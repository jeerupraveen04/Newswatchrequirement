"use client";

import Link from "next/link";
import { useState } from "react";
import { useApiQuery } from "@/lib/hooks";
import { proxy } from "@/lib/proxy";
import { formatRelative } from "@/lib/types";

interface QueueItem {
  id: string;
  title: string;
  status: string;
  submittedAt: string | null;
  regionId: string;
}

export default function ModerationPage() {
  const [status, setStatus] = useState("pending");
  const { data, isLoading, refetch } = useApiQuery<QueueItem[]>(
    ["moderation", status],
    `/admin/moderation/queue?status=${status}&limit=50`,
  );
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function moderate(id: string, action: "publish" | "reject" | "unpublish", note?: string) {
    setBusy(true);
    await proxy(`/articles/${id}/moderate`, { method: "POST", body: { action, note } });
    setBusy(false);
    setRejectId(null);
    setReason("");
    void refetch();
  }

  return (
    <>
      <h1 className="page-title" style={{ marginBottom: 2 }}>Article moderation</h1>
      <p className="page-sub">Review, publish or reject submitted stories within your region scope.</p>

      <div className="row mb-3 wrap">
        {["pending", "published", "rejected", "unpublished"].map((s) => (
          <button key={s} className={`chip ${status === s ? "active" : ""}`} onClick={() => setStatus(s)}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {isLoading && <div className="skeleton" style={{ height: 100 }} />}
      {!isLoading && (!data || data.length === 0) && (
        <div className="empty"><div className="big">&#128203;</div><div>Nothing in this queue.</div></div>
      )}

      {data && data.length > 0 && (
        <table className="table">
          <thead>
            <tr><th>Title</th><th>Submitted</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {data.map((a) => (
              <tr key={a.id}>
                <td>{a.title}</td>
                <td>{formatRelative(a.submittedAt)}</td>
                <td><span className={`badge badge-${a.status === "published" ? "success" : a.status === "pending" ? "warning" : "muted"}`}>{a.status}</span></td>
                <td className="row">
                  {a.status === "pending" && (
                    <>
                      <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => moderate(a.id, "publish")}>Publish</button>
                      <button className="btn btn-secondary btn-sm" disabled={busy} onClick={() => setRejectId(a.id)}>Reject</button>
                    </>
                  )}
                  {a.status === "published" && (
                    <button className="btn btn-secondary btn-sm" disabled={busy} onClick={() => moderate(a.id, "unpublish")}>Unpublish</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {rejectId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div className="card card-pad" style={{ maxWidth: 480, width: "100%" }}>
            <div className="section-title">Reject article</div>
            <div className="field">
              <label>Reason <span className="badge badge-error">Required</span></label>
              <textarea className="textarea" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Explain what the reporter must change…" />
            </div>
            <div className="row" style={{ justifyContent: "flex-end" }}>
              <button className="btn btn-ghost" onClick={() => setRejectId(null)}>Cancel</button>
              <button className="btn btn-danger" disabled={!reason.trim() || busy} onClick={() => moderate(rejectId, "reject", reason)}>Send &amp; reject</button>
            </div>
          </div>
        </div>
      )}

      <p className="small muted mt-3">
        Super admin hard delete is available in <Link href="/admin/danger-zone" style={{ color: "var(--purple)" }}>Danger Zone</Link>.
      </p>
    </>
  );
}
