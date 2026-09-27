import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";

/**
 * API integration tests (REQ-SYS-450).
 * These exercise the envelope, auth, validation, and RBAC against the running
 * test database. They are skipped automatically if the DB is unreachable.
 */
const app = createApp();

let dbUp = true;
beforeAll(async () => {
  try {
    const res = await request(app).get("/api/v1/ready");
    dbUp = res.status === 200;
  } catch {
    dbUp = false;
  }
});

describe("health & envelope", () => {
  it("GET /health returns the standard envelope", async () => {
    const res = await request(app).get("/api/v1/health");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, error: null });
    expect(res.body.data.status).toBe("ok");
  });

  it("unknown route returns 404 envelope", async () => {
    const res = await request(app).get("/api/v1/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});

describe("auth", () => {
  it("login with bad body returns 422 VALIDATION_ERROR", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({ email: "nope", password: "" });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.fields).toBeTruthy();
  });

  it("protected /auth/me without token returns 401", async () => {
    const res = await request(app).get("/api/v1/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("AUTH_REQUIRED");
  });

  it("logs in a seeded super admin (when DB is up)", async () => {
    if (!dbUp) return;
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "super@newswatch.app", password: "Password123!" });
    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe("super_admin");
    expect(res.body.data.accessToken).toBeTruthy();
  });
});

describe("RBAC (when DB is up)", () => {
  it("guest cannot create an article", async () => {
    if (!dbUp) return;
    const res = await request(app).post("/api/v1/articles").send({});
    expect([401, 403]).toContain(res.status);
  });

  it("non-admin cannot read the moderation queue", async () => {
    if (!dbUp) return;
    const login = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "user@newswatch.app", password: "Password123!" });
    const token = login.body.data?.accessToken;
    const res = await request(app).get("/api/v1/admin/moderation/queue").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("admin CANNOT manage regions (super admin only)", async () => {
    if (!dbUp) return;
    const login = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "admin@newswatch.app", password: "Password123!" });
    const token = login.body.data?.accessToken;
    const res = await request(app)
      .post("/api/v1/admin/regions")
      .set("Authorization", `Bearer ${token}`)
      .send({ type: "district", name: "Xtest", slug: "xtest-rbac" });
    expect(res.status).toBe(403);
  });
});

describe("public catalogue", () => {
  it("GET /categories returns an array", async () => {
    if (!dbUp) return;
    const res = await request(app).get("/api/v1/categories");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("GET /articles/feed returns a list envelope with pagination meta", async () => {
    if (!dbUp) return;
    const res = await request(app).get("/api/v1/articles/feed?limit=2");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toHaveProperty("nextCursor");
    expect(res.body.meta).toHaveProperty("hasMore");
  });
});
