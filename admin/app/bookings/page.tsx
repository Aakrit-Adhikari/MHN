"use client";

import { Plus, X } from "lucide-react";
import { FormEvent, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/State";
import { apiRequest, getStoredToken } from "@/lib/api";
import { formatDateTime, money } from "@/lib/format";
import { useApiData } from "@/lib/useApiData";
import type { Booking, BookingStatus, PaymentStatus, Tour } from "@/types/api";

type BookingForm = {
  tourId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  bookingDate: string;
  passengerCount: string;
  amount: string;
  currency: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
};

const emptyBooking: BookingForm = {
  tourId: "",
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  bookingDate: "",
  passengerCount: "",
  amount: "",
  currency: "USD",
  status: "PENDING",
  paymentStatus: "PENDING"
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
    passengerCount: form.passengerCount ? Number(form.passengerCount) : null,
    amount: form.amount ? Number(form.amount) : null,
    currency: form.currency,
    status: form.status,
    paymentStatus: form.paymentStatus
  };
}

function formFromBooking(booking: Booking): BookingForm {
  return {
    tourId: booking.tourId ?? "",
    customerName: booking.customerName,
    customerEmail: booking.customerEmail ?? "",
    customerPhone: booking.customerPhone ?? "",
    bookingDate: booking.bookingDate ? booking.bookingDate.slice(0, 10) : "",
    passengerCount: booking.passengerCount ? String(booking.passengerCount) : "",
    amount: booking.amount ? String(booking.amount) : "",
    currency: booking.currency,
    status: booking.status,
    paymentStatus: booking.paymentStatus ?? "PENDING"
  };
}

function paymentStatusLabel(status: PaymentStatus) {
  if (status === "PAID_IN_FULL") return "Paid in full";
  if (status === "UNPAID") return "Unpaid";
  return "Pending";
}

function paymentStatusBadgeClass(status: PaymentStatus) {
  if (status === "PAID_IN_FULL") return "badge-green";
  if (status === "UNPAID") return "badge-yellow";
  return "badge-grey";
}

export default function BookingsPage() {
  const { data, loading, error, reload } = useApiData<Booking[]>("/admin/bookings", true);
  const { data: tours } = useApiData<Tour[]>("/tours");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Booking | null>(null);
  const [form, setForm] = useState<BookingForm>(emptyBooking);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");

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
        description="Track confirmed and pending bookings, customers, tours, and booking value."
        actions={<button className="btn btn-gold" onClick={openCreate}><Plus className="h-4 w-4" /> Manual Booking</button>}
      />

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState title="Bookings could not be loaded" message={error.message} /> : null}
      {actionError ? <div className="mb-4"><ErrorState title="Action failed" message={actionError} /></div> : null}

      {!loading && !error && !data?.length ? (
        <EmptyState title="No bookings found" message="Manual bookings and booking inquiries will appear here." />
      ) : null}

      {!loading && !error && data?.length ? (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Tour</th>
                  <th>Passengers</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.map((booking) => (
                  <tr key={booking.id}>
                    <td>
                      <div className="t-name">{booking.customerName}</div>
                      <div className="t-meta">{booking.customerEmail || booking.customerPhone || booking.id}</div>
                    </td>
                    <td>{booking.tour?.title ?? "Custom booking"}</td>
                    <td>{booking.passengerCount ?? "Not set"}</td>
                    <td>{money(booking.amount)}</td>
                    <td><span className="badge badge-blue">{booking.status}</span></td>
                    <td><span className={`badge ${paymentStatusBadgeClass(booking.paymentStatus)}`}>{paymentStatusLabel(booking.paymentStatus)}</span></td>
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
                Payment Status
                <select value={form.paymentStatus} onChange={(event) => setForm({ ...form, paymentStatus: event.target.value as PaymentStatus })}>
                  <option value="PENDING">Pending</option>
                  <option value="UNPAID">Unpaid</option>
                  <option value="PAID_IN_FULL">Paid in full</option>
                </select>
              </label>
              <label>
                Number of Passengers
                <input
                  type="number"
                  min="0"
                  value={form.passengerCount}
                  onChange={(event) => setForm({ ...form, passengerCount: event.target.value })}
                />
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
