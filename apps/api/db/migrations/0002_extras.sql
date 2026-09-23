-- migrate:up
-- NewsWatch PostgreSQL extras applied after Prisma migrations.
-- Covers things Prisma cannot express: extensions, citext, partial indexes,
-- generated tsvector, CHECK constraints, and the updated_at trigger.
-- Idempotent: safe to re-run.

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS citext;     -- case-insensitive email
CREATE EXTENSION IF NOT EXISTS pg_trgm;    -- fuzzy search on names

-- ---------- updated_at trigger ----------
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t text;
BEGIN
  FOR t IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename IN ('users','reporter_profiles','regions','categories','comments',
                        'devices','media_assets','app_settings','article_posters')
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_updated ON %I', t, t);
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
      t, t);
  END LOOP;
END $$;

-- ---------- users: citext email + partial unique indexes ----------
ALTER TABLE users ALTER COLUMN email TYPE citext;
DROP INDEX IF EXISTS "users_email_key";
CREATE UNIQUE INDEX IF NOT EXISTS ux_users_email ON users (email) WHERE is_deleted = false;
CREATE UNIQUE INDEX IF NOT EXISTS ux_users_phone ON users (phone) WHERE is_deleted = false AND phone IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ux_users_username ON users (username) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS ix_users_role ON users (role) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS ix_users_not_deleted ON users (created_at DESC) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS ix_users_deleted ON users (deleted_at DESC) WHERE is_deleted = true;

-- ---------- articles: full-text + partial indexes ----------
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(body, '')), 'C')
  ) STORED;

CREATE INDEX IF NOT EXISTS ix_articles_search ON articles USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS ix_articles_feed
  ON articles (published_at DESC, id DESC)
  WHERE status = 'published' AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS ix_articles_reporter
  ON articles (reporter_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS ix_articles_region
  ON articles (region_id, published_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS ix_articles_breaking
  ON articles (published_at DESC) WHERE is_breaking = true AND status = 'published';
CREATE INDEX IF NOT EXISTS ix_articles_scheduled
  ON articles (scheduled_at) WHERE status = 'pending' AND scheduled_at IS NOT NULL;

-- ---------- media_assets: type-aware size/duration CHECKs ----------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_media_size_by_kind') THEN
    ALTER TABLE media_assets ADD CONSTRAINT ck_media_size_by_kind CHECK (
      (kind = 'image' AND size_bytes <= 10485760) OR
      (kind = 'video' AND size_bytes <= 209715200)
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_media_duration_max') THEN
    ALTER TABLE media_assets ADD CONSTRAINT ck_media_duration_max CHECK (
      duration_seconds IS NULL OR duration_seconds <= 180
    );
  END IF;
END $$;

-- ---------- content partial indexes ----------
CREATE INDEX IF NOT EXISTS ix_comments_article
  ON comments (article_id, created_at DESC)
  WHERE deleted_at IS NULL AND is_hidden = false;
CREATE INDEX IF NOT EXISTS ix_comments_parent
  ON comments (parent_id, created_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS ix_notifications_unread
  ON notifications (user_id) WHERE read = false;
CREATE INDEX IF NOT EXISTS ix_ac_category ON article_categories (category_id, article_id);
CREATE INDEX IF NOT EXISTS ix_article_tags_tag ON article_tags (tag_id, article_id);
CREATE INDEX IF NOT EXISTS ix_otp_identifier
  ON otp_codes (identifier, purpose) WHERE consumed_at IS NULL;
CREATE INDEX IF NOT EXISTS ix_refresh_user
  ON refresh_tokens (user_id) WHERE revoked_at IS NULL;

-- migrate:down
SELECT 1;
