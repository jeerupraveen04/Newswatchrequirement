\restrict dbmate

-- Dumped from database version 16.15 (Debian 16.15-1.pgdg12+2)
-- Dumped by pg_dump version 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgmq; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA pgmq;


--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


--
-- Name: citext; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;


--
-- Name: EXTENSION citext; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION citext IS 'data type for case-insensitive character strings';


--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: pgmq; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgmq WITH SCHEMA pgmq;


--
-- Name: EXTENSION pgmq; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgmq IS 'A lightweight message queue. Like AWS SQS and RSMQ but on Postgres.';


--
-- Name: ArticleStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ArticleStatus" AS ENUM (
    'draft',
    'pending',
    'published',
    'rejected',
    'unpublished',
    'deleted'
);


--
-- Name: BodyFormat; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."BodyFormat" AS ENUM (
    'rich',
    'markdown'
);


--
-- Name: FollowTarget; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."FollowTarget" AS ENUM (
    'reporter',
    'category'
);


--
-- Name: MediaKind; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."MediaKind" AS ENUM (
    'image',
    'video'
);


--
-- Name: MediaProcessingStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."MediaProcessingStatus" AS ENUM (
    'pending',
    'processing',
    'ready',
    'failed'
);


--
-- Name: MediaPurpose; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."MediaPurpose" AS ENUM (
    'avatar',
    'article',
    'hero',
    'gallery',
    'poster',
    'video'
);


--
-- Name: MediaStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."MediaStatus" AS ENUM (
    'pending',
    'processing',
    'ready',
    'failed'
);


--
-- Name: NotificationType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."NotificationType" AS ENUM (
    'new_article',
    'breaking',
    'comment_reply',
    'comment_like',
    'reporter_article_status'
);


--
-- Name: OtpChannel; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."OtpChannel" AS ENUM (
    'sms',
    'email'
);


--
-- Name: OtpPurpose; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."OtpPurpose" AS ENUM (
    'login',
    'signup',
    'reset'
);


--
-- Name: PosterTemplate; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PosterTemplate" AS ENUM (
    'classic',
    'breaking',
    'minimal',
    'gradient',
    'photo_hero'
);


--
-- Name: ReactionType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ReactionType" AS ENUM (
    'like'
);


--
-- Name: RegionType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."RegionType" AS ENUM (
    'state',
    'district',
    'constituency',
    'mandal'
);


--
-- Name: ReporterStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ReporterStatus" AS ENUM (
    'pending',
    'approved',
    'rejected',
    'revoked'
);


--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."UserRole" AS ENUM (
    'user',
    'reporter',
    'admin',
    'super_admin'
);


--
-- Name: UserStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."UserStatus" AS ENUM (
    'active',
    'suspended',
    'deleted'
);


--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: a_analytics_ingest; Type: TABLE; Schema: pgmq; Owner: -
--

CREATE TABLE pgmq.a_analytics_ingest (
    msg_id bigint NOT NULL,
    read_ct integer DEFAULT 0 NOT NULL,
    enqueued_at timestamp with time zone DEFAULT now() NOT NULL,
    last_read_at timestamp with time zone,
    archived_at timestamp with time zone DEFAULT now() NOT NULL,
    vt timestamp with time zone NOT NULL,
    message jsonb,
    headers jsonb
);


--
-- Name: a_article_scheduled_publish; Type: TABLE; Schema: pgmq; Owner: -
--

CREATE TABLE pgmq.a_article_scheduled_publish (
    msg_id bigint NOT NULL,
    read_ct integer DEFAULT 0 NOT NULL,
    enqueued_at timestamp with time zone DEFAULT now() NOT NULL,
    last_read_at timestamp with time zone,
    archived_at timestamp with time zone DEFAULT now() NOT NULL,
    vt timestamp with time zone NOT NULL,
    message jsonb,
    headers jsonb
);


--
-- Name: a_email_send; Type: TABLE; Schema: pgmq; Owner: -
--

CREATE TABLE pgmq.a_email_send (
    msg_id bigint NOT NULL,
    read_ct integer DEFAULT 0 NOT NULL,
    enqueued_at timestamp with time zone DEFAULT now() NOT NULL,
    last_read_at timestamp with time zone,
    archived_at timestamp with time zone DEFAULT now() NOT NULL,
    vt timestamp with time zone NOT NULL,
    message jsonb,
    headers jsonb
);


--
-- Name: a_media_delete; Type: TABLE; Schema: pgmq; Owner: -
--

CREATE TABLE pgmq.a_media_delete (
    msg_id bigint NOT NULL,
    read_ct integer DEFAULT 0 NOT NULL,
    enqueued_at timestamp with time zone DEFAULT now() NOT NULL,
    last_read_at timestamp with time zone,
    archived_at timestamp with time zone DEFAULT now() NOT NULL,
    vt timestamp with time zone NOT NULL,
    message jsonb,
    headers jsonb
);


--
-- Name: a_media_poster; Type: TABLE; Schema: pgmq; Owner: -
--

CREATE TABLE pgmq.a_media_poster (
    msg_id bigint NOT NULL,
    read_ct integer DEFAULT 0 NOT NULL,
    enqueued_at timestamp with time zone DEFAULT now() NOT NULL,
    last_read_at timestamp with time zone,
    archived_at timestamp with time zone DEFAULT now() NOT NULL,
    vt timestamp with time zone NOT NULL,
    message jsonb,
    headers jsonb
);


--
-- Name: a_media_probe; Type: TABLE; Schema: pgmq; Owner: -
--

CREATE TABLE pgmq.a_media_probe (
    msg_id bigint NOT NULL,
    read_ct integer DEFAULT 0 NOT NULL,
    enqueued_at timestamp with time zone DEFAULT now() NOT NULL,
    last_read_at timestamp with time zone,
    archived_at timestamp with time zone DEFAULT now() NOT NULL,
    vt timestamp with time zone NOT NULL,
    message jsonb,
    headers jsonb
);


--
-- Name: a_media_transcode; Type: TABLE; Schema: pgmq; Owner: -
--

