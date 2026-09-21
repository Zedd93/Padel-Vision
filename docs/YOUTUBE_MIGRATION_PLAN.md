# Plan migracji streamingu na YouTube Live

Dokument decyzyjny + plan wdrożeniowy. Cel: przenieść całą dystrybucję wideo
(live + VOD) na YouTube, żeby zejść z kosztów infrastruktury streamingowej
do zera na starcie działalności.

---

## 1. TL;DR

**Rekomendacja: migrować.** Trzy powody, w kolejności ważności:

1. **Pipeline RTMP/HLS nie istnieje.** `services/transcoder/` i
   `services/notifications/` są puste — nie ma tam ani jednego pliku.
   `docker-compose.yml` ma tylko `postgres`, `redis`, `backend`, `frontend`.
   Migracja to więc głównie **rezygnacja z budowy** 3–6 tygodni pracy
   (Node Media Server + FFmpeg multi-bitrate + packaging HLS + CDN + S3
   lifecycle), a nie przepisywanie działającego systemu.
2. **Koszt operacyjny spada do zera** — ingest, transkodowanie, CDN, storage
   i VOD są po stronie YouTube (szczegóły w §4).
3. **Kod do przepięcia jest mały** — realnie 6 plików backendu i 6 frontendu.
   Reszta (czat STOMP, overlay wyniku, turnieje, panel sędziego) zostaje
   nietknięta.

**Decyzja podjęta 2026-09-07: opcja A — wszystkie transmisje na YouTube są
darmowe.** YouTube API ToS zabrania paywallowania treści YouTube (§5.1), więc
monetyzacja przenosi się z **dostępu** na **funkcje i wsparcie**: subskrypcje
klubowe, Piłki/donacje, sponsorzy. PPV zostaje wycofane — zakres w §6.7.

**Estymata: 12–18 dni roboczych** (§7).

---

## 2. Stan obecny — co faktycznie jest w kodzie

Inwentaryzacja, nie plan. To, co poniżej, jest w repo dzisiaj.

### Backend

| Plik | Rola dzisiaj |
|---|---|
| `domain/stream/Stream.java` | encja; pole `hlsUrl` trzyma URL playlisty |
| `domain/stream/StreamService.java` | `hlsBaseUrl` z configu, buduje `hlsUrl` z `club.streamKey`; `handleRtmpPublish/Unpublish` |
| `domain/payment/WebhookController.java` | `POST /api/webhooks/rtmp` → publish/unpublish |
| `domain/payment/dto/RtmpWebhookRequest.java` | DTO webhooka `{action, streamKey, clientId}` |
| `domain/club/Club.java` | `streamKey` (UUID generowany w `@PrePersist`) |
| `domain/club/MultistreamConfig.java` | per-klub `{platform, rtmpUrl, streamKey, enabled}` — YouTube już jest przewidziany |
| `domain/stream/Vod.java` | `s3Url`, `duration`, `fileSize`, `highlights` |
| `shared/enums/StreamStatus.java` | `LIVE / OFFLINE / VOD` |
| `resources/application.yml` | `rtmp.server-url: rtmps://stream.padelvision.app/live`, `aws.s3.*` |
| `resources/db/migration/` | Flyway `V1`…`V9` — następna to `V10` |

**Nie ma:** żadnej integracji Google/OAuth w backendzie (`grep -rl "oauth\|google"`
→ pusto). OAuth klubu z YouTube trzeba zbudować od zera.

### Frontend

| Plik | Rola dzisiaj |
|---|---|
| `components/stream/VideoPlayer.tsx` | ~700 linii: hls.js, DVR, markery, powtórka slow-mo, selektor jakości, prędkość |
| `components/stream/MiniPlayer.tsx` | drugi, uproszczony odtwarzacz hls.js |
| `pages/MultiviewPage.tsx` | 6 równoległych `VideoPlayer` (mock `hlsUrl`) |
| `pages/ClipDetailPage.tsx` | mock `hlsUrl` |
| `pages/LivePage.tsx` | `hlsUrl = "/test.mp4"` — surowy `<video>` |
| `pages/StudioPage.tsx` | hardkodowany `MOCK_CLUB.rtmpUrl` + `streamKey`, sekcja Multistreaming z YouTube |
| `api/streams.ts` | typ `Stream.hlsUrl`, `Vod.s3Url` |
| `hooks/useWebSocket.ts` + `components/stream/ChatPanel.tsx` | własny czat STOMP |

