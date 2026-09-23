"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ displayName: "", email: "", phone: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok || !data.success) {
      setError(data.error?.message ?? "Sign up failed");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <h1>Sign up</h1>
      <p className="lead">It only takes a minute.</p>
      {error && <div className="toast-note mb-2" style={{ background: "rgba(220,38,38,.08)", borderColor: "rgba(220,38,38,.25)", color: "var(--error)" }}>{error}</div>}
      <form onSubmit={submit}>
        <div className="field"><label>Full name</label><input className="input" value={form.displayName} onChange={(e) => set("displayName", e.target.value)} placeholder="Your name" required minLength={2} /></div>
        <div className="field"><label>Email address</label><input className="input" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@example.com" required /></div>
        <div className="field"><label>Phone number (optional)</label><input className="input" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+91 00000 00000" /></div>
        <div className="field"><label>Password</label><input className="input" type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="Minimum 8 characters" required minLength={8} /></div>
        <button className="btn btn-primary btn-block" type="submit" disabled={loading}>{loading ? "Creating…" : "Create account"}</button>
      </form>
      <p className="center mt-3 small">Already registered? <Link href="/login" style={{ color: "var(--purple)", fontWeight: 700 }}>Log in</Link></p>
    </>
  );
}
