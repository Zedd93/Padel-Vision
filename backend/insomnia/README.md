# PadelVision API — Insomnia Collection

Insomnia Collection covering every public REST endpoint exposed by the
PadelVision Spring Boot backend, plus a smoke-test suite that runs
automatically in CI against a live instance of the API.

## Files

- `padelvision.insomnia.json` — Insomnia v4 export (workspace, environments,
  request groups, requests, and the `smoke` unit test suite)

## Local usage (Insomnia desktop app)

1. Open Insomnia
2. **Application menu -> Import** -> *From file*
3. Pick `backend/insomnia/padelvision.insomnia.json`
4. The workspace **PadelVision API** appears with folders 01-10 grouped by
   domain (Health, Auth, Users, Clubs, Streams, Tournaments, Players, Search,
   Notifications, Admin)
5. Switch the active environment to **Local** (top-left dropdown).
   `base_url` defaults to `http://localhost:8080`.

### Auth flow when poking around manually

1. Hit `POST /api/auth/register` once (the email/username include
   `{% now 'unix' %}` so they are unique per call)
2. Hit `POST /api/auth/login` with the same credentials
3. Copy `accessToken` from the response into the **Base Environment** ->
   `access_token` field (Insomnia: cmd+e to edit env)
4. All authenticated endpoints (Users, Notifications, Admin, Tournaments
   create, Clubs settings) will pick up the bearer header automatically

## Smoke test suite

The `smoke` test suite chains the most important endpoints into a happy
path that exercises both the public API and the auth flow. It contains
13 assertions across:

| # | Test | What it verifies |
|---|---|---|
| 1 | Health endpoint | `200 OK` + `status` field present |
| 2 | Register new user | response contains `accessToken`, `refreshToken`, `user` |
| 3 | Login with same credentials | tokens returned, user object has `id` and `email` |
| 4 | GET `/api/clubs` | array (or paginated `content`) |
| 5 | GET `/api/clubs/live-map` | array |
| 6 | GET `/api/streams/live` | array |
| 7 | GET `/api/streams/archived` | paginated response |
| 8 | GET `/api/tournaments` | array |
| 9 | GET `/api/tournaments/trending` | array |
| 10 | GET `/api/players` | array |
| 11 | GET `/api/players/rankings` | array |
| 12 | GET `/api/search?q=padel` | object |

Each test is a small JS function using `expect()` (Chai-style) — the source
lives inline in the JSON file under `unit_test` resources, easy to grep.

## Running the suite locally with Inso CLI

[Inso](https://docs.insomnia.rest/inso-cli/introduction) is the headless
runner for Insomnia collections. Install it once:

```bash
npm install -g insomnia-inso
```

Then start the backend (in another terminal) and run the smoke suite:

```bash
# 1. Start backend (any of these)
cd backend && mvn spring-boot:run
# or
docker compose up -d backend postgres redis

# 2. Wait for /api/health to respond
curl -fsS http://localhost:8080/api/health

# 3. Run the smoke suite
cd backend
inso run test smoke \
  --src insomnia/padelvision.insomnia.json \
  --env Local \
  --reporter spec
```

Exit code is `0` on success, non-zero on any failed assertion — perfect
for CI gating.

### Useful Inso flags

| Flag | Purpose |
|---|---|
| `--reporter spec` | human-readable output (default `dot`) |
| `--reporter min` | minimal output, useful in CI |
| `--bail` | stop at first failed assertion |
| `--verbose` | print full request/response for every call |
| `--ci` | machine-friendly output, no colors |

## CI integration

The smoke suite runs automatically inside the **Backend: Test** workflow
on every push and pull request. See `.github/workflows/backend-test.yml`
- the `api-test` job:

1. Boots Postgres + Redis as service containers
2. Builds the backend jar with Maven (`mvn package -DskipTests`)
3. Starts the jar in the background (test profile uses real Postgres)
4. Polls `/api/health` until it responds (max 60s)
5. Installs `insomnia-inso` from npm
6. Runs `inso run test smoke --src backend/insomnia/padelvision.insomnia.json --env CI`
7. Fails the job on any assertion failure

This means every PR automatically verifies that the API surface still
works end-to-end, not just at the unit test level.

## Adding new requests

1. Open the collection in Insomnia desktop, add the request inside the
   matching `01-Health` ... `10-Admin` folder
2. Use `{{ _.base_url }}` for the host so it works across environments
3. For auth-required calls, add `Authorization: Bearer {{ _.access_token }}`
4. **Application menu -> Export -> Insomnia v4 (JSON)** -> overwrite
   `backend/insomnia/padelvision.insomnia.json`
5. Commit the file. Diffs are reasonable because the JSON is sorted by
   `_id` and one-resource-per-block

## Adding new tests

1. In Insomnia desktop, **Tests** tab on the left -> `smoke` suite
2. **+ New Test** -> pick a request -> write JS using `expect(...)`
3. Re-export the collection JSON and commit
