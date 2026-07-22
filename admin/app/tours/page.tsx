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
import type { DressGuideItem, FlightFeels, IncludedPermit, JourneyStep, Observance, PeakEncountered, QuickFacts, Tour, TourFaq, TourGalleryItem } from "@/types/api";

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
  quickFacts: QuickFacts;
  observances: Observance[];
  flightFeels: FlightFeels | null;
  journey: JourneyStep[];
  peaksEncountered: PeakEncountered[];
  includedPermits: IncludedPermit[];
  dressGuideItems: DressGuideItem[];
  faqs: TourFaq[];
  isPublished: boolean;
};

const quickFactFields: Array<{ key: keyof QuickFacts; label: string; placeholder: string }> = [
  { key: "duration", label: "Duration", placeholder: "e.g. 4–5 hours" },
  { key: "maxAltitude", label: "Max altitude", placeholder: "e.g. 5,545 m" },
  { key: "difficultyLevel", label: "Difficulty level", placeholder: "e.g. Easy" },
  { key: "privateCharterPrice", label: "Private charter price", placeholder: "e.g. USD 3,500" },
  { key: "hotelPickup", label: "Hotel pickup", placeholder: "e.g. Included" },
  { key: "tourFlightDuration", label: "Tour flight duration", placeholder: "e.g. 70 minutes" },
  { key: "minRecommendedAge", label: "Min. recommended age", placeholder: "e.g. 5 years" },
  { key: "idealTime", label: "Ideal time", placeholder: "e.g. Early morning" },
  { key: "travelInsurance", label: "Travel insurance", placeholder: "e.g. Recommended" },
  { key: "helicopterType", label: "Helicopter type", placeholder: "e.g. Airbus H125" },
  { key: "bestSeason", label: "Best season", placeholder: "e.g. Mar–May, Sep–Nov" },
  { key: "mealsIncluded", label: "Meals included", placeholder: "e.g. Breakfast" },
  { key: "helicopterCapacity", label: "Helicopter capacity", placeholder: "e.g. 5 passengers" },
  { key: "sharedTourPrice", label: "Shared tour price", placeholder: "e.g. USD 950/person" },
  { key: "permitsIncluded", label: "Permits included", placeholder: "e.g. All permits included" }
];

const emptyObservance = (): Observance => ({ topic: "", description: "" });
const emptyJourneyStep = (stepNo: number): JourneyStep => ({ stepNo, time: "", topic: "", summary: "" });
const emptyPeak = (): PeakEncountered => ({ peakName: "", rankLabel: "", elevation: "", description: "", tag: "" });
const emptyPermit = (): IncludedPermit => ({ permitName: "", departmentOrMunicipality: "", usdAmount: "", nepaliAmount: "", importantNotice: "" });
const emptyDressGuideItem = (): DressGuideItem => ({ layer: "", item: "", why: "" });
const emptyFaq = (): TourFaq => ({ question: "", answer: "" });

