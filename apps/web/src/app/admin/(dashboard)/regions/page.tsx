"use client";

import { useEffect, useState } from "react";
import { proxy } from "@/lib/proxy";

interface Region {
  id: string;
  type: string;
  name: string;
  slug: string;
  parentId: string | null;
}

export default function RegionsPage() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [modal, setModal] = useState<{ name: string; slug: string; type: string; parentId: string } | null>(null);
  const [note, setNote] = useState<string | null>(null);

  async function load() {
    const res = await proxy<Region[]>("/admin/regions");
    setRegions(res.data ?? []);
  }
  useEffect(() => { void load(); }, []);

  async function create() {
    if (!modal) return;
    const res = await proxy("/admin/regions", {
      method: "POST",
      body: { name: modal.name, slug: modal.slug, type: modal.type, parentId: modal.parentId || null },
    });
    setNote(res.ok ? "Region created." : res.error?.message ?? "Failed");
    setModal(null);
    void load();
  }

  async function remove(r: Region) {
    const res = await proxy(`/admin/regions/${r.id}`, { method: "DELETE" });
    setNote(res.ok ? "Region deleted." : res.error?.message ?? "Blocked");
    void load();
  }

  const roots = regions.filter((r) => !r.parentId);
  void roots;

  return (
    <>
      <div className="row-between mb-2">
        <div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>Region management</h1>
          <p className="page-sub" style={{ marginBottom: 0 }}>State → District → Constituency → Mandal · <b>Super Admin only</b></p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal({ name: "", slug: "", type: "district", parentId: "" })}>+ New region</button>
      </div>

      {note && <div className="toast-note mb-2">{note}</div>}

      <table className="table">
        <thead><tr><th>Type</th><th>Name</th><th>Slug</th><th>Parent</th><th>Actions</th></tr></thead>
        <tbody>
          {regions.map((r) => {
            const parent = regions.find((p) => p.id === r.parentId);
            return (
              <tr key={r.id}>
                <td><span className="badge badge-muted">{r.type}</span></td>
                <td>{r.name}</td>
                <td>{r.slug}</td>
                <td className="muted">{parent?.name ?? "—"}</td>
                <td><button className="btn btn-ghost btn-sm" onClick={() => remove(r)}>Delete</button></td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div className="card card-pad" style={{ maxWidth: 480, width: "100%" }}>
            <div className="section-title">New region</div>
            <div className="field"><label>Name</label><input className="input" value={modal.name} onChange={(e) => setModal({ ...modal, name: e.target.value })} /></div>
            <div className="field"><label>Slug</label><input className="input" value={modal.slug} onChange={(e) => setModal({ ...modal, slug: e.target.value })} placeholder="warangal" /></div>
            <div className="field"><label>Type</label>
              <select className="select" value={modal.type} onChange={(e) => setModal({ ...modal, type: e.target.value })}>
                <option value="state">State</option><option value="district">District</option>
                <option value="constituency">Constituency</option><option value="mandal">Mandal</option>
              </select>
            </div>
            <div className="field"><label>Parent</label>
              <select className="select" value={modal.parentId} onChange={(e) => setModal({ ...modal, parentId: e.target.value })}>
                <option value="">None</option>
                {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div className="row" style={{ justifyContent: "flex-end" }}>
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={create}>Create region</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