Wszystkie odtwarzacze poza `LivePage` działają dziś na publicznym mocku
`test-streams.mux.dev` — czyli **nic realnego nie jest podpięte**.

---

## 3. Architektura docelowa

```
Klub (OBS Studio)
   │  RTMP → rtmp://a.rtmp.youtube.com/live2  (ingest YouTube, darmowy)
   ▼
YouTube Live  ──►  transkodowanie + CDN + DVR + archiwum VOD   (wszystko po stronie YouTube)
   │
   │  YouTube Data API v3           IFrame Player API
   ▼                                        ▼
Backend PadelVision                Frontend padelvision.tv
 • tworzy broadcast                 • <iframe> z własnym overlayem UI
 • pobiera adres ingestu            • kontrolki: seek, prędkość, markery
 • odpytuje status (batch)          • overlay wyniku z kompensacją latencji
 • zapisuje youtubeVideoId
 • WŁASNY czat STOMP  ─────────────► ChatPanel (bez zmian)
 • WŁASNY overlay wyniku ──────────► ScoreOverlay (+ bufor opóźnienia)
```

Kluczowe decyzje architektoniczne:

- **Reusable stream per klub.** `liveStreams.insert` z
  `contentDetails.isReusable = true` wykonujemy **raz** przy podłączaniu kanału.
  Adres ingestu i klucz są wtedy stałe dla klubu — OBS konfiguruje się raz,
  a każda kolejna transmisja to tylko nowy `liveBroadcast` + `bind`.
  To oszczędza quota i upraszcza UX Studia.
- **`enableAutoStart` + `enableAutoStop`.** Transmisja startuje sama, gdy OBS
  zacznie nadawać, i kończy się po ~60 s ciszy. Znika potrzeba ręcznych
  `transition` (oszczędność 100 jednostek quota na transmisję) i znika
  webhook RTMP.
- **Prywatność `unlisted` domyślnie.** Film nie jest wyszukiwalny na YouTube,
  ale osadza się w `<iframe>`. Ruch zostaje na padelvision.tv.
- **Czat i wynik zostają nasze.** Czat YouTube jest nie do pobrania w ramach
  quota (§5.2), a nasz STOMP już działa.
- **Zero storage po naszej stronie.** `Vod.s3Url` przestaje być używane;
  archiwum to ten sam `youtubeVideoId`, pod którym leciała transmisja.
- **Miniatury za darmo.** `https://i.ytimg.com/vi/{videoId}/maxresdefault.jpg`
  zamiast `thumbnails.set` (50 jednostek) i zamiast S3.

---

## 4. Analiza kosztów

Założenie skali startowej: **10 klubów, 20 transmisji/mies. × 2 h = 40 h ingestu,
średnio 30 widzów → ~1 200 widzogodzin → ~1,6 TB egress** przy 3 Mbps.

| | Własny RTMP + HLS (DigitalOcean) | Amazon IVS | **YouTube Live** |
|---|---|---|---|
| Ingest | droplet 2 vCPU ~$24 | $2,00/h × 40 h = **$80** | **$0** |
| Transkodowanie | CPU-optimized 4 vCPU ~$84 | wliczone | **$0** |
| Egress / CDN | w puli transferu DO | $0,15/GB × 1600 GB = **$240** | **$0** |
| Storage VOD | Spaces 250 GB ~$5 | S3 ~$6 | **$0** |
| **Razem / mies.** | **~$115** | **~$326** | **$0** |
| **Koszt budowy** | **3–6 tygodni** (transcoder od zera) | ~1 tydzień | ~2 tygodnie |
| Przy 10× skali | ~$400–600 | **~$3 200** | **$0** |

Nawet pomijając rachunek — pozycja "koszt budowy" przy własnym pipeline jest
najdroższa, bo `services/transcoder/` jest pusty.

**Czego YouTube nie pokrywa:** hosting backendu/frontendu, Postgres, Redis,
S3 na avatary/loga klubów. Te koszty zostają bez zmian.

---

## 5. Ryzyka i ograniczenia

