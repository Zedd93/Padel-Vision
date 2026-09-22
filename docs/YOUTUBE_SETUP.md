# Faza 0 — konfiguracja Google Cloud i kanału YouTube

Runbook do wyklikania w konsoli. Nic tutaj nie da się zrobić z poziomu repo —
to poświadczenia i zgody, które musisz założyć samodzielnie.

Plan migracji: [`YOUTUBE_MIGRATION_PLAN.md`](YOUTUBE_MIGRATION_PLAN.md)

> **Zacznij od kroku 3 (włączenie live na kanale).** Ma 24 h opóźnienia
> aktywacji, więc uruchom je pierwszego dnia i rób resztę w tym czasie.

---

## 1. Projekt Google Cloud

- [ ] Wejdź na <https://console.cloud.google.com/projectcreate>
- [ ] **Nazwa projektu:** `padelvision` → **Utwórz**
- [ ] Sprawdź, że na górnym pasku konsoli (obok logo) jest wybrany projekt `padelvision` —
      wszystkie linki niżej działają na **aktualnie wybranym** projekcie
- [ ] Zapisz **Project ID** (generowany, np. `padelvision-472913`) — przyda się w krokach niżej
- [ ] Włącz API: <https://console.cloud.google.com/apis/library/youtube.googleapis.com> → **Włącz**

> Nie potrzebujesz karty płatniczej — YouTube Data API v3 działa w darmowej
> quocie 10 000 jednostek/dobę bez billingu.

---

## 2. OAuth — Platforma uwierzytelniania Google

> Od 2025 ekran zgody OAuth to osobny moduł **„Platforma uwierzytelniania Google"**
> z zakładkami. Kreator startowy pyta tylko o podstawy — **zakresy i użytkownicy
> testowi są w osobnych zakładkach**, nie na kolejnych ekranach kreatora.
> Nazwy poniżej są z polskiej wersji konsoli.

### 2a. Kreator (jednorazowo)

- [ ] <https://console.cloud.google.com/auth/overview> → **Rozpocznij**
- [ ] **Informacje o aplikacji:** *Nazwa aplikacji* `PadelVision`,
      *Adres e-mail dla użytkowników potrzebujących pomocy* `wojzed@gmail.com` → **Dalej**
- [ ] **Odbiorcy:** **Zewnętrzny** → **Dalej**
- [ ] **Dane kontaktowe:** *Adres e-mail* `wojzed@gmail.com` → **Dalej**
- [ ] **Zakończ:** zaznacz zgodę na zasady Google → **Utwórz**

Domena aplikacji i autoryzowane domeny (zakładka **Elementy marki**) nie są
potrzebne w trybie testowym — uzupełnia się je dopiero przed weryfikacją.

### 2b. Użytkownicy testowi

- [ ] <https://console.cloud.google.com/auth/audience> → sekcja **Użytkownicy testowi**
      → **Dodaj użytkowników** → `wojzed@gmail.com` → **Zapisz**
- [ ] **Nie publikuj aplikacji** — zostaje w trybie testowym (limit 100 kont testowych)

### 2c. Zakres

- [ ] <https://console.cloud.google.com/auth/scopes> (**Dostęp do danych**) → **Dodaj lub usuń zakresy**
- [ ] W wysuniętym z prawej panelu przewiń **na sam dół** — jest tam pole do ręcznego
      wpisania zakresów. Wklej:

  ```
  https://www.googleapis.com/auth/youtube.force-ssl
  ```

- [ ] Przycisk pod polem (dodaje do tabeli) → przycisk na dole panelu (zatwierdza)
- [ ] **Na dole strony „Dostęp do danych" kliknij Zapisz** — bez tego zmiana przepada

  To jedyny potrzebny zakres — pokrywa `liveBroadcasts` i `liveStreams`
  (insert / bind / list). **Nie dodawaj** `youtube.readonly` ani `youtube` —
  każdy dodatkowy zakres wydłuża weryfikację.

> Deklaracja zakresu jest wymagana do weryfikacji aplikacji, ale **nie blokuje
> logowania użytkowników testowych**. Jeśli nie da się znaleźć pola — pomiń 2c
> i wróć przed wnioskiem weryfikacyjnym. Gdyby w kroku 4 pojawił się błąd
> dotyczący zakresu, wróć tutaj.

