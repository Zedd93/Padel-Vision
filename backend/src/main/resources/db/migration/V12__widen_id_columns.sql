-- Rozszerzenie kolumn identyfikatorow z VARCHAR(30) do VARCHAR(36).
--
-- Schemat odziedziczyl VARCHAR(30) po cuid-ach z Prismy, ale encje generuja
-- w @PrePersist 36-znakowe UUID-y. Kazdy zapis nowego rekordu konczyl sie
-- bledem Postgresa:
--
--   ERROR: value too long for type character varying(30)
--   [insert into users (...) values (...)]
--
-- Dotyczylo to takze clubs.stream_key, ktory rowniez dostaje UUID.
-- Rozszerzenie VARCHAR nie przepisuje tabeli i nie rusza istniejacych danych.
-- Kolumny kluczy obcych rozszerzane razem z kolumnami, na ktore wskazuja.

ALTER TABLE youtube_channel_connections ALTER COLUMN club_id TYPE VARCHAR(36);
ALTER TABLE users ALTER COLUMN id TYPE VARCHAR(36);
ALTER TABLE accounts ALTER COLUMN id TYPE VARCHAR(36);
ALTER TABLE accounts ALTER COLUMN user_id TYPE VARCHAR(36);
ALTER TABLE sessions ALTER COLUMN id TYPE VARCHAR(36);
ALTER TABLE sessions ALTER COLUMN user_id TYPE VARCHAR(36);
ALTER TABLE bits_wallets ALTER COLUMN id TYPE VARCHAR(36);
ALTER TABLE bits_wallets ALTER COLUMN user_id TYPE VARCHAR(36);
ALTER TABLE clubs ALTER COLUMN id TYPE VARCHAR(36);
ALTER TABLE clubs ALTER COLUMN user_id TYPE VARCHAR(36);
ALTER TABLE clubs ALTER COLUMN stream_key TYPE VARCHAR(36);
ALTER TABLE multistream_configs ALTER COLUMN id TYPE VARCHAR(36);
ALTER TABLE multistream_configs ALTER COLUMN club_id TYPE VARCHAR(36);
ALTER TABLE playtomic_integrations ALTER COLUMN id TYPE VARCHAR(36);
ALTER TABLE playtomic_integrations ALTER COLUMN club_id TYPE VARCHAR(36);
ALTER TABLE streams ALTER COLUMN id TYPE VARCHAR(36);
ALTER TABLE streams ALTER COLUMN club_id TYPE VARCHAR(36);
ALTER TABLE streams ALTER COLUMN match_id TYPE VARCHAR(36);
ALTER TABLE vods ALTER COLUMN id TYPE VARCHAR(36);
ALTER TABLE vods ALTER COLUMN stream_id TYPE VARCHAR(36);
ALTER TABLE highlights ALTER COLUMN id TYPE VARCHAR(36);
ALTER TABLE highlights ALTER COLUMN vod_id TYPE VARCHAR(36);
ALTER TABLE chat_messages ALTER COLUMN id TYPE VARCHAR(36);
ALTER TABLE chat_messages ALTER COLUMN stream_id TYPE VARCHAR(36);
ALTER TABLE chat_messages ALTER COLUMN user_id TYPE VARCHAR(36);
ALTER TABLE stream_tags ALTER COLUMN id TYPE VARCHAR(36);
ALTER TABLE stream_tags ALTER COLUMN stream_id TYPE VARCHAR(36);
ALTER TABLE tournaments ALTER COLUMN id TYPE VARCHAR(36);
ALTER TABLE tournaments ALTER COLUMN club_id TYPE VARCHAR(36);
ALTER TABLE matches ALTER COLUMN id TYPE VARCHAR(36);
ALTER TABLE matches ALTER COLUMN tournament_id TYPE VARCHAR(36);
ALTER TABLE players ALTER COLUMN id TYPE VARCHAR(36);
ALTER TABLE players ALTER COLUMN club_id TYPE VARCHAR(36);
ALTER TABLE follows ALTER COLUMN id TYPE VARCHAR(36);
ALTER TABLE follows ALTER COLUMN follower_id TYPE VARCHAR(36);
ALTER TABLE follows ALTER COLUMN club_id TYPE VARCHAR(36);
ALTER TABLE follows ALTER COLUMN player_id TYPE VARCHAR(36);
ALTER TABLE subscriptions ALTER COLUMN id TYPE VARCHAR(36);
ALTER TABLE subscriptions ALTER COLUMN user_id TYPE VARCHAR(36);
ALTER TABLE subscriptions ALTER COLUMN club_id TYPE VARCHAR(36);
ALTER TABLE transactions ALTER COLUMN id TYPE VARCHAR(36);
ALTER TABLE transactions ALTER COLUMN user_id TYPE VARCHAR(36);
ALTER TABLE notifications ALTER COLUMN id TYPE VARCHAR(36);
ALTER TABLE notifications ALTER COLUMN user_id TYPE VARCHAR(36);
