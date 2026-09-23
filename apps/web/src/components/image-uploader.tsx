"use client";

import { useRef, useState } from "react";
import { proxy } from "@/lib/proxy";

interface SignResponse {
  assetId: string;
  uploadUrl: string;
  key: string;
}

/**
 * Uploads an image/video via the authenticated proxy:
 * sign -> PUT to R2 -> complete. Calls onUploaded with the asset id.
 */
export function ImageUploader({
  purpose = "article",
  accept = "image/*,video/*",
  onUploaded,
}: {
  purpose?: "avatar" | "article" | "hero" | "gallery" | "poster" | "video";
  accept?: string;
  onUploaded?: (assetId: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setBusy(true);
    const isVideo = file.type.startsWith("video/");
    setProgress(`Signing ${file.name}…`);

    const sign = await proxy<SignResponse>("/media/sign", {
      method: "POST",
      body: {
        kind: isVideo ? "video" : "image",
        contentType: file.type || "application/octet-stream",
        sizeBytes: file.size,
        purpose,
      },
    });
    if (!sign.ok || !sign.data) {
      setBusy(false);
      setError(sign.error?.message ?? "Upload rejected");
      return;
    }

    setProgress(`Uploading ${file.name}… (${(file.size / 1024).toFixed(0)} KB)`);
    try {
      const put = await fetch(sign.data.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!put.ok) throw new Error(`Upload failed (${put.status})`);
      setProgress("Processing…");
      await proxy(`/media/${sign.data.assetId}/complete`, {
        method: "POST",
        body: isVideo ? { durationSeconds: 1 } : {},
      });
      onUploaded?.(sign.data.assetId);
      setProgress(`Uploaded: ${file.name}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        style={{ border: "2px dashed var(--border)", borderRadius: 12, padding: 22, textAlign: "center", color: "var(--muted)", cursor: busy ? "wait" : "pointer" }}
      >
        <div style={{ fontSize: 26 }}>&#128247; &#127909;</div>
        <div className="mt-1">Click to upload an image or video</div>
        <div className="small">Images ≤10MB · Videos ≤200MB / 3 min</div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
        }}
      />
      {progress && <div className="hint">{progress}</div>}
      {error && <div className="hint" style={{ color: "var(--error)" }}>{error}</div>}
    </div>
  );
}
