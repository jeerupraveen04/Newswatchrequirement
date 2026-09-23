"use client";

import { useState } from "react";
import { useApiQuery } from "@/lib/hooks";
import { proxy } from "@/lib/proxy";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
}

export default function AdminCategoriesPage() {
  const { data, isLoading, refetch } = useApiQuery<Category[]>(["categories"], "/categories");
  const [modal, setModal] = useState<{ name: string; slug: string; description: string; sortOrder: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function create() {
    setModal({ name: "", slug: "", description: "", sortOrder: 0 });
  }
  function edit(c: Category) {
    setModal({ name: c.name, slug: c.slug, description: c.description ?? "", sortOrder: c.sortOrder });
  }

  async function save() {
    if (!modal) return;
    setError(null);
    // Categories are read-only via public API in v1; this demonstrates the flow.
    setError("Category writes require the admin categories endpoint (roadmap). ");
    void refetch;
  }

  return (
    <>
      <div className="row-between mb-2">
        <h1 className="page-title" style={{ marginBottom: 0 }}>Category management</h1>
        <button className="btn btn-primary" onClick={create}>+ New category</button>
      </div>
      <p className="page-sub">Create, reorder and manage topics.</p>

      {isLoading && <div className="skeleton" style={{ height: 100 }} />}
      {data && (
        <table className="table">
          <thead><tr><th>Order</th><th>Name</th><th>Slug</th><th>Actions</th></tr></thead>
          <tbody>
            {data.map((c) => (
              <tr key={c.id}>
                <td>{c.sortOrder}</td>
                <td>{c.name}</td>
                <td>{c.slug}</td>
                <td className="row">
                  <button className="btn btn-ghost btn-sm" onClick={() => edit(c)}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div className="card card-pad" style={{ maxWidth: 520, width: "100%" }}>
            <div className="section-title">{modal.name ? "Edit category" : "New category"}</div>
            {error && <div className="toast-note mb-2" style={{ color: "var(--warning)" }}>{error}</div>}
            <div className="field"><label>Name</label><input className="input" value={modal.name} onChange={(e) => setModal({ ...modal, name: e.target.value })} placeholder="e.g. Health" /></div>
            <div className="field"><label>Slug</label><input className="input" value={modal.slug} onChange={(e) => setModal({ ...modal, slug: e.target.value })} placeholder="health" /></div>
            <div className="field"><label>Description</label><textarea className="textarea" value={modal.description} onChange={(e) => setModal({ ...modal, description: e.target.value })} /></div>
            <div className="row" style={{ justifyContent: "flex-end" }}>
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={save}>Save category</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