### 5.1 ✅ ToS: paywall na treści YouTube — ROZSTRZYGNIĘTE (opcja A, 2026-09-07)

YouTube API Services Terms of Service (Developer Policies) zabraniają pobierania
opłat za dostęp do treści audiowizualnych YouTube przez klienta API oraz
umieszczania ich za paywallem. To **bezpośrednio koliduje** z tym, co jest już
zbudowane w aplikacji: `/pricing` (plany Pass/Pro), PPV i `/wallet`.

Rozważane opcje (**wybrano A**):

| Opcja | Na czym polega | Konsekwencja |
|---|---|---|
| **✅ A — WYBRANA** | Wszystkie transmisje na YouTube są **darmowe**. Monetyzujemy: subskrypcje klubowe (funkcje panelu, nie dostęp), Piłki/donacje, sponsorzy, reklama klubu | Zgodne z ToS. Wymaga wycofania PPV i przedefiniowania planów widza — zakres w §6.7 |
| **B — hybryda** | Darmowe → YouTube; płatne PPV/turnieje premium → własny HLS albo IVS | Zgodne z ToS, ale wymaga utrzymania **obu** pipeline'ów. Odkłada oszczędność |
| **C — odrzucona** | PPV na unlisted YouTube, ID filmu wydawane po płatności | Łamie ToS + ochrona iluzoryczna (link działa dla każdego). Ryzyko odcięcia dostępu do API całego projektu |

**Konsekwencja opcji A:** dostęp do transmisji przestaje być towarem. Płatne
plany widza (`ViewerTier.PASS` / `PRO`) muszą sprzedawać coś innego niż dostęp —
propozycje w §6.7. „Bez reklam" **nie jest** dostępną korzyścią, bo reklamami
w odtwarzaczu YouTube sterujemy tylko pośrednio (status YPP kanału klubu, §5.4).

### 5.2 Quota YouTube Data API v3

Domyślny limit: **10 000 jednostek/dobę** na projekt Google Cloud.

| Operacja | Koszt | Kiedy |
|---|---|---|
| `liveStreams.insert` (reusable) | 50 | raz na klub |
| `liveBroadcasts.insert` | 50 | raz na transmisję |
| `liveBroadcasts.bind` | 50 | raz na transmisję |
| `liveBroadcasts.list` (do 50 ID naraz) | **1** | polling |
| `liveStreams.list` (do 50 ID naraz) | **1** | polling |
| `liveChatMessages.list` | 5 | **nie używamy** |

Budżet dobowy przy poller co 60 s, batchowanym po ID:
`1440 × 2 = 2 880` jednostek na cały polling (niezależnie od liczby klubów)
`+ 100` na transmisję → **~70 transmisji/dobę** w domyślnej quocie. Z zapasem
na start.

Dwie rzeczy, które trzeba zrobić dobrze od razu:
- **Batchowanie ID w pollerze.** Jedno `liveBroadcasts.list?id=a,b,c,…` (do 50)
  kosztuje 1 jednostkę. Odpytywanie po jednym streamie zabija quotę.
- **`QuotaGuard`** — licznik zużycia w Redis z dziennym resetem, który odmawia
  wywołań powyżej budżetu zamiast dostać HTTP 403 `quotaExceeded` w środku
  transmisji.

**Czat YouTube jest niewykonalny w quocie**: 2 h transmisji przy pollingu co 5 s
to ~1440 wywołań × 5 = **7 200 jednostek na jedną transmisję**. Dlatego zostajemy
przy własnym STOMP.

Zwiększenie quoty wymaga audytu YouTube API Services (formularz, tygodnie–miesiące,
częste odmowy). **Plan zakłada domyślne 10 000.**

### 5.3 Latencja i desynchronizacja overlaya wyniku

| `latencyPreference` | Opóźnienie | DVR |
|---|---|---|
| `normal` | ~40–60 s | tak |
| `low` (rekomendowane) | ~15–30 s | tak |
| `ultraLow` | ~2–5 s | **nie** |

Nasz overlay wyniku leci przez STOMP **natychmiast**, więc bez korekty widz
zobaczy punkt 15–30 s zanim zobaczy zagranie. To psuje produkt.

