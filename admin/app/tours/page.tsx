"use client";

import dynamic from "next/dynamic";
import { Edit, ImageIcon, Plus, Timer, Trash2, Upload, X } from "lucide-react";
import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import type { JoditEditorProps } from "jodit-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/State";
import { apiRequest, getAssetUrl, getStoredToken } from "@/lib/api";
import { formatDate, money } from "@/lib/format";
import { useApiData } from "@/lib/useApiData";
import type { Tour } from "@/types/api";

const JoditEditor = dynamic(() => import("jodit-react"), { ssr: false });

type TourForm = {
  title: string;
  slug: string;
  summary: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  priceFrom: string;
  duration: string;
  isPublished: boolean;
};

const emptyTour: TourForm = {
  title: "",
  slug: "",
  summary: "",
  content: "",
  metaTitle: "",
  metaDescription: "",
  priceFrom: "",
  duration: "",
  isPublished: true
};

function toForm(tour?: Tour): TourForm {
  if (!tour) return emptyTour;
  return {
    title: tour.title,
    slug: tour.slug,
    summary: tour.summary,
    content: tour.content ?? tour.description ?? "",
    metaTitle: tour.metaTitle ?? "",
    metaDescription: tour.metaDescription ?? "",
    priceFrom: tour.priceFrom || tour.price ? String(tour.priceFrom ?? tour.price) : "",
    duration: tour.duration ?? "",
    isPublished: tour.isPublished ?? true
  };
}

function getTourPrice(tour: Tour) {
  return tour.priceFrom ?? tour.price ?? null;
}

