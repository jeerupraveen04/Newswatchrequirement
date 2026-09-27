"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { proxy } from "@/lib/proxy";

const TEMPLATES = [
  { key: "classic", label: "Classic", bg: "#8a007a", fg: "#ffffff" },
  { key: "breaking", label: "Breaking", bg: "#dc2626", fg: "#ffffff" },
  { key: "minimal", label: "Minimal", bg: "#ffffff", fg: "#8a007a" },
  { key: "gradient", label: "Gradient", bg: "linear-gradient(150deg,#8a007a,#2563eb)", fg: "#ffffff" },
  { key: "photo_hero", label: "Photo Hero", bg: "#222", fg: "#ffffff" },
];

const H_COLORS = ["#ffffff", "#171717", "#ffd400", "#8a007a"];
const D_COLORS = ["#ffffff", "#e0e0e0", "#555555"];

function PosterInner() {
  const params = useSearchParams();
  const articleId = params.get("id") ?? "";
  const [template, setTemplate] = useState("classic");
  const [headline, setHeadline] = useState("PM Modi Inaugurates New Infrastructure Projects");
  const [description, setDescription] = useState("Several projects launched to boost connectivity and jobs.");
  const [tag, setTag] = useState("INDIA");
  const [headlineColor, setHeadlineColor] = useState("#ffffff");
  const [descColor, setDescColor] = useState("#e0e0e0");
  const [headlineSize, setHeadlineSize] = useState(30);
  const [descSize, setDescSize] = useState(15);
  const [result, setResult] = useState<{ url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const tpl = TEMPLATES.find((t) => t.key === template)!;

  async function render() {
    if (!articleId) {
      setError("Open this from an article: /poster?id=<articleId>");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await proxy<{ url: string }>("/share/poster", {
      method: "POST",
      body: { articleId, template, headlineColor, descColor, headlineSize, descSize, categoryTag: tag },
    });
    setBusy(false);
    if (res.ok && res.data) setResult(res.data);
    else setError(res.error?.message ?? "Render failed");
  }

  return (
    <main className="page" style={{ maxWidth: 960 }}>
      <Link href="/reporter/articles" className="small muted">← My articles</Link>
      <h1 className="page-title mt-2">Share poster</h1>
      <p className="page-sub">Pick a template. The generated poster is attached when sharing.</p>

      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 22, alignItems: "start" }}>
        <div>
          <div style={{ background: "#e9e9ee", borderRadius: 12, padding: 22, display: "flex", justifyContent: "center" }}>
            <div style={{ width: "100%", maxWidth: 380, aspectRatio: "4/5", borderRadius: 14, overflow: "hidden", position: "relative", background: tpl.bg, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 22, color: tpl.fg, boxShadow: "0 8px 30px rgba(0,0,0,.18)" }}>
              <div style={{ position: "absolute", top: 16, left: 18, display: "flex", alignItems: "center", gap: 8, fontWeight: 800 }}>
                <span style={{ width: 22, height: 22, borderRadius: "50% 5px 50% 50%", transform: "rotate(-20deg)", background: tpl.fg }} />
                newswatch
              </div>
              <span style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,.9)", color: "#8a007a", fontSize: 10, fontWeight: 800, padding: "4px 9px", borderRadius: 20 }}>{tag}</span>
              <div style={{ fontWeight: 800, lineHeight: 1.14, color: headlineColor, fontSize: headlineSize, zIndex: 1 }}>{headline}</div>
              <div style={{ lineHeight: 1.5, color: descColor, fontSize: descSize, marginTop: 10, zIndex: 1 }}>{description}</div>
              <div style={{ marginTop: 16, fontSize: 11, fontWeight: 700, color: descColor, zIndex: 1 }}>newswatch.com</div>
            </div>
          </div>
          {result && (
            <div className="toast-note mt-2">
              Poster rendered: <a href={result.url} target="_blank" rel="noreferrer" style={{ color: "var(--purple)", fontWeight: 700 }}>open</a>
            </div>
          )}
          {error && <div className="toast-note mt-2" style={{ color: "var(--error)" }}>{error}</div>}
        </div>

        <div>
          <div className="card card-pad mb-3">
            <div className="section-title" style={{ fontSize: 15 }}>Template</div>
            <div className="row wrap">
              {TEMPLATES.map((tp) => (
                <button key={tp.key} className={`chip ${template === tp.key ? "active" : ""}`} onClick={() => setTemplate(tp.key)}>{tp.label}</button>
              ))}
            </div>
          </div>
          <div className="card card-pad mb-3">
            <div className="section-title" style={{ fontSize: 15 }}>Content</div>
            <div className="field"><label>Headline</label><textarea className="textarea" value={headline} onChange={(e) => setHeadline(e.target.value)} /></div>
            <div className="field"><label>Description</label><textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
            <div className="field" style={{ marginBottom: 0 }}><label>Category tag</label><input className="input" value={tag} onChange={(e) => setTag(e.target.value.toUpperCase())} /></div>
          </div>
          <div className="card card-pad mb-3">
            <div className="section-title" style={{ fontSize: 15 }}>Headline style</div>
            <div className="row wrap mb-2">
              {H_COLORS.map((c) => <button key={c} onClick={() => setHeadlineColor(c)} style={{ width: 26, height: 26, borderRadius: "50%", background: c, border: headlineColor === c ? "3px solid var(--purple)" : "2px solid #fff", boxShadow: "0 0 0 1px #ccc" }} />)}
              <input type="range" min={18} max={46} value={headlineSize} onChange={(e) => setHeadlineSize(Number(e.target.value))} />
              <span className="small muted">{headlineSize}px</span>
            </div>
          </div>
          <div className="card card-pad mb-3">
            <div className="section-title" style={{ fontSize: 15 }}>Description style</div>
            <div className="row wrap mb-2">
              {D_COLORS.map((c) => <button key={c} onClick={() => setDescColor(c)} style={{ width: 26, height: 26, borderRadius: "50%", background: c, border: descColor === c ? "3px solid var(--purple)" : "2px solid #fff", boxShadow: "0 0 0 1px #ccc" }} />)}
              <input type="range" min={11} max={24} value={descSize} onChange={(e) => setDescSize(Number(e.target.value))} />
              <span className="small muted">{descSize}px</span>
            </div>
          </div>
          <button className="btn btn-primary btn-block" disabled={busy} onClick={render}>{busy ? "Rendering…" : "Generate poster"}</button>
        </div>
      </div>
    </main>
  );
}

export default function PosterPage() {
  return (
    <Suspense fallback={<div className="page"><div className="skeleton" style={{ height: 300 }} /></div>}>
      <PosterInner />
    </Suspense>
  );
}