Rozwiązanie: `useLatencyCompensatedEvents` — kolejkujemy zdarzenia wyniku ze
znacznikiem czasu i renderujemy z opóźnieniem równym zmierzonej latencji
odtwarzacza. Latencję kalibrujemy per-klub (stała konfigurowalna, domyślnie 20 s;
weryfikacja: `player.getCurrentTime()` vs `stream.startedAt`). Dotyczy to też
czatu — wiadomość "co za akcja!" nie może wyprzedzać akcji.

### 5.4 Co tracimy w odtwarzaczu

| Funkcja `VideoPlayer.tsx` | Na YouTube | Uwaga |
|---|---|---|
| Selektor jakości | ❌ | `setPlaybackQuality` to no-op od 2019 — usuwamy przycisk, jakość auto |
| DVR + seekbar | ✅ | `enableDvr: true`, `seekTo()` / `getDuration()` |
| Markery na osi | ✅ | własny overlay nad iframe, `getCurrentTime()` |
| Powtórka slow-mo | ✅ | `setPlaybackRate(0.5)` |
| Skok ±15/30 s | ✅ | `seekTo()` |
| Fullscreen | ✅ | na wrapperze, `allowfullscreen` na iframe |
| Własne kontrolki | ✅ | `playerVars.controls = 0` |
| Pobieranie VOD | ❌ | znika bezpowrotnie |
| Klipy renderowane FFmpeg | ⚠️ | zamiast renderu — zakres `start`/`end` w embedzie. **Tańsze i szybsze**, ale klipu nie da się pobrać ani wrzucić na social |
| Multiview 6× | ⚠️ | każdy iframe YT to pełny odtwarzacz; realnie **max 4** kafelki |
| Brak reklam | ⚠️ | jeśli kanał klubu jest w YPP, YouTube może wyświetlić reklamę. Zalecenie dla klubów: kanał poza programem partnerskim |
| Branding YouTube | ⚠️ | logo w rogu i "Watch on YouTube" na pauzie są nieusuwalne (`modestbranding` wycofane) |
| Minimalny rozmiar odtwarzacza | ⚠️ | ToS: 200×200 px — dotyczy kafelków Multiview |

### 5.5 Wymagania po stronie kanału klubu

Do udokumentowania w onboardingu klubu (blokery, nie do obejścia kodem):

- kanał zweryfikowany numerem telefonu,
- **live streaming włączony — pierwsze włączenie ma 24 h opóźnienia**,
- brak aktywnych ostrzeżeń o naruszeniu zasad (blokują live na 90 dni),
- muzyka w tle na korcie może wywołać Content ID → wyciszenie fragmentu VOD.

---

## 6. Zmiany w kodzie

### 6.1 Baza — `V10__youtube_streaming.sql`

```sql
ALTER TABLE streams
    ADD COLUMN youtube_video_id     VARCHAR(24),
    ADD COLUMN youtube_broadcast_id VARCHAR(24),
    ADD COLUMN youtube_privacy      VARCHAR(16) NOT NULL DEFAULT 'unlisted',
    ADD COLUMN latency_preference   VARCHAR(16) NOT NULL DEFAULT 'low';

CREATE INDEX idx_streams_youtube_broadcast ON streams (youtube_broadcast_id);

-- hls_url zostaje NULLABLE na czas migracji, usuwane w V12 (patrz §9)

CREATE TABLE youtube_channel_connections (
    id                      VARCHAR(36) PRIMARY KEY,
    club_id                 VARCHAR(36) NOT NULL UNIQUE REFERENCES clubs (id) ON DELETE CASCADE,
    channel_id              VARCHAR(64) NOT NULL,
    channel_title           VARCHAR(255),
    refresh_token_enc       TEXT        NOT NULL,
    access_token_enc        TEXT,
    access_token_expires_at TIMESTAMPTZ,
    scopes                  TEXT        NOT NULL,
    reusable_stream_id      VARCHAR(64),
    ingest_address          VARCHAR(255),
    ingest_stream_name      VARCHAR(128),
    status                  VARCHAR(24) NOT NULL DEFAULT 'CONNECTED',
    connected_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

> **Bezpieczeństwo:** `refresh_token` to długożyciowe poświadczenie do cudzego
> konta Google. Musi być szyfrowany at rest (AES-256-GCM, klucz z
> `YOUTUBE_TOKEN_ENC_KEY`), nigdy plaintextem w kolumnie i nigdy w logach.

### 6.2 Backend — nowe pliki

```
backend/src/main/java/com/padelvision/integration/youtube/
├── YouTubeOAuthController.java          GET  /api/club/youtube/connect     → URL zgody
│                                        GET  /api/club/youtube/callback    → wymiana code→token
│                                        DELETE /api/club/youtube/disconnect
│                                        GET  /api/club/youtube/status      → stan + adres ingestu
├── YouTubeOAuthService.java             wymiana kodu, odświeżanie, revoke
├── YouTubeLiveService.java              createBroadcast / bind / endBroadcast / fetchStatus
├── YouTubeApiClient.java                RestClient + mapowanie błędów + zliczanie quota
├── YouTubeChannelConnection.java        @Entity
├── YouTubeChannelConnectionRepository.java
├── TokenCipher.java                     AES-256-GCM encrypt/decrypt
├── YouTubeStatusPoller.java             @Scheduled(fixedDelay = 60_000), batch po ≤50 ID
├── QuotaGuard.java                      licznik jednostek w Redis, dzienny reset
└── dto/                                 BroadcastResource, LiveStreamResource, ChannelResource
```

**Zakresy OAuth:** `https://www.googleapis.com/auth/youtube.force-ssl`
(pokrywa `liveBroadcasts`/`liveStreams` insert+bind). Autoryzacja z
`access_type=offline` i `prompt=consent`, inaczej nie dostaniemy refresh tokenu.

