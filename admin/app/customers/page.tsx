"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/State";
import { formatDate, money } from "@/lib/format";
import { useApiData } from "@/lib/useApiData";
import type { Booking, BookingStatus } from "@/types/api";

type CustomerRecord = {
  key: string;
  name: string;
  email: string | null;
  phone: string | null;
  bookings: Booking[];
  bookingCount: number;
  totalAmount: number;
  latestBooking: Booking;
  latestBookingAt: string;
  statuses: Partial<Record<BookingStatus, number>>;
};

function customerKey(booking: Booking) {
  const email = booking.customerEmail?.trim().toLowerCase();
  if (email) return `email:${email}`;

  const phone = booking.customerPhone?.replace(/\D/g, "");
  if (phone) return `phone:${phone}`;

  return `name:${booking.customerName.trim().toLowerCase()}`;
}

function bookingTime(booking: Booking) {
  return new Date(booking.bookingDate ?? booking.createdAt).getTime();
}

function buildCustomers(bookings: Booking[]) {
  const records = new Map<string, CustomerRecord>();

  bookings.forEach((booking) => {
    const key = customerKey(booking);
    const existing = records.get(key);

    if (!existing) {
      records.set(key, {
        key,
        name: booking.customerName,
        email: booking.customerEmail,
        phone: booking.customerPhone,
        bookings: [booking],
        bookingCount: 1,
        totalAmount: booking.amount ?? 0,
        latestBooking: booking,
        latestBookingAt: booking.bookingDate ?? booking.createdAt,
        statuses: { [booking.status]: 1 }
      });
      return;
    }

    existing.bookings.push(booking);
    existing.bookingCount += 1;
    existing.totalAmount += booking.amount ?? 0;
    existing.email ||= booking.customerEmail;
    existing.phone ||= booking.customerPhone;
    existing.statuses[booking.status] = (existing.statuses[booking.status] ?? 0) + 1;

    if (bookingTime(booking) > bookingTime(existing.latestBooking)) {
      existing.latestBooking = booking;
      existing.latestBookingAt = booking.bookingDate ?? booking.createdAt;
    }
  });

  return Array.from(records.values()).sort((left, right) => bookingTime(right.latestBooking) - bookingTime(left.latestBooking));
}

function statusBadgeClass(status: BookingStatus) {
  if (status === "CONFIRMED") return "badge-green";
  if (status === "PENDING") return "badge-yellow";
  if (status === "COMPLETED") return "badge-blue";
  return "badge-grey";
}

export default function CustomersPage() {
  const { data, loading, error } = useApiData<Booking[]>("/admin/bookings", true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "ALL">("ALL");

  const customers = useMemo(() => buildCustomers(data ?? []), [data]);
  const filteredCustomers = useMemo(() => {
    const term = search.trim().toLowerCase();

    return customers.filter((customer) => {
      const matchesSearch = !term || [
        customer.name,
        customer.email,
        customer.phone,
        customer.latestBooking.tour?.title
      ].some((value) => value?.toLowerCase().includes(term));

      const matchesStatus = statusFilter === "ALL" || customer.bookings.some((booking) => booking.status === statusFilter);

      return matchesSearch && matchesStatus;
    });
  }, [customers, search, statusFilter]);

  const totalBookings = data?.length ?? 0;
  const repeatCustomers = customers.filter((customer) => customer.bookingCount > 1).length;
  const totalValue = customers.reduce((sum, customer) => sum + customer.totalAmount, 0);

  return (
    <>
      <PageHeader
        title="Customers"
        description="Customer profiles built from booking records and manual bookings."
        actions={
          <Link className="btn btn-gold" href="/bookings">
            <UsersRound className="h-4 w-4" /> Manage Bookings
          </Link>
        }
      />

      {loading ? <LoadingState label="Loading customer records..." /> : null}
      {error ? <ErrorState title="Customers could not be loaded" message={error.message} /> : null}

      {!loading && !error && data?.length ? (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Customers</div>
              <div className="stat-value">{customers.length}</div>
              <div className="stat-meta">Unique booking contacts</div>
            </div>
            <div className="stat-card blue">
              <div className="stat-label">Bookings</div>
              <div className="stat-value">{totalBookings}</div>
              <div className="stat-meta">Across all customers</div>
            </div>
            <div className="stat-card green">
              <div className="stat-label">Repeat</div>
              <div className="stat-value">{repeatCustomers}</div>
              <div className="stat-meta">Customers with 2+ bookings</div>
            </div>
            <div className="stat-card gold">
              <div className="stat-label">Value</div>
              <div className="stat-value">{money(totalValue)}</div>
              <div className="stat-meta">Recorded booking amount</div>
            </div>
          </div>

          <div className="card mb-4">
            <div className="card-body flex flex-wrap items-center justify-between gap-3">
              <div className="search-box">
                <Search className="h-4 w-4" />
                <input
                  aria-label="Search customers"
                  placeholder="Search customers"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <select
                className="admin-select"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as BookingStatus | "ALL")}
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </>
      ) : null}

      {!loading && !error && !data?.length ? (
        <EmptyState title="No customers found" message="Customers will appear here automatically when bookings are created." />
      ) : null}

      {!loading && !error && data?.length && !filteredCustomers.length ? (
        <EmptyState title="No matching customers" message="Try another search term or status filter." />
      ) : null}

      {!loading && !error && filteredCustomers.length ? (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Bookings</th>
                  <th>Total Value</th>
                  <th>Latest Booking</th>
                  <th>Status Mix</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.key}>
                    <td>
                      <div className="t-name">{customer.name}</div>
                      <div className="t-meta">{customer.latestBooking.tour?.title ?? "Custom booking"}</div>
                    </td>
                    <td>
                      <div>{customer.email || "No email"}</div>
                      <div className="t-meta">{customer.phone || "No phone"}</div>
                    </td>
                    <td>{customer.bookingCount}</td>
                    <td>{money(customer.totalAmount)}</td>
                    <td>{formatDate(customer.latestBookingAt)}</td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        {(Object.entries(customer.statuses) as [BookingStatus, number][]).map(([status, count]) => (
                          <span className={`badge ${statusBadgeClass(status)}`} key={status}>
                            {status} {count}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </>
  );
}
