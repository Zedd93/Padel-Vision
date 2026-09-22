# Deploy na serwer firmowy

Jednorazowa konfiguracja serwera produkcyjnego. Potem każdy merge do `main`
wdraża backend sam.

## Jak to działa

| Część | Gdzie | Adres |
|---|---|---|
| Frontend | Vercel | `https://padelvision.tv` |
| Backend | usługa Windows na serwerze firmowym | `https://api.padelvision.tv` |
| Baza | PostgreSQL na tym samym serwerze | `localhost:5432` |
| Redis | WSL Ubuntu22 na tym samym serwerze | `localhost:6379` |
| HTTPS | Cloudflare Tunnel (już działa na serwerze) | — |
| Transmisje | YouTube Live | — |

**Dlaczego tak, a nie Docker:** serwer ma WSL1, a WSL1 nie uruchomi Dockera —
nie ma prawdziwego jądra Linuksa. Przejście na WSL2 wymagałoby restartu serwera
i zmieniłoby sieć, na której działa Nextcloud. Backend to jeden plik JAR, więc
uruchamiamy go natywnie jako usługę Windows.

**Dlaczego self-hosted runner:** serwer stoi za NAT-em, więc GitHub nie może się
do niego zalogować. Runner zainstalowany na serwerze sam łączy się z GitHubem
(ruch wychodzący) i odbiera zadania deployu. **Nie trzeba otwierać żadnego portu.**

**Czego nie ruszamy:** nginx na 80 i 8086, Apache/Nextcloud na 8084, ArchiveCore
na 3001, konfiguracja cloudflared — dokładamy tylko jedną regułę tunelu.

**Konta i uprawnienia** (ważne na współdzielonym serwerze):

| Konto | Co może |
|---|---|
| `LocalService` — backend | czytać swoje pliki, pisać tylko do `logs` |
| `NETWORK SERVICE` — runner GitHub Actions | podmienić `backend.jar` i zrestartować **tylko** usługę `padelvision-api` |

Żadne z nich nie jest administratorem.

---

Wszystkie polecenia wykonujesz na serwerze (VPN + Pulpit zdalny)
w **PowerShellu uruchomionym jako administrator**, chyba że napisano inaczej.

## Krok 1. Pliki instalacyjne na serwer

- [ ] Na Macu skopiuj folder `deploy/windows` z repo
- [ ] Na serwerze wklej go jako `C:\padelvision-setup`
      (kopiowanie plików przez Pulpit zdalny działa zwykłym Ctrl+C / Ctrl+V)

W środku mają być: `install-service.ps1`, `deploy.ps1`, `.env.production.example`.

---

## Krok 2. Java 21

- [ ] Na serwerze wejdź na <https://adoptium.net/temurin/releases/?version=21&os=windows&arch=x64&package=jre>
- [ ] Pobierz plik **.msi** i zainstaluj z domyślnymi opcjami
- [ ] Sprawdź w **nowym** oknie PowerShella:

  ```powershell
  java -version
  ```

  Ma pokazać `version "21...`. Jeśli pokazuje inną wersję, to nic — skrypt
  instalacyjny sam znajdzie Javę 21.

---

## Krok 3. PostgreSQL

- [ ] Sprawdź, czy PostgreSQL już jest na serwerze:

  ```powershell
  Get-Service *postgres*
  ```

- [ ] **Jeśli nic nie pokazało** — pobierz instalator PostgreSQL 16 z
      <https://www.enterprisedb.com/downloads/postgres-postgresql-downloads>
      (Windows x86-64) i zainstaluj. Zapamiętaj hasło użytkownika `postgres`.
      Port zostaw `5432`.
- [ ] **Jeśli już jest** — użyjemy istniejącej instancji, tylko z osobną bazą.

- [ ] Wygeneruj hasło dla bazy PadelVision i **zapisz je** — przyda się w kroku 6:

  ```powershell
  wsl -d Ubuntu22 -- openssl rand -hex 24
  ```

