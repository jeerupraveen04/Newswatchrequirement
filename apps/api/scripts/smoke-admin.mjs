#!/usr/bin/env node
/* P1 backend verification: admin + super-admin + RBAC enforcement. */
const BASE = process.env.API_URL || "http://localhost:4010/api/v1";
async function call(method, path, body, token) {
  const res = await fetch(BASE + path, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, json: await res.json() };
}
async function login(email) {
  const r = await call("POST", "/auth/login", { email, password: "Password123!" });
  return r.json.data?.accessToken;
}
(async () => {
  const superT = await login("super@newswatch.app");
  const adminT = await login("admin@newswatch.app");

  console.log("== admin can see region-scoped moderation queue ==");
  const q = await call("GET", "/admin/moderation/queue?status=published", null, adminT);
  console.log("queue:", q.status, q.json.success ? q.json.data.length + " item(s)" : q.json.error);

  console.log("== admin CANNOT manage regions (super admin only) ==");
  const r1 = await call("POST", "/admin/regions", { type: "district", name: "Test", slug: "test-x" }, adminT);
  console.log("admin create region (expect 403):", r1.status, r1.json.error?.code);

  console.log("== super admin creates + deletes region ==");
  const r2 = await call("POST", "/admin/regions", { type: "district", name: "Test District", slug: "test-district" }, superT);
  console.log("create region:", r2.status, r2.json.success ? "id=" + r2.json.data.id.slice(0, 8) : r2.json.error);
  if (r2.json.success) {
    const r3 = await call("DELETE", `/admin/regions/${r2.json.data.id}`, null, superT);
    console.log("delete region:", r3.status, r3.json.success ? "ok" : r3.json.error);
  }

  console.log("== super admin soft-deletes a user; restore ==");
  const users = await call("GET", "/articles/feed?limit=1"); // touch
  void users;
  // create a throwaway user via register
  const tmp = await call("POST", "/auth/register", { email: `del_${Date.now()}@example.com`, password: "Password123!", displayName: "Delete Me" });
  const tmpId = tmp.json.data.user.id;
  const sd = await call("DELETE", `/admin/users/${tmpId}`, null, superT);
  console.log("soft delete:", sd.status, sd.json.success ? "isDeleted=" + sd.json.data.isDeleted : sd.json.error);
  const deleted = await call("GET", "/admin/users/deleted", null, superT);
  console.log("deleted list count:", deleted.json.data.length);
  const rs = await call("POST", `/admin/users/${tmpId}/restore`, {}, superT);
  console.log("restore:", rs.status, rs.json.success ? "isDeleted=" + rs.json.data.isDeleted : rs.json.error);

  console.log("== app settings (super admin write, public read) ==");
  const put = await call("PUT", "/admin/app-settings", { entries: { "contact.supportEmail": "support@newswatch.app" }, isPublic: { "contact.supportEmail": true } }, superT);
  console.log("write:", put.status, put.json.success ? "ok" : put.json.error);
  const pub = await call("GET", "/app-settings");
  console.log("public read:", pub.status, JSON.stringify(pub.json.data));

  console.log("== audit log ==");
  const audit = await call("GET", "/admin/audit-logs?limit=10", null, superT);
  console.log("audit entries:", audit.json.data.length, "| latest:", audit.json.data[0]?.action);

  console.log("== super admin hard-deletes article ==");
  const feed = await call("GET", "/articles/feed?limit=1");
  const aid = feed.json.data[0]?.id;
  const hd = await call("DELETE", `/admin/articles/${aid}`, null, superT);
  console.log("hard delete:", hd.status, hd.json.success ? "ok" : hd.json.error);

  console.log("== media sign (image) ==");
  const sign = await call("POST", "/media/sign", { kind: "image", contentType: "image/jpeg", sizeBytes: 12345, purpose: "hero" }, adminT);
  console.log("sign image:", sign.status, sign.json.success ? "assetId=" + sign.json.data.assetId.slice(0, 8) : sign.json.error);
  console.log("== media sign rejects huge video ==");
  const bad = await call("POST", "/media/sign", { kind: "video", contentType: "video/mp4", sizeBytes: 999999999, purpose: "video" }, adminT);
  console.log("oversized video (expect 413):", bad.status, bad.json.error?.code);
})();
