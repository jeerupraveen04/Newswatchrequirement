"use client";

import { useState } from "react";
import { useApiQuery } from "@/lib/hooks";
import { proxy } from "@/lib/proxy";

interface AdminUser {
  id: string;
  displayName: string;
  email: string | null;
  role: string;
  status: string;
}

const ROLE_BADGE: Record<string, string> = {
  user: "badge-muted",
  reporter: "badge-warning",
  admin: "badge-purple",
  super_admin: "badge-error",
};

export default function AdminUsersPage() {
  const { data, isLoading, refetch } = useApiQuery<AdminUser[]>(["admin-users"], "/admin/users");
  const [deleting, setDeleting] = useState<AdminUser | null>(null);
  const [note, setNote] = useState<string | null>(null);

  async function softDelete(u: AdminUser) {
    const res = await proxy(`/admin/users/${u.id}`, { method: "DELETE" });
    setDeleting(null);
    setNote(res.ok ? `${u.displayName} soft-deleted (restorable).` : res.error?.message ?? "Failed");
    void refetch();
  }

  return (
    <>
      <h1 className="page-title" style={{ marginBottom: 2 }}>User management</h1>
      <p className="page-sub">Users, reporters, admins and super admins. Soft delete is super-admin only.</p>

      {note && <div className="toast-note mb-2">{note}</div>}
      {isLoading && <div className="skeleton" style={{ height: 100 }} />}

      {data && (
        <table className="table">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {data.map((u) => (
              <tr key={u.id}>
                <td>{u.displayName}</td>
                <td>{u.email}</td>
                <td><span className={`badge ${ROLE_BADGE[u.role] ?? "badge-muted"}`}>{u.role}</span></td>
                <td><span className="badge badge-success">{u.status}</span></td>
                <td className="row">
                  <button className="btn btn-ghost btn-sm" onClick={() => setDeleting(u)}>Soft delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {deleting && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div className="card card-pad" style={{ maxWidth: 440, width: "100%" }}>
            <div className="section-title" style={{ color: "var(--error)" }}>Soft-delete {deleting.displayName}?</div>
            <p className="small muted">Sets <code>is_deleted = true</code>. The account can be restored from the Danger Zone.</p>
            <div className="row" style={{ justifyContent: "flex-end" }}>
              <button className="btn btn-ghost" onClick={() => setDeleting(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => softDelete(deleting)}>Soft delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