### 6.3 Backend — pliki do zmiany

| Plik | Zmiana |
|---|---|
| `domain/stream/Stream.java` | + `youtubeVideoId`, `youtubeBroadcastId`, `youtubePrivacy`, `latencyPreference`; `hlsUrl` → `@Deprecated` |
| `domain/stream/StreamService.java` | usuń `@Value hlsBaseUrl`; `startStream()` deleguje do `YouTubeLiveService.createBroadcast()`; `stopStream()` → `endBroadcast()`; **usuń `handleRtmpPublish` i `handleRtmpUnpublish`** |
| `domain/stream/dto/StreamResponse.java` | + `youtubeVideoId`, `embedUrl`, `latencySeconds`; `hlsUrl` zostaje na czas migracji |
| `domain/stream/StreamController.java` | mapowanie nowych pól; **dokończ `/archived`** — dziś zwraca `List.of()` na sztywno |
| `domain/stream/StreamClubController.java` | mapowanie nowych pól |
| `domain/payment/WebhookController.java` | **usuń `POST /api/webhooks/rtmp`** |
| `domain/payment/dto/RtmpWebhookRequest.java` | **usuń plik** |
| `domain/stream/Vod.java` | `s3Url` → `@Deprecated`; VOD wskazuje na `stream.youtubeVideoId` |
| `domain/club/Club.java` | `streamKey` przestaje być kluczem ingestu — zostaw (fallback/opcja B), oznacz `@Deprecated` |
| `config/SecurityConfig.java` | `permitAll` na `/api/club/youtube/callback` |
| `resources/application.yml` | **usuń `rtmp.server-url`**; dodaj sekcję `youtube.*` |

### 6.4 Frontend — nowe pliki

```
frontend/src/components/stream/YouTubePlayer.tsx      IFrame API + własny overlay kontrolek
frontend/src/components/stream/StreamPlayer.tsx       przełącznik: youtubeVideoId ? YT : HLS
frontend/src/hooks/useYouTubeIframeApi.ts             leniwy singleton window.YT (Promise)
frontend/src/hooks/useLatencyCompensatedEvents.ts     bufor zdarzeń wyniku/czatu (§5.3)
```

`playerVars` dla `YouTubePlayer`:
```ts
{ autoplay: 1, mute: 1, controls: 0, rel: 0, playsinline: 1,
  enablejsapi: 1, origin: import.meta.env.VITE_YOUTUBE_EMBED_ORIGIN }
```

### 6.5 Frontend — pliki do zmiany

