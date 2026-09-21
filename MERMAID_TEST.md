# Mermaid Rendering Test

## Test 1 — basic flowchart

```mermaid
flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Done]
    B -->|No| D[Retry]
```

## Test 2 — subgraph with quoted title

```mermaid
flowchart TB
    subgraph USERS["Uzytkownicy"]
        WEB["Przegladarka"]
    end
    WEB --> API["Backend"]
```

## Test 3 — subgraph without quotes

```mermaid
flowchart TB
    subgraph USERS[Uzytkownicy]
        WEB[Przegladarka]
    end
    WEB --> API[Backend]
```

## Test 4 — database cylinder shape

```mermaid
flowchart TD
    A[Controller] --> DB[(PostgreSQL)]
```

## Test 5 — chained arrows

```mermaid
flowchart TD
    A[API] --> B[PgBouncer] --> C[RDS]
```

## Test 6 — edge label with slash

```mermaid
flowchart TD
    A[Client] -->|POST /api/auth/login| B[AuthController]
```

## Test 7 — unicode arrow in node

```mermaid
flowchart TD
    A[401 → auto refresh]
```

## Test 8 — unicode arrow replaced

```mermaid
flowchart TD
    A["401 - auto refresh"]
```

## Test 9 — Polish diacritics in edge label

```mermaid
flowchart TD
    A -->|Utwórz sesję| B[Stripe]
```

## Test 10 — arrow to subgraph

```mermaid
flowchart TB
    subgraph VPC[VPC Region]
        ALB[Load Balancer]
    end
    GH[GitHub Actions] --> VPC
```

## Test 11 — sequence diagram

```mermaid
sequenceDiagram
    participant U as Uzytkownik
    participant API as Backend
    U->>API: POST /api/bookings
    API-->>U: 201 Created
```

## Test 12 — complex subgraph from README

```mermaid
flowchart TB
    subgraph USERS["Uzytkownicy"]
        WEB["Przegladarka / PWA"]
        MOBILE["Aplikacja mobilna"]
        OBS["OBS Studio / Kamera"]
    end

    subgraph EDGE["AWS Edge"]
        R53["Route 53 DNS"]
        CF["CloudFront CDN"]
        WAF["AWS WAF"]
    end

    subgraph VPC["VPC eu-central-1"]
        ALB["Application Load Balancer"]
        API["Backend Pods"]
        FE["Frontend Pods"]
        PGBOUNCER["PgBouncer Sidecar"]
        RDS["RDS PostgreSQL 16"]
        REDIS["ElastiCache Redis"]
    end

    WEB --> R53
    MOBILE --> R53
    R53 --> CF
    CF --> WAF
    WAF --> ALB
    ALB --> API
    ALB --> FE
    API --> PGBOUNCER
    PGBOUNCER --> RDS
    API --> REDIS
```
