"use client";

import Link from "next/link";
import { useApiQuery, useApiMutation } from "@/lib/hooks";
import { formatRelative } from "@/lib/types";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  deepLink: string | null;
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const { data, isLoading } = useApiQuery<{ items: Notification[]; unread: number }>(
    ["notifications"],
    "/notifications?limit=30",
  );
  const markAll = useApiMutation<{ allRead: boolean }>("/notifications/read-all", {
    method: "POST",
    invalidate: [["notifications"]],
  });

  return (
    <main className="page">
      <div className="row-between mb-2">
        <h1 className="page-title" style={{ marginBottom: 0 }}>Notifications</h1>
        <button className="btn btn-ghost btn-sm" onClick={() => markAll.mutate({} as never)}>Mark all read</button>
      </div>
      <p className="page-sub">{data?.unread ?? 0} unread</p>
      {isLoading && <div className="skeleton" style={{ height: 80 }} />}
      {!isLoading && (!data || data.items.length === 0) && (
        <div className="empty"><div className="big">&#128276;</div><div>Nothing here yet.</div></div>
      )}
      {data?.items.map((n) => (
        <Link
          key={n.id}
          href={n.deepLink ?? "#"}
          className="list-row"
          style={!n.read ? { borderLeft: "3px solid var(--purple)" } : undefined}
        >
          <div className="grow">
            <div className="title">{n.title}</div>
            <div className="sub">{n.body} · {formatRelative(n.createdAt)}</div>
          </div>
        </Link>
      ))}
    </main>
  );
}
