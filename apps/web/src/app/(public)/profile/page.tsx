"use client";

import Link from "next/link";
import { useApiQuery } from "@/lib/hooks";

interface Me {
  id: string;
  displayName: string;
  username: string;
  email: string | null;
  bio: string | null;
  avatarUrl: string | null;
  role: string;
}

export default function ProfilePage() {
  const { data, isLoading } = useApiQuery<Me>(["me"], "/me");

  if (isLoading) return <main className="page"><div className="skeleton" style={{ height: 120 }} /></main>;
  if (!data) return <main className="page"><div className="empty">Not signed in.</div></main>;

  return (
    <main className="page">
      <div className="card card-pad">
        <div className="row">
          <span style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--purple)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 700 }}>
            {data.displayName.charAt(0)}
          </span>
          <div className="grow">
            <h1 style={{ fontSize: 22, fontWeight: 800 }}>{data.displayName}</h1>
            <div className="muted small">@{data.username} · {data.role}</div>
            <div className="row mt-1">
              <Link href="/settings" className="btn btn-secondary btn-sm">Settings</Link>
              {data.role === "reporter" && <Link href="/reporter/dashboard" className="btn btn-ghost btn-sm">Reporter dashboard</Link>}
              {(data.role === "admin" || data.role === "super_admin") && <Link href="/admin" className="btn btn-ghost btn-sm">Admin console</Link>}
            </div>
          </div>
        </div>
        {data.bio && <p className="muted mt-3">{data.bio}</p>}
      </div>
      <div className="row mt-3 wrap">
        <Link href="/bookmarks" className="btn btn-secondary">My saved</Link>
        <Link href="/notifications" className="btn btn-ghost">Notifications</Link>
      </div>
    </main>
  );
}