> **Weryfikacja przez Google:** `youtube.force-ssl` to zakres wrażliwy. Dopóki
> aplikacja jest w trybie testowym, działa bez weryfikacji, ale **refresh token
> wygasa po 7 dniach** — do developmentu wystarczy. Przed pierwszym prawdziwym
> klubem trzeba opublikować aplikację i złożyć wniosek weryfikacyjny w
> **Centrum weryfikacji** (formularz + nagranie wideo pokazujące użycie zakresu,
> 2–6 tygodni). Zaplanuj to **równolegle z Fazami 1–3**, nie na końcu.

### 2d. Klient OAuth

- [ ] <https://console.cloud.google.com/auth/clients> (**Klienci**) → **Utwórz klienta**
- [ ] **Typ aplikacji:** **Aplikacja internetowa**
- [ ] **Nazwa:** `PadelVision YouTube`
- [ ] Sekcja **Autoryzowane identyfikatory URI przekierowania** → **Dodaj URI** — dodaj
      wszystkie trzy. **Nie** w sekcji *Autoryzowane źródła JavaScriptu* wyżej — ona
      też ma przycisk „Dodaj URI", ale to nie ta.

  ```
  http://localhost:8080/api/club/youtube/callback
  https://api.padelvision.tv/api/club/youtube/callback
  https://developers.google.com/oauthplayground
  ```

  Trzeci służy do generowania refresh tokenów bez uruchomionego backendu
  (krok 4). **Zostaw go, dopóki własny flow OAuth nie zadziała end-to-end
  (Faza 3)** — do tego czasu jest jedynym sposobem na odnowienie tokenu.
  Usuń dopiero potem.

- [ ] **Utwórz** → w okienku skopiuj **Identyfikator klienta** i **Tajny klucz klienta**
      do menedżera haseł. Tajny klucz jest w całości widoczny **tylko w tym okienku** —
      najpewniej od razu pobierz też plik JSON. Zgubiony klucz nie jest katastrofą:
      na stronie klienta można dodać nowy.

> **Nie używaj istniejących `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`** z
> `backend/.env.example` — to pozostałość po NextAuth z poprzedniej architektury,
> nigdzie w backendzie nieużywana (`grep -rl "oauth" backend/src` → pusto).
> YouTube dostaje własnego klienta, żeby weryfikacja jednego nie blokowała drugiego.

---

## 3. Kanał YouTube — włączenie transmisji na żywo

> ⏱ **24 h opóźnienia.** Zrób to jako pierwsze.

Użyj **osobnego kanału testowego**, nie kanału prawdziwego klubu.

- [ ] Zaloguj się na konto kanału testowego
- [ ] Weryfikacja numerem telefonu: <https://www.youtube.com/verify>
- [ ] Włącz live: na <https://www.youtube.com> kliknij **Utwórz** (ikona kamery, prawy
      górny róg) → **Rozpocznij transmisję na żywo** → potwierdź włączenie
- [ ] Odczekaj 24 h (dostaniesz maila)
- [ ] Sprawdź brak ostrzeżeń: YouTube Studio → Ustawienia → Kanał → **Stan i funkcje**
      (aktywne ostrzeżenie blokuje live na 90 dni)
- [ ] Zapisz **Channel ID**: YouTube Studio → Ustawienia → Kanał → Zaawansowane

---

## 4. Weryfikacja — pierwszy refresh token

Potwierdzenie, że kroki 1–3 faktycznie działają, zanim ruszy Faza 1.

OAuth Playground jest **tylko po angielsku** — nazwy przycisków poniżej są takie,
jakie tam zobaczysz.

- [ ] <https://developers.google.com/oauthplayground>
- [ ] Zębatka (prawy górny róg) → zaznacz **Use your own OAuth credentials**
- [ ] Wklej identyfikator i tajny klucz klienta z kroku 2d
- [ ] W lewym panelu wklej zakres ręcznie w pole *Input your own scopes*:

  ```
  https://www.googleapis.com/auth/youtube.force-ssl
  ```

- [ ] **Authorize APIs** → wybierz konto `wojzed@gmail.com`
- [ ] Jeśli Google zapyta o kanał — wybierz **kanał testowy**, nie prywatny. Token
      zwiąże się z kanałem wybranym w tym miejscu.
      **Wybór kanału się nie pojawił, a skrypt pokazuje prywatny kanał?** Google
      zapamiętał poprzednią zgodę. Usuń dostęp PadelVision na
      <https://myaccount.google.com/connections> i powtórz ten krok.