| Plik | Zmiana |
|---|---|
| `components/stream/VideoPlayer.tsx` | zmiana nazwy na `HlsPlayer.tsx`, bez zmian w środku; **usuń selektor jakości** dopiero przy kasowaniu ścieżki HLS |
| `components/stream/MiniPlayer.tsx` | wariant YT (iframe bez kontrolek) obok wariantu hls.js |
| `pages/MultiviewPage.tsx` | `StreamPlayer` zamiast `VideoPlayer`; **ogranicz siatkę do 4 kafelków** |
| `pages/ClipDetailPage.tsx` | klip = `videoId` + `start`/`end` zamiast `hlsUrl` |
| `pages/LivePage.tsx` | usuń `hlsUrl = "/test.mp4"`, podepnij `StreamPlayer` pod realny stream z API |
| `pages/StudioPage.tsx` | usuń `MOCK_CLUB.rtmpUrl` / `streamKey`; sekcja "Połącz kanał YouTube" (OAuth) + adres ingestu z `GET /api/club/youtube/status`; Multistreaming: YouTube staje się głównym celem |
| `api/streams.ts` | `Stream`: + `youtubeVideoId`, `embedUrl`, `latencySeconds`; `Vod.s3Url` → opcjonalne |
| `components/stream/ScoreOverlay` + `ChatPanel.tsx` | podłącz `useLatencyCompensatedEvents` |
| `package.json` | `hls.js` usuwamy dopiero w Fazie 5 |

### 6.6 Sprzątanie infrastruktury

- `services/transcoder/` i `services/notifications/` — **usunąć** (puste katalogi,
  wprowadzają w błąd co do stanu projektu)
- `README.md` — sekcja architektury i diagramy Mermaid: RTMP/FFmpeg/HLS → YouTube
- `docker-compose.yml` — bez zmian (nigdy nie miał serwisu RTMP)
- `AWS_S3_BUCKET` zostaje (loga, awatary, banery klubów) — nie kasować

### 6.7 Wycofanie PPV (konsekwencja opcji A)

Inwentaryzacja z kodu — PPV jest szerzej rozsiane niż `/pricing`.

**Dobra wiadomość:** `frontend/src/components/stream/PpvGate.tsx` (~pełny UI
bramki płatności) **nie jest nigdzie importowany** — zero użyć poza własnym
plikiem. Usunięcie jest bezkosztowe.

#### Backend

| Plik | Zmiana |
|---|---|
| `domain/payment/PaymentController.java` | usuń `POST /api/payments/ppv` |
| `domain/payment/PaymentService.java` | usuń `purchasePpv()` |
| `domain/payment/dto/PpvRequest.java` | **usuń plik** |
| `domain/tournament/Tournament.java` | `isPPV`, `ppvPrice` → `@Deprecated`, wypadają z API zapisu |
| `domain/tournament/TournamentService.java` | usuń parametry `isPPV` / `ppvPrice` z `create()` i `update()` |
| `domain/tournament/TournamentController.java` | j.w. + mapowanie w response |
| `domain/tournament/dto/TournamentCreateRequest.java`, `TournamentUpdateRequest.java`, `TournamentResponse.java` | usuń pola PPV |
| `shared/enums/TransactionType.java` | **`PPV` zostaje w enumie** — w bazie są historyczne transakcje, usunięcie wartości wywali deserializację |
| `shared/enums/NotificationType.java` | sprawdź typ powiadomienia o PPV — zostaw dla historii, przestań emitować |

**Migracja `V11`:** wyłącznie `ALTER TABLE tournaments ALTER COLUMN is_ppv SET
DEFAULT false`. **Nie kasować** `is_ppv` / `ppv_price` ani wartości `PPV`
z enuma `transaction_type` — historia rozliczeń musi się dać odczytać.

#### Frontend

| Plik | Zmiana |
|---|---|
| `components/stream/PpvGate.tsx` | **usuń plik** (nieużywany) |
| `pages/PricingPage.tsx` | przedefiniuj plany widza — patrz niżej |
| `pages/SubscriptionsPage.tsx`, `pages/AccountPage.tsx` | usuń PPV z historii zakupów i UI |
| `pages/EarningsPage.tsx`, `pages/AnalyticsPage.tsx` | usuń „PPV" ze źródeł przychodu i wykresów |
| `pages/AdminFinancePage.tsx`, `pages/AdminPage.tsx` | j.w. w splitach przychodu i KPI |
| `components/layout/NotificationCenter.tsx` | usuń obsługę powiadomienia o PPV |
| `pages/ForClubsPage.tsx` | usuń PPV z oferty dla klubów |

