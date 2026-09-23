-- migrate:up
-- PGMQ: Postgres Message Queue extension (https://github.com/pgmq/pgmq).
-- Enabled by the pg16-pgmq image. Queues are created here so the app can send/read.
CREATE EXTENSION IF NOT EXISTS pgmq;

-- Queues used by NewsWatch workers (docs/architecture/03-backend-architecture.md §8).
-- pgmq.create is idempotent-safe via the DO block guard.
DO $$
DECLARE q text;
BEGIN
  FOREACH q IN ARRAY ARRAY[
    'media_probe',
    'media_transcode',
    'media_poster',
    'media_delete',
    'notification_push',
    'email_send',
    'sms_send',
    'article_scheduled_publish',
    'analytics_ingest',
    'poster_render'
  ]
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pgmq.list_queues() WHERE queue_name = q
    ) THEN
      PERFORM pgmq.create(q);
    END IF;
  END LOOP;
END $$;

-- migrate:down
DO $$
DECLARE q text;
BEGIN
  FOREACH q IN ARRAY ARRAY[
    'media_probe','media_transcode','media_poster','media_delete',
    'notification_push','email_send','sms_send',
    'article_scheduled_publish','analytics_ingest','poster_render'
  ]
  LOOP
    BEGIN
      PERFORM pgmq.drop_queue(q);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END LOOP;
END $$;
