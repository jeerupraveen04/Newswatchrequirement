"use client";

import { useEffect, useState } from "react";
import { proxy } from "@/lib/proxy";
import { formatRelative } from "@/lib/types";

interface DeletedUser {
  id: string;
  displayName: string;
  email: string | null;
  deletedAt: string | null;
}

interface AuditEntry {
  id: string;
  action: string;
  targetType: string;
  createdAt: string;
  meta: Record<string, unknown>;
}

export default function DangerZonePage() {
  const [users, setUsers] = useState<DeletedUser[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [articleId, setArticleId] = useState("");
  const [confirmTitle, setConfirmTitle] = useState("");

  async function load() {
    const [u, a] = await Promise.all([
      proxy<DeletedUser[]>("/admin/users/deleted"),
      proxy<AuditEntry[]>("/admin/audit-logs?limit=30"),
    ]);
    setUsers(u.data ?? []);
    setAudit(a.data ?? []);
  }
  useEffect(() => { void load(); }, []);

  async function restore(id: string) {
    const res = await proxy(`/admin/users/${id}/restore`, { method: "POST", body: {} });
    setNote(res.ok ? "User restored." : res.error?.message ?? "Failed");
    void load();
  }
  async function purge(id: string) {
    const res = await proxy(`/admin/users/${id}/purge`, { method: "POST", body: {} });
    setNote(res.ok ? "User purged." : res.error?.message ?? "Failed");
    void load();
  }
  async function hardDeleteArticle() {
    if (!articleId || !confirmTitle) return;
    const res = await proxy(`/admin/articles/${articleId}`, { method: "DELETE" });
    setNote(res.ok ? "Article permanently deleted." : res.error?.message ?? "Failed");
    setArticleId("");
    setConfirmTitle("");
    void load();
  }

  return (
    <>
      <h1 className="page-title" style={{ marginBottom: 2 }}>Danger zone</h1>
      <p className="page-sub">Soft-deleted users, article hard delete, audit log · <b>Super Admin only</b></p>

      <div className="toast-note mb-3" style={{ background: "rgba(220,38,38,.08)", borderColor: "rgba(220,38,38,.25)", color: "var(--error)" }}>
        Destructive actions are irreversible and fully audited.
      </div>
      {note && <div className="toast-note mb-3">{note}</div>}

      <div className="card card-pad mb-3">
        <div className="section-title">Users — soft delete <span className="badge badge-warning">restorable</span></div>
        {users.length === 0 ? (
          <p className="muted small">No soft-deleted users.</p>
        ) : (
          <table className="table">
            <thead><tr><th>User</th><th>Email</th><th>Deleted</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.displayName}</td>
                  <td>{u.email}</td>
                  <td>{formatRelative(u.deletedAt)}</td>
                  <td className="row">
                    <button className="btn btn-secondary btn-sm" onClick={() => restore(u.id)}>Restore</button>
                    <button className="btn btn-danger btn-sm" onClick={() => purge(u.id)}>Purge</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card card-pad mb-3" style={{ border: "1px solid rgba(220,38,38,.3)" }}>
        <div className="section-title" style={{ color: "var(--error)" }}>Hard delete article <span className="badge badge-error">irreversible</span></div>
        <p className="small muted mb-2">Permanently removes the article row and its dependents, and queues media deletion.</p>
        <div className="field" style={{ maxWidth: 520 }}><label>Article ID</label><input className="input" value={articleId} onChange={(e) => setArticleId(e.target.value)} placeholder="uuid" /></div>
        <div className="field" style={{ maxWidth: 520 }}><label>Type the article title to confirm</label><input className="input" value={confirmTitle} onChange={(e) => setConfirmTitle(e.target.value)} /></div>
        <button className="btn btn-danger" disabled={!articleId || !confirmTitle} onClick={hardDeleteArticle}>Permanently delete article</button>
      </div>

      <div className="card card-pad">
        <div className="section-title">Audit log</div>
        <table className="table">
          <thead><tr><th>When</th><th>Action</th><th>Target</th></tr></thead>
          <tbody>
            {audit.map((a) => (
              <tr key={a.id}>
                <td>{formatRelative(a.createdAt)}</td>
                <td>{a.action}</td>
                <td>{a.targetType}</td>
              </tr>
            ))}
            {audit.length === 0 && <tr><td colSpan={3} className="muted">No audit entries.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
