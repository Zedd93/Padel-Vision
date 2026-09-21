# Test transmisji na YouTube — lokalnie

Scenariusz end-to-end: od uruchomienia backendu po mecz lecący na YouTube.
Wszystko na localhoście — deploy nie jest potrzebny.

Wymaga ukończonej [Fazy 0](YOUTUBE_SETUP.md), czyli działającego
`./scripts/youtube-check.sh`.

> **Dlaczego localhost wystarcza:** w kroku 2d Fazy 0 zarejestrowaliśmy
> `http://localhost:8080/api/club/youtube/callback` jako dozwolony adres
> przekierowania. Google odeśle klub prosto na lokalny backend — żaden tunel
> ani publiczny adres nie jest potrzebny.

---

## 1. Konfiguracja

- [ ] W katalogu głównym repo utwórz `.env` z poświadczeniami z Fazy 0:

  ```
  YOUTUBE_CLIENT_ID=...apps.googleusercontent.com
  YOUTUBE_CLIENT_SECRET=...
  YOUTUBE_TOKEN_ENC_KEY=...
  ```

  `docker-compose.yml` czyta ten plik automatycznie. Pozostałe zmienne
  (`YOUTUBE_REDIRECT_URI`, prywatność, latencja) mają sensowne domyślne wartości.

- [ ] Uruchom backend z bazą:

  ```bash
  docker compose up -d postgres redis backend
  ```

- [ ] Poczekaj, aż odpowie:

  ```bash
  curl -fsS http://localhost:8080/api/health && echo " — backend żyje"
  ```

- [ ] Uruchom frontend w osobnym terminalu:

  ```bash
  cd frontend && npm run dev
  ```

  Działa na `http://localhost:5173` — tam właśnie wraca przeglądarka po zgodzie
  Google (`YOUTUBE_POST_CONNECT_REDIRECT`).

---

## 2. Konto klubu

Rejestracja przez API zawsze tworzy rolę `VIEWER`, a endpointu zakładającego
klub jeszcze nie ma — stąd skrypt.

- [ ] Zarejestruj się w aplikacji (`/register`) albo curlem
- [ ] Podnieś konto do roli klubu:

  ```bash
  ./scripts/seed-club.sh twoj@email.pl "Klub Testowy"
  ```

- [ ] **Wyloguj się i zaloguj ponownie** — rola jest zapisana w tokenie JWT,
      więc stary token nadal mówi `VIEWER`

---

## 3. Podłączenie kanału

- [ ] Wejdź na `http://localhost:5173/studio`
- [ ] Karta **Kanał YouTube** → **Połącz kanał YouTube**
- [ ] Wybierz konto Google → **wybierz kanał Padel Vision Test**, nie prywatny
- [ ] Ekran o niezweryfikowanej aplikacji jest oczekiwany → *Zaawansowane* →
      przejdź dalej → zaznacz uprawnienie do YouTube → **Kontynuuj**
- [ ] Wrócisz do Studia z zielonym bannerem i nazwą kanału

---

## 4. Utworzenie transmisji

- [ ] W Studiu wpisz tytuł (bez tytułu przycisk jest nieaktywny)
- [ ] **Rozpocznij stream**

Co się dzieje pod spodem: backend woła `liveStreams.insert` (raz na klub,
strumień wielokrotnego użytku), potem `liveBroadcasts.insert` i `bind`.

- [ ] W karcie **Kanał YouTube** pojawią się **Adres serwera** i **Klucz transmisji**

---

## 5. OBS

- [ ] OBS → Ustawienia → Transmisja
- [ ] Usługa: **Niestandardowy**
- [ ] Serwer: adres ze Studia (`rtmp://a.rtmp.youtube.com/live2`)
- [ ] Klucz transmisji: klucz ze Studia
- [ ] Ustawienia → Wyjście → bitrate ok. 4500 kbps, keyframe co 2 s
- [ ] **Rozpocznij transmisję**

---

## 6. Weryfikacja

- [ ] Po ≤60 s poller przestawia status — sprawdź:

  ```bash
  curl -s http://localhost:8080/api/streams/live | python3 -m json.tool
  ```

  Szukaj `"status": "LIVE"` oraz `youtubeVideoId`.

- [ ] Otwórz `http://localhost:5173/stream/<id transmisji>` — odtwarzacz gra
      z własnymi kontrolkami
- [ ] Kontrolnie: `https://www.youtube.com/watch?v=<youtubeVideoId>` pokazuje
      ten sam obraz

**Czego się spodziewać:** obraz ma 15–30 s opóźnienia (ustawienie `low`).
To normalne i właśnie dlatego overlay wyniku jest buforowany
([Faza 4](YOUTUBE_MIGRATION_PLAN.md#54-czego-tracimy-w-odtwarzaczu)).

---

## 7. Zakończenie

- [ ] Zatrzymaj nadawanie w OBS — po ok. minucie ciszy YouTube kończy
      transmisję sam (`enableAutoStop`)
- [ ] Albo **Zakończ transmisję** w Studiu
- [ ] Nagranie zostaje na kanale pod tym samym adresem co transmisja

---

## Gdy coś nie działa

| Objaw | Przyczyna | Co zrobić |
|---|---|---|
| „Integracja YouTube nie jest skonfigurowana” | brak zmiennych w `.env` | sprawdź krok 1, zrestartuj `backend` |
| „Klub nie ma połączonego kanału YouTube” | rola nie weszła do tokenu | wyloguj się i zaloguj ponownie |
| „Kanał YouTube klubu nie ma włączonych transmisji” | nie minęły 24 h od aktywacji | patrz [YOUTUBE_SETUP.md](YOUTUBE_SETUP.md) krok 3 |
| Zgoda cofnięta / `REVOKED` | token unieważniony | rozłącz i połącz kanał ponownie |
| Status nie zmienia się na LIVE | poller nie widzi sygnału | sprawdź `docker compose logs -f backend`, OBS musi faktycznie nadawać |
| 500 przy rejestracji | za krótki `JWT_SECRET` | HS512 wymaga ≥512 bitów; domyślny w compose jest poprawny |

Logi backendu:

```bash
docker compose logs -f backend
```

---

## Czego ten test nie obejmuje

- **Deploy na DigitalOcean** — zadanie `deploy` pada na kroku *Configure AWS
  credentials* (brak sekretów AWS w repo). Test lokalny tego nie wymaga
- **Kompensacja opóźnienia** — overlay wyniku i czat działają na danych demo,
  dopóki panel sędziego nie jest podpięty pod prawdziwy mecz
- **Multiview** — kafelki są nadal placeholderami
