# Deploy na DigitalOcean

Jednorazowa konfiguracja serwera produkcyjnego. Potem każdy merge do `main`
wdraża się sam.

**Co gdzie działa:**

| Część | Gdzie | Adres |
|---|---|---|
| Frontend | Vercel | `https://padelvision.tv` |
| Backend + baza + Redis | droplet DigitalOcean | `https://api.padelvision.tv` |
| HTTPS | Caddy na droplecie — sam pobiera i odnawia certyfikat | — |
| Transmisje | YouTube Live | — |

Sekrety trzymane są jako sekrety GitHuba. AWS nie jest potrzebny.

---

## A. Klucz SSH

- [ ] W terminalu na Macu:

  ```bash
  ssh-keygen -t ed25519 -f ~/.ssh/padelvision_deploy -N "" -C "github-deploy"
  ```

- [ ] Skopiuj **publiczną** część (przyda się w kroku B):

  ```bash
  pbcopy < ~/.ssh/padelvision_deploy.pub
  ```

---

## B. Serwer

- [ ] <https://cloud.digitalocean.com/droplets/new>
- [ ] **Region:** Frankfurt (FRA1) — najbliżej Polski
- [ ] **Image:** zakładka *Marketplace* → wyszukaj **Docker** → wybierz *Docker on Ubuntu*
      (Docker jest od razu zainstalowany)
- [ ] **Size:** *Basic* → *Regular* → **2 GB / 1 CPU** (~$12/mies.)
- [ ] **Authentication:** *SSH Key* → *New SSH Key* → wklej klucz z kroku A → nazwa `github-deploy`
- [ ] **Hostname:** `padelvision-prod` → **Create Droplet**
- [ ] Skopiuj **adres IP** dropletu
- [ ] Sprawdź połączenie (wstaw swoje IP):

  ```bash
  ssh -i ~/.ssh/padelvision_deploy root@TWOJE_IP "docker --version"
  ```

  Pierwsze połączenie zapyta o odcisk klucza — wpisz `yes`.

---

## C. Domena

- [ ] U rejestratora domeny `padelvision.tv` → ustawienia DNS → dodaj rekord:

  | Typ | Nazwa | Wartość | TTL |
  |---|---|---|---|
  | `A` | `api` | IP dropletu | 300 |

- [ ] Sprawdź (może potrwać od kilku minut do godziny):

  ```bash
  dig +short api.padelvision.tv
  ```

  Ma zwrócić IP dropletu. **Nie odpalaj deployu, zanim to zadziała** — Caddy nie
  dostanie certyfikatu, a Let's Encrypt po kilku nieudanych próbach blokuje
  domenę na godzinę.

---

## D. Plik z sekretami

- [ ] W katalogu repo:

  ```bash
  cp .env.production.example .env.production
  ```

- [ ] Wygeneruj hasło do bazy i wklej jako `POSTGRES_PASSWORD`:

  ```bash
  openssl rand -hex 24
  ```

- [ ] Wygeneruj klucz JWT i wklej jako `JWT_SECRET`:

  ```bash
  openssl rand -base64 64 | tr -d '\n'
  ```

- [ ] Wpisz `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET` i `YOUTUBE_TOKEN_ENC_KEY` —
      te same co w lokalnym `.env` z Fazy 0

Plik jest w `.gitignore`, nie trafi do repo. Zachowaj kopię w menedżerze haseł.

---

## E. Sekrety w GitHubie

Cztery komendy w katalogu repo (wstaw swoje IP):

```bash
gh secret set DIGITALOCEAN_HOST --body "TWOJE_IP"
```

```bash
gh secret set DIGITALOCEAN_USERNAME --body "root"
```

```bash
gh secret set DIGITALOCEAN_SSH_KEY < ~/.ssh/padelvision_deploy
```

```bash
gh secret set ENV_PRODUCTION < .env.production
```

- [ ] Sprawdź, że są cztery:

  ```bash
  gh secret list
  ```

> Do `DIGITALOCEAN_SSH_KEY` idzie klucz **prywatny** (bez `.pub`) — to on
> pozwala GitHubowi zalogować się na serwer.

---

## F. Frontend na Vercelu

- [ ] <https://vercel.com> → projekt **padel-vision** → *Settings* → *Environment Variables*
- [ ] Dodaj dla środowiska **Production**:

  | Nazwa | Wartość |
  |---|---|
  | `VITE_API_URL` | `https://api.padelvision.tv` |
  | `VITE_WS_URL` | `https://api.padelvision.tv/ws` |
  | `VITE_YOUTUBE_EMBED_ORIGIN` | `https://padelvision.tv` |

  `VITE_WS_URL` zaczyna się od **`https://`**, nie `wss://` — czat używa SockJS,
  który sam negocjuje WebSocket i odrzuca adresy `ws://`/`wss://`.

- [ ] *Deployments* → ostatni produkcyjny → **Redeploy** — zmienne `VITE_*` są
      wkompilowywane przy buildzie, więc bez przebudowy nie zadziałają

---

## G. Pierwszy deploy

```bash
gh workflow run "Deploy App" -f publish_images=true -f deploy=true
```

- [ ] Obserwuj przebieg:

  ```bash
  gh run watch
  ```

- [ ] Sprawdź, że backend odpowiada przez HTTPS:

  ```bash
  curl https://api.padelvision.tv/api/health
  ```

Od teraz każdy merge do `main` wdraża się automatycznie.

---

## Gdy coś nie działa

| Objaw | Przyczyna | Co zrobić |
|---|---|---|
| `Brak sekretu …` w kroku *Check deploy secrets* | sekret nie ustawiony | wróć do kroku E |
| `ENV_PRODUCTION nie zawiera POSTGRES_PASSWORD` | puste hasło w pliku | krok D, potem `gh secret set ENV_PRODUCTION < .env.production` |
| `ssh: handshake failed` | zły klucz albo IP | sprawdź krok B — ręczny `ssh` musi działać |
| `denied` przy `docker compose pull` | brak dostępu do obrazów GHCR | GitHub → *Packages* → `padelvision-backend` → *Package settings* → dodaj repo `Padel-Vision` z uprawnieniem *Read* |
| `curl` do API wisi albo błąd certyfikatu | DNS nie wskazuje na droplet | krok C — `dig` musi zwracać IP |
| Frontend nie łączy się z API | zmienne Vercela nieustawione albo bez redeployu | krok F |

Logi na serwerze:

```bash
ssh -i ~/.ssh/padelvision_deploy root@TWOJE_IP "cd /opt/padelvision && docker compose -f docker-compose.prod.yml --env-file .env.production logs --tail=100 backend caddy"
```

---

## Aktualizacja sekretów

Zmiana dowolnej zmiennej produkcyjnej:

1. Edytuj lokalny `.env.production`
2. `gh secret set ENV_PRODUCTION < .env.production`
3. `gh workflow run "Deploy App" -f publish_images=false -f deploy=true`
