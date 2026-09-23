"use client";

import { useEffect, useState } from "react";
import { useApiQuery } from "@/lib/hooks";
import { proxy } from "@/lib/proxy";

interface ReporterApp {
  id: string;
  userId: string;
  status: string;
  fullName: string;
  bio: string;
  phone: string;
  beats: string[];
  portfolioUrl: string | null;
  sampleArticleUrl: string | null;
  email: string | null;
}

interface Region {
  id: string;
  name: string;
  type: string;
}

export default function ReporterApprovalsPage() {
  const [status, setStatus] = useState("pending");
  const { data, isLoading, refetch } = useApiQuery<ReporterApp[]>(
    ["reporter-apps", status],
    `/admin/reporters?status=${status}`,
  );
  const [regions, setRegions] = useState<Region[]>([]);
  const [active, setActive] = useState<ReporterApp | null>(null);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    void proxy<Region[]>("/regions").then((r) => setRegions(r.data ?? []));
  }, []);

  async function review(action: "approve" | "reject") {
    if (!active) return;
    await proxy(`/admin/reporters/${active.id}/review`, {
      method: "POST",
      body: { action, regionIds: action === "approve" ? selected : undefined },
    });
    setActive(null);
    setSelected([]);
    void refetch();
  }

  return (
    <>
      <h1 className="page-title" style={{ marginBottom: 2 }}>Reporter approvals</h1>
      <p className="page-sub">Approve applicants and assign their region scope.</p>

      <div className="row mb-3 wrap">
        {["pending", "approved", "rejected"].map((s) => (
          <button key={s} className={`chip ${status === s ? "active" : ""}`} onClick={() => setStatus(s)}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {isLoading && <div className="skeleton" style={{ height: 100 }} />}
      {!isLoading && (!data || data.length === 0) && (
        <div className="empty"><div className="big">&#128100;</div><div>No {status} applications.</div></div>
      )}

      {data?.map((a) => (
        <div key={a.id} className="card card-pad mb-3">
          <div className="row-between">
            <div>
              <b>{a.fullName}</b>
              <div className="small muted">{a.email} · {a.phone} · {a.beats.join(", ") || "no beats"}</div>
            </div>
            <span className={`badge badge-${a.status === "approved" ? "success" : a.status === "pending" ? "warning" : "error"}`}>{a.status}</span>
          </div>
          <p className="small mt-2" style={{ lineHeight: 1.6 }}>{a.bio}</p>
          {a.status === "pending" && (
            <div className="row mt-2">
              <button className="btn btn-primary btn-sm" onClick={() => setActive(a)}>Review &amp; approve</button>
            </div>
          )}
        </div>
      ))}

      {active && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div className="card card-pad" style={{ maxWidth: 560, width: "100%", maxHeight: "90vh", overflow: "auto" }}>
            <div className="section-title">Approve {active.fullName}</div>
            <div className="field">
              <label>Assign region scope</label>
              <div className="row wrap">
                {regions.map((r) => (
                  <button key={r.id} type="button" className={`chip ${selected.includes(r.id) ? "active" : ""}`}
                    onClick={() => setSelected((s) => s.includes(r.id) ? s.filter((x) => x !== r.id) : [...s, r.id])}>
                    {r.name}
                  </button>
                ))}
              </div>
              <div className="hint">Selected regions and their descendants become this reporter&rsquo;s publish scope.</div>
            </div>
            <div className="row" style={{ justifyContent: "flex-end" }}>
              <button className="btn btn-ghost" onClick={() => setActive(null)}>Cancel</button>
              <button className="btn btn-secondary" onClick={() => review("reject")}>Reject</button>
              <button className="btn btn-primary" onClick={() => review("approve")}>Approve</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
