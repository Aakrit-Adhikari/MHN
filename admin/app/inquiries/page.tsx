"use client";

import { Mail, Phone, Plus, Trash2, X } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/State";
import { apiRequest, getStoredToken } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { getSourceBadgeClass, getSourceLabel, sourceOptions, sourceTypeOptions } from "@/lib/source";
import { useApiData } from "@/lib/useApiData";
import type { Inquiry, SourceType, Tour } from "@/types/api";

type InquiryForm = {
  type: "BOOKING" | "CHARTER" | "CONTACT";
  name: string;
  email: string;
  phone: string;
  message: string;
  locale: string;
  tourId: string;
  sourceType: SourceType | "";
  sourceName: string;
  sourceMedium: string;
  campaignName: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm: string;
  utmContent: string;
  referrerUrl: string;
  landingPage: string;
  sourceNote: string;
};

type SourceForm = Pick<
  InquiryForm,
  | "sourceType"
  | "sourceName"
  | "sourceMedium"
  | "campaignName"
  | "utmSource"
  | "utmMedium"
  | "utmCampaign"
  | "utmTerm"
  | "utmContent"
  | "referrerUrl"
  | "landingPage"
  | "sourceNote"
>;

const emptySource: SourceForm = {
  sourceType: "MANUAL",
  sourceName: "Manual Admin Entry",
  sourceMedium: "",
  campaignName: "",
  utmSource: "",
  utmMedium: "",
  utmCampaign: "",
  utmTerm: "",
  utmContent: "",
  referrerUrl: "",
  landingPage: "",
  sourceNote: ""
};

const emptyInquiry: InquiryForm = {
  type: "CONTACT",
  name: "",
  email: "",
  phone: "",
  message: "",
  locale: "en",
  tourId: "",
  ...emptySource
};

function nullable(value: string) {
  return value.trim() || null;
}

function sourcePayload(form: SourceForm) {
  return {
    sourceType: form.sourceType || null,
    sourceName: nullable(form.sourceName),
    sourceMedium: nullable(form.sourceMedium),
    campaignName: nullable(form.campaignName),
    utmSource: nullable(form.utmSource),
    utmMedium: nullable(form.utmMedium),
    utmCampaign: nullable(form.utmCampaign),
    utmTerm: nullable(form.utmTerm),
    utmContent: nullable(form.utmContent),
    referrerUrl: nullable(form.referrerUrl),
    landingPage: nullable(form.landingPage),
    sourceNote: nullable(form.sourceNote)
  };
}

function formFromInquiry(item: Inquiry): SourceForm {
  return {
    sourceType: item.sourceType ?? "",
    sourceName: item.sourceName ?? "",
    sourceMedium: item.sourceMedium ?? "",
    campaignName: item.campaignName ?? "",
    utmSource: item.utmSource ?? "",
    utmMedium: item.utmMedium ?? "",
    utmCampaign: item.utmCampaign ?? "",
    utmTerm: item.utmTerm ?? "",
    utmContent: item.utmContent ?? "",
    referrerUrl: item.referrerUrl ?? "",
    landingPage: item.landingPage ?? "",
    sourceNote: item.sourceNote ?? ""
  };
}

function applySourceOption<T extends SourceForm>(form: T, label: string): T {
  const option = sourceOptions.find((item) => item.label === label);
  if (!option) return form;

  return {
    ...form,
    sourceType: option.sourceType,
    sourceName: option.sourceName,
    sourceMedium: option.sourceMedium ?? "",
    utmSource: option.utmSource ?? form.utmSource,
    utmMedium: option.utmMedium ?? form.utmMedium
  };
}

function inquiryType(item: Inquiry) {
  return item.inquiryType ?? item.type ?? "CONTACT";
}

