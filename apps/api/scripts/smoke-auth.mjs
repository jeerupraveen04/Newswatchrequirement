#!/usr/bin/env node
/* Tiny test client for the NewsWatch auth flow. */
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
  const json = await res.json();
  return { status: res.status, json };
}

(async () => {
  const email = `otp_${Date.now()}@example.com`;
  console.log("== 1. register ==");
  const reg = await call("POST", "/auth/register", {
    email,
    password: "Password123!",
    displayName: "OTP Test",
  });
  console.log(reg.status, JSON.stringify(reg.json).slice(0, 200));

  console.log("== 2. login ==");
  const login = await call("POST", "/auth/login", { email, password: "Password123!" });
  console.log(login.status, login.json.success ? "ok role=" + login.json.data.user.role : login.json.error);

  const access = login.json.data?.accessToken;
  const refresh = login.json.data?.refreshToken;

  console.log("== 3. /auth/me ==");
  const me = await call("GET", "/auth/me", null, access);
  console.log(me.status, JSON.stringify(me.json.data));

  console.log("== 4. seed login (super admin) ==");
  const su = await call("POST", "/auth/login", { email: "super@newswatch.app", password: "Password123!" });
  console.log(su.status, su.json.success ? su.json.data.user.role : su.json.error);

  console.log("== 5. refresh rotation ==");
  const r1 = await call("POST", "/auth/refresh", { refreshToken: refresh });
  console.log(r1.status, r1.json.success ? "rotated ok" : r1.json.error);

  console.log("== 6. reuse old refresh (expect fail) ==");
  const r2 = await call("POST", "/auth/refresh", { refreshToken: refresh });
  console.log(r2.status, r2.json.error?.code);

  console.log("== 7. OTP request + verify ==");
  const otpReq = await call("POST", "/auth/otp/request", {
    identifier: "user@newswatch.app",
    channel: "email",
    purpose: "login",
  });
  console.log("request:", otpReq.status, otpReq.json.data ? "sent (see server log for code)" : otpReq.json.error);

  console.log("== 8. validation error envelope ==");
  const bad = await call("POST", "/auth/login", { email: "nope", password: "x" });
  console.log(bad.status, JSON.stringify(bad.json.error));
})();
