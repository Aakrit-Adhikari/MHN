"use client";

import { Edit, Plus, Trash2, Upload, X } from "lucide-react";
import { ChangeEvent, FormEvent, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/State";
import { apiRequest, getAssetUrl, getStoredToken } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { useApiData } from "@/lib/useApiData";
import type { Helicopters } from "@/types/api";

const emptyForm = { helicopterNumber: "", model: "" };

export default function HelicoptersPage() {
  const { data, loading, error, reload } = useApiData<Helicopters[]>("/admin/helicopters", true);
  const [editing, setEditing] = useState<Helicopters | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [picture, setPicture] = useState<File | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");

  function showForm(helicopter?: Helicopters) {
    setEditing(helicopter ?? null);
    setForm(helicopter ? { helicopterNumber: helicopter.helicopterNumber, model: helicopter.model } : emptyForm);
    setPicture(null);
    setActionError("");
    setOpen(true);
  }

  function selectPicture(event: ChangeEvent<HTMLInputElement>) {
    setPicture(event.target.files?.[0] ?? null);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!editing && !picture) {
      setActionError("Please select a helicopter picture.");
      return;
    }
    setSaving(true);
    setActionError("");
    const body = new FormData();
    body.append("helicopterNumber", form.helicopterNumber.trim());
    body.append("model", form.model.trim());
    if (picture) body.append("picture", picture);
    try {
      await apiRequest(editing ? `/admin/helicopters/${editing.id}` : "/admin/helicopters", {
        method: editing ? "PATCH" : "POST", token: getStoredToken(), body
      });
      setOpen(false);
      reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to save helicopter.");
    } finally { setSaving(false); }
  }

  async function remove(helicopter: Helicopters) {
    if (!window.confirm(`Delete helicopter ${helicopter.helicopterNumber}?`)) return;
    try {
      await apiRequest(`/admin/helicopters/${helicopter.id}`, { method: "DELETE", token: getStoredToken() });
      reload();
    } catch (err) { setActionError(err instanceof Error ? err.message : "Unable to delete helicopter."); }
  }

  return <>
    <PageHeader title="Helicopters" actions={<button className="btn btn-gold" onClick={() => showForm()}><Plus className="h-4 w-4" /> Add Helicopter</button>} />
    {loading ? <LoadingState /> : null}
    {error ? <ErrorState title="Helicopters could not be loaded" /> : null}
    {actionError && !open ? <div className="mb-4"><ErrorState title="Action failed" message={actionError} /></div> : null}
    {!loading && !error && !data?.length ? <EmptyState title="No helicopters found" /> : null}
    {data?.length ? <div className="card"><div className="table-wrap"><table>
      <thead><tr><th>Picture</th><th>Helicopter Number</th><th>Model</th><th>Created</th><th>Updated</th><th></th></tr></thead>
      <tbody>{data.map((helicopter) => <tr key={helicopter.id}>
        <td><img className="blog-cover-thumb" src={getAssetUrl(helicopter.pictureUrl)} alt={`${helicopter.model} ${helicopter.helicopterNumber}`} /></td>
        <td><div className="t-name">{helicopter.helicopterNumber}</div></td>
        <td>{helicopter.model}</td><td>{formatDate(helicopter.createdAt)}</td><td>{formatDate(helicopter.updatedAt)}</td>
        <td><div className="flex justify-end gap-2"><button className="btn btn-secondary" onClick={() => showForm(helicopter)}><Edit className="h-4 w-4" /> Edit</button><button className="btn btn-ghost text-red-700 hover:text-red-700" onClick={() => remove(helicopter)}><Trash2 className="h-4 w-4" /> Delete</button></div></td>
      </tr>)}</tbody>
    </table></div></div> : null}

    {open ? <div className="modal-backdrop" role="dialog" aria-modal="true"><form className="modal-panel" onSubmit={save}>
      <div className="modal-header"><h2>{editing ? "Edit Helicopter" : "Add Helicopter"}</h2><button type="button" className="icon-btn" onClick={() => setOpen(false)} aria-label="Close"><X className="h-5 w-5" /></button></div>
      {actionError ? <div className="mb-4"><ErrorState title="Could not save" message={actionError} /></div> : null}
      <div className="form-grid">
        <label>Helicopter Number<input required maxLength={100} value={form.helicopterNumber} onChange={(e) => setForm({ ...form, helicopterNumber: e.target.value })} placeholder="e.g. 9N-ALM" /></label>
        <label>Model<input required maxLength={150} value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="e.g. Airbus H125" /></label>
        <label className="md:col-span-2">Picture<input type="file" accept="image/*" required={!editing} onChange={selectPicture} /></label>
        {editing && !picture ? <div className="md:col-span-2"><img className="blog-cover-thumb" src={getAssetUrl(editing.pictureUrl)} alt="Current helicopter" /></div> : null}
      </div>
      <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>Cancel</button><button className="btn btn-gold" disabled={saving}><Upload className="h-4 w-4" /> {saving ? "Saving..." : "Save Helicopter"}</button></div>
    </form></div> : null}
  </>;
}
