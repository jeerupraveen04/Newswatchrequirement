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
  const [modal, setModal] = useState<{ id?: string; name: string; slug: string; description: string; sortOrder: number } | null>(null);
  const [note, setNote] = useState<string | null>(null);

  function create() {
    setModal({ name: "", slug: "", description: "", sortOrder: 0 });
  }
  function edit(c: Category) {
    setModal({ id: c.id, name: c.name, slug: c.slug, description: c.description ?? "", sortOrder: c.sortOrder });
  }

  async function save() {
    if (!modal) return;
    const body = { name: modal.name, slug: modal.slug || undefined, description: modal.description, sortOrder: modal.sortOrder };
    const res = modal.id
      ? await proxy(`/categories/${modal.id}`, { method: "PATCH", body })
      : await proxy("/categories", { method: "POST", body });
    setNote(res.ok ? (modal.id ? "Category updated." : "Category created.") : res.error?.message ?? "Failed");
    setModal(null);
    void refetch();
  }

  async function remove(c: Category) {
    const res = await proxy(`/categories/${c.id}`, { method: "DELETE" });
    setNote(res.ok ? "Category deleted." : res.error?.message ?? "Failed");
    void refetch();
  }

  return (
    <>
      <div className="row-between mb-2">
        <h1 className="page-title" style={{ marginBottom: 0 }}>Category management</h1>
        <button className="btn btn-primary" onClick={create}>+ New category</button>
      </div>
      <p className="page-sub">Create, reorder and manage topics.</p>
      {note && <div className="toast-note mb-2">{note}</div>}

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
                  <button className="btn btn-ghost btn-sm" onClick={() => remove(c)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div className="card card-pad" style={{ maxWidth: 520, width: "100%" }}>
            <div className="section-title">{modal.id ? "Edit category" : "New category"}</div>
            <div className="field"><label>Name</label><input className="input" value={modal.name} onChange={(e) => setModal({ ...modal, name: e.target.value })} placeholder="e.g. Health" /></div>
            <div className="field"><label>Slug</label><input className="input" value={modal.slug} onChange={(e) => setModal({ ...modal, slug: e.target.value })} placeholder="health" /></div>
            <div className="field"><label>Description</label><textarea className="textarea" value={modal.description} onChange={(e) => setModal({ ...modal, description: e.target.value })} /></div>
            <div className="field"><label>Sort order</label><input className="input" type="number" value={modal.sortOrder} onChange={(e) => setModal({ ...modal, sortOrder: Number(e.target.value) })} /></div>
            <div className="row" style={{ justifyContent: "flex-end" }}>
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={!modal.name.trim()}>Save category</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
