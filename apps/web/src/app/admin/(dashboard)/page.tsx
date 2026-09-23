import Link from "next/link";
import { getSession } from "@/lib/session";

export const metadata = { title: "Admin dashboard" };

export default async function AdminDashboard() {
  const session = await getSession();
  const isSuper = session.role === "super_admin";

  return (
    <>
      <div className="row-between mb-3">
        <div>
          <h1 className="page-title" style={{ marginBottom: 2 }}>Dashboard</h1>
          <p className="page-sub" style={{ marginBottom: 0 }}>
            {isSuper ? "Global overview" : `Region-scoped · ${session.regionScopes.length} region(s)`}
          </p>
        </div>
        <Link href="/admin/articles" className="btn btn-primary">Moderation queue</Link>
      </div>

      <div className="grid grid-4 mb-3">
        <div className="kpi"><div className="num">—</div><div className="lbl">Total articles</div></div>
        <div className="kpi"><div className="num" style={{ color: "var(--warning)" }}>—</div><div className="lbl">Pending review</div></div>
        <div className="kpi"><div className="num" style={{ color: "var(--success)" }}>—</div><div className="lbl">Published today</div></div>
        <div className="kpi"><div className="num">{session.regionScopes.length}</div><div className="lbl">Scoped regions</div></div>
      </div>

      <div className="grid grid-2 mb-3">
        <Link href="/admin/articles" className="card card-pad">
          <div className="section-title">Article moderation</div>
          <p className="muted small">Review, approve, or reject submitted stories within your scope.</p>
        </Link>
        <Link href="/admin/reporters" className="card card-pad">
          <div className="section-title">Reporter approvals</div>
          <p className="muted small">Approve applicants and assign their region scope.</p>
        </Link>
      </div>

      {isSuper && (
        <div className="grid grid-3">
          <Link href="/admin/regions" className="card card-pad">
            <div className="section-title">Regions</div>
            <p className="muted small">Manage the State → District → Constituency → Mandal tree.</p>
          </Link>
          <Link href="/admin/app-settings" className="card card-pad">
            <div className="section-title">App &amp; Ad Settings</div>
            <p className="muted small">Contact and advertisement details.</p>
          </Link>
          <Link href="/admin/danger-zone" className="card card-pad" style={{ border: "1px solid rgba(220,38,38,.3)" }}>
            <div className="section-title" style={{ color: "var(--error)" }}>Danger Zone</div>
            <p className="muted small">Soft-delete users, hard-delete articles, audit log.</p>
          </Link>
        </div>
      )}
    </>
  );
}
