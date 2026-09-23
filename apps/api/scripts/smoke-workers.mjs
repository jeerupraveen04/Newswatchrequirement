#!/usr/bin/env node
/**
 * P1b verification: pgmq workers + realtime.
 *  - image pipeline: sign -> upload -> complete -> worker -> ready
 *  - video pipeline: sign -> complete -> worker probe/transcode/poster -> ready
 *    (ffmpeg absent => graceful fallback, still reaches ready)
 *  - notification: like/comment action enqueues + worker processes it
 *  - queue metrics
 */
import postgres from "postgres";

const BASE = process.env.API_URL || "http://localhost:4010/api/v1";
const PG = "postgresql://newswatch:newswatch@localhost:55432/newswatch?sslmode=disable";

async function call(method, path, body, token) {
  const res = await fetch(BASE + path, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, json: await res.json() };
}

async function pollMedia(id, token) {
  for (let i = 0; i < 15; i++) {
    const got = await call("GET", `/media/${id}`, null, token);
    const s = got.json.data?.processingStatus;
    if (s === "ready" || s === "failed") return { status: s, data: got.json.data };
    await new Promise((r) => setTimeout(r, 700));
  }
  return { status: "timeout", data: null };
}

(async () => {
  const login = await call("POST", "/auth/login", { email: "reporter@newswatch.app", password: "Password123!" });
  const token = login.json.data.accessToken;

  // ---- Image pipeline ----
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/pLvAAAAAElFTkSuQmCC",
    "base64",
  );
  const signImg = await call("POST", "/media/sign", { kind: "image", contentType: "image/png", sizeBytes: png.length, purpose: "hero" }, token);
  await fetch(signImg.json.data.uploadUrl, { method: "PUT", headers: { "Content-Type": "image/png" }, body: png });
  const imgComplete = await call("POST", `/media/${signImg.json.data.assetId}/complete`, {}, token);
  const img = await pollMedia(signImg.json.data.assetId, token);
  console.log("IMAGE pipeline:", imgComplete.status, "->", img.status, "| url:", img.data?.url ? "set" : "null");

  // ---- Video pipeline (ffmpeg absent => fallback) ----
  const fakeMp4 = Buffer.alloc(1024, 1);
  const signVid = await call("POST", "/media/sign", { kind: "video", contentType: "video/mp4", sizeBytes: fakeMp4.length, purpose: "video" }, token);
  const vurl = signVid.json.data?.uploadUrl;
  if (vurl) {
    await fetch(vurl, { method: "PUT", headers: { "Content-Type": "video/mp4" }, body: fakeMp4 });
    const vidComplete = await call("POST", `/media/${signVid.json.data.assetId}/complete`, { durationSeconds: 12 }, token);
    const vid = await pollMedia(signVid.json.data.assetId, token);
    console.log("VIDEO pipeline:", vidComplete.status, "->", vid.status, "| duration:", vid.data?.durationSeconds);
  } else {
    console.log("VIDEO sign failed:", signVid.json.error);
  }

  // ---- Notification via API action ----
  const feed = await call("GET", "/articles/feed?limit=1");
  const articleId = feed.json.data[0]?.id;
  if (articleId) {
    const like = await call("POST", "/like", { targetType: "article", targetId: articleId }, token);
    console.log("like action:", like.status, JSON.stringify(like.json.data));
  }

  // ---- Queue metrics (direct SQL) ----
  const sql = postgres(PG);
  const [m] = await sql`SELECT queue_name, queue_length FROM pgmq.metrics('media_probe')`;
  console.log("media_probe metrics:", JSON.stringify(m));
  const [a] = await sql`SELECT queue_name, queue_length FROM pgmq.metrics('notification_push')`;
  console.log("notification_push metrics:", JSON.stringify(a));
  await sql.end();
})();