#### Czym zastąpić `ViewerTier.PASS` / `PRO`

Dostęp jest darmowy, więc płatne plany widza muszą sprzedawać funkcje. Kandydaci
(do wyboru — patrz §10 pyt. 1):

- **Multiview** — oglądanie 4 kortów naraz (kosztowne po stronie klienta, naturalna funkcja premium)
- **Klipy bez limitu** + własna biblioteka klipów (darmowy: np. 3/mies.)
- **Odznaka i kolor nicku w czacie**, priorytet wiadomości
- **Powiadomienia push** o starcie meczu ulubionego klubu/zawodnika
- **Rozszerzone statystyki zawodnika** i historia H2H
- **Wcześniejszy dostęp** do zapisów na turnieje

Piłki (`/wallet`) i donacje działają bez zmian — to wsparcie twórcy, nie opłata
za dostęp, więc nie kolidują z ToS.

---

## 7. Fazy wdrożenia

| Faza | Zakres | Est. |
|---|---|---|
| **0. Konto Google** | ~~Rozstrzygnięcie §5.1~~ ✅ *opcja A*. Runbook: **[`YOUTUBE_SETUP.md`](YOUTUBE_SETUP.md)** — projekt GCP, YouTube Data API v3, consent screen, klient OAuth, kanał testowy z live (**24 h karencji**), weryfikacja `scripts/youtube-check.sh`. Konfiguracja w repo ✅ gotowa | 0,5 d |
| **1. Fundament backendu** | `V10`, encja `YouTubeChannelConnection`, `TokenCipher`, `YouTubeOAuthService` + `YouTubeOAuthController`, `SecurityConfig` | 2–3 d |
| **2. Cykl życia transmisji** | `YouTubeApiClient`, `QuotaGuard`, `YouTubeLiveService` (reusable stream, broadcast, bind, autoStart/autoStop), `YouTubeStatusPoller`, przepięcie `StreamService`, **usunięcie webhooka RTMP** | 2–3 d |
| **3. Odtwarzacz** | `useYouTubeIframeApi`, `YouTubePlayer` z własnymi kontrolkami, `StreamPlayer`, `MiniPlayer`, przepięcie `LivePage` | 3–4 d |
| **4. Synchronizacja** | `useLatencyCompensatedEvents`, kalibracja opóźnienia, podpięcie ScoreOverlay + ChatPanel, testy na żywym meczu | 1–2 d |
| **5. Studio, VOD, sprzątanie** | Flow OAuth w `StudioPage`, VOD/klipy na `videoId`, Multiview 4×, usunięcie `hls.js` + `services/*` + `rtmp.server-url`, README | 1–2 d |
| **6. Wycofanie PPV** | Zakres z §6.7: backend (endpoint, DTO, pola turnieju, `V11`), frontend (usunięcie `PpvGate`, czyszczenie 7 stron), nowe korzyści PASS/PRO w `/pricing` | 2–3 d |
| | **Razem** | **12–18 d** |

Faza 0 jest blokerem kalendarzowym dla wszystkich pozostałych — 24 h na aktywację
live po stronie YouTube i weryfikacja consent screen potrafią zająć więcej niż
sam kod. Fazę 6 można prowadzić **równolegle** do 1–5 (nie dotyka streamingu),
ale nie wolno jej wypuścić na produkcję przed Fazą 3 — inaczej zniknie płatny
dostęp, zanim pojawi się darmowy odtwarzacz.

---

## 8. Konfiguracja

> Krok po kroku w konsoli Google: **[`YOUTUBE_SETUP.md`](YOUTUBE_SETUP.md)**.
> Sekcje poniżej to referencja wartości — są już wprowadzone do repo
> (`application.yml`, `backend/.env.example`, `frontend/.env.example`,
> `scripts/secrets-template.json`).

### Backend (`application.yml` + sekrety)