CREATE TABLE pgmq.a_media_transcode (
    msg_id bigint NOT NULL,
    read_ct integer DEFAULT 0 NOT NULL,
    enqueued_at timestamp with time zone DEFAULT now() NOT NULL,
    last_read_at timestamp with time zone,
    archived_at timestamp with time zone DEFAULT now() NOT NULL,
    vt timestamp with time zone NOT NULL,
    message jsonb,
    headers jsonb
);


--
-- Name: a_notification_push; Type: TABLE; Schema: pgmq; Owner: -
--

CREATE TABLE pgmq.a_notification_push (
    msg_id bigint NOT NULL,
    read_ct integer DEFAULT 0 NOT NULL,
    enqueued_at timestamp with time zone DEFAULT now() NOT NULL,
    last_read_at timestamp with time zone,
    archived_at timestamp with time zone DEFAULT now() NOT NULL,
    vt timestamp with time zone NOT NULL,
    message jsonb,
    headers jsonb
);


--
-- Name: a_poster_render; Type: TABLE; Schema: pgmq; Owner: -
--

CREATE TABLE pgmq.a_poster_render (
    msg_id bigint NOT NULL,
    read_ct integer DEFAULT 0 NOT NULL,
    enqueued_at timestamp with time zone DEFAULT now() NOT NULL,
    last_read_at timestamp with time zone,
    archived_at timestamp with time zone DEFAULT now() NOT NULL,
    vt timestamp with time zone NOT NULL,
    message jsonb,
    headers jsonb
);


--
-- Name: a_sms_send; Type: TABLE; Schema: pgmq; Owner: -
--

CREATE TABLE pgmq.a_sms_send (
    msg_id bigint NOT NULL,
    read_ct integer DEFAULT 0 NOT NULL,
    enqueued_at timestamp with time zone DEFAULT now() NOT NULL,
    last_read_at timestamp with time zone,
    archived_at timestamp with time zone DEFAULT now() NOT NULL,
    vt timestamp with time zone NOT NULL,
    message jsonb,
    headers jsonb
);


--
-- Name: q_analytics_ingest; Type: TABLE; Schema: pgmq; Owner: -
--

CREATE TABLE pgmq.q_analytics_ingest (
    msg_id bigint NOT NULL,
    read_ct integer DEFAULT 0 NOT NULL,
    enqueued_at timestamp with time zone DEFAULT now() NOT NULL,
    last_read_at timestamp with time zone,
    vt timestamp with time zone NOT NULL,
    message jsonb,
    headers jsonb
);


--
-- Name: q_analytics_ingest_msg_id_seq; Type: SEQUENCE; Schema: pgmq; Owner: -
--

ALTER TABLE pgmq.q_analytics_ingest ALTER COLUMN msg_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME pgmq.q_analytics_ingest_msg_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: q_article_scheduled_publish; Type: TABLE; Schema: pgmq; Owner: -
--

CREATE TABLE pgmq.q_article_scheduled_publish (
    msg_id bigint NOT NULL,
    read_ct integer DEFAULT 0 NOT NULL,
    enqueued_at timestamp with time zone DEFAULT now() NOT NULL,
    last_read_at timestamp with time zone,
    vt timestamp with time zone NOT NULL,
    message jsonb,
    headers jsonb
);


--
-- Name: q_article_scheduled_publish_msg_id_seq; Type: SEQUENCE; Schema: pgmq; Owner: -
--

ALTER TABLE pgmq.q_article_scheduled_publish ALTER COLUMN msg_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME pgmq.q_article_scheduled_publish_msg_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: q_email_send; Type: TABLE; Schema: pgmq; Owner: -
--

CREATE TABLE pgmq.q_email_send (
    msg_id bigint NOT NULL,
    read_ct integer DEFAULT 0 NOT NULL,
    enqueued_at timestamp with time zone DEFAULT now() NOT NULL,
    last_read_at timestamp with time zone,
    vt timestamp with time zone NOT NULL,
    message jsonb,
    headers jsonb
);


--
-- Name: q_email_send_msg_id_seq; Type: SEQUENCE; Schema: pgmq; Owner: -
--

ALTER TABLE pgmq.q_email_send ALTER COLUMN msg_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME pgmq.q_email_send_msg_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: q_media_delete; Type: TABLE; Schema: pgmq; Owner: -
--

CREATE TABLE pgmq.q_media_delete (
    msg_id bigint NOT NULL,
    read_ct integer DEFAULT 0 NOT NULL,
    enqueued_at timestamp with time zone DEFAULT now() NOT NULL,
    last_read_at timestamp with time zone,
    vt timestamp with time zone NOT NULL,
    message jsonb,
    headers jsonb
);


--
-- Name: q_media_delete_msg_id_seq; Type: SEQUENCE; Schema: pgmq; Owner: -
--

ALTER TABLE pgmq.q_media_delete ALTER COLUMN msg_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME pgmq.q_media_delete_msg_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: q_media_poster; Type: TABLE; Schema: pgmq; Owner: -
--

CREATE TABLE pgmq.q_media_poster (
    msg_id bigint NOT NULL,
    read_ct integer DEFAULT 0 NOT NULL,
    enqueued_at timestamp with time zone DEFAULT now() NOT NULL,
    last_read_at timestamp with time zone,
    vt timestamp with time zone NOT NULL,
    message jsonb,
    headers jsonb
);


--
-- Name: q_media_poster_msg_id_seq; Type: SEQUENCE; Schema: pgmq; Owner: -
--

ALTER TABLE pgmq.q_media_poster ALTER COLUMN msg_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME pgmq.q_media_poster_msg_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: q_media_probe; Type: TABLE; Schema: pgmq; Owner: -
--

CREATE TABLE pgmq.q_media_probe (
    msg_id bigint NOT NULL,
    read_ct integer DEFAULT 0 NOT NULL,
    enqueued_at timestamp with time zone DEFAULT now() NOT NULL,
    last_read_at timestamp with time zone,
    vt timestamp with time zone NOT NULL,
    message jsonb,
    headers jsonb
);


