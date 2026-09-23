"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useApiQuery } from "@/lib/hooks";
import { proxy } from "@/lib/proxy";

interface Me {
  displayName: string;
  username: string;
  email: string | null;
  bio: string | null;
  role: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const { data } = useApiQuery<Me>(["me"], "/me");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [saved, setSaved] = useState(false);
  const [init, setInit] = useState(false);

  if (data && !init) {
    setDisplayName(data.displayName);
    setBio(data.bio ?? "");
    setInit(true);
  }

  async function save() {
    await proxy("/me", { method: "PATCH", body: { displayName, bio } });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <main className="page" style={{ maxWidth: 640 }}>
      <h1 className="page-title">Settings</h1>
      <p className="page-sub">Manage your account and preferences.</p>

      <div className="card card-pad mb-3">
        <div className="section-title">Profile</div>
        {saved && <div className="toast-note mb-2">Saved.</div>}
        <div className="field"><label>Display name</label><input className="input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} /></div>
        <div className="field"><label>Bio</label><textarea className="textarea" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={200} /></div>
        <div className="field"><label>Email</label><input className="input" value={data?.email ?? ""} disabled /></div>
        <button className="btn btn-primary" onClick={save}>Save changes</button>
      </div>

      <div className="card card-pad mb-3">
        <div className="section-title">Account</div>
        <div className="row-between" style={{ padding: "12px 0" }}>
          <span>Role</span>
          <span className="badge badge-purple">{data?.role}</span>
        </div>
      </div>

      <button className="btn btn-secondary btn-block" onClick={logout}>Log out</button>
    </main>
  );
}
