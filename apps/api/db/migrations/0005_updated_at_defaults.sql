-- migrate:up
-- updated_at columns: Prisma's @updatedAt is client-side. Give the column a
-- default so plain INSERTs work (the set_updated_at() trigger also fires).
ALTER TABLE users             ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE reporter_profiles ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE regions           ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE categories        ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE comments          ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE devices           ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE media_assets      ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE article_posters   ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE app_settings      ALTER COLUMN updated_at SET DEFAULT now();

-- migrate:down
ALTER TABLE users             ALTER COLUMN updated_at DROP DEFAULT;
ALTER TABLE reporter_profiles ALTER COLUMN updated_at DROP DEFAULT;
ALTER TABLE regions           ALTER COLUMN updated_at DROP DEFAULT;
ALTER TABLE categories        ALTER COLUMN updated_at DROP DEFAULT;
ALTER TABLE comments          ALTER COLUMN updated_at DROP DEFAULT;
ALTER TABLE devices           ALTER COLUMN updated_at DROP DEFAULT;
ALTER TABLE media_assets      ALTER COLUMN updated_at DROP DEFAULT;
ALTER TABLE article_posters   ALTER COLUMN updated_at DROP DEFAULT;
ALTER TABLE app_settings      ALTER COLUMN updated_at DROP DEFAULT;
