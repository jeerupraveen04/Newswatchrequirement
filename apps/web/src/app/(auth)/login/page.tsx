"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok || !data.success) {
      setError(data.error?.message ?? "Login failed");
      return;
    }
    router.push(next.startsWith("/") ? next : "/");
    router.refresh();
  }

  return (
    <>
      <h1>Log in</h1>
      <p className="lead">Use your email to continue.</p>
      {error && <div className="toast-note mb-2" style={{ background: "rgba(220,38,38,.08)", borderColor: "rgba(220,38,38,.25)", color: "var(--error)" }}>{error}</div>}
      <form onSubmit={submit}>
        <div className="field">
          <label>Email address</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
        </div>
        <div className="field">
          <label>Password</label>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
        </div>
        <div className="row-between mb-2">
          <span />
          <Link href="/forgot-password" className="small" style={{ color: "var(--purple)", fontWeight: 700 }}>Forgot password?</Link>
        </div>
        <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>
      <p className="center mt-3 small">
        New here? <Link href="/signup" style={{ color: "var(--purple)", fontWeight: 700 }}>Create an account</Link>
      </p>
      <div className="toast-note mt-3 small">
        Demo: <b>super@newswatch.app</b> / <b>admin@newswatch.app</b> / <b>reporter@newswatch.app</b> / <b>user@newswatch.app</b> — password <b>Password123!</b>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="skeleton" style={{ height: 260 }} />}>
      <LoginForm />
    </Suspense>
  );
}