- [ ] Utwórz użytkownika i bazę (w miejsce `HASLO` wklej hasło z poprzedniego punktu;
      zapyta o hasło użytkownika `postgres`):

  ```powershell
  & 'C:\Program Files\PostgreSQL\16\bin\psql.exe' -U postgres -c "CREATE USER padelvision WITH PASSWORD 'HASLO';"
  ```

  ```powershell
  & 'C:\Program Files\PostgreSQL\16\bin\psql.exe' -U postgres -c "CREATE DATABASE padelvision OWNER padelvision;"
  ```

  Jeśli PostgreSQL był już wcześniej w innej wersji, zamień `16` w ścieżce na
  numer wersji z `C:\Program Files\PostgreSQL\`.

Tabele założy sam backend przy pierwszym starcie (Flyway).

---

## Krok 4. Redis w WSL

- [ ] Zainstaluj i uruchom:

  ```powershell
  wsl -d Ubuntu22 -u root -- apt-get update
  ```

  ```powershell
  wsl -d Ubuntu22 -u root -- apt-get install -y redis-server
  ```

  ```powershell
  wsl -d Ubuntu22 -u root -- service redis-server start
  ```

- [ ] Sprawdź — ma odpowiedzieć `PONG`:

  ```powershell
  wsl -d Ubuntu22 -- redis-cli ping
  ```

- [ ] **Autostart po restarcie serwera.** Redis w WSL1 nie wstaje sam. Zrób to
      **tak samo, jak u Was startuje Apache/Nextcloud** — najpewniej jest na to
      zadanie w *Harmonogramie zadań*. Dopisz do niego:

  ```
  wsl.exe -d Ubuntu22 -u root -- service redis-server start
  ```

  Zadanie musi działać na tym samym koncie Windows, na którym zainstalowana jest
  dystrybucja `Ubuntu22` — dystrybucje WSL są przypisane do użytkownika.

---

## Krok 5. Pierwsze uruchomienie skryptu

```powershell
cd C:\padelvision-setup
```

```powershell
powershell -ExecutionPolicy Bypass -File .\install-service.ps1
```

Skrypt znajdzie Javę, utworzy `C:\padelvision` i skopiuje tam szablon
`.env.production`. **Zatrzyma się** z prośbą o uzupełnienie pliku — to
oczekiwane.

---

## Krok 6. Uzupełnij konfigurację

- [ ] Otwórz plik w Notatniku:

  ```powershell
  notepad C:\padelvision\.env.production
  ```

- [ ] `DATABASE_PASSWORD=` — hasło z kroku 3
- [ ] `JWT_SECRET=` — wygeneruj i wklej:

  ```powershell
  wsl -d Ubuntu22 -- openssl rand -hex 48
  ```

- [ ] `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_TOKEN_ENC_KEY` —
      **te same wartości** co w lokalnym `.env` z Fazy 0. Klucz szyfrowania musi
      być identyczny, inaczej zapisane połączenia klubów z YouTube przestaną działać
- [ ] Zapisz. Plik nie trafia do repo i nie ma go w GitHubie — **zrób kopię
      w menedżerze haseł**

---

## Krok 7. Instalacja usługi

Ten sam skrypt jeszcze raz:

```powershell
powershell -ExecutionPolicy Bypass -File .\install-service.ps1
```

Tym razem zainstaluje usługę `padelvision-api`, ustawi konta i uprawnienia.
Na końcu napisze, że usługi jeszcze nie uruchamia — plik `backend.jar` wgra
pierwszy deploy.

Jeśli port 4000 jest zajęty, skrypt to powie — wtedy uruchom go z innym, np.
`-Port 4010`, i użyj tego portu w kroku 10. Deploy odczyta go sam z konfiguracji
usługi.

---

## Krok 8. Runner GitHub Actions

- [ ] W przeglądarce: <https://github.com/Zedd93/Padel-Vision/settings/actions/runners/new>
- [ ] Wybierz **Windows** i **x64**
- [ ] Wykonaj polecenia ze strony w PowerShellu, ale **w katalogu `C:\actions-runner`**
      zamiast w katalogu domowym (pierwsze polecenie zamień na
      `mkdir C:\actions-runner; cd C:\actions-runner`)
- [ ] Przy `config.cmd` odpowiedz:

  | Pytanie | Odpowiedź |
  |---|---|
  | runner group | Enter |
  | name of runner | Enter |
  | **additional labels** | **`padelvision-prod`** |
  | work folder | Enter |
  | **run the runner as service?** | **`Y`** |
  | user account for the service | Enter (zostaje `NT AUTHORITY\NETWORK SERVICE`) |

- [ ] Odśwież stronę <https://github.com/Zedd93/Padel-Vision/settings/actions/runners> —
      runner ma być zielony, ze statusem **Idle**

> Etykieta `padelvision-prod` jest kluczowa: tylko zadanie deployu jej szuka.
> Testy i budowanie dalej lecą na serwerach GitHuba, nie obciążając firmowego.

---

## Krok 9. Pierwszy deploy

Na Macu:

```bash
gh workflow run "Deploy App" -f publish_images=false -f deploy=true
```

```bash
gh run watch
```

Albo w przeglądarce: **Actions** → **Deploy App** → **Run workflow** →
zaznacz **deploy** → **Run workflow**.

- [ ] Sprawdź na serwerze, że backend odpowiada:

  ```powershell
  Invoke-WebRequest http://127.0.0.1:4000/api/health -UseBasicParsing
  ```

  `StatusCode : 200` — działa.

Deploy robi kopię poprzedniej wersji i jeśli nowa nie odpowie w 3 minuty,
**sam przywraca poprzednią**.

---

## Krok 10. Cloudflare Tunnel

Backend słucha tylko na `127.0.0.1` — nie widać go nawet w sieci firmowej.
Z internetu dochodzi się do niego wyłącznie przez tunel.

Domena `padelvision.tv` musi być na tym samym koncie Cloudflare co tunel.

- [ ] <https://one.dash.cloudflare.com> → **Networks** → **Tunnels** → Wasz tunel
- [ ] **Jeśli jest przycisk *Configure*** (tunel zarządzany z panelu):
      zakładka **Public Hostname** → **Add a public hostname**:

  | Pole | Wartość |
  |---|---|
  | Subdomain | `api` |
  | Domain | `padelvision.tv` |
  | Type | `HTTP` |
  | URL | `localhost:4000` |

  → **Save**. Rekord DNS utworzy się sam.

- [ ] **Jeśli tunel jest zarządzany lokalnie** (plik `config.yml`): dopisz regułę
      **nad** ostatnią regułą `http_status:404`:

  ```yaml
    - hostname: api.padelvision.tv
      service: http://localhost:4000
  ```

  potem utwórz rekord DNS i zrestartuj usługę:

  ```powershell
  cloudflared tunnel route dns NAZWA_TUNELU api.padelvision.tv
  ```

  ```powershell
  Restart-Service cloudflared
  ```

- [ ] Z dowolnego komputera:

  ```bash
  curl https://api.padelvision.tv/api/health
  ```

WebSocket (czat) przechodzi przez tunel bez dodatkowej konfiguracji.

---

## Krok 11. Frontend na Vercelu

- [ ] <https://vercel.com> → projekt **padel-vision** → *Settings* →
      *Environment Variables* → dodaj dla **Production**:

  | Nazwa | Wartość |
  |---|---|
  | `VITE_API_URL` | `https://api.padelvision.tv` |
  | `VITE_WS_URL` | `https://api.padelvision.tv/ws` |
  | `VITE_YOUTUBE_EMBED_ORIGIN` | `https://padelvision.tv` |

  `VITE_WS_URL` zaczyna się od **`https://`**, nie `wss://` — czat używa SockJS,
  który sam negocjuje WebSocket i odrzuca adresy `ws://`/`wss://`.

