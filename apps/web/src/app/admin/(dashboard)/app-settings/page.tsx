"use client";

import { useEffect, useState } from "react";
import { proxy } from "@/lib/proxy";

interface Setting {
  key: string;
  value: unknown;
  isPublic: boolean;
}

const FIELDS: Array<{ key: string; label: string; type: "text" | "email" | "url" | "textarea" }> = [
  { key: "contact.supportEmail", label: "Support email", type: "email" },
  { key: "contact.supportPhone", label: "Support phone", type: "text" },
  { key: "contact.whatsapp", label: "WhatsApp", type: "text" },
  { key: "contact.officeAddress", label: "Office address", type: "textarea" },
  { key: "ads.salesEmail", label: "Ad-sales email", type: "email" },
  { key: "ads.salesPhone", label: "Ad-sales phone", type: "text" },
  { key: "ads.rateCardUrl", label: "Ad rate card URL", type: "url" },
];

export default function AppSettingsPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [note, setNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void proxy<Setting[]>("/admin/app-settings").then((r) => {
      const v: Record<string, string> = {};
      for (const s of r.data ?? []) {
        v[s.key] = typeof s.value === "string" ? s.value : JSON.stringify(s.value);
      }
      setValues(v);
      setLoading(false);
    });
  }, []);

  async function save() {
    const entries: Record<string, string> = {};
    const isPublic: Record<string, boolean> = {};
    for (const f of FIELDS) {
      entries[f.key] = values[f.key] ?? "";
      isPublic[f.key] = true;
    }
    const res = await proxy("/admin/app-settings", { method: "PUT", body: { entries, isPublic } });
    setNote(res.ok ? "Saved (versioned & audited)." : res.error?.message ?? "Failed");
  }

  if (loading) return <><h1 className="page-title">App &amp; Ad Settings</h1><div className="skeleton" style={{ height: 200 }} /></>;

  return (
    <>
      <div className="row-between mb-2">
        <div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>App contact &amp; advertisement settings</h1>
          <p className="page-sub" style={{ marginBottom: 0 }}>Public contact and ad-sales details · <b>Super Admin only</b></p>
        </div>
        <button className="btn btn-primary" onClick={save}>Save changes</button>
      </div>

      {note && <div className="toast-note mb-3">{note}</div>}

      <div className="card card-pad" style={{ maxWidth: 640 }}>
        <div className="section-title">Public contact &amp; ads</div>
        {FIELDS.map((f) => (
          <div className="field" key={f.key}>
            <label>{f.label}</label>
            {f.type === "textarea" ? (
              <textarea className="textarea" value={values[f.key] ?? ""} onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))} />
            ) : (
              <input className="input" type={f.type} value={values[f.key] ?? ""} onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))} />
            )}
          </div>
        ))}
        <p className="small muted">Changes are versioned and audited (actor, before, after).</p>
      </div>
    </>
  );
}
