"use client";

import { useState } from "react";
import { proxy } from "@/lib/proxy";
import { formatCount } from "@/lib/types";

export function ArticleActions({
  articleId,
  slug,
  likeCount,
}: {
  articleId: string;
  slug: string;
  likeCount: number;
}) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likes, setLikes] = useState(likeCount);

  async function toggleLike() {
    const res = await proxy<{ liked: boolean }>("/like", {
      method: "POST",
      body: { targetType: "article", targetId: articleId },
    });
    if (res.ok && res.data) {
      setLiked(res.data.liked);
      setLikes((n) => n + (res.data!.liked ? 1 : -1));
    } else {
      window.location.href = "/login";
    }
  }

  async function toggleSave() {
    const res = await proxy<{ bookmarked: boolean }>("/bookmarks", {
      method: "POST",
      body: { articleId },
    });
    if (res.ok && res.data) setSaved(res.data.bookmarked);
    else window.location.href = "/login";
  }

  async function share() {
    const url = `${window.location.origin}/news/${slug}`;
    if (navigator.share) await navigator.share({ url, title: document.title }).catch(() => undefined);
    else await navigator.clipboard.writeText(url);
  }

  return (
    <div className="action-bar">
      <button className={`action-btn ${liked ? "active" : ""}`} onClick={toggleLike}>
        <span className="ico">&#9825;</span>
        <span>{formatCount(likes)}</span>
      </button>
      <a className="action-btn" href="#comments">
        <span className="ico">&#9711;</span>
        <span>Comments</span>
      </a>
      <button className="action-btn" onClick={share}>
        <span className="ico">&#8999;</span>
        <span>Share</span>
      </button>
      <button className={`action-btn ${saved ? "active" : ""}`} onClick={toggleSave}>
        <span className="ico">&#9873;</span>
        <span>Save</span>
      </button>
    </div>
  );
}
