"use client";

import { Plus, X } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/State";
import { apiRequest, getStoredToken } from "@/lib/api";
import { formatDateTime, money } from "@/lib/format";
import { getSourceBadgeClass, getSourceLabel, sourceOptions, sourceTypeOptions } from "@/lib/source";
import { useApiData } from "@/lib/useApiData";
import type { Booking, BookingStatus, SourceType, Tour } from "@/types/api";

type BookingForm = {
  tourId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  bookingDate: string;
  amount: string;
  currency: string;
  status: BookingStatus;
  notes: string;
  sourceType: SourceType | "";
  sourceName: string;
  sourceMedium: string;
  campaignName: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  referrerUrl: string;
  landingPage: string;
  sourceNote: string;
};

const emptyBooking: BookingForm = {
  tourId: "",
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  bookingDate: "",
  amount: "",
  currency: "USD",
  status: "PENDING",
  notes: "",
  sourceType: "MANUAL",
  sourceName: "Manual Admin Entry",
  sourceMedium: "",
  campaignName: "",
  utmSource: "",
  utmMedium: "",
  utmCampaign: "",
  referrerUrl: "",
  landingPage: "",
  sourceNote: ""
};

function nullable(value: string) {
  return value.trim() || null;
}

function payload(form: BookingForm) {
  return {
    tourId: form.tourId || null,
    customerName: form.customerName,
    customerEmail: nullable(form.customerEmail),
    customerPhone: nullable(form.customerPhone),
    bookingDate: form.bookingDate || null,
    amount: form.amount ? Number(form.amount) : null,
    currency: form.currency,
    status: form.status,
    notes: nullable(form.notes),
    sourceType: form.sourceType || null,
    sourceName: nullable(form.sourceName),
    sourceMedium: nullable(form.sourceMedium),
    campaignName: nullable(form.campaignName),
    utmSource: nullable(form.utmSource),
    utmMedium: nullable(form.utmMedium),
    utmCampaign: nullable(form.utmCampaign),
    referrerUrl: nullable(form.referrerUrl),
    landingPage: nullable(form.landingPage),
    sourceNote: nullable(form.sourceNote)
  };
}

function formFromBooking(booking: Booking): BookingForm {
  return {
    tourId: booking.tourId ?? "",
    customerName: booking.customerName,
    customerEmail: booking.customerEmail ?? "",
    customerPhone: booking.customerPhone ?? "",
    bookingDate: booking.bookingDate ? booking.bookingDate.slice(0, 10) : "",
    amount: booking.amount ? String(booking.amount) : "",
    currency: booking.currency,
    status: booking.status,
    notes: booking.notes ?? "",
    sourceType: booking.sourceType ?? "",
    sourceName: booking.sourceName ?? "",
    sourceMedium: booking.sourceMedium ?? "",
    campaignName: booking.campaignName ?? "",
    utmSource: booking.utmSource ?? "",
    utmMedium: booking.utmMedium ?? "",
    utmCampaign: booking.utmCampaign ?? "",
    referrerUrl: booking.referrerUrl ?? "",
    landingPage: booking.landingPage ?? "",
    sourceNote: booking.sourceNote ?? ""
  };
}

