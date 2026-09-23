"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { proxy } from "@/lib/proxy";

interface Region {
  id: string;
  name: string;
  type: string;
}

export default function ReporterApplyPage() {
  const [form, setForm] = useState({ fullName: "", bio: "", phone: "", beats: "", portfolioUrl: "", sampleArticleUrl: "" });
  const [regions, setRegions] = useState<Region[]>([]);
  const [requested, setRequested] = useState<string[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void proxy<Region[]>("/regions").then((r) => setRegions(r.data ?? []));
    void proxy<{ status: string } | null>("/reporter/profile").then((r) => {
      setStatus(r.data?.status ?? null);
      setLoading(false);
    });
  }, []);

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await proxy("/reporter/apply", {
      method: "POST",
      body: {
        fullName: form.fullName,
        bio: form.bio,
        phone: form.phone,
        beats: form.beats.split(",").map((b) => b.trim()).filter(Boolean),
        portfolioUrl: form.portfolioUrl || undefined,
        sampleArticleUrl: form.sampleArticleUrl || undefined,
        requestedRegionIds: requested,
      },
    });
    if (res.ok) setStatus("pending");
  }

  if (loading) return <main className="container-wide"><div className="skeleton" style={{ height: 200 }} /></main>;

  return (
    <main className="page" style={{ maxWidth: 620 }}>
      <Link href="/profile" className="small muted">← Back to profile</Link>
      <h1 className="page-title mt-2">Become a reporter</h1>
      <p className="page-sub">Apply to publish stories on NewsWatch.</p>

      {status && (
        <div className="toast-note mb-3" style={{ background: status === "approved" ? "rgba(22,163,74,.12)" : "rgba(217,119,6,.12)", borderColor: "rgba(217,119,6,.3)", color: status === "approved" ? "var(--success)" : "var(--warning)" }}>
          Status: <b>{status}</b>
          {status === "pending" && " · you'll be notified once an admin reviews your application."}
        </div>
      )}

      {status !== "approved" && (
        <form onSubmit={submit}>
          <div className="card card-pad mb-3">
            <div className="field"><label>Full name</label><input className="input" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} required /></div>
            <div className="field"><label>Phone</label><input className="input" value={form.phone} onChange={(e) => set("phone", e.target.value)} required /></div>
            <div className="field"><label>Bio</label><textarea className="textarea" value={form.bio} onChange={(e) => set("bio", e.target.value)} required /></div>
            <div className="field"><label>Areas of expertise (comma-separated)</label><input className="input" value={form.beats} onChange={(e) => set("beats", e.target.value)} placeholder="politics, business" /></div>
            <div className="field"><label>Portfolio URL</label><input className="input" value={form.portfolioUrl} onChange={(e) => set("portfolioUrl", e.target.value)} placeholder="https://" /></div>
            <div className="field"><label>Sample article URL</label><input className="input" value={form.sampleArticleUrl} onChange={(e) => set("sampleArticleUrl", e.target.value)} placeholder="https://" /></div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Requested regions</label>
              <div className="row wrap">
                {regions.map((r) => (
                  <button key={r.id} type="button" className={`chip ${requested.includes(r.id) ? "active" : ""}`}
                    onClick={() => setRequested((s) => s.includes(r.id) ? s.filter((x) => x !== r.id) : [...s, r.id])}>
                    {r.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button className="btn btn-primary" type="submit">Submit application</button>
        </form>
      )}
    </main>
  );
}
