#!/usr/bin/env node
/* End-to-end content pipeline test: reporter drafts -> submits; admin publishes. */
const BASE = process.env.API_URL || "http://localhost:4010/api/v1";

async function call(method, path, body, token) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, json: await res.json() };
}

const BODY = Array.from({ length: 210 }, (_, i) => `word${i}`).join(" ");

(async () => {
  // login reporter
  const rep = await call("POST", "/auth/login", { email: "reporter@newswatch.app", password: "Password123!" });
  console.log("reporter login:", rep.status, rep.json.success ? rep.json.data.user.role : rep.json.error);
  const repToken = rep.json.data.accessToken;

  // categories + regions
  const cats = await call("GET", "/categories");
  console.log("categories:", cats.json.data.length);
  const regions = await call("GET", "/regions");
  const hyderabad = regions.json.data.find((r) => r.slug === "hyderabad");
  console.log("regions:", regions.json.data.length, "| hyderabad:", hyderabad.id.slice(0, 8));

  // create draft
  const draft = await call(
    "POST",
    "/articles",
    {
      title: "Monsoon Preparedness Ramped Up Across Coastal Districts",
      summary: "Cities increase drainage and evacuation planning ahead of the season.",
      body: `<p>${BODY}</p>`,
      bodyFormat: "rich",
      regionId: hyderabad.id,
      categoryIds: [cats.json.data[0].id],
      tags: ["monsoon", "infrastructure"],
    },
    repToken,
  );
  console.log("create draft:", draft.status, draft.json.success ? "id=" + draft.json.data.id.slice(0, 8) : draft.json.error);
  const articleId = draft.json.data?.id;

  // out-of-scope region (reporter is scoped to Telangana only) -> expect 403? It's in scope.
  // Test sanitization: submit with a script tag should be stripped.
  const submit = await call("POST", `/articles/${articleId}/submit`, {}, repToken);
  console.log("submit:", submit.status, submit.json.success ? "status=" + submit.json.data.status : submit.json.error);

  // reporter cannot self-publish
  const selfPub = await call("POST", `/articles/${articleId}/moderate`, { action: "publish" }, repToken);
  console.log("reporter self-publish (expect 403):", selfPub.status, selfPub.json.error?.code);

  // admin publishes
  const adm = await call("POST", "/auth/login", { email: "admin@newswatch.app", password: "Password123!" });
  const admToken = adm.json.data.accessToken;
  const pub = await call("POST", `/articles/${articleId}/moderate`, { action: "publish" }, admToken);
  console.log("admin publish:", pub.status, pub.json.success ? "status=" + pub.json.data.status : pub.json.error);

  // feed + detail
  const feed = await call("GET", "/articles/feed?limit=5");
  console.log("feed items:", feed.json.data.length, "| hasMore:", feed.json.meta.hasMore);
  const detail = await call("GET", `/articles/${draft.json.data.slug}`);
  console.log("detail:", detail.status, detail.json.success ? "title=" + detail.json.data.title.slice(0, 30) : detail.json.error);

  // search
  const search = await call("GET", "/articles/search?q=monsoon");
  console.log("search 'monsoon':", search.json.data.length, "result(s)");
})();