- [ ] Ekran o niezweryfikowanej aplikacji jest oczekiwany w trybie testowym →
      link **Zaawansowane** → link przejścia do PadelVision
- [ ] Na ekranie uprawnień **zaznacz ptaszek przy dostępie do YouTube**, jeśli jest —
      bez tego token nie dostanie zakresu → **Kontynuuj**
- [ ] **Exchange authorization code for tokens** → skopiuj **Refresh token**

Teraz sprawdź, że token faktycznie daje dostęp do live:

```bash
export YOUTUBE_CLIENT_ID='...' YOUTUBE_CLIENT_SECRET='...' YOUTUBE_REFRESH_TOKEN='...'
./scripts/youtube-check.sh
```

Skrypt nie wypisuje żadnych tokenów — tylko nazwę kanału, jego ID i status
uprawnień do transmisji.

---

## 5. Klucz szyfrowania tokenów

Refresh tokeny klubów trafiają do bazy zaszyfrowane AES-256-GCM (§6.1 planu).
Wygeneruj klucz **u siebie** — nie generuję go w sesji, żeby nie wylądował
w transkrypcie:

```bash
openssl rand -base64 32
```

- [ ] Zapisz wynik jako `YOUTUBE_TOKEN_ENC_KEY` w menedżerze haseł
- [ ] Wpisz go do `.env` (lokalnie) i do `C:\padelvision\.env.production` na serwerze firmowym (patrz [DEPLOY.md](DEPLOY.md))
- [ ] **Zrób backup poza repo i poza CI** — utrata klucza oznacza, że wszystkie
      kluby muszą przejść OAuth od nowa

---

## 6. Zmienne środowiskowe

Uzupełnij `.env` w katalogu repo (lokalnie, czyta go `docker-compose.yml`) oraz `C:\padelvision\.env.production` na serwerze (produkcja, szablon: `deploy/windows/.env.production.example`):

| Zmienna | Skąd | Uwagi |
|---|---|---|
| `YOUTUBE_CLIENT_ID` | krok 2d | jawny, trafia też do URL zgody |
| `YOUTUBE_CLIENT_SECRET` | krok 2d | **sekret** |
| `YOUTUBE_REDIRECT_URI` | krok 2d | musi się zgadzać co do znaku z konsolą |
| `YOUTUBE_TOKEN_ENC_KEY` | krok 5 | **sekret**, backup obowiązkowy |
| `YOUTUBE_DEFAULT_PRIVACY` | `unlisted` | patrz §10 pyt. 2 planu |
| `YOUTUBE_DEFAULT_LATENCY` | `low` | ~15–30 s, DVR działa |
| `YOUTUBE_DAILY_QUOTA_UNITS` | `10000` | domyślna quota projektu |

Frontend (`frontend/.env`, Vercel):

| Zmienna | Wartość |
|---|---|
| `VITE_YOUTUBE_EMBED_ORIGIN` | `http://localhost:5173` lokalnie, `https://padelvision.tv` na prod |

> `VITE_*` jest wkompilowywane w bundle i widoczne publicznie. Nigdy nie wkładaj
> tam `YOUTUBE_CLIENT_SECRET` ani `YOUTUBE_TOKEN_ENC_KEY` — cały OAuth dzieje się
> po stronie backendu.

---

## Definicja ukończenia Fazy 0

- [ ] `./scripts/youtube-check.sh` kończy się zielonym `✓` i pokazuje kanał testowy
- [ ] `liveStreams: OK` w wyjściu skryptu (to potwierdza, że 24 h minęło)
- [ ] `YOUTUBE_TOKEN_ENC_KEY` w menedżerze haseł + backup
- [ ] Redirect URI `oauthplayground` zostaje do Fazy 3, potem do usunięcia
- [ ] Wniosek weryfikacyjny do Google złożony **albo** świadomie odłożony
      z wiedzą, że refresh tokeny wygasają co 7 dni w trybie testowym

Po odhaczeniu — Faza 1 (§7 planu): migracja `V10`, encja `YouTubeChannelConnection`,
`TokenCipher`, `YouTubeOAuthService` + `Controller`.
