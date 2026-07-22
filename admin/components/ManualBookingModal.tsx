"use client";

import { X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { apiRequest, getStoredToken } from "@/lib/api";
import type { BookingStatus, CalendarTourOption, PaymentStatus } from "@/types/api";

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

function emptyBooking(bookingDate: string): BookingForm {
  return {
    tourId: "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    bookingDate,
    passengerCount: "",
    amount: "",
    currency: "USD",
    status: "PENDING",
    paymentStatus: "PENDING"
  };
}

function nullable(value: string) {
  return value.trim() || null;
}

export function ManualBookingModal({
  open,
  initialDate,
  tours,
  onClose,
  onSaved
}: {
  open: boolean;
  initialDate: string;
  tours: CalendarTourOption[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<BookingForm>(() => emptyBooking(initialDate));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm(emptyBooking(initialDate));
    setError("");
  }, [initialDate, open]);

  if (!open) return null;

  async function saveBooking(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await apiRequest("/admin/bookings", {
        method: "POST",
        token: getStoredToken(),
        body: JSON.stringify({
          tourId: form.tourId || null,
          customerName: form.customerName.trim(),
          customerEmail: nullable(form.customerEmail),
          customerPhone: nullable(form.customerPhone),
          bookingDate: form.bookingDate,
          passengerCount: form.passengerCount ? Number(form.passengerCount) : null,
          amount: form.amount ? Number(form.amount) : null,
          currency: form.currency,
          status: form.status,
          paymentStatus: form.paymentStatus
        })
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save booking.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="manual-booking-title">
      <form className="modal-panel" onSubmit={saveBooking}>
        <div className="modal-header">
          <div>
            <h2 id="manual-booking-title">Manual Booking</h2>
            <p className="t-meta">Selected date: {initialDate}</p>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="form-grid">
          <label>
            Tour
            <select value={form.tourId} onChange={(event) => setForm({ ...form, tourId: event.target.value })}>
              <option value="">Custom booking</option>
              {tours.map((tour) => <option value={tour.id} key={tour.id}>{tour.title}</option>)}
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
            <input value={form.customerName} onChange={(event) => setForm({ ...form, customerName: event.target.value })} required minLength={2} autoFocus />
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
            <input type="date" value={form.bookingDate} onChange={(event) => setForm({ ...form, bookingDate: event.target.value })} required />
          </label>
          <label>
            Amount
            <input type="number" min="0" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} />
          </label>
          <label>
            Currency
            <input value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value.toUpperCase().slice(0, 3) })} required minLength={3} />
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
            <input type="number" min="0" value={form.passengerCount} onChange={(event) => setForm({ ...form, passengerCount: event.target.value })} />
          </label>
        </div>

        {error ? <p className="form-error">{error}</p> : null}
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-gold" disabled={saving}>{saving ? "Saving..." : "Save Booking"}</button>
        </div>
      </form>
    </div>
  );
}