--
-- Name: q_media_probe_msg_id_seq; Type: SEQUENCE; Schema: pgmq; Owner: -
--

ALTER TABLE pgmq.q_media_probe ALTER COLUMN msg_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME pgmq.q_media_probe_msg_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: q_media_transcode; Type: TABLE; Schema: pgmq; Owner: -
--

CREATE TABLE pgmq.q_media_transcode (
    msg_id bigint NOT NULL,
    read_ct integer DEFAULT 0 NOT NULL,
    enqueued_at timestamp with time zone DEFAULT now() NOT NULL,
    last_read_at timestamp with time zone,
    vt timestamp with time zone NOT NULL,
    message jsonb,
    headers jsonb
);


--
-- Name: q_media_transcode_msg_id_seq; Type: SEQUENCE; Schema: pgmq; Owner: -
--

ALTER TABLE pgmq.q_media_transcode ALTER COLUMN msg_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME pgmq.q_media_transcode_msg_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: q_notification_push; Type: TABLE; Schema: pgmq; Owner: -
--

CREATE TABLE pgmq.q_notification_push (
    msg_id bigint NOT NULL,
    read_ct integer DEFAULT 0 NOT NULL,
    enqueued_at timestamp with time zone DEFAULT now() NOT NULL,
    last_read_at timestamp with time zone,
    vt timestamp with time zone NOT NULL,
    message jsonb,
    headers jsonb
);


--
-- Name: q_notification_push_msg_id_seq; Type: SEQUENCE; Schema: pgmq; Owner: -
--

ALTER TABLE pgmq.q_notification_push ALTER COLUMN msg_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME pgmq.q_notification_push_msg_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: q_poster_render; Type: TABLE; Schema: pgmq; Owner: -
--

CREATE TABLE pgmq.q_poster_render (
    msg_id bigint NOT NULL,
    read_ct integer DEFAULT 0 NOT NULL,
    enqueued_at timestamp with time zone DEFAULT now() NOT NULL,
    last_read_at timestamp with time zone,
    vt timestamp with time zone NOT NULL,
    message jsonb,
    headers jsonb
);


--
-- Name: q_poster_render_msg_id_seq; Type: SEQUENCE; Schema: pgmq; Owner: -
--

ALTER TABLE pgmq.q_poster_render ALTER COLUMN msg_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME pgmq.q_poster_render_msg_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: q_sms_send; Type: TABLE; Schema: pgmq; Owner: -
--

CREATE TABLE pgmq.q_sms_send (
    msg_id bigint NOT NULL,
    read_ct integer DEFAULT 0 NOT NULL,
    enqueued_at timestamp with time zone DEFAULT now() NOT NULL,
    last_read_at timestamp with time zone,
    vt timestamp with time zone NOT NULL,
    message jsonb,
    headers jsonb
);


--
-- Name: q_sms_send_msg_id_seq; Type: SEQUENCE; Schema: pgmq; Owner: -
--