function applySourceOption(form: BookingForm, label: string): BookingForm {
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

export default function BookingsPage() {
  const { data, loading, error, reload } = useApiData<Booking[]>("/admin/bookings", true);
  const { data: tours } = useApiData<Tour[]>("/tours");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Booking | null>(null);
  const [form, setForm] = useState<BookingForm>(emptyBooking);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");

  const filteredBookings = useMemo(() => {
    if (!data) return [];
    if (sourceFilter === "ALL") return data;
    return data.filter((item) => getSourceLabel(item) === sourceFilter || item.sourceName === sourceFilter);
  }, [data, sourceFilter]);

  function openCreate() {
    setEditing(null);
    setForm(emptyBooking);
    setActionError("");
    setOpen(true);
  }

  function openEdit(booking: Booking) {
    setEditing(booking);
    setForm(formFromBooking(booking));
    setActionError("");
    setOpen(true);
  }

  async function saveBooking(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setActionError("");

    try {
      await apiRequest(editing ? `/admin/bookings/${editing.id}` : "/admin/bookings", {
        method: editing ? "PATCH" : "POST",
        token: getStoredToken(),
        body: JSON.stringify(payload(form))
      });
      setOpen(false);
      reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to save booking.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Bookings"
        description="Track confirmed and pending bookings, source attribution, and booking value."
        actions={<button className="btn btn-gold" onClick={openCreate}><Plus className="h-4 w-4" /> Manual Booking</button>}
      />

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState title="Bookings could not be loaded" message={error.message} /> : null}
      {actionError ? <div className="mb-4"><ErrorState title="Action failed" message={actionError} /></div> : null}

      {!loading && !error && data?.length ? (
        <div className="card mb-4">
          <div className="card-body flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="card-title">Source Filter</div>
              <div className="card-subtitle">Showing {filteredBookings.length} of {data.length} bookings</div>
            </div>
            <select className="admin-select" value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}>
              <option value="ALL">All Sources</option>
              {sourceOptions.map((option) => (
                <option value={option.sourceName} key={option.label}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
      ) : null}

      {!loading && !error && !data?.length ? (
        <EmptyState title="No bookings found" message="Manual bookings and booking inquiries will appear here." />
      ) : null}

      {!loading && !error && filteredBookings.length ? (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Tour</th>
                  <th>Amount</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>
                      <div className="t-name">{booking.customerName}</div>
                      <div className="t-meta">{booking.customerEmail || booking.customerPhone || booking.id}</div>
                    </td>
                    <td>{booking.tour?.title ?? "Custom booking"}</td>
                    <td>{money(booking.amount)}</td>
                    <td>
                      <span className={`badge ${getSourceBadgeClass(booking.sourceType)}`}>{getSourceLabel(booking)}</span>
                      {booking.campaignName || booking.utmCampaign ? <div className="t-meta">{booking.campaignName || booking.utmCampaign}</div> : null}
                    </td>
                    <td><span className="badge badge-blue">{booking.status}</span></td>
                    <td>{formatDateTime(booking.createdAt)}</td>
                    <td><button className="btn btn-secondary" onClick={() => openEdit(booking)}>Edit</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {open ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <form className="modal-panel" onSubmit={saveBooking}>
            <div className="modal-header">
              <div>
                <h2>{editing ? "Edit Booking" : "Manual Booking"}</h2>
                <p>Amount defaults from the selected tour price when left blank.</p>
              </div>
              <button type="button" className="icon-btn" onClick={() => setOpen(false)} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="form-grid">
              <label>
                Tour
                <select
                  value={form.tourId}
                  onChange={(event) => {
                    const tour = tours?.find((item) => item.id === event.target.value);
                    const tourAmount = tour?.priceFrom ?? tour?.price;
                    setForm({ ...form, tourId: event.target.value, amount: form.amount || (tourAmount ? String(tourAmount) : "") });
                  }}
                >
                  <option value="">Custom booking</option>
                  {tours?.map((tour) => (
                    <option value={tour.id} key={tour.id}>{tour.title}</option>
                  ))}
                </select>
              </label>
              <label>
                Status
                <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as BookingStatus })}>
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </label>
              <label>
                Customer Name
                <input value={form.customerName} onChange={(event) => setForm({ ...form, customerName: event.target.value })} required />
              </label>
              <label>
                Customer Email
                <input type="email" value={form.customerEmail} onChange={(event) => setForm({ ...form, customerEmail: event.target.value })} />
              </label>
              <label>
                Customer Phone
                <input value={form.customerPhone} onChange={(event) => setForm({ ...form, customerPhone: event.target.value })} />
              </label>
              <label>
                Booking Date
                <input type="date" value={form.bookingDate} onChange={(event) => setForm({ ...form, bookingDate: event.target.value })} />
              </label>
              <label>
                Amount
                <input type="number" min="0" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} />
              </label>
              <label>
                Currency
                <input value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value.toUpperCase().slice(0, 3) })} required />
              </label>
              <label>
                Source Preset
                <select value="" onChange={(event) => setForm(applySourceOption(form, event.target.value))}>
                  <option value="">Custom source</option>
                  {sourceOptions.map((option) => (
                    <option value={option.label} key={option.label}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label>
                Source Type
                <select value={form.sourceType} onChange={(event) => setForm({ ...form, sourceType: event.target.value as SourceType | "" })} required>
                  <option value="">Select source type</option>
                  {sourceTypeOptions.map((option) => (
                    <option value={option.value} key={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label>
                Source Name
                <input value={form.sourceName} onChange={(event) => setForm({ ...form, sourceName: event.target.value })} required />
              </label>
              <label>
                Campaign Name
                <input value={form.campaignName} onChange={(event) => setForm({ ...form, campaignName: event.target.value })} />
              </label>
              <label>
                UTM Source
                <input value={form.utmSource} onChange={(event) => setForm({ ...form, utmSource: event.target.value })} />
              </label>
              <label>
                UTM Medium
                <input value={form.utmMedium} onChange={(event) => setForm({ ...form, utmMedium: event.target.value })} />
              </label>
              <label>
                UTM Campaign
                <input value={form.utmCampaign} onChange={(event) => setForm({ ...form, utmCampaign: event.target.value })} />
              </label>
              <label>
                Referrer URL
                <input value={form.referrerUrl} onChange={(event) => setForm({ ...form, referrerUrl: event.target.value })} />
              </label>
              <label>
                Landing Page
                <input value={form.landingPage} onChange={(event) => setForm({ ...form, landingPage: event.target.value })} />
              </label>
              <label className="md:col-span-2">
                Notes
                <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} rows={3} />
              </label>
              <label className="md:col-span-2">
                Source Note
                <textarea value={form.sourceNote} onChange={(event) => setForm({ ...form, sourceNote: event.target.value })} rows={3} />
              </label>
            </div>
            {actionError ? <p className="form-error">{actionError}</p> : null}
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
              <button className="btn btn-gold" disabled={saving}>{saving ? "Saving..." : "Save Booking"}</button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
