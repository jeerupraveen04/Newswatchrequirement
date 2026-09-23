-- migrate:up
-- Prisma generated UUIDs client-side and did not emit DEFAULT clauses.
-- Drizzle relies on database defaults, so add them here (idempotent).

ALTER TABLE users               ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE roles               ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE permissions         ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE refresh_tokens      ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE otp_codes           ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE reporter_profiles   ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE regions             ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE admin_region_scopes    ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE reporter_region_scopes ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE articles            ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE article_images      ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE article_status_history ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE categories          ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE tags                ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE comments            ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE reactions           ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE bookmarks           ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE follows             ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE notifications       ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE devices             ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE media_assets        ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE article_posters     ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE analytics_events    ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE audit_logs          ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- updated_at columns: Prisma's @updatedAt is client-side, but the set_updated_at()
-- trigger (0002) also fires. Give the column a default so plain INSERTs work.
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
ALTER TABLE users               ALTER COLUMN id DROP DEFAULT;
ALTER TABLE roles               ALTER COLUMN id DROP DEFAULT;
ALTER TABLE permissions         ALTER COLUMN id DROP DEFAULT;
ALTER TABLE refresh_tokens      ALTER COLUMN id DROP DEFAULT;
ALTER TABLE otp_codes           ALTER COLUMN id DROP DEFAULT;
ALTER TABLE reporter_profiles   ALTER COLUMN id DROP DEFAULT;
ALTER TABLE regions             ALTER COLUMN id DROP DEFAULT;
ALTER TABLE admin_region_scopes    ALTER COLUMN id DROP DEFAULT;
ALTER TABLE reporter_region_scopes ALTER COLUMN id DROP DEFAULT;
ALTER TABLE articles            ALTER COLUMN id DROP DEFAULT;
ALTER TABLE article_images      ALTER COLUMN id DROP DEFAULT;
ALTER TABLE article_status_history ALTER COLUMN id DROP DEFAULT;
ALTER TABLE categories          ALTER COLUMN id DROP DEFAULT;
ALTER TABLE tags                ALTER COLUMN id DROP DEFAULT;
ALTER TABLE comments            ALTER COLUMN id DROP DEFAULT;
ALTER TABLE reactions           ALTER COLUMN id DROP DEFAULT;
ALTER TABLE bookmarks           ALTER COLUMN id DROP DEFAULT;
ALTER TABLE follows             ALTER COLUMN id DROP DEFAULT;
ALTER TABLE notifications       ALTER COLUMN id DROP DEFAULT;
ALTER TABLE devices             ALTER COLUMN id DROP DEFAULT;
ALTER TABLE media_assets        ALTER COLUMN id DROP DEFAULT;
ALTER TABLE article_posters     ALTER COLUMN id DROP DEFAULT;
ALTER TABLE analytics_events    ALTER COLUMN id DROP DEFAULT;
ALTER TABLE audit_logs          ALTER COLUMN id DROP DEFAULT;
