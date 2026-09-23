"use client";

import Link from "next/link";
import { useState } from "react";
import { proxy } from "@/lib/proxy";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await proxy("/auth/password/forgot", { method: "POST", body: { email } });
    setLoading(false);
    setSent(true);
  }

  return (
    <>
      <h1>Forgot password?</h1>
      <p className="lead">Enter your email and we&rsquo;ll send a reset code.</p>
      {sent ? (
        <div className="toast-note">If an account exists for <b>{email}</b>, a reset code has been sent. It expires in 30 minutes.</div>
      ) : (
        <form onSubmit={submit}>
          <div className="field"><label>Email address</label><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required /></div>
          <button className="btn btn-primary btn-block" type="submit" disabled={loading}>{loading ? "Sending…" : "Send reset code"}</button>
        </form>
      )}
      <p className="center mt-3 small"><Link href="/login" style={{ color: "var(--purple)", fontWeight: 700 }}>← Back to login</Link></p>
    </>
  );
}
