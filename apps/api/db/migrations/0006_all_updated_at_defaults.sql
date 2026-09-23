-- migrate:up
-- Ensure every NOT NULL `updated_at` column has a DEFAULT now(), so plain
-- INSERTs (Drizzle) work without supplying it. Idempotent: re-setting a default
-- is safe.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT table_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_name = 'updated_at'
      AND is_nullable = 'NO'
      AND column_default IS NULL
  LOOP
    EXECUTE format('ALTER TABLE %I ALTER COLUMN updated_at SET DEFAULT now()', r.table_name);
  END LOOP;
END $$;

-- migrate:down
-- No-op: defaults are harmless to leave in place.
SELECT 1;