ALTER TABLE pgmq.q_sms_send ALTER COLUMN msg_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME pgmq.q_sms_send_msg_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: admin_region_scopes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_region_scopes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    region_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: analytics_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.analytics_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    event_name text NOT NULL,
    client_event_id text,
    article_id uuid,
    props jsonb DEFAULT '{}'::jsonb NOT NULL,
    platform text,
    occurred_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: app_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.app_settings (
    key text NOT NULL,
    value jsonb NOT NULL,
    is_public boolean DEFAULT false NOT NULL,
    updated_by uuid,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: article_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.article_categories (
    article_id uuid NOT NULL,
    category_id uuid NOT NULL,
    is_primary boolean DEFAULT false NOT NULL
);


--
-- Name: article_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.article_images (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    article_id uuid NOT NULL,
    media_asset_id uuid NOT NULL,
    kind public."MediaKind" DEFAULT 'image'::public."MediaKind" NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    alt text,
    is_hero boolean DEFAULT false NOT NULL
);


--
-- Name: article_posters; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.article_posters (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    article_id uuid NOT NULL,
    media_asset_id uuid NOT NULL,
    template public."PosterTemplate" NOT NULL,
    width integer,
    height integer,
    created_by uuid,
    is_default boolean DEFAULT false NOT NULL,
    overrides jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: article_status_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.article_status_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    article_id uuid NOT NULL,
    from_status public."ArticleStatus",
    to_status public."ArticleStatus" NOT NULL,
    changed_by uuid,
    note text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: article_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.article_tags (
    article_id uuid NOT NULL,
    tag_id uuid NOT NULL
);


--
-- Name: articles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.articles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    summary text NOT NULL,
    body text NOT NULL,
    body_format public."BodyFormat" DEFAULT 'rich'::public."BodyFormat" NOT NULL,
    headline_style jsonb,
    description_style jsonb,
    poster jsonb,
    reporter_id uuid NOT NULL,
    hero_image_id uuid,
    region_id uuid NOT NULL,
    status public."ArticleStatus" DEFAULT 'draft'::public."ArticleStatus" NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    is_breaking boolean DEFAULT false NOT NULL,
    view_count integer DEFAULT 0 NOT NULL,
    like_count integer DEFAULT 0 NOT NULL,
    comment_count integer DEFAULT 0 NOT NULL,
    bookmark_count integer DEFAULT 0 NOT NULL,
    reading_minutes integer DEFAULT 1 NOT NULL,
    scheduled_at timestamp with time zone,
    submitted_at timestamp with time zone,
    published_at timestamp with time zone,
    review_note text,
    reviewed_by uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    search_vector tsvector GENERATED ALWAYS AS (((setweight(to_tsvector('english'::regconfig, COALESCE(title, ''::text)), 'A'::"char") || setweight(to_tsvector('english'::regconfig, COALESCE(summary, ''::text)), 'B'::"char")) || setweight(to_tsvector('english'::regconfig, COALESCE(body, ''::text)), 'C'::"char"))) STORED
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    actor_id uuid,
    action text NOT NULL,
    target_type text NOT NULL,
    target_id uuid,
    meta jsonb DEFAULT '{}'::jsonb NOT NULL,
    ip text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: bookmarks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bookmarks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    article_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    color_token text,
    sort_order integer DEFAULT 0 NOT NULL,
    follower_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    article_id uuid NOT NULL,
    author_id uuid NOT NULL,
    parent_id uuid,
    body text NOT NULL,
    depth integer DEFAULT 0 NOT NULL,
    like_count integer DEFAULT 0 NOT NULL,
    reply_count integer DEFAULT 0 NOT NULL,
    is_hidden boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: devices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.devices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    device_id text NOT NULL,
    push_token text,
    platform text NOT NULL,
    app_version text,
    push_enabled boolean DEFAULT true NOT NULL,
    last_seen_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: follows; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.follows (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    target_type public."FollowTarget" NOT NULL,
    target_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: media_assets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.media_assets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_id uuid NOT NULL,
    purpose public."MediaPurpose" NOT NULL,
    kind public."MediaKind" DEFAULT 'image'::public."MediaKind" NOT NULL,
    status public."MediaStatus" DEFAULT 'pending'::public."MediaStatus" NOT NULL,
    processing_status public."MediaProcessingStatus" DEFAULT 'pending'::public."MediaProcessingStatus" NOT NULL,
    processing_error text,
    storage_key text NOT NULL,
    url text,
    mime_type text NOT NULL,
    codec text,
    size_bytes bigint NOT NULL,
    width integer,
    height integer,
    duration_seconds numeric(10,3),
    poster_media_id uuid,
    blurhash text,
    variants jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT ck_media_duration_max CHECK (((duration_seconds IS NULL) OR (duration_seconds <= (180)::numeric))),
    CONSTRAINT ck_media_size_by_kind CHECK ((((kind = 'image'::public."MediaKind") AND (size_bytes <= 10485760)) OR ((kind = 'video'::public."MediaKind") AND (size_bytes <= 209715200))))
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    type public."NotificationType" NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    entity_type text,
    entity_id uuid,
    deep_link text,
    read boolean DEFAULT false NOT NULL,
    read_at timestamp with time zone,
    data jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: otp_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.otp_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    identifier text NOT NULL,
    channel public."OtpChannel" NOT NULL,
    purpose public."OtpPurpose" NOT NULL,
    code_hash text NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    max_attempts integer DEFAULT 5 NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    consumed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text
);


--
-- Name: reactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    type public."ReactionType" DEFAULT 'like'::public."ReactionType" NOT NULL,
    target_type text NOT NULL,
    target_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refresh_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token_hash text NOT NULL,
    family_id uuid NOT NULL,
    device_id text,
    user_agent text,
    ip text,
    expires_at timestamp with time zone NOT NULL,
    revoked_at timestamp with time zone,
    rotated_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: regions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.regions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    type public."RegionType" NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    parent_id uuid,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: reporter_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reporter_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    status public."ReporterStatus" DEFAULT 'pending'::public."ReporterStatus" NOT NULL,
    full_name text NOT NULL,
    bio text NOT NULL,
    beats text[] DEFAULT ARRAY[]::text[],
    portfolio_url text,
    sample_article_url text,
    phone text NOT NULL,
    reviewed_by uuid,
    reviewer_note text,
    reviewed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: reporter_region_scopes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reporter_region_scopes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    region_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_permissions (
    role_id uuid NOT NULL,
    permission_id uuid NOT NULL
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text
);


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema_migrations (
    version character varying NOT NULL
);


--
-- Name: tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email public.citext,
    phone text,
    username text NOT NULL,
    display_name text NOT NULL,
    password_hash text,
    role public."UserRole" DEFAULT 'user'::public."UserRole" NOT NULL,
    status public."UserStatus" DEFAULT 'active'::public."UserStatus" NOT NULL,
    email_verified boolean DEFAULT false NOT NULL,
    phone_verified boolean DEFAULT false NOT NULL,
    avatar_url text,
    bio text,
    failed_login_attempts integer DEFAULT 0 NOT NULL,
    locked_until timestamp with time zone,
    last_login_at timestamp with time zone,
    is_deleted boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by uuid,
    restored_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: a_analytics_ingest a_analytics_ingest_pkey; Type: CONSTRAINT; Schema: pgmq; Owner: -
--

ALTER TABLE ONLY pgmq.a_analytics_ingest
    ADD CONSTRAINT a_analytics_ingest_pkey PRIMARY KEY (msg_id);


--
-- Name: a_article_scheduled_publish a_article_scheduled_publish_pkey; Type: CONSTRAINT; Schema: pgmq; Owner: -
--

ALTER TABLE ONLY pgmq.a_article_scheduled_publish
    ADD CONSTRAINT a_article_scheduled_publish_pkey PRIMARY KEY (msg_id);


--
-- Name: a_email_send a_email_send_pkey; Type: CONSTRAINT; Schema: pgmq; Owner: -
--

ALTER TABLE ONLY pgmq.a_email_send
    ADD CONSTRAINT a_email_send_pkey PRIMARY KEY (msg_id);


--
-- Name: a_media_delete a_media_delete_pkey; Type: CONSTRAINT; Schema: pgmq; Owner: -
--

ALTER TABLE ONLY pgmq.a_media_delete
    ADD CONSTRAINT a_media_delete_pkey PRIMARY KEY (msg_id);


--
-- Name: a_media_poster a_media_poster_pkey; Type: CONSTRAINT; Schema: pgmq; Owner: -
--

ALTER TABLE ONLY pgmq.a_media_poster
    ADD CONSTRAINT a_media_poster_pkey PRIMARY KEY (msg_id);


--
-- Name: a_media_probe a_media_probe_pkey; Type: CONSTRAINT; Schema: pgmq; Owner: -
--

ALTER TABLE ONLY pgmq.a_media_probe
    ADD CONSTRAINT a_media_probe_pkey PRIMARY KEY (msg_id);


--
-- Name: a_media_transcode a_media_transcode_pkey; Type: CONSTRAINT; Schema: pgmq; Owner: -
--

ALTER TABLE ONLY pgmq.a_media_transcode
    ADD CONSTRAINT a_media_transcode_pkey PRIMARY KEY (msg_id);


--
-- Name: a_notification_push a_notification_push_pkey; Type: CONSTRAINT; Schema: pgmq; Owner: -
--

ALTER TABLE ONLY pgmq.a_notification_push
    ADD CONSTRAINT a_notification_push_pkey PRIMARY KEY (msg_id);


--
-- Name: a_poster_render a_poster_render_pkey; Type: CONSTRAINT; Schema: pgmq; Owner: -
--

ALTER TABLE ONLY pgmq.a_poster_render
    ADD CONSTRAINT a_poster_render_pkey PRIMARY KEY (msg_id);


--
-- Name: a_sms_send a_sms_send_pkey; Type: CONSTRAINT; Schema: pgmq; Owner: -
--

ALTER TABLE ONLY pgmq.a_sms_send
    ADD CONSTRAINT a_sms_send_pkey PRIMARY KEY (msg_id);


--
-- Name: q_analytics_ingest q_analytics_ingest_pkey; Type: CONSTRAINT; Schema: pgmq; Owner: -
--

ALTER TABLE ONLY pgmq.q_analytics_ingest
    ADD CONSTRAINT q_analytics_ingest_pkey PRIMARY KEY (msg_id);


--
-- Name: q_article_scheduled_publish q_article_scheduled_publish_pkey; Type: CONSTRAINT; Schema: pgmq; Owner: -
--

ALTER TABLE ONLY pgmq.q_article_scheduled_publish
    ADD CONSTRAINT q_article_scheduled_publish_pkey PRIMARY KEY (msg_id);


--
-- Name: q_email_send q_email_send_pkey; Type: CONSTRAINT; Schema: pgmq; Owner: -
--

ALTER TABLE ONLY pgmq.q_email_send
    ADD CONSTRAINT q_email_send_pkey PRIMARY KEY (msg_id);


--
-- Name: q_media_delete q_media_delete_pkey; Type: CONSTRAINT; Schema: pgmq; Owner: -
--

ALTER TABLE ONLY pgmq.q_media_delete
    ADD CONSTRAINT q_media_delete_pkey PRIMARY KEY (msg_id);


--
-- Name: q_media_poster q_media_poster_pkey; Type: CONSTRAINT; Schema: pgmq; Owner: -
--

ALTER TABLE ONLY pgmq.q_media_poster
    ADD CONSTRAINT q_media_poster_pkey PRIMARY KEY (msg_id);


--
-- Name: q_media_probe q_media_probe_pkey; Type: CONSTRAINT; Schema: pgmq; Owner: -
--

ALTER TABLE ONLY pgmq.q_media_probe
    ADD CONSTRAINT q_media_probe_pkey PRIMARY KEY (msg_id);


--
-- Name: q_media_transcode q_media_transcode_pkey; Type: CONSTRAINT; Schema: pgmq; Owner: -
--

ALTER TABLE ONLY pgmq.q_media_transcode
    ADD CONSTRAINT q_media_transcode_pkey PRIMARY KEY (msg_id);


--
-- Name: q_notification_push q_notification_push_pkey; Type: CONSTRAINT; Schema: pgmq; Owner: -
--

ALTER TABLE ONLY pgmq.q_notification_push
    ADD CONSTRAINT q_notification_push_pkey PRIMARY KEY (msg_id);


--
-- Name: q_poster_render q_poster_render_pkey; Type: CONSTRAINT; Schema: pgmq; Owner: -
--

ALTER TABLE ONLY pgmq.q_poster_render
    ADD CONSTRAINT q_poster_render_pkey PRIMARY KEY (msg_id);


--
-- Name: q_sms_send q_sms_send_pkey; Type: CONSTRAINT; Schema: pgmq; Owner: -
--

ALTER TABLE ONLY pgmq.q_sms_send
    ADD CONSTRAINT q_sms_send_pkey PRIMARY KEY (msg_id);


--
-- Name: admin_region_scopes admin_region_scopes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_region_scopes
    ADD CONSTRAINT admin_region_scopes_pkey PRIMARY KEY (id);


--
-- Name: analytics_events analytics_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics_events
    ADD CONSTRAINT analytics_events_pkey PRIMARY KEY (id);


--
-- Name: app_settings app_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_settings
    ADD CONSTRAINT app_settings_pkey PRIMARY KEY (key);


--
-- Name: article_categories article_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_categories
    ADD CONSTRAINT article_categories_pkey PRIMARY KEY (article_id, category_id);


--
-- Name: article_images article_images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_images
    ADD CONSTRAINT article_images_pkey PRIMARY KEY (id);


--
-- Name: article_posters article_posters_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_posters
    ADD CONSTRAINT article_posters_pkey PRIMARY KEY (id);


--
-- Name: article_status_history article_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_status_history
    ADD CONSTRAINT article_status_history_pkey PRIMARY KEY (id);


--
-- Name: article_tags article_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_tags
    ADD CONSTRAINT article_tags_pkey PRIMARY KEY (article_id, tag_id);


--
-- Name: articles articles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: bookmarks bookmarks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookmarks
    ADD CONSTRAINT bookmarks_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: devices devices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.devices
    ADD CONSTRAINT devices_pkey PRIMARY KEY (id);


--
-- Name: follows follows_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_pkey PRIMARY KEY (id);


--
-- Name: media_assets media_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_assets
    ADD CONSTRAINT media_assets_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: otp_codes otp_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.otp_codes
    ADD CONSTRAINT otp_codes_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: reactions reactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reactions
    ADD CONSTRAINT reactions_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: regions regions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.regions
    ADD CONSTRAINT regions_pkey PRIMARY KEY (id);


--
-- Name: reporter_profiles reporter_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reporter_profiles
    ADD CONSTRAINT reporter_profiles_pkey PRIMARY KEY (id);


--
-- Name: reporter_region_scopes reporter_region_scopes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reporter_region_scopes
    ADD CONSTRAINT reporter_region_scopes_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: archived_at_idx_analytics_ingest; Type: INDEX; Schema: pgmq; Owner: -
--

CREATE INDEX archived_at_idx_analytics_ingest ON pgmq.a_analytics_ingest USING btree (archived_at);


--
-- Name: archived_at_idx_article_scheduled_publish; Type: INDEX; Schema: pgmq; Owner: -
--

CREATE INDEX archived_at_idx_article_scheduled_publish ON pgmq.a_article_scheduled_publish USING btree (archived_at);


--
-- Name: archived_at_idx_email_send; Type: INDEX; Schema: pgmq; Owner: -
--

CREATE INDEX archived_at_idx_email_send ON pgmq.a_email_send USING btree (archived_at);


--
-- Name: archived_at_idx_media_delete; Type: INDEX; Schema: pgmq; Owner: -
--

CREATE INDEX archived_at_idx_media_delete ON pgmq.a_media_delete USING btree (archived_at);


--
-- Name: archived_at_idx_media_poster; Type: INDEX; Schema: pgmq; Owner: -
--

CREATE INDEX archived_at_idx_media_poster ON pgmq.a_media_poster USING btree (archived_at);


--
-- Name: archived_at_idx_media_probe; Type: INDEX; Schema: pgmq; Owner: -
--

CREATE INDEX archived_at_idx_media_probe ON pgmq.a_media_probe USING btree (archived_at);


--
-- Name: archived_at_idx_media_transcode; Type: INDEX; Schema: pgmq; Owner: -
--

CREATE INDEX archived_at_idx_media_transcode ON pgmq.a_media_transcode USING btree (archived_at);


--
-- Name: archived_at_idx_notification_push; Type: INDEX; Schema: pgmq; Owner: -
--

CREATE INDEX archived_at_idx_notification_push ON pgmq.a_notification_push USING btree (archived_at);


--
-- Name: archived_at_idx_poster_render; Type: INDEX; Schema: pgmq; Owner: -
--

CREATE INDEX archived_at_idx_poster_render ON pgmq.a_poster_render USING btree (archived_at);


--
-- Name: archived_at_idx_sms_send; Type: INDEX; Schema: pgmq; Owner: -
--

CREATE INDEX archived_at_idx_sms_send ON pgmq.a_sms_send USING btree (archived_at);


--
-- Name: q_analytics_ingest_vt_idx; Type: INDEX; Schema: pgmq; Owner: -
--

CREATE INDEX q_analytics_ingest_vt_idx ON pgmq.q_analytics_ingest USING btree (vt);


--
-- Name: q_article_scheduled_publish_vt_idx; Type: INDEX; Schema: pgmq; Owner: -
--

CREATE INDEX q_article_scheduled_publish_vt_idx ON pgmq.q_article_scheduled_publish USING btree (vt);


--
-- Name: q_email_send_vt_idx; Type: INDEX; Schema: pgmq; Owner: -
--

CREATE INDEX q_email_send_vt_idx ON pgmq.q_email_send USING btree (vt);


--
-- Name: q_media_delete_vt_idx; Type: INDEX; Schema: pgmq; Owner: -
--

CREATE INDEX q_media_delete_vt_idx ON pgmq.q_media_delete USING btree (vt);


--
-- Name: q_media_poster_vt_idx; Type: INDEX; Schema: pgmq; Owner: -
--

CREATE INDEX q_media_poster_vt_idx ON pgmq.q_media_poster USING btree (vt);


--
-- Name: q_media_probe_vt_idx; Type: INDEX; Schema: pgmq; Owner: -
--

CREATE INDEX q_media_probe_vt_idx ON pgmq.q_media_probe USING btree (vt);


--
-- Name: q_media_transcode_vt_idx; Type: INDEX; Schema: pgmq; Owner: -
--

CREATE INDEX q_media_transcode_vt_idx ON pgmq.q_media_transcode USING btree (vt);


--
-- Name: q_notification_push_vt_idx; Type: INDEX; Schema: pgmq; Owner: -
--

CREATE INDEX q_notification_push_vt_idx ON pgmq.q_notification_push USING btree (vt);


--
-- Name: q_poster_render_vt_idx; Type: INDEX; Schema: pgmq; Owner: -
--

CREATE INDEX q_poster_render_vt_idx ON pgmq.q_poster_render USING btree (vt);


--
-- Name: q_sms_send_vt_idx; Type: INDEX; Schema: pgmq; Owner: -
--

CREATE INDEX q_sms_send_vt_idx ON pgmq.q_sms_send USING btree (vt);


--
-- Name: admin_region_scopes_user_id_region_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX admin_region_scopes_user_id_region_id_key ON public.admin_region_scopes USING btree (user_id, region_id);


--
-- Name: analytics_events_article_id_occurred_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX analytics_events_article_id_occurred_at_idx ON public.analytics_events USING btree (article_id, occurred_at);


--
-- Name: analytics_events_event_name_occurred_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX analytics_events_event_name_occurred_at_idx ON public.analytics_events USING btree (event_name, occurred_at);


--
-- Name: article_categories_category_id_article_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX article_categories_category_id_article_id_idx ON public.article_categories USING btree (category_id, article_id);


--
-- Name: article_images_article_id_position_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX article_images_article_id_position_idx ON public.article_images USING btree (article_id, "position");


--
-- Name: article_images_media_asset_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX article_images_media_asset_id_idx ON public.article_images USING btree (media_asset_id);


--
-- Name: article_posters_article_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX article_posters_article_id_idx ON public.article_posters USING btree (article_id);


--
-- Name: article_status_history_article_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX article_status_history_article_id_created_at_idx ON public.article_status_history USING btree (article_id, created_at);


--
-- Name: article_tags_tag_id_article_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX article_tags_tag_id_article_id_idx ON public.article_tags USING btree (tag_id, article_id);


--
-- Name: articles_region_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX articles_region_id_idx ON public.articles USING btree (region_id);


--
-- Name: articles_reporter_id_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX articles_reporter_id_status_idx ON public.articles USING btree (reporter_id, status);


--
-- Name: articles_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX articles_slug_key ON public.articles USING btree (slug);


--
-- Name: audit_logs_actor_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_logs_actor_id_created_at_idx ON public.audit_logs USING btree (actor_id, created_at);


--
-- Name: audit_logs_target_type_target_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_logs_target_type_target_id_idx ON public.audit_logs USING btree (target_type, target_id);


--
-- Name: bookmarks_user_id_article_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX bookmarks_user_id_article_id_key ON public.bookmarks USING btree (user_id, article_id);


--
-- Name: bookmarks_user_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX bookmarks_user_id_created_at_idx ON public.bookmarks USING btree (user_id, created_at);


--
-- Name: categories_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX categories_name_key ON public.categories USING btree (name);


--
-- Name: categories_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX categories_slug_key ON public.categories USING btree (slug);


--
-- Name: categories_sort_order_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX categories_sort_order_idx ON public.categories USING btree (sort_order);


--
-- Name: comments_article_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX comments_article_id_created_at_idx ON public.comments USING btree (article_id, created_at);


--
-- Name: comments_author_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX comments_author_id_idx ON public.comments USING btree (author_id);


--
-- Name: comments_parent_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX comments_parent_id_created_at_idx ON public.comments USING btree (parent_id, created_at);


--
-- Name: devices_push_token_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX devices_push_token_idx ON public.devices USING btree (push_token);


--
-- Name: devices_push_token_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX devices_push_token_key ON public.devices USING btree (push_token);


--
-- Name: devices_user_id_device_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX devices_user_id_device_id_key ON public.devices USING btree (user_id, device_id);


--
-- Name: follows_target_type_target_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX follows_target_type_target_id_idx ON public.follows USING btree (target_type, target_id);


--
-- Name: follows_user_id_target_type_target_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX follows_user_id_target_type_target_id_key ON public.follows USING btree (user_id, target_type, target_id);


--
-- Name: ix_ac_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_ac_category ON public.article_categories USING btree (category_id, article_id);


--
-- Name: ix_article_tags_tag; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_article_tags_tag ON public.article_tags USING btree (tag_id, article_id);


--
-- Name: ix_articles_breaking; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_articles_breaking ON public.articles USING btree (published_at DESC) WHERE ((is_breaking = true) AND (status = 'published'::public."ArticleStatus"));


--
-- Name: ix_articles_feed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_articles_feed ON public.articles USING btree (published_at DESC, id DESC) WHERE ((status = 'published'::public."ArticleStatus") AND (deleted_at IS NULL));


--
-- Name: ix_articles_region; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_articles_region ON public.articles USING btree (region_id, published_at DESC) WHERE (deleted_at IS NULL);


--
-- Name: ix_articles_reporter; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_articles_reporter ON public.articles USING btree (reporter_id, status) WHERE (deleted_at IS NULL);


--
-- Name: ix_articles_scheduled; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_articles_scheduled ON public.articles USING btree (scheduled_at) WHERE ((status = 'pending'::public."ArticleStatus") AND (scheduled_at IS NOT NULL));


--
-- Name: ix_articles_search; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_articles_search ON public.articles USING gin (search_vector);


--
-- Name: ix_comments_article; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_comments_article ON public.comments USING btree (article_id, created_at DESC) WHERE ((deleted_at IS NULL) AND (is_hidden = false));


--
-- Name: ix_comments_parent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_comments_parent ON public.comments USING btree (parent_id, created_at) WHERE (deleted_at IS NULL);


--
-- Name: ix_notifications_unread; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_notifications_unread ON public.notifications USING btree (user_id) WHERE (read = false);


--
-- Name: ix_otp_identifier; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_otp_identifier ON public.otp_codes USING btree (identifier, purpose) WHERE (consumed_at IS NULL);


--
-- Name: ix_refresh_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_refresh_user ON public.refresh_tokens USING btree (user_id) WHERE (revoked_at IS NULL);


--
-- Name: ix_users_deleted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_users_deleted ON public.users USING btree (deleted_at DESC) WHERE (is_deleted = true);


--
-- Name: ix_users_not_deleted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_users_not_deleted ON public.users USING btree (created_at DESC) WHERE (is_deleted = false);


--
-- Name: ix_users_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_users_role ON public.users USING btree (role) WHERE (is_deleted = false);


--
-- Name: media_assets_kind_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX media_assets_kind_idx ON public.media_assets USING btree (kind);


--
-- Name: media_assets_owner_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX media_assets_owner_id_created_at_idx ON public.media_assets USING btree (owner_id, created_at);


--
-- Name: media_assets_poster_media_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX media_assets_poster_media_id_idx ON public.media_assets USING btree (poster_media_id);


--
-- Name: media_assets_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX media_assets_status_idx ON public.media_assets USING btree (status);


--
-- Name: notifications_user_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_user_id_created_at_idx ON public.notifications USING btree (user_id, created_at);


--
-- Name: otp_codes_expires_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX otp_codes_expires_at_idx ON public.otp_codes USING btree (expires_at);


--
-- Name: otp_codes_identifier_purpose_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX otp_codes_identifier_purpose_idx ON public.otp_codes USING btree (identifier, purpose);


--
-- Name: permissions_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX permissions_name_key ON public.permissions USING btree (name);


--
-- Name: reactions_target_type_target_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reactions_target_type_target_id_idx ON public.reactions USING btree (target_type, target_id);


--
-- Name: reactions_user_id_target_type_target_id_type_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX reactions_user_id_target_type_target_id_type_key ON public.reactions USING btree (user_id, target_type, target_id, type);


--
-- Name: refresh_tokens_expires_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX refresh_tokens_expires_at_idx ON public.refresh_tokens USING btree (expires_at);


--
-- Name: refresh_tokens_family_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX refresh_tokens_family_id_idx ON public.refresh_tokens USING btree (family_id);


--
-- Name: refresh_tokens_token_hash_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX refresh_tokens_token_hash_key ON public.refresh_tokens USING btree (token_hash);


--
-- Name: regions_parent_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX regions_parent_id_idx ON public.regions USING btree (parent_id);


--
-- Name: regions_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX regions_slug_key ON public.regions USING btree (slug);


--
-- Name: regions_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX regions_type_idx ON public.regions USING btree (type);


--
-- Name: reporter_profiles_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reporter_profiles_status_idx ON public.reporter_profiles USING btree (status);


--
-- Name: reporter_profiles_user_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX reporter_profiles_user_id_key ON public.reporter_profiles USING btree (user_id);


--
-- Name: reporter_region_scopes_user_id_region_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX reporter_region_scopes_user_id_region_id_key ON public.reporter_region_scopes USING btree (user_id, region_id);


--
-- Name: role_permissions_permission_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX role_permissions_permission_id_idx ON public.role_permissions USING btree (permission_id);


--
-- Name: roles_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX roles_name_key ON public.roles USING btree (name);


--
-- Name: tags_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX tags_name_key ON public.tags USING btree (name);


--
-- Name: tags_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX tags_slug_key ON public.tags USING btree (slug);


--
-- Name: users_phone_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_phone_key ON public.users USING btree (phone);


--
-- Name: users_role_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_role_idx ON public.users USING btree (role);


--
-- Name: users_username_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_username_key ON public.users USING btree (username);


--
-- Name: ux_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_users_email ON public.users USING btree (email) WHERE (is_deleted = false);


--
-- Name: ux_users_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_users_phone ON public.users USING btree (phone) WHERE ((is_deleted = false) AND (phone IS NOT NULL));


--
-- Name: ux_users_username; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_users_username ON public.users USING btree (username) WHERE (is_deleted = false);


--
-- Name: app_settings trg_app_settings_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_app_settings_updated BEFORE UPDATE ON public.app_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: article_posters trg_article_posters_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_article_posters_updated BEFORE UPDATE ON public.article_posters FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: categories trg_categories_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_categories_updated BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: comments trg_comments_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_comments_updated BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: devices trg_devices_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_devices_updated BEFORE UPDATE ON public.devices FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: media_assets trg_media_assets_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_media_assets_updated BEFORE UPDATE ON public.media_assets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: regions trg_regions_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_regions_updated BEFORE UPDATE ON public.regions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: reporter_profiles trg_reporter_profiles_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_reporter_profiles_updated BEFORE UPDATE ON public.reporter_profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: users trg_users_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_users_updated BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: admin_region_scopes admin_region_scopes_region_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_region_scopes
    ADD CONSTRAINT admin_region_scopes_region_id_fkey FOREIGN KEY (region_id) REFERENCES public.regions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: admin_region_scopes admin_region_scopes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_region_scopes
    ADD CONSTRAINT admin_region_scopes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: analytics_events analytics_events_article_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics_events
    ADD CONSTRAINT analytics_events_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.articles(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: analytics_events analytics_events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics_events
    ADD CONSTRAINT analytics_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: article_categories article_categories_article_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_categories
    ADD CONSTRAINT article_categories_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.articles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: article_categories article_categories_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_categories
    ADD CONSTRAINT article_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: article_images article_images_article_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_images
    ADD CONSTRAINT article_images_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.articles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: article_images article_images_media_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_images
    ADD CONSTRAINT article_images_media_asset_id_fkey FOREIGN KEY (media_asset_id) REFERENCES public.media_assets(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: article_posters article_posters_article_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_posters
    ADD CONSTRAINT article_posters_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.articles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: article_posters article_posters_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_posters
    ADD CONSTRAINT article_posters_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: article_posters article_posters_media_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_posters
    ADD CONSTRAINT article_posters_media_asset_id_fkey FOREIGN KEY (media_asset_id) REFERENCES public.media_assets(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: article_status_history article_status_history_article_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_status_history
    ADD CONSTRAINT article_status_history_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.articles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: article_status_history article_status_history_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_status_history
    ADD CONSTRAINT article_status_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: article_tags article_tags_article_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_tags
    ADD CONSTRAINT article_tags_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.articles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: article_tags article_tags_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_tags
    ADD CONSTRAINT article_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: articles articles_hero_image_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_hero_image_id_fkey FOREIGN KEY (hero_image_id) REFERENCES public.media_assets(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: articles articles_region_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_region_id_fkey FOREIGN KEY (region_id) REFERENCES public.regions(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: articles articles_reporter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: articles articles_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: audit_logs audit_logs_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: bookmarks bookmarks_article_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookmarks
    ADD CONSTRAINT bookmarks_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.articles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: bookmarks bookmarks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookmarks
    ADD CONSTRAINT bookmarks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: comments comments_article_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.articles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: comments comments_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: comments comments_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.comments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: devices devices_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.devices
    ADD CONSTRAINT devices_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: follows follows_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: media_assets media_assets_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_assets
    ADD CONSTRAINT media_assets_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: media_assets media_assets_poster_media_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_assets
    ADD CONSTRAINT media_assets_poster_media_id_fkey FOREIGN KEY (poster_media_id) REFERENCES public.media_assets(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: otp_codes otp_codes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.otp_codes
    ADD CONSTRAINT otp_codes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reactions reactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reactions
    ADD CONSTRAINT reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: regions regions_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.regions
    ADD CONSTRAINT regions_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.regions(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: reporter_profiles reporter_profiles_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reporter_profiles
    ADD CONSTRAINT reporter_profiles_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: reporter_profiles reporter_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reporter_profiles
    ADD CONSTRAINT reporter_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reporter_region_scopes reporter_region_scopes_region_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reporter_region_scopes
    ADD CONSTRAINT reporter_region_scopes_region_id_fkey FOREIGN KEY (region_id) REFERENCES public.regions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reporter_region_scopes reporter_region_scopes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reporter_region_scopes
    ADD CONSTRAINT reporter_region_scopes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict dbmate


--
-- Dbmate schema migrations
--

INSERT INTO public.schema_migrations (version) VALUES
    ('0001'),
    ('0002'),
    ('0003'),
    ('0004'),
    ('0005'),
    ('0006');
