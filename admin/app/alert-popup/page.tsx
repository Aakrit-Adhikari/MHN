"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { Edit, ImagePlus, Trash2, Upload, X } from "lucide-react";

import { PageHeader } from "@/components/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/State";
import { apiRequest, getAssetUrl, getStoredToken } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { useApiData } from "@/lib/useApiData";
import type { AlertPopup } from "@/types/api";

type AlertPopupForm = {
  title: string;
  linkUrl: string;
  isActive: boolean;
  startsAt: string;
  endsAt: string;
};

const emptyForm: AlertPopupForm = {
  title: "",
  linkUrl: "",
  isActive: true,
  startsAt: "",
  endsAt: ""
};

function toDateInput(value: string | null) {
  return value ? value.slice(0, 10) : "";
}

function toForm(popup?: AlertPopup): AlertPopupForm {
  if (!popup) return emptyForm;

  return {
    title: popup.title ?? "",
    linkUrl: popup.linkUrl ?? "",
    isActive: popup.isActive,
    startsAt: toDateInput(popup.startsAt),
    endsAt: toDateInput(popup.endsAt)
  };
}

export default function AlertPopupPage() {
  const { data, loading, error, reload } = useApiData<AlertPopup[]>("/admin/alert-popups", true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AlertPopup | null>(null);
  const [form, setForm] = useState<AlertPopupForm>(emptyForm);
  const [image, setImage] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setImage(null);
    setActionError("");
    setOpen(true);
  }

  function openEdit(popup: AlertPopup) {
    setEditing(popup);
    setForm(toForm(popup));
    setImage(null);
    setActionError("");
    setOpen(true);
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    setImage(event.target.files?.[0] ?? null);
  }

  async function savePopup(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setActionError("");

    if (!editing && !image) {
      setActionError("Popup image is required.");
      setSaving(false);
      return;
    }

    const body = new FormData();
    if (form.title) body.append("title", form.title);
    if (form.linkUrl) body.append("linkUrl", form.linkUrl);
    body.append("isActive", String(form.isActive));
    if (form.startsAt) body.append("startsAt", form.startsAt);
    if (form.endsAt) body.append("endsAt", form.endsAt);
    if (image) body.append("image", image);

    try {
      await apiRequest(editing ? `/admin/alert-popups/${editing.id}` : "/admin/alert-popups", {
        method: editing ? "PATCH" : "POST",
        token: getStoredToken(),
        body
      });

      setOpen(false);
      setImage(null);
      reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to save alert popup.");
    } finally {
      setSaving(false);
    }
  }

  async function deletePopup(popup: AlertPopup) {
    if (!window.confirm(`Delete "${popup.title || "alert popup"}"?`)) return;

    try {
      await apiRequest(`/admin/alert-popups/${popup.id}`, {
        method: "DELETE",
        token: getStoredToken()
      });
      reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to delete alert popup.");
    }
  }

  return (
    <>
      <PageHeader
        title="Alert Popup"
        actions={<button className="btn btn-gold" onClick={openNew}><ImagePlus className="h-4 w-4" /> New Popup</button>}
      />

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState title="Alert popups could not be loaded" /> : null}
      {actionError ? <div className="mb-4"><ErrorState title="Action failed" message={actionError} /></div> : null}
      {!loading && !error && !data?.length ? (
        <EmptyState title="No alert popups found" />
      ) : null}

      {data?.length ? (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Schedule</th>
                  <th>Updated</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.map((popup) => (
                  <tr key={popup.id}>
                    <td>
                      <img
                        className="alert-popup-thumb"
                        src={getAssetUrl(popup.imageUrl)}
                        alt={popup.title || "Alert popup"}
                      />
                    </td>
                    <td>
                      <div className="t-name">{popup.title || "Untitled popup"}</div>
                      <div className="t-meta">{popup.linkUrl || "No link"}</div>
                    </td>
                    <td>
                      <span className={`badge ${popup.isActive ? "badge-green" : "badge-grey"}`}>
                        {popup.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className="t-meta">
                        {popup.startsAt ? `From ${formatDate(popup.startsAt)}` : "Starts anytime"}
                      </div>
                      <div className="t-meta">
                        {popup.endsAt ? `Until ${formatDate(popup.endsAt)}` : "No end date"}
                      </div>
                    </td>
                    <td>{formatDate(popup.updatedAt)}</td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <button className="btn btn-secondary" onClick={() => openEdit(popup)}>
                          <Edit className="h-4 w-4" /> Edit
                        </button>
                        <button className="btn btn-ghost text-red-700 hover:text-red-700" onClick={() => deletePopup(popup)}>
                          <Trash2 className="h-4 w-4" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {open ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <form className="modal-panel" onSubmit={savePopup}>
            <div className="modal-header">
              <div>
                <h2>{editing ? "Edit Alert Popup" : "New Alert Popup"}</h2>
              </div>
              <button type="button" className="icon-btn" onClick={() => setOpen(false)} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="form-grid">
              <label>
                Title
                <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
              </label>
              <label>
                Link URL
                <input value={form.linkUrl} onChange={(event) => setForm({ ...form, linkUrl: event.target.value })} placeholder="https://..." />
              </label>
              <label>
                Starts At
                <input value={form.startsAt} onChange={(event) => setForm({ ...form, startsAt: event.target.value })} type="date" />
              </label>
              <label>
                Ends At
                <input value={form.endsAt} onChange={(event) => setForm({ ...form, endsAt: event.target.value })} type="date" />
              </label>
              <label className="checkbox-row">
                <input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />
                Active
              </label>
              <label className="md:col-span-2">
                Popup Image
                <span className="file-input-row">
                  <Upload className="h-4 w-4" />
                  <input type="file" accept="image/*" onChange={handleImageChange} />
                </span>
                {image ? (
                  <span className="file-input-meta">{image.name}</span>
                ) : editing ? (
                  <span className="file-input-meta">Current image will be kept unless you choose a new one.</span>
                ) : null}
              </label>
            </div>

            {actionError ? <p className="form-error">{actionError}</p> : null}

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
              <button className="btn btn-gold" disabled={saving}>{saving ? "Saving..." : "Save Popup"}</button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