- [ ] *Deployments* → ostatni produkcyjny → **⋯** → **Redeploy** —
      zmienne `VITE_*` są wkompilowywane przy budowaniu

> Na serwerze działa już frontend Padel Vision pod nginx:8086. Produkcyjny
> frontend jest na Vercelu, więc ten jest od niego niezależny — jeśli to stara
> wersja, można go wyłączyć.

---

## Gdy coś nie działa

| Objaw | Przyczyna | Co zrobić |
|---|---|---|
| Deploy wisi na „Waiting for a runner” | runner offline albo bez etykiety | krok 8 — runner zielony, etykieta `padelvision-prod` |
| `Nie ma uslugi padelvision-api` | skrypt nie przeszedł do końca | krok 7 |
| `JWT_SECRET ma N znakow` | za krótki klucz | krok 6, `openssl rand -hex 48` |
| `Backend nie odpowiedzial` + błąd bazy w logu | zła nazwa/hasło bazy | krok 3 i `DATABASE_*` w kroku 6 |
| `Backend nie odpowiedzial` + `RedisConnectionFailure` | Redis nie działa | `wsl -d Ubuntu22 -u root -- service redis-server start` |
| `Access denied` przy zatrzymaniu usługi | brak uprawnień runnera | uruchom ponownie krok 7 |
| `curl` do API zwraca 502/530 | tunel nie widzi backendu | krok 10 — port w regule musi się zgadzać |
| Frontend nie łączy się z API | zmienne Vercela bez redeployu | krok 11 |

**Logi backendu:**

```powershell
Get-Content C:\padelvision\logs\padelvision-api.out.log -Tail 100
```

**Stan usługi:**

```powershell
Get-Service padelvision-api
```

---

## Zmiana konfiguracji

1. Edytuj `C:\padelvision\.env.production`
2. `Restart-Service padelvision-api`

Nowy deploy nie jest potrzebny — plik czytany jest przy każdym starcie.
