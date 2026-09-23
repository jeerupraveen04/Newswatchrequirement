import { io } from "socket.io-client";

const BASE = process.env.API_URL || "http://localhost:4010/api/v1";
const ORIGIN = "http://localhost:4010";
import postgres from "postgres";
const PG = "postgresql://newswatch:newswatch@localhost:55432/newswatch?sslmode=disable";

async function call(method, path, body, token) {
  const res = await fetch(BASE + path, {
    method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, json: await res.json() };
}

(async () => {
  const login = await call("POST", "/auth/login", { email: "user@newswatch.app", password: "Password123!" });
  const token = login.json.data.accessToken;
  const feed = await call("GET", "/articles/feed?limit=1");
  const articleId = feed.json.data[0]?.id;
  if (!articleId) { console.log("no article to comment on"); process.exit(0); }

  const socket = io(ORIGIN, { path: "/socket.io", transports: ["websocket"] });
  const got = new Promise((resolve) => {
    socket.on("connect", () => {
      socket.emit("join", `article:${articleId}`);
      setTimeout(() => {
        call("POST", `/articles/${articleId}/comments`, { body: "Realtime test comment" }, token);
      }, 300);
    });
    socket.on("comment:new", (payload) => resolve(payload));
    setTimeout(() => resolve(null), 6000);
  });

  const payload = await got;
  console.log("realtime comment:new received:", payload ? "YES id=" + String(payload.id).slice(0,8) : "NO");
  socket.close();
  const sql = postgres(PG);
  await sql`DELETE FROM comments WHERE body = 'Realtime test comment'`;
  await sql.end();
})();
