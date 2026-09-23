"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("super@newswatch.app");
  const [password, setPassword] = useState("Password123!");
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
    router.push("/admin");
    router.refresh();
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#171717", padding: 24 }}>
      <div className="card card-pad" style={{ width: "100%", maxWidth: 400 }}>
        <div className="row mb-2"><span className="logo-icon" /><b style={{ fontSize: 18 }}>newswatch admin</b></div>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Admin sign in</h1>
        <p className="muted small mb-3">Restricted to admin &amp; super admin accounts.</p>
        {error && <div className="toast-note mb-2" style={{ background: "rgba(220,38,38,.08)", borderColor: "rgba(220,38,38,.25)", color: "var(--error)" }}>{error}</div>}
        <form onSubmit={submit}>
          <div className="field"><label>Email</label><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          <div className="field"><label>Password</label><input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
          <button className="btn btn-primary btn-block" type="submit" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button>
        </form>
        <p className="center small mt-2"><a href="/" style={{ color: "var(--purple)", fontWeight: 700 }}>← Back to site</a></p>
      </div>
    </div>
  );
}
