#!/usr/bin/env node
/**
 * P1b media pipeline test:
 *  reporter signs an image -> PUTs to R2(MinIO) -> complete -> worker marks ready.
 * Also tests the notification queue + Socket.IO realtime path indirectly.
 */
const BASE = process.env.API_URL || "http://localhost:4010/api/v1";

async function call(method, path, body, token) {
  const res = await fetch(BASE + path, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, json: await res.json() };
}

(async () => {
  const rep = await call("POST", "/auth/login", { email: "reporter@newswatch.app", password: "Password123!" });
  const token = rep.json.data.accessToken;
  console.log("reporter login:", rep.status);

  // 1x1 PNG
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/pLvAAAAAElFTkSuQmCC",
    "base64",
  );

  const sign = await call(
    "POST",
    "/media/sign",
    { kind: "image", contentType: "image/png", sizeBytes: png.length, purpose: "hero" },
    token,
  );
  console.log("sign:", sign.status, sign.json.success ? "assetId=" + sign.json.data.assetId.slice(0, 8) : sign.json.error);
  const { assetId, uploadUrl } = sign.json.data;

  const put = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": "image/png" }, body: png });
  console.log("upload PUT:", put.status);

  const complete = await call("POST", `/media/${assetId}/complete`, {}, token);
  console.log("complete:", complete.status, JSON.stringify(complete.json.data));
  const initialStatus = complete.json.data?.processingStatus;

  // Poll for worker to process.
  let status = initialStatus;
  for (let i = 0; i < 10 && status !== "ready" && status !== "failed"; i++) {
    await new Promise((r) => setTimeout(r, 700));
    const got = await call("GET", `/media/${assetId}`);
    status = got.json.data?.processingStatus;
  }
  console.log("final processing status:", status);
  const final = await call("GET", `/media/${assetId}`);
  console.log("final media:", JSON.stringify(final.json.data));
})();