const emptyTour: TourForm = {
  title: "",
  slug: "",
  summary: "",
  content: "",
  metaTitle: "",
  metaDescription: "",
  priceFrom: "",
  duration: "",
  quickFacts: {},
  observances: [],
  flightFeels: null,
  journey: [],
  peaksEncountered: [],
  includedPermits: [],
  dressGuideItems: [],
  faqs: [],
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
    quickFacts: tour.quickFacts ?? {},
    observances: tour.observances ?? [],
    flightFeels: tour.flightFeels ?? null,
    journey: tour.journey ?? [],
    peaksEncountered: tour.peaksEncountered ?? [],
    includedPermits: tour.includedPermits ?? [],
    dressGuideItems: tour.dressGuideItems ?? [],
    faqs: tour.faqs ?? [],
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
  const [gallery, setGallery] = useState<TourGalleryItem[]>([]);
  const [galleryUploads, setGalleryUploads] = useState<Array<{ file: File | null; caption: string }>>([]);
  const [removedGalleryIds, setRemovedGalleryIds] = useState<string[]>([]);
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
    setGallery([]);
    setGalleryUploads([]);
    setRemovedGalleryIds([]);
    setActionError("");
    setOpen(true);
  }

  function openEdit(tour: Tour) {
    setEditing(tour);
    setForm(toForm(tour));
    setPhoto(null);
    setGallery(tour.gallery ?? []);
    setGalleryUploads([]);
    setRemovedGalleryIds([]);
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
    const quickFacts = Object.fromEntries(
      Object.entries(form.quickFacts).filter(([, value]) => value?.trim())
    );
    body.append("quickFacts", JSON.stringify(quickFacts));
    body.append("observances", JSON.stringify(
      form.observances.filter((observance) => observance.topic.trim() || observance.description.trim())
    ));
    if (form.flightFeels?.topic || form.flightFeels?.description || form.flightFeels?.tourMap) {
      body.append("flightFeels", JSON.stringify(form.flightFeels));
    }
    body.append("journey", JSON.stringify(form.journey.filter((item) => item.time.trim() || item.topic.trim() || item.summary.trim())));
    body.append("peaksEncountered", JSON.stringify(form.peaksEncountered.filter((item) => item.peakName.trim())));
    body.append("includedPermits", JSON.stringify(form.includedPermits.filter((item) => Object.values(item).some((value) => value.trim()))));
    body.append("isPublished", String(form.isPublished));
    if (photo) body.append("photo", photo);

    try {
      const savedTour = await apiRequest<Tour>(editing ? `/tours/${editing.slug}` : "/tours", {
        method: editing ? "PATCH" : "POST",
        token: getStoredToken(),
        body
      });
      const tourSlug = savedTour.data?.slug ?? editing?.slug;
      if (!tourSlug) throw new Error("Tour was saved but its slug could not be resolved.");

      await apiRequest(`/tours/${tourSlug}/dress-guide`, {
        method: "PUT",
        token: getStoredToken(),
        body: JSON.stringify({ items: form.dressGuideItems })
      });

      if (editing?.faqs?.length) {
        await Promise.all(editing.faqs.filter((faq) => faq.id).map((faq) => apiRequest(`/tours/${tourSlug}/faqs/${faq.id}`, {
          method: "DELETE",
          token: getStoredToken()
        })));
      }
      for (const faq of form.faqs) {
        await apiRequest(`/tours/${tourSlug}/faqs`, {
          method: "POST",
          token: getStoredToken(),
          body: JSON.stringify({ question: faq.question, answer: faq.answer })
        });
      }

      await Promise.all(removedGalleryIds.map((id) => apiRequest(`/tours/${tourSlug}/gallery/${id}`, {
        method: "DELETE",
        token: getStoredToken()
      })));
      for (const upload of galleryUploads) {
        if (!upload.file) continue;
        const galleryBody = new FormData();
        galleryBody.append("image", upload.file);
        if (upload.caption) galleryBody.append("caption", upload.caption);
        await apiRequest(`/tours/${tourSlug}/gallery`, { method: "POST", token: getStoredToken(), body: galleryBody });
      }
      setOpen(false);
      setPhoto(null);
      setGalleryUploads([]);
      setRemovedGalleryIds([]);
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
              <details className="md:col-span-2 quick-facts-dropdown">
                <summary>Quick Facts</summary>
                <p>Add only the facts that apply to this tour.</p>
                <div className="form-grid mt-3">
                  {quickFactFields.map(({ key, label, placeholder }) => (
                    <label key={key}>
                      {label}
                      <input
                        value={form.quickFacts[key] ?? ""}
                        onChange={(event) => setForm({
                          ...form,
                          quickFacts: { ...form.quickFacts, [key]: event.target.value }
                        })}
                        placeholder={placeholder}
                      />
                    </label>
                  ))}
                </div>
              </details>
              <details className="md:col-span-2 quick-facts-dropdown">
                <summary>Observance</summary>
                <p>Add the tour highlights visitors will observe during this experience.</p>
                <div className="mt-3 space-y-3">
                  {form.observances.map((observance, index) => (
                    <div className="observance-row" key={index}>
                      <label>
                        Topic
                        <input
                          value={observance.topic}
                          onChange={(event) => setForm({
                            ...form,
                            observances: form.observances.map((item, itemIndex) => itemIndex === index
                              ? { ...item, topic: event.target.value }
                              : item)
                          })}
                          placeholder="e.g. Everest Base Camp Flyover"
                          required
                        />
                      </label>
                      <label>
                        Description
                        <textarea
                          value={observance.description}
                          onChange={(event) => setForm({
                            ...form,
                            observances: form.observances.map((item, itemIndex) => itemIndex === index
                              ? { ...item, description: event.target.value }
                              : item)
                          })}
                          placeholder="Describe what visitors will see or experience."
                          rows={2}
                          required
                        />
                      </label>
                      <button
                        type="button"
                        className="icon-btn observance-remove"
                        onClick={() => setForm({ ...form, observances: form.observances.filter((_, itemIndex) => itemIndex !== index) })}
                        aria-label={`Remove observance ${index + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button type="button" className="btn btn-secondary" onClick={() => setForm({ ...form, observances: [...form.observances, emptyObservance()] })}>
                    <Plus className="h-4 w-4" /> Add Observance
                  </button>
                </div>
              </details>
              <details className="md:col-span-2 quick-facts-dropdown">
                <summary>Flight Feels</summary>
                <p>Add the primary flight experience and an optional tour-map link.</p>
                <div className="mt-3 space-y-3">
                  <label>
                    Topic
                    <input
                      value={form.flightFeels?.topic ?? ""}
                      onChange={(event) => setForm({ ...form, flightFeels: { ...(form.flightFeels ?? { description: "", tourMap: "" }), topic: event.target.value } })}
                      placeholder="e.g. A front-row Himalayan experience"
                    />
                  </label>
                  <label>
                    Tour Map URL
                    <input
                      type="url"
                      value={form.flightFeels?.tourMap ?? ""}
                      onChange={(event) => setForm({ ...form, flightFeels: { ...(form.flightFeels ?? { topic: "", description: "" }), tourMap: event.target.value } })}
                      placeholder="https://..."
                    />
                  </label>
                  <div className="rich-editor-field">
                    <span className="rich-editor-label">Description</span>
                    <JoditEditor
                      value={form.flightFeels?.description ?? ""}
                      config={{ ...editorConfig, height: 220 }}
                      onBlur={(description) => setForm({ ...form, flightFeels: { ...(form.flightFeels ?? { topic: "", tourMap: "" }), description } })}
                    />
                  </div>
                </div>
              </details>
              <details className="md:col-span-2 quick-facts-dropdown">
                <summary>Journey</summary>
                <p>Add the tour journey steps in the order visitors experience them.</p>
                <div className="mt-3 space-y-3">
                  {form.journey.map((step, index) => (
                    <div className="tour-repeatable-row" key={index}>
                      <label>
                        Step No.
                        <input type="number" min="1" value={step.stepNo} onChange={(event) => setForm({ ...form, journey: form.journey.map((item, itemIndex) => itemIndex === index ? { ...item, stepNo: Number(event.target.value) } : item) })} required />
                      </label>
                      <label>
                        Time
                        <input value={step.time} onChange={(event) => setForm({ ...form, journey: form.journey.map((item, itemIndex) => itemIndex === index ? { ...item, time: event.target.value } : item) })} placeholder="e.g. 06:30 AM" required />
                      </label>
                      <label>
                        Topic
                        <input value={step.topic} onChange={(event) => setForm({ ...form, journey: form.journey.map((item, itemIndex) => itemIndex === index ? { ...item, topic: event.target.value } : item) })} placeholder="e.g. Hotel pickup" required />
                      </label>
                      <label>
                        Summary
                        <textarea value={step.summary} onChange={(event) => setForm({ ...form, journey: form.journey.map((item, itemIndex) => itemIndex === index ? { ...item, summary: event.target.value } : item) })} rows={2} required />
                      </label>
                      <button type="button" className="icon-btn observance-remove" onClick={() => setForm({ ...form, journey: form.journey.filter((_, itemIndex) => itemIndex !== index) })} aria-label={`Remove journey step ${index + 1}`}><Trash2 className="h-4 w-4" /></button>
                    </div>
                  ))}
                  <button type="button" className="btn btn-secondary" onClick={() => setForm({ ...form, journey: [...form.journey, emptyJourneyStep(form.journey.length + 1)] })}><Plus className="h-4 w-4" /> Add Journey Step</button>
                </div>
              </details>
              <details className="md:col-span-2 quick-facts-dropdown">
                <summary>Peaks Encountered</summary>
                <p>Add every peak featured during the tour, matching the peak-card layout.</p>
                <div className="mt-3 space-y-3">
                  {form.peaksEncountered.map((peak, index) => (
                    <div className="tour-repeatable-row" key={index}>
                      <label>
                        Rank Label
                        <input value={peak.rankLabel} onChange={(event) => setForm({ ...form, peaksEncountered: form.peaksEncountered.map((item, itemIndex) => itemIndex === index ? { ...item, rankLabel: event.target.value } : item) })} placeholder="e.g. World's highest" required />
                      </label>
                      <label>
                        Peak Name
                        <input value={peak.peakName} onChange={(event) => setForm({ ...form, peaksEncountered: form.peaksEncountered.map((item, itemIndex) => itemIndex === index ? { ...item, peakName: event.target.value } : item) })} placeholder="e.g. Mount Everest" required />
                      </label>
                      <label>
                        Elevation
                        <input value={peak.elevation} onChange={(event) => setForm({ ...form, peaksEncountered: form.peaksEncountered.map((item, itemIndex) => itemIndex === index ? { ...item, elevation: event.target.value } : item) })} placeholder="e.g. 8,848 m / 29,032 ft" required />
                      </label>
                      <label>
                        Description
                        <textarea value={peak.description} onChange={(event) => setForm({ ...form, peaksEncountered: form.peaksEncountered.map((item, itemIndex) => itemIndex === index ? { ...item, description: event.target.value } : item) })} rows={2} required />
                      </label>
                      <label>
                        Tag (optional)
                        <input value={peak.tag ?? ""} onChange={(event) => setForm({ ...form, peaksEncountered: form.peaksEncountered.map((item, itemIndex) => itemIndex === index ? { ...item, tag: event.target.value } : item) })} placeholder="e.g. EBC flyover" />
                      </label>
                      <button type="button" className="icon-btn observance-remove" onClick={() => setForm({ ...form, peaksEncountered: form.peaksEncountered.filter((_, itemIndex) => itemIndex !== index) })} aria-label={`Remove peak ${index + 1}`}><Trash2 className="h-4 w-4" /></button>
                    </div>
                  ))}
                  <button type="button" className="btn btn-secondary" onClick={() => setForm({ ...form, peaksEncountered: [...form.peaksEncountered, emptyPeak()] })}><Plus className="h-4 w-4" /> Add Peak</button>
                </div>
              </details>
              <details className="md:col-span-2 quick-facts-dropdown">
                <summary>Dress Guide</summary>
                <p>Add the layers visitors should wear, including the item and why it is important.</p>
                <div className="mt-3 space-y-3">
                  {form.dressGuideItems.map((guideItem, index) => (
                    <div className="tour-repeatable-row" key={guideItem.id ?? index}>
                      <label>
                        Layer
                        <input value={guideItem.layer} onChange={(event) => setForm({ ...form, dressGuideItems: form.dressGuideItems.map((item, itemIndex) => itemIndex === index ? { ...item, layer: event.target.value } : item) })} placeholder="e.g. Base layer" required />
                      </label>
                      <label>
                        Item
                        <input value={guideItem.item} onChange={(event) => setForm({ ...form, dressGuideItems: form.dressGuideItems.map((item, itemIndex) => itemIndex === index ? { ...item, item: event.target.value } : item) })} placeholder="e.g. Thermal top and bottom" required />
                      </label>
                      <label>
                        Why
                        <textarea value={guideItem.why} onChange={(event) => setForm({ ...form, dressGuideItems: form.dressGuideItems.map((item, itemIndex) => itemIndex === index ? { ...item, why: event.target.value } : item) })} rows={2} required />
                      </label>
                      <button type="button" className="icon-btn observance-remove" onClick={() => setForm({ ...form, dressGuideItems: form.dressGuideItems.filter((_, itemIndex) => itemIndex !== index) })} aria-label={`Remove dress guide item ${index + 1}`}><Trash2 className="h-4 w-4" /></button>
                    </div>
                  ))}
                  <button type="button" className="btn btn-secondary" onClick={() => setForm({ ...form, dressGuideItems: [...form.dressGuideItems, emptyDressGuideItem()] })}><Plus className="h-4 w-4" /> Add Dress Guide Item</button>
                </div>
              </details>
              <details className="md:col-span-2 quick-facts-dropdown">
                <summary>Included Permits</summary>
                <p>Add each permit included in this tour’s price.</p>
                <div className="mt-3 space-y-3">
                  {form.includedPermits.map((permit, index) => (
                    <div className="tour-repeatable-row" key={index}>
                      <label>
                        Permit Name
                        <input value={permit.permitName} onChange={(event) => setForm({ ...form, includedPermits: form.includedPermits.map((item, itemIndex) => itemIndex === index ? { ...item, permitName: event.target.value } : item) })} required />
                      </label>
                      <label>
                        Department / Municipality
                        <input value={permit.departmentOrMunicipality} onChange={(event) => setForm({ ...form, includedPermits: form.includedPermits.map((item, itemIndex) => itemIndex === index ? { ...item, departmentOrMunicipality: event.target.value } : item) })} required />
                      </label>
                      <label>
                        USD Amount
                        <input value={permit.usdAmount} onChange={(event) => setForm({ ...form, includedPermits: form.includedPermits.map((item, itemIndex) => itemIndex === index ? { ...item, usdAmount: event.target.value } : item) })} placeholder="e.g. USD 50" required />
                      </label>
                      <label>
                        Nepali Amount
                        <input value={permit.nepaliAmount} onChange={(event) => setForm({ ...form, includedPermits: form.includedPermits.map((item, itemIndex) => itemIndex === index ? { ...item, nepaliAmount: event.target.value } : item) })} placeholder="e.g. NPR 6,500" required />
                      </label>
                      <label>
                        Important Notice
                        <textarea value={permit.importantNotice} onChange={(event) => setForm({ ...form, includedPermits: form.includedPermits.map((item, itemIndex) => itemIndex === index ? { ...item, importantNotice: event.target.value } : item) })} rows={2} required />
                      </label>
                      <button type="button" className="icon-btn observance-remove" onClick={() => setForm({ ...form, includedPermits: form.includedPermits.filter((_, itemIndex) => itemIndex !== index) })} aria-label={`Remove permit ${index + 1}`}><Trash2 className="h-4 w-4" /></button>
                    </div>
                  ))}
                  <button type="button" className="btn btn-secondary" onClick={() => setForm({ ...form, includedPermits: [...form.includedPermits, emptyPermit()] })}><Plus className="h-4 w-4" /> Add Permit</button>
                </div>
              </details>
              <details className="md:col-span-2 quick-facts-dropdown">
                <summary>Gallery</summary>
                <p><strong>Maximum 9 images can be stored.</strong> {gallery.length + galleryUploads.length} of 9 image slots used.</p>
                <div className="mt-3 space-y-3">
                  {gallery.map((item) => (
                    <div className="tour-repeatable-row" key={item.id}>
                      <img className="gallery-admin-preview" src={getAssetUrl(item.imageUrl)} alt={item.caption ?? "Gallery image"} />
                      <span>{item.caption || "Gallery image"}</span>
                      <button type="button" className="icon-btn observance-remove" onClick={() => {
                        setGallery(gallery.filter((galleryItem) => galleryItem.id !== item.id));
                        setRemovedGalleryIds([...removedGalleryIds, item.id]);
                      }} aria-label="Remove gallery image"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  ))}
                  {galleryUploads.map((upload, index) => (
                    <div className="tour-repeatable-row" key={index}>
                      <label>
                        Image
                        <input type="file" accept="image/*" onChange={(event) => setGalleryUploads(galleryUploads.map((item, itemIndex) => itemIndex === index ? { ...item, file: event.target.files?.[0] ?? null } : item))} required />
                      </label>
                      <label>
                        Caption (optional)
                        <input value={upload.caption} onChange={(event) => setGalleryUploads(galleryUploads.map((item, itemIndex) => itemIndex === index ? { ...item, caption: event.target.value } : item))} />
                      </label>
                      <button type="button" className="icon-btn observance-remove" onClick={() => setGalleryUploads(galleryUploads.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove new gallery image ${index + 1}`}><Trash2 className="h-4 w-4" /></button>
                    </div>
                  ))}
                  <button type="button" className="btn btn-secondary" disabled={gallery.length + galleryUploads.length >= 9} onClick={() => setGalleryUploads([...galleryUploads, { file: null, caption: "" }])}><Plus className="h-4 w-4" /> Add Gallery Image</button>
                </div>
              </details>
              <details className="md:col-span-2 quick-facts-dropdown">
                <summary>FAQs</summary>
                <p>Add as many frequently asked questions as this tour needs.</p>
                <div className="mt-3 space-y-3">
                  {form.faqs.map((faq, index) => (
                    <div className="tour-repeatable-row" key={faq.id ?? index}>
                      <label>
                        Question
                        <input value={faq.question} onChange={(event) => setForm({ ...form, faqs: form.faqs.map((item, itemIndex) => itemIndex === index ? { ...item, question: event.target.value } : item) })} required />
                      </label>
                      <label>
                        Answer
                        <textarea value={faq.answer} onChange={(event) => setForm({ ...form, faqs: form.faqs.map((item, itemIndex) => itemIndex === index ? { ...item, answer: event.target.value } : item) })} rows={3} required />
                      </label>
                      <button type="button" className="icon-btn observance-remove" onClick={() => setForm({ ...form, faqs: form.faqs.filter((_, itemIndex) => itemIndex !== index) })} aria-label={`Remove FAQ ${index + 1}`}><Trash2 className="h-4 w-4" /></button>
                    </div>
                  ))}
                  <button type="button" className="btn btn-secondary" onClick={() => setForm({ ...form, faqs: [...form.faqs, emptyFaq()] })}><Plus className="h-4 w-4" /> Add FAQ</button>
                </div>
              </details>
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
