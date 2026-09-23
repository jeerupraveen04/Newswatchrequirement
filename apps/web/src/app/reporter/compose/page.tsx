"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { proxy } from "@/lib/proxy";
import { ImageUploader } from "@/components/image-uploader";

interface Region {
  id: string;
  name: string;
  type: string;
  parentId: string | null;
}

const H_COLORS = ["#171717", "#8a007a", "#dc2626", "#2563eb", "#16a34a"];
const D_COLORS = ["#555555", "#737373", "#171717", "#8a007a"];
const SIZES = [
  { label: "S", h: 22, d: 13 },
  { label: "M", h: 30, d: 15 },
  { label: "L", h: 38, d: 18 },
  { label: "XL", h: 46, d: 22 },
];

function ComposerInner() {
  const router = useRouter();
  const params = useSearchParams();
  const editId = params.get("id");
  const editorRef = useRef<HTMLDivElement>(null);

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [regions, setRegions] = useState<Region[]>([]);
  const [regionId, setRegionId] = useState("");
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [tags, setTags] = useState("");
  const [headlineColor, setHeadlineColor] = useState("#171717");
  const [descColor, setDescColor] = useState("#737373");
  const [headlineSize, setHeadlineSize] = useState(30);
  const [descSize, setDescSize] = useState(15);
  const [heroMediaId, setHeroMediaId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void proxy<Region[]>("/reporter/regions").then((r) => setRegions(r.data ?? []));
    void proxy<Array<{ id: string; name: string }>>("/categories").then((r) => setCategories(r.data ?? []));
  }, []);

  function fmt(cmd: string, val?: string) {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
  }

  async function submit(forReview: boolean) {
    setError(null);
    setBusy(true);
    const bodyHtml = editorRef.current?.innerHTML ?? "";
    const res = await proxy<{ id: string; slug: string }>("/articles", {
      method: "POST",
      body: {
        title,
        summary,
        body: bodyHtml,
        bodyFormat: "rich",
        regionId,
        categoryIds: selectedCats,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        headlineStyle: { color: headlineColor, fontSize: headlineSize, weight: 800 },
        descriptionStyle: { color: descColor, fontSize: descSize },
      },
    });
    if (!res.ok || !res.data) {
      setBusy(false);
      setError(res.error?.message ?? "Could not save");
      return;
    }
    const articleId = res.data.id;
    if (forReview) {
      const sub = await proxy(`/articles/${articleId}/submit`, { method: "POST", body: {} });
      setBusy(false);
      if (!sub.ok) {
        setError(sub.error?.message ?? "Submit failed");
        return;
      }
      setStatus("pending");
      router.push("/reporter/articles");
      return;
    }
    setBusy(false);
    setStatus("draft");
  }

  return (
    <main className="container-wide">
      <div className="row-between mb-3">
        <div>
          <Link href="/reporter/dashboard" className="small muted">← Dashboard</Link>
          <h1 className="page-title" style={{ marginBottom: 0 }}>{editId ? "Edit article" : "New article"}</h1>
        </div>
        {status && <span className="badge badge-success">Saved as {status}</span>}
      </div>

      {error && <div className="toast-note mb-2" style={{ background: "rgba(220,38,38,.08)", borderColor: "rgba(220,38,38,.25)", color: "var(--error)" }}>{error}</div>}

      <div className="card card-pad mb-3">
        <div className="field">
          <label>Headline / Title <span className="badge badge-purple">Required</span></label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Article headline" />
        </div>

        <div className="section-title" style={{ fontSize: 14 }}>Headline style</div>
        <div className="row wrap mb-2">
          <span className="small muted">Colour</span>
          {H_COLORS.map((c) => (
            <button key={c} onClick={() => setHeadlineColor(c)} title={c}
              style={{ width: 26, height: 26, borderRadius: "50%", background: c, border: headlineColor === c ? "3px solid var(--purple)" : "2px solid #fff", boxShadow: "0 0 0 1px var(--border)", cursor: "pointer" }} />
          ))}
          <span className="small muted" style={{ marginLeft: 12 }}>Size</span>
          {SIZES.map((s) => (
            <button key={s.label} className={`chip ${headlineSize === s.h ? "active" : ""}`} onClick={() => setHeadlineSize(s.h)}>{s.label}</button>
          ))}
        </div>
      </div>

      <div className="card card-pad mb-3">
        <div className="field">
          <label>Description / Summary</label>
          <textarea className="textarea" value={summary} onChange={(e) => setSummary(e.target.value)} maxLength={300} placeholder="Short summary shown in feeds" />
        </div>
        <div className="section-title" style={{ fontSize: 14 }}>Description style</div>
        <div className="row wrap mb-2">
          <span className="small muted">Colour</span>
          {D_COLORS.map((c) => (
            <button key={c} onClick={() => setDescColor(c)} title={c}
              style={{ width: 26, height: 26, borderRadius: "50%", background: c, border: descColor === c ? "3px solid var(--purple)" : "2px solid #fff", boxShadow: "0 0 0 1px var(--border)", cursor: "pointer" }} />
          ))}
          <span className="small muted" style={{ marginLeft: 12 }}>Size</span>
          {SIZES.map((s) => (
            <button key={s.label} className={`chip ${descSize === s.d ? "active" : ""}`} onClick={() => setDescSize(s.d)}>{s.label}</button>
          ))}
        </div>
      </div>

      <div className="card card-pad mb-3">
        <div className="section-title" style={{ marginBottom: 12 }}>Live preview</div>
        <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
          <div style={{ fontWeight: 800, lineHeight: 1.15, color: headlineColor, fontSize: headlineSize }}>
            {title || "Your headline appears here"}
          </div>
          <div style={{ color: descColor, fontSize: descSize, marginTop: 8 }}>
            {summary || "Your description appears here."}
          </div>
        </div>
      </div>

      <div className="card card-pad mb-3">
        <div className="field" style={{ marginBottom: 10 }}><label>Body <span className="badge badge-purple">Required · min 200 words to submit</span></label></div>
        <div className="row wrap mb-1" style={{ padding: 8, border: "1px solid var(--border)", borderBottom: "none", borderRadius: "8px 8px 0 0", background: "#fafafa" }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => fmt("bold")}><b>B</b></button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => fmt("italic")}><i>I</i></button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => fmt("formatBlock", "H2")}>H2</button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => fmt("insertUnorderedList")}>• List</button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => fmt("formatBlock", "BLOCKQUOTE")}>&#10078;</button>
          <input type="color" defaultValue="#8a007a" title="Text colour" style={{ width: 34, height: 30 }} onChange={(e) => fmt("foreColor", e.target.value)} />
        </div>
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          className="rt-editor"
          style={{ border: "1px solid var(--border)", borderRadius: "0 0 8px 8px", minHeight: 220, padding: 14, fontSize: 15, lineHeight: 1.7, outline: "none" }}
        >
          <p>Write your story here. Use the toolbar to format text.</p>
        </div>
      </div>

      <div className="card card-pad mb-3">
        <div className="field">
          <label>Region <span className="badge badge-purple">Required</span></label>
          <select className="select" value={regionId} onChange={(e) => setRegionId(e.target.value)}>
            <option value="">Select a region…</option>
            {regions.map((r) => (
              <option key={r.id} value={r.id}>{r.name} ({r.type})</option>
            ))}
          </select>
          <div className="hint">Limited to your assigned regions (REQ-REG-002).</div>
        </div>
        <div className="field">
          <label>Categories</label>
          <div className="row wrap">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`chip ${selectedCats.includes(c.id) ? "active" : ""}`}
                onClick={() => setSelectedCats((s) => s.includes(c.id) ? s.filter((x) => x !== c.id) : [...s, c.id])}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
        <div className="field"><label>Tags</label><input className="input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="infrastructure, budget" /></div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Hero image or video</label>
          <ImageUploader purpose="hero" onUploaded={(id) => setHeroMediaId(id)} />
          {heroMediaId && <div className="hint">Media attached: {heroMediaId.slice(0, 8)}…</div>}
        </div>
      </div>

      <div className="row wrap">
        <button className="btn btn-secondary" disabled={busy} onClick={() => submit(false)}>Save draft</button>
        <button className="btn btn-primary" disabled={busy} onClick={() => submit(true)}>Submit for review</button>
      </div>
    </main>
  );
}

export default function ComposePage() {
  return (
    <Suspense fallback={<div className="container-wide"><div className="skeleton" style={{ height: 300 }} /></div>}>
      <ComposerInner />
    </Suspense>
  );
}