function SourceFields({
  form,
  onChange
}: {
  form: SourceForm;
  onChange: (form: SourceForm) => void;
}) {
  const selectedLabel = sourceOptions.find(
    (option) => option.sourceType === form.sourceType && option.sourceName === form.sourceName
  )?.label ?? "";

  return (
    <>
      <label>
        Source Preset
        <select value={selectedLabel} onChange={(event) => onChange(applySourceOption(form, event.target.value))}>
          <option value="">Custom source</option>
          {sourceOptions.map((option) => (
            <option value={option.label} key={option.label}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Source Type
        <select value={form.sourceType} onChange={(event) => onChange({ ...form, sourceType: event.target.value as SourceType | "" })} required>
          <option value="">Select source type</option>
          {sourceTypeOptions.map((option) => (
            <option value={option.value} key={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Source Name
        <input value={form.sourceName} onChange={(event) => onChange({ ...form, sourceName: event.target.value })} required />
      </label>
      <label>
        Source Medium
        <input value={form.sourceMedium} onChange={(event) => onChange({ ...form, sourceMedium: event.target.value })} placeholder="paid_social" />
      </label>
      <label>
        Campaign Name
        <input value={form.campaignName} onChange={(event) => onChange({ ...form, campaignName: event.target.value })} />
      </label>
      <label>
        UTM Source
        <input value={form.utmSource} onChange={(event) => onChange({ ...form, utmSource: event.target.value })} />
      </label>
      <label>
        UTM Medium
        <input value={form.utmMedium} onChange={(event) => onChange({ ...form, utmMedium: event.target.value })} />
      </label>
      <label>
        UTM Campaign
        <input value={form.utmCampaign} onChange={(event) => onChange({ ...form, utmCampaign: event.target.value })} />
      </label>
      <label>
        UTM Term
        <input value={form.utmTerm} onChange={(event) => onChange({ ...form, utmTerm: event.target.value })} />
      </label>
      <label>
        UTM Content
        <input value={form.utmContent} onChange={(event) => onChange({ ...form, utmContent: event.target.value })} />
      </label>
      <label>
        Referrer URL
        <input value={form.referrerUrl} onChange={(event) => onChange({ ...form, referrerUrl: event.target.value })} />
      </label>
      <label>
        Landing Page
        <input value={form.landingPage} onChange={(event) => onChange({ ...form, landingPage: event.target.value })} />
      </label>
      <label className="md:col-span-2">
        Source Note
        <textarea value={form.sourceNote} onChange={(event) => onChange({ ...form, sourceNote: event.target.value })} rows={3} />
      </label>
    </>
  );
}

export default function InquiriesPage() {
  const { data, loading, error, reload } = useApiData<Inquiry[]>("/inquiries", true);
  const { data: tours, loading: toursLoading, error: toursError } = useApiData<Tour[]>("/tours");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Inquiry | null>(null);
  const [sourceEditing, setSourceEditing] = useState<Inquiry | null>(null);
  const [sourceForm, setSourceForm] = useState<SourceForm>(emptySource);
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [form, setForm] = useState<InquiryForm>(emptyInquiry);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");

  const filteredInquiries = useMemo(() => {
    if (!data) return [];
    if (sourceFilter === "ALL") return data;
    return data.filter((item) => getSourceLabel(item) === sourceFilter);
  }, [data, sourceFilter]);

  async function createInquiry(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setActionError("");

    try {
      await apiRequest("/inquiries", {
        method: "POST",
        body: JSON.stringify({
          type: form.type,
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          message: form.message,
          locale: form.locale,
          tourId: form.type === "BOOKING" ? form.tourId : undefined,
          ...sourcePayload(form)
        })
      });
      setOpen(false);
      setForm(emptyInquiry);
      reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to create inquiry.");
    } finally {
      setSaving(false);
    }
  }

  function openSourceEditor(item: Inquiry) {
    setSelected(null);
    setSourceEditing(item);
    setSourceForm(formFromInquiry(item));
    setActionError("");
  }

  async function updateSource(event: FormEvent) {
    event.preventDefault();
    if (!sourceEditing) return;

    setSaving(true);
    setActionError("");

    try {
      await apiRequest(`/inquiries/${sourceEditing.id}`, {
        method: "PATCH",
        token: getStoredToken(),
        body: JSON.stringify(sourcePayload(sourceForm))
      });
      setSourceEditing(null);
      reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to update source.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteInquiry(item: Inquiry) {
    if (!window.confirm(`Delete inquiry from ${item.name}?`)) return;

    try {
      await apiRequest(`/inquiries/${item.id}`, {
        method: "DELETE",
        token: getStoredToken()
      });
      reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to delete inquiry.");
    }
  }

  return (
    <>
      <PageHeader
        title="Inquiries"
        description="Review customer inquiries and add manual requests from phone or walk-in leads."
        actions={<button className="btn btn-gold" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Manual Inquiry</button>}
      />

      {loading ? <LoadingState /> : null}
      {error ? (
        <ErrorState
          title="Inquiries could not be loaded"
          message={`${error.message}. Make sure you are logged in with an ADMIN backend user.`}
        />
      ) : null}
      {actionError ? <div className="mb-4"><ErrorState title="Action failed" message={actionError} /></div> : null}

      {!loading && !error && data?.length ? (
        <div className="card mb-4">
          <div className="card-body flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="card-title">Source Filter</div>
              <div className="card-subtitle">Showing {filteredInquiries.length} of {data.length} inquiries</div>
            </div>
            <select className="admin-select" value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}>
              <option value="ALL">All Sources</option>
              {sourceOptions.map((option) => (
                <option value={option.sourceName} key={option.label}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : null}

      {!loading && !error && !data?.length ? (
        <EmptyState title="No inquiries found" message="New customer inquiries will appear here." />
      ) : null}
      {!loading && !error && data?.length && !filteredInquiries.length ? (
        <EmptyState title="No matching inquiries" message="Try another source filter." />
      ) : null}

      {filteredInquiries.map((item) => (
        <article className="inquiry-card" key={item.id}>
          <div>
            <span className="t-id">{item.id}</span>
            <div className="inquiry-title">{item.name}</div>
            <div className="inquiry-details">
              <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {item.email}</span>
              <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {item.phone || "No phone"}</span>
              <span>{formatDateTime(item.createdAt)}</span>
              <span>Locale: {item.locale}</span>
            </div>
            <div className="inquiry-message">{item.message}</div>
            <div className="source-row">
              <span className={`badge ${getSourceBadgeClass(item.sourceType)}`}>{getSourceLabel(item)}</span>
              {item.campaignName || item.utmCampaign ? <span>Campaign: {item.campaignName || item.utmCampaign}</span> : null}
              {item.sourceMedium || item.utmMedium ? <span>Medium: {item.sourceMedium || item.utmMedium}</span> : null}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={inquiryType(item) === "BOOKING" ? "badge badge-green" : inquiryType(item) === "CHARTER" ? "badge badge-gold" : "badge badge-blue"}>
              {inquiryType(item)}
            </span>
            <button className="btn btn-secondary" onClick={() => setSelected(item)}>View</button>
            <button className="btn btn-secondary" onClick={() => openSourceEditor(item)}>Edit Source</button>
            <button className="btn btn-ghost text-red-700 hover:text-red-700" onClick={() => deleteInquiry(item)}>
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          </div>
        </article>
      ))}

      {open ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <form className="modal-panel" onSubmit={createInquiry}>
            <div className="modal-header">
              <div>
                <h2>Manual Inquiry</h2>
                <p>Add a customer request received outside the website form.</p>
              </div>
              <button type="button" className="icon-btn" onClick={() => setOpen(false)} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="form-grid">
              <label>
                Type
                <select
                  value={form.type}
                  onChange={(event) => {
                    const type = event.target.value as InquiryForm["type"];
                    setForm({ ...form, type, tourId: type === "BOOKING" ? form.tourId : "" });
                  }}
                >
                  <option value="CONTACT">Contact</option>
                  <option value="BOOKING">Booking</option>
                  <option value="CHARTER">Charter</option>
                </select>
              </label>
              {form.type === "BOOKING" ? (
                <label>
                  Tour
                  <select
                    value={form.tourId}
                    onChange={(event) => setForm({ ...form, tourId: event.target.value })}
                    disabled={toursLoading || Boolean(toursError)}
                  >
                    <option value="">{toursLoading ? "Loading tours..." : "No tour / custom booking"}</option>
                    {tours?.map((tour) => (
                      <option value={tour.id} key={tour.id}>
                        {tour.title}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <label>
                  Locale
                  <input value={form.locale} onChange={(event) => setForm({ ...form, locale: event.target.value })} required />
                </label>
              )}
              {form.type === "BOOKING" ? (
                <label className="md:col-span-2">
                  Locale
                  <input value={form.locale} onChange={(event) => setForm({ ...form, locale: event.target.value })} required />
                </label>
              ) : null}
              <label>
                Name
                <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
              </label>
              <label>
                Email
                <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
              </label>
              <label className="md:col-span-2">
                Phone
                <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
              </label>
              <label className="md:col-span-2">
                Message
                <textarea value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} required rows={6} />
              </label>
              <div className="form-section-title md:col-span-2">Source Tracking</div>
              <SourceFields form={form} onChange={(nextForm) => setForm({ ...form, ...nextForm })} />
            </div>

            {actionError ? <p className="form-error">{actionError}</p> : null}

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
              <button className="btn btn-gold" disabled={saving}>{saving ? "Saving..." : "Save Inquiry"}</button>
            </div>
          </form>
        </div>
      ) : null}

      {sourceEditing ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <form className="modal-panel" onSubmit={updateSource}>
            <div className="modal-header">
              <div>
                <h2>Edit Source</h2>
                <p>{sourceEditing.name} · {inquiryType(sourceEditing)}</p>
              </div>
              <button type="button" className="icon-btn" onClick={() => setSourceEditing(null)} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="form-grid">
              <SourceFields form={sourceForm} onChange={setSourceForm} />
            </div>
            {actionError ? <p className="form-error">{actionError}</p> : null}
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setSourceEditing(null)}>Cancel</button>
              <button className="btn btn-gold" disabled={saving}>{saving ? "Saving..." : "Update Source"}</button>
            </div>
          </form>
        </div>
      ) : null}

      {selected ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-panel">
            <div className="modal-header">
              <div>
                <h2>{selected.name}</h2>
                <p>{inquiryType(selected)} inquiry submitted {formatDateTime(selected.createdAt)}</p>
              </div>
              <button type="button" className="icon-btn" onClick={() => setSelected(null)} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 text-sm text-slate-700 p-5">
              <p><strong>Email:</strong> {selected.email}</p>
              <p><strong>Phone:</strong> {selected.phone || "No phone"}</p>
              <p><strong>Locale:</strong> {selected.locale}</p>
              <div className="source-detail-grid">
                <p><strong>Source:</strong> {getSourceLabel(selected)}</p>
                <p><strong>Type:</strong> {selected.sourceType || "Not set"}</p>
                <p><strong>Campaign:</strong> {selected.campaignName || selected.utmCampaign || "Not set"}</p>
                <p><strong>Medium:</strong> {selected.sourceMedium || selected.utmMedium || "Not set"}</p>
                <p><strong>Referrer:</strong> {selected.referrerUrl || "Not set"}</p>
                <p><strong>Landing Page:</strong> {selected.landingPage || "Not set"}</p>
              </div>
              {selected.sourceNote ? <p><strong>Source Note:</strong> {selected.sourceNote}</p> : null}
              <p><strong>Message:</strong></p>
              <div className="inquiry-message">{selected.message}</div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => openSourceEditor(selected)}>Edit Source</button>
              <button className="btn btn-secondary" onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