```yaml
youtube:
  client-id:        ${YOUTUBE_CLIENT_ID}
  client-secret:    ${YOUTUBE_CLIENT_SECRET}
  redirect-uri:     ${YOUTUBE_REDIRECT_URI:https://api.padelvision.tv/api/club/youtube/callback}
  token-enc-key:    ${YOUTUBE_TOKEN_ENC_KEY}          # 32 B, base64, AES-256-GCM
  default-privacy:  ${YOUTUBE_DEFAULT_PRIVACY:unlisted}
  default-latency:  ${YOUTUBE_DEFAULT_LATENCY:low}
  daily-quota-units: ${YOUTUBE_DAILY_QUOTA_UNITS:10000}
  poll-interval-ms: ${YOUTUBE_POLL_INTERVAL_MS:60000}

padelvision:
  streaming:
    provider: ${STREAMING_PROVIDER:youtube}           # youtube | hls  (rollback, §9)
```

Do usunięcia: `rtmp.server-url`.

### Frontend (Vercel + `.env`)

```
VITE_YOUTUBE_EMBED_ORIGIN=https://padelvision.tv
```

> `VITE_*` trafia do bundla — nie wolno tam wkładać `YOUTUBE_CLIENT_SECRET`
> ani `YOUTUBE_TOKEN_ENC_KEY`. Cały OAuth dzieje się po stronie backendu.

### Google Cloud Console

- Włączone API: **YouTube Data API v3**
- OAuth client type: **Web application**
- Authorized redirect URIs: produkcja + `http://localhost:8080/api/club/youtube/callback` na dev
- Consent screen: **External**, scope `youtube.force-ssl` → wymaga weryfikacji
  aplikacji przez Google przed wyjściem z trybu testowego (limit 100 kont testowych)

---

## 9. Rollback i bezpieczeństwo migracji

- **Flaga `padelvision.streaming.provider`** (`youtube` | `hls`) przełącza
  ścieżkę w `StreamService` i w `StreamPlayer` bez deployu nowego kodu.
- **Migracja `V10` jest wyłącznie addytywna.** `hls_url` i `s3_url` zostają
  nullable. Kasowanie kolumn dopiero w `V12`, **nie wcześniej niż 30 dni** po
  stabilnym działaniu na produkcji.
- **`hls.js` i `HlsPlayer.tsx` zostają w repo** do końca Fazy 5. Usunięcie
  `hls.js` z `package.json` to ostatni, nieodwracalny krok.
- **Kolejność wdrożeń:** Fazy 1–2 można wypuścić na produkcję przed frontendem —
  backend tworzy broadcasty, ale UI nadal używa starej ścieżki. Ryzyko rozłożone.
- **Klucz szyfrowania tokenów.** Utrata `YOUTUBE_TOKEN_ENC_KEY` = wszystkie
  kluby muszą ponownie przejść OAuth. Backup klucza poza repo i poza CI.
- **Odwołanie zgody przez klub** (`myaccount.google.com` → Uprawnienia) unieważnia
  refresh token natychmiast. `YouTubeStatusPoller` musi obsłużyć `invalid_grant`
  → `status = 'REVOKED'` + powiadomienie klubu, a nie sypać stacktrace'ami.

---

## 10. Otwarte pytania

> ~~**§5.1 — opcja A czy B?**~~ ✅ Rozstrzygnięte 2026-09-07: **opcja A**.

1. **Które korzyści dostają PASS i PRO?** Lista kandydatów w §6.7. Blokuje
   Fazę 6 i przepisanie `/pricing`. Bez tego płatne plany widza nie mają treści.
2. **Kanał klubu czy kanał PadelVision?** Kanał klubu = klub buduje własną
   publiczność i sam ogarnia weryfikację, ale onboarding jest trudniejszy i
   tracimy kontrolę nad treścią. Kanał centralny = prostszy onboarding i jedna
   quota, ale wszystko na jednym koncie (jedno ostrzeżenie = wszyscy offline).
   Plan zakłada **kanał klubu**; wariant centralny upraszcza Fazę 1, ale
   podnosi ryzyko operacyjne.
3. **`unlisted` czy `public`?** `public` daje klubom zasięg z wyszukiwarki
   YouTube kosztem ruchu na padelvision.tv. Do decyzji per plan klubu?
4. **Multistream** (`MultistreamConfig`): z YouTube jako celem głównym
   równoległy push na Facebooka najtaniej robić po stronie klienta
   (plugin multi-RTMP w OBS, $0) niż serwerowo. Potwierdzić kierunek.