function getTextFromHtml(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function ToursPage() {
  const { data, loading, error, reload } = useApiData<Tour[]>("/tours");
  const [editing, setEditing] = useState<Tour | null>(null);
  const [form, setForm] = useState<TourForm>(emptyTour);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const editorConfig = useMemo<JoditEditorProps["config"]>(
    () => ({
      height: 380,
      placeholder: "Write the full tour content here...",
      toolbarAdaptive: false,
      toolbarSticky: false,
      askBeforePasteHTML: false,
      askBeforePasteFromWord: false,
      defaultActionOnPaste: "insert_clear_html" as const,
      buttons: [
        "bold",
        "italic",
        "underline",
        "strikethrough",
        "|",
        "ul",
        "ol",
        "outdent",
        "indent",
        "|",
        "paragraph",
        "fontsize",
        "brush",
        "|",
        "align",
        "link",
        "image",
        "table",
        "hr",
        "quote",
        "|",
        "undo",
        "redo",
        "eraser",
        "source",
        "fullsize"
      ],
      uploader: {
        insertImageAsBase64URI: true
      },
      removeButtons: ["about"]
    }),
    []
  );

  function openNew() {
    setEditing(null);
    setForm(emptyTour);
    setPhoto(null);
    setActionError("");
    setOpen(true);
  }

  function openEdit(tour: Tour) {
    setEditing(tour);
    setForm(toForm(tour));
    setPhoto(null);
    setActionError("");
    setOpen(true);
  }

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    setPhoto(event.target.files?.[0] ?? null);
  }

  async function saveTour(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setActionError("");

    if (getTextFromHtml(form.content).length < 10) {
      setActionError("Tour content must be at least 10 characters.");
      setSaving(false);
      return;
    }

    const body = new FormData();
    body.append("title", form.title);
    if (form.slug) body.append("slug", form.slug);
    body.append("summary", form.summary);
    body.append("content", form.content);
    body.append("metaTitle", form.metaTitle);
    body.append("metaDescription", form.metaDescription);
    if (form.priceFrom) body.append("priceFrom", form.priceFrom);
    if (form.duration) body.append("duration", form.duration);
    body.append("isPublished", String(form.isPublished));
    if (photo) body.append("photo", photo);

    try {
      await apiRequest(editing ? `/tours/${editing.slug}` : "/tours", {
        method: editing ? "PATCH" : "POST",
        token: getStoredToken(),
        body
      });
      setOpen(false);
      setPhoto(null);
      reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to save tour.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteTour(tour: Tour) {
    if (!window.confirm(`Delete "${tour.title}"?`)) return;

    try {
      await apiRequest(`/tours/${tour.slug}`, {
        method: "DELETE",
        token: getStoredToken()
      });
      reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to delete tour.");
    }
  }

  return (
    <>
      <PageHeader
        title="Tours"
        description="Create, update, publish, and remove helicopter tour packages."
        actions={<button className="btn btn-gold" onClick={openNew}><Plus className="h-4 w-4" /> New Tour</button>}
      />

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState title="Tours could not be loaded" message={error.message} /> : null}
      {actionError ? <div className="mb-4"><ErrorState title="Action failed" message={actionError} /></div> : null}
      {!loading && !error && !data?.length ? (
        <EmptyState title="No tours found" message="Create the first tour package to show it here." />
      ) : null}

      {data?.length ? (
        <div className="tours-grid">
          {data.map((tour) => {
            const isPublished = tour.isPublished ?? true;

            return (
              <article className="tour-card" key={tour.id}>
                <div className={`tour-card-banner ${tour.coverImageUrl ? "tour-card-banner-has-image" : ""}`}>
                  {tour.coverImageUrl ? (
                    <img
                      className="tour-card-image"
                      src={getAssetUrl(tour.coverImageUrl)}
                      alt=""
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  ) : null}
                  <div>
                    <div className="tour-name">{tour.title}</div>
                    <div className="mt-1 text-xs text-white/75">{tour.slug}</div>
                  </div>
                  <span className={`badge ${isPublished ? "badge-green" : "badge-grey"}`}>
                    {isPublished ? "Published" : "Draft"}
                  </span>
                </div>
                <div className="tour-body">
                  <p className="line-clamp-3 text-sm text-slate-600">{tour.summary}</p>
                  <div className="tour-stats">
                    <div>
                      <div className="tour-stat-label">Duration</div>
                      <div className="tour-stat-value flex items-center gap-1">
                        <Timer className="h-3.5 w-3.5" />
                        {tour.duration || "Not set"}
                      </div>
                    </div>
                    <div>
                      <div className="tour-stat-label">Price From</div>
                      <div className="tour-stat-value">{money(getTourPrice(tour))}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span>Updated {formatDate(tour.updatedAt)}</span>
                    <span className="flex items-center gap-1">
                      <ImageIcon className="h-3.5 w-3.5" />
                      {tour.coverImageUrl ? "Image attached" : "No image"}
                    </span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button className="btn btn-secondary" onClick={() => openEdit(tour)}>
                      <Edit className="h-4 w-4" /> Edit
                    </button>
                    <button className="btn btn-ghost text-red-700 hover:text-red-700" onClick={() => deleteTour(tour)}>
                      <Trash2 className="h-4 w-4" /> Delete
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}

      {open ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <form className="modal-panel" onSubmit={saveTour}>
            <div className="modal-header">
              <div>
                <h2>{editing ? "Edit Tour" : "New Tour"}</h2>
                <p>{editing ? "Update the selected tour package." : "Add a new tour package."}</p>
              </div>
              <button type="button" className="icon-btn" onClick={() => setOpen(false)} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="form-grid">
              <label>
                Title
                <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required minLength={5} />
              </label>
              <label>
                Slug
                <input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} placeholder="auto-generated if blank" />
              </label>
              <label>
                Price From
                <input value={form.priceFrom} onChange={(event) => setForm({ ...form, priceFrom: event.target.value })} type="number" min="1" />
              </label>
              <label>
                Duration
                <input value={form.duration} onChange={(event) => setForm({ ...form, duration: event.target.value })} placeholder="4.5 hrs" />
              </label>
              <label className="md:col-span-2">
                Summary
                <textarea value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} required minLength={10} maxLength={255} rows={3} />
              </label>
              <label>
                SEO Title
                <input value={form.metaTitle} onChange={(event) => setForm({ ...form, metaTitle: event.target.value })} />
              </label>
              <label>
                SEO Description
                <textarea value={form.metaDescription} onChange={(event) => setForm({ ...form, metaDescription: event.target.value })} maxLength={255} rows={3} />
              </label>
              <div className="md:col-span-2 rich-editor-field">
                <span className="rich-editor-label">Content</span>
                <JoditEditor
                  value={form.content}
                  config={editorConfig}
                  onBlur={(content) => setForm((current) => ({ ...current, content }))}
                  onChange={(content) => setForm((current) => ({ ...current, content }))}
                />
              </div>
              <label className="md:col-span-2">
                Cover Image
                <span className="file-input-row">
                  <Upload className="h-4 w-4" />
                  <input type="file" accept="image/*" onChange={handlePhotoChange} />
                </span>
                {photo ? (
                  <span className="file-input-meta">{photo.name}</span>
                ) : editing?.coverImageUrl ? (
                  <span className="file-input-meta">Current image will be kept unless you choose a new one.</span>
                ) : null}
              </label>
              <label className="checkbox-row md:col-span-2">
                <input type="checkbox" checked={form.isPublished} onChange={(event) => setForm({ ...form, isPublished: event.target.checked })} />
                Published
              </label>
            </div>

            {actionError ? <p className="form-error">{actionError}</p> : null}

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
              <button className="btn btn-gold" disabled={saving}>{saving ? "Saving..." : "Save Tour"}</button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
