"use client";

import { useState } from "react";
import { useApiQuery } from "@/lib/hooks";
import { proxy } from "@/lib/proxy";
import { formatRelative } from "@/lib/types";

interface Comment {
  id: string;
  body: string;
  createdAt: string;
  author: { displayName: string; username: string; role: string } | null;
  replies: Array<{
    id: string;
    body: string;
    createdAt: string;
    author: { displayName: string; role: string } | null;
  }>;
}

export function Comments({ articleId, canPost }: { articleId: string; canPost: boolean }) {
  const { data, isLoading, refetch } = useApiQuery<Comment[]>(["comments", articleId], `/articles/${articleId}/comments?limit=30`);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  async function post() {
    if (!body.trim()) return;
    setBusy(true);
    const res = await proxy(`/articles/${articleId}/comments`, { method: "POST", body: { body } });
    setBusy(false);
    if (res.ok) {
      setBody("");
      void refetch();
    } else {
      window.location.href = "/login";
    }
  }

  return (
    <section id="comments" className="mt-3">
      <div className="section-title">Comments</div>

      {canPost ? (
        <div className="card card-pad mb-3">
          <textarea className="textarea" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Add a comment…" maxLength={1000} />
          <div className="row mt-2" style={{ justifyContent: "flex-end" }}>
            <button className="btn btn-primary btn-sm" disabled={busy || !body.trim()} onClick={post}>Post</button>
          </div>
        </div>
      ) : (
        <p className="small muted mb-3">
          <a href="/login" style={{ color: "var(--purple)", fontWeight: 700 }}>Log in</a> to join the conversation.
        </p>
      )}

      {isLoading && <div className="skeleton" style={{ height: 60 }} />}
      {!isLoading && (!data || data.length === 0) && <p className="muted small">No comments yet.</p>}

      {data?.map((c) => (
        <div key={c.id} className="comment" style={{ padding: "14px 0", borderBottom: "1px solid var(--border)" }}>
          <div style={{ width: 27, height: 27, borderRadius: "50%", background: "var(--purple)", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="small muted mb-1">
              <b style={{ color: "var(--text)" }}>{c.author?.displayName ?? "User"}</b> · {formatRelative(c.createdAt)}
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.55 }}>{c.body}</div>
            {c.replies.map((r) => (
              <div key={r.id} style={{ marginLeft: 20, marginTop: 10, paddingLeft: 12, borderLeft: "2px solid var(--border)" }}>
                <div className="small muted mb-1">
                  <b style={{ color: "var(--text)" }}>{r.author?.displayName ?? "User"}</b> · {formatRelative(r.createdAt)}
                </div>
                <div style={{ fontSize: 14 }}>{r.body}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
