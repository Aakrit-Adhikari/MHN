"use client";

import { Download, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/State";
import { formatDate, initials, money } from "@/lib/format";
import { useApiData } from "@/lib/useApiData";
import type { BookingStatus, CustomerCategory, CustomerRecord, CustomerSummary } from "@/types/api";

type CustomersResponse = {
  customers: CustomerRecord[];
  summary: CustomerSummary;
};

type CustomerSort = "RECENT" | "VALUE" | "BOOKINGS" | "NAME";

function statusBadgeClass(status: BookingStatus) {
  if (status === "CONFIRMED") return "badge-green";
  if (status === "PENDING") return "badge-yellow";
  if (status === "COMPLETED") return "badge-blue";
  return "badge-grey";
}

function categoryBadgeClass(category: CustomerCategory) {
  if (category === "VIP") return "badge-gold";
  if (category === "REPEATED") return "badge-blue";
  if (category === "NEW") return "badge-green";
  return "badge-grey";
}

function categoryLabel(category: CustomerCategory) {
  if (category === "NO_BOOKING") return "No Booking";
  if (category === "REPEATED") return "Repeat";
  return category[0] + category.slice(1).toLowerCase();
}

function accountSource(customer: CustomerRecord) {
  if (!customer.authProviders.length) return "Customer account";
  return customer.authProviders.map((provider) => (
    provider === "LOCAL" ? "Email" : provider[0] + provider.slice(1).toLowerCase()
  )).join(", ");
}

function csvCell(value: string | number) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CustomerCategory | "ALL">("ALL");
  const [sort, setSort] = useState<CustomerSort>("RECENT");
  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set("category", categoryFilter);
    params.set("sort", sort);
    if (search.trim()) params.set("search", search.trim());
    return params.toString();
  }, [categoryFilter, search, sort]);
  const { data, loading, error } = useApiData<CustomersResponse>(`/admin/customers?${query}`, true);

  const customers = data?.customers ?? [];
  const summary = data?.summary;

  function exportCustomers() {
    if (!customers.length) return;

    const rows = [
      ["Customer", "Email", "Phone", "Tag", "Bookings", "Lifetime Value", "Last Booking", "Account Source"],
      ...customers.map((customer) => [
        customer.name,
        customer.email ?? "",
        customer.phone ?? "",
        categoryLabel(customer.category),
        customer.bookingCount,
        customer.totalSpent,
        customer.latestBookingAt ?? "",
        accountSource(customer),
      ]),
    ];
    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "mhn-customers.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageHeader
        title="Customers"
        description={summary ? `${summary.totalCustomers} customers · ${summary.repeatRate}% repeat rate` : undefined}
        actions={
          <button className="btn btn-secondary" onClick={exportCustomers} disabled={!customers.length}>
            <Download className="h-4 w-4" /> Export
          </button>
        }
      />

      {loading ? <LoadingState label="Loading customer records..." /> : null}
      {error ? <ErrorState title="Customers could not be loaded" /> : null}

      {!loading && !error && summary ? (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Total Customers</div>
              <div className="stat-value">{summary.totalCustomers}</div>
              <div className="stat-meta">{summary.visibleCustomers} shown with current filters</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">No Booking</div>
              <div className="stat-value">{summary.noBookingCustomers}</div>
              <div className="stat-meta">Customer lifetime value is $0</div>
            </div>
            <div className="stat-card blue">
              <div className="stat-label">Repeat Customers</div>
              <div className="stat-value">{summary.repeatedCustomers}</div>
              <div className="stat-meta">{summary.repeatRate}% of customers with value</div>
            </div>
            <div className="stat-card gold">
              <div className="stat-label">Lifetime Value</div>
              <div className="stat-value">{money(summary.totalValue)}</div>
              <div className="stat-meta">Confirmed and completed bookings</div>
            </div>
          </div>

          <div className="card mb-4">
            <div className="card-body flex flex-wrap items-center gap-3">
              <div className="search-box customer-search">
                <Search className="h-4 w-4" />
                <input
                  aria-label="Search customers"
                  placeholder="Search name, email, phone or tour"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <select
                className="admin-select"
                aria-label="Filter by customer tag"
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value as CustomerCategory | "ALL")}
              >
                <option value="ALL">All Customers</option>
                <option value="NO_BOOKING">No Booking</option>
                <option value="NEW">New</option>
                <option value="REPEATED">Repeat</option>
                <option value="VIP">VIP</option>
              </select>
              <select
                className="admin-select"
                aria-label="Sort customers"
                value={sort}
                onChange={(event) => setSort(event.target.value as CustomerSort)}
              >
                <option value="RECENT">Sort: Recent activity</option>
                <option value="VALUE">Sort: Lifetime value</option>
                <option value="BOOKINGS">Sort: Booking count</option>
                <option value="NAME">Sort: Customer name</option>
              </select>
            </div>
          </div>
        </>
      ) : null}

      {!loading && !error && !customers.length ? (
        <EmptyState title="No customers found" message="Try changing the search or customer tag filter." />
      ) : null}

      {!loading && !error && customers.length ? (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Account</th>
                  <th>Bookings</th>
                  <th>Last Booking</th>
                  <th>Lifetime Value</th>
                  <th>Tags</th>
                  <th>Booking Status</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <div className="customer-cell">
                        <div className="customer-avatar">
                          {customer.avatarUrl ? <img src={customer.avatarUrl} alt="" /> : initials(customer.name)}
                        </div>
                        <div>
                          <div className="t-name">{customer.name}</div>
                          <div className="t-meta">{customer.email || customer.phone || "No contact details"}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>{accountSource(customer)}</div>
                      <div className="t-meta">Joined {customer.joinedAt ? formatDate(customer.joinedAt) : "date unavailable"}</div>
                    </td>
                    <td>{customer.bookingCount}</td>
                    <td>
                      <div>{customer.latestBookingAt ? formatDate(customer.latestBookingAt) : "Never"}</div>
                      <div className="t-meta">{customer.latestTourTitle ?? "No completed booking"}</div>
                    </td>
                    <td><strong className="customer-value">{money(customer.totalSpent)}</strong></td>
                    <td>
                      <span className={`badge ${categoryBadgeClass(customer.category)}`}>
                        {categoryLabel(customer.category)}
                      </span>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        {(Object.entries(customer.statuses) as [BookingStatus, number][]).map(([status, count]) => (
                          <span className={`badge ${statusBadgeClass(status)}`} key={status}>
                            {status} {count}
                          </span>
                        ))}
                        {!Object.keys(customer.statuses).length ? <span className="t-meta">No activity</span> : null}
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
