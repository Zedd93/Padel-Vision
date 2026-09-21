-- Wyrównanie schematu bazy z mapowaniem encji JPA.
--
-- Backend nie startował na PostgreSQL: przy ddl-auto=validate Hibernate
-- odrzucał kontekst, bo schemat (odziedziczony po Prismie) rozjeżdżał się
-- z mapowaniem encji. Testy tego nie łapały, bo profil `test` używa H2
-- z ddl-auto=create-drop i buduje schemat z encji, a nie z migracji.

-- ─── 1. Kolumny enumowe → VARCHAR ────────────────────────────
-- Encje używają @Enumerated(EnumType.STRING), co Hibernate mapuje na VARCHAR.
-- Kolumny były natywnymi typami enum PostgreSQL (Types#OTHER).
-- Przy okazji znika konieczność ALTER TYPE przy dodawaniu wartości do enuma.

ALTER TABLE users ALTER COLUMN role DROP DEFAULT;
ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(50) USING role::text;
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'VIEWER';

ALTER TABLE users ALTER COLUMN viewer_tier DROP DEFAULT;
ALTER TABLE users ALTER COLUMN viewer_tier TYPE VARCHAR(50) USING viewer_tier::text;
ALTER TABLE users ALTER COLUMN viewer_tier SET DEFAULT 'FREE';

ALTER TABLE clubs ALTER COLUMN plan DROP DEFAULT;
ALTER TABLE clubs ALTER COLUMN plan TYPE VARCHAR(50) USING plan::text;
ALTER TABLE clubs ALTER COLUMN plan SET DEFAULT 'STARTER';

ALTER TABLE streams ALTER COLUMN status DROP DEFAULT;
ALTER TABLE streams ALTER COLUMN status TYPE VARCHAR(50) USING status::text;
ALTER TABLE streams ALTER COLUMN status SET DEFAULT 'OFFLINE';

ALTER TABLE tournaments ALTER COLUMN format TYPE VARCHAR(50) USING format::text;
ALTER TABLE tournaments ALTER COLUMN category TYPE VARCHAR(50) USING category::text;
ALTER TABLE tournaments ALTER COLUMN level TYPE VARCHAR(50) USING level::text;

ALTER TABLE subscriptions ALTER COLUMN type TYPE VARCHAR(50) USING type::text;
ALTER TABLE transactions ALTER COLUMN type TYPE VARCHAR(50) USING type::text;
ALTER TABLE notifications ALTER COLUMN type TYPE VARCHAR(50) USING type::text;

DROP TYPE IF EXISTS user_role;
DROP TYPE IF EXISTS viewer_tier;
DROP TYPE IF EXISTS club_plan;
DROP TYPE IF EXISTS stream_status;
DROP TYPE IF EXISTS tournament_format;
DROP TYPE IF EXISTS tournament_category;
DROP TYPE IF EXISTS tournament_level;
DROP TYPE IF EXISTS subscription_type;
DROP TYPE IF EXISTS transaction_type;
DROP TYPE IF EXISTS notification_type;

-- ─── 2. Brakujący klucz główny ───────────────────────────────
-- VerificationToken deklaruje @Id @GeneratedValue(IDENTITY) na kolumnie id,
-- której tabela nigdy nie miała.

ALTER TABLE verification_tokens ADD COLUMN id BIGSERIAL PRIMARY KEY;
