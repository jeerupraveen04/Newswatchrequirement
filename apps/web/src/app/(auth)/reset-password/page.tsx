"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { proxy } from "@/lib/proxy";

function ResetInner() {
  const params = useSearchParams();
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await proxy("/auth/password/reset", { method: "POST", body: { email, code, newPassword } });
    setBusy(false);
    if (res.ok) setDone(true);
    else setError(res.error?.message ?? "Reset failed");
  }

  if (done) {
    return (
      <>
        <h1>Password reset</h1>
        <div className="toast-note">Your password has been updated. You can now log in.</div>
        <Link href="/login" className="btn btn-primary btn-block mt-3">Go to login</Link>
      </>
    );
  }

  return (
    <>
      <h1>Reset password</h1>
      <p className="lead">Enter the 6-digit code we emailed you.</p>
      {error && <div className="toast-note mb-2" style={{ color: "var(--error)" }}>{error}</div>}
      <form onSubmit={submit}>
        <div className="field"><label>Email</label><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
        <div className="field"><label>Reset code</label><input className="input" value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} required /></div>
        <div className="field"><label>New password</label><input className="input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={8} required /></div>
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? "Saving…" : "Reset password"}</button>
      </form>
      <p className="center mt-3 small"><Link href="/login" style={{ color: "var(--purple)", fontWeight: 700 }}>← Back to login</Link></p>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="skeleton" style={{ height: 260 }} />}>
      <ResetInner />
    </Suspense>
  );
}
