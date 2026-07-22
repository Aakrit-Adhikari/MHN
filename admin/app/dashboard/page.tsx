"use client";

import {
  BookOpen,
  CalendarCheck,
  CircleDollarSign,
  MessageSquare,
  PieChart,
  Plane,
  Plus,
  Radio,
  TrendingUp,
  UserRoundCog,
  Users
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { EmptyState, ErrorState, LoadingState } from "@/components/State";
import { getStoredUser } from "@/lib/api";
import { formatDateTime, money } from "@/lib/format";
import { hasPermission } from "@/lib/permissions";
import { getSourceBadgeClass } from "@/lib/source";
import { useApiData } from "@/lib/useApiData";
import type { DashboardOverview, DashboardRecentInquiry, SourceSummaryRow, User } from "@/types/api";

const inquiryTypeDisplay = {
  BOOKING: { label: "Booking", className: "badge-green" },
  CHARTER: { label: "Charter", className: "badge-gold" },
  CONTACT: { label: "Contact", className: "badge-blue" }
} as const;

function getInquiryTypeDisplay(item: DashboardRecentInquiry) {
  const type = item.inquiryType ?? "CONTACT";
  return inquiryTypeDisplay[type];
}

function SourceList({
  rows,
  emptyMessage,
  formatValue = (value) => String(value)
}: {
  rows: SourceSummaryRow[];
  emptyMessage: string;
  formatValue?: (value: number) => string;
}) {
  if (!rows.length) {
    return <div className="t-meta">{emptyMessage}</div>;
  }

  return (
    <div className="space-y-2">
      {rows.slice(0, 5).map((row) => (
        <div className="flex items-center justify-between gap-3" key={`${row.sourceType ?? "unknown"}-${row.label}`}>
          <span className={`badge ${getSourceBadgeClass(row.sourceType)}`}>{row.label}</span>
          <strong className="text-slate-700">{formatValue(row.count)}</strong>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const canViewBookings = hasPermission(user, "VIEW_BOOKINGS");
  const canViewInquiries = hasPermission(user, "VIEW_INQUIRIES");
  const canViewTours = hasPermission(user, "VIEW_TOURS");
  const canViewBlogs = hasPermission(user, "VIEW_BLOGS");
  const canViewCustomers = hasPermission(user, "VIEW_CUSTOMERS");
  const canViewUsers = hasPermission(user, "VIEW_USERS");
  const canViewFinance = hasPermission(user, "VIEW_FINANCE");
  const canViewReports = hasPermission(user, "VIEW_REPORTS");
  const hasQuickActions = canViewBookings || canViewTours || canViewBlogs || canViewInquiries ||
    canViewCustomers || canViewUsers || canViewFinance || canViewReports;
  const visibleStatCount = [
    canViewTours,
    canViewBlogs,
    canViewInquiries,
    canViewBookings,
    canViewCustomers,
    canViewUsers
  ].filter(Boolean).length;
  const statGridSize = Math.min(Math.max(visibleStatCount, 1), 4);

  const overview = useApiData<DashboardOverview>("/admin/dashboard/overview", true, Boolean(user));
  const recentInquiries = overview.data?.recentInquiries ?? [];
  const sourceSummary = overview.data?.sourceSummary;

  return (
    <>
      <PageHeader
        title="Dashboard"
        actions={canViewInquiries ? <Link className="btn btn-primary" href="/inquiries">View Inquiries</Link> : undefined}
      />

      {overview.error ? <div className="mb-4"><ErrorState title="Dashboard data could not be loaded" /></div> : null}

      {overview.loading ? (
        <LoadingState />
      ) : (
        <>
          <div className={`stats-grid stats-grid-${statGridSize}`}>
            {canViewTours ? <StatCard icon={Plane} label="Tours" value={overview.data?.counts.tours ?? 0} tone="gold" /> : null}
            {canViewBlogs ? <StatCard icon={BookOpen} label="Blogs" value={overview.data?.counts.blogs ?? 0} /> : null}
            {canViewInquiries ? <StatCard
              icon={MessageSquare}
              label="Inquiries"
              value={overview.data?.counts.inquiries ?? 0}
              tone="blue"
            /> : null}
            {canViewBookings ? <StatCard
              icon={CalendarCheck}
              label="Bookings"
              value={overview.data?.counts.bookings ?? 0}
              tone="green"
            /> : null}
            {canViewCustomers ? <StatCard
              icon={Users}
              label="Customers"
              value={overview.data?.counts.customers ?? 0}
              tone="green"
            /> : null}
            {canViewUsers ? <StatCard
              icon={UserRoundCog}
              label="Users"
              value={overview.data?.counts.users ?? 0}
              tone="blue"
            /> : null}
          </div>

          <div className="dash-grid">
            {canViewInquiries ? <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Recent Inquiries</div>
                </div>
              </div>
              {recentInquiries.length ? (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Contact</th>
                        <th>Submitted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentInquiries.map((item) => {
                        const type = getInquiryTypeDisplay(item);

                        return (
                          <tr key={item.id}>
                            <td>
                              <div className="t-name">{item.name}</div>
                            </td>
                            <td><span className={`badge ${type.className}`}>{type.label}</span></td>
                            <td>
                              {item.email}
                              <div className="t-meta">{item.phone || "No phone"}</div>
                            </td>
                            <td>{formatDateTime(item.createdAt)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="card-body">
                  <EmptyState title="No inquiries found" />
                </div>
              )}
            </div> : null}

            {hasQuickActions ? <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Quick Actions</div>
                </div>
              </div>
              <div className="card-body space-y-3 text-sm text-slate-700">
                {canViewBookings ? <Link className="btn btn-gold w-full justify-start" href="/bookings">
                  <CalendarCheck className="h-4 w-4" /> Manage Bookings
                </Link> : null}
                {canViewTours ? <Link className="btn btn-secondary w-full justify-start" href="/tours">
                  <Plus className="h-4 w-4" /> Manage Tours
                </Link> : null}
                {canViewBlogs ? <Link className="btn btn-secondary w-full justify-start" href="/blogs">
                  <BookOpen className="h-4 w-4" /> Manage Blogs
                </Link> : null}
                {canViewInquiries ? <Link className="btn btn-secondary w-full justify-start" href="/inquiries">
                  <MessageSquare className="h-4 w-4" /> Review Inquiries
                </Link> : null}
                {canViewCustomers ? <Link className="btn btn-secondary w-full justify-start" href="/customers">
                  <Users className="h-4 w-4" /> View Customers
                </Link> : null}
                {canViewUsers ? <Link className="btn btn-secondary w-full justify-start" href="/users">
                  <UserRoundCog className="h-4 w-4" /> Manage Users
                </Link> : null}
                {canViewFinance ? <Link className="btn btn-secondary w-full justify-start" href="/finance">
                  <CircleDollarSign className="h-4 w-4" /> View Finance
                </Link> : null}
                {canViewReports ? <Link className="btn btn-secondary w-full justify-start" href="/reports">
                  <PieChart className="h-4 w-4" /> View Reports
                </Link> : null}
              </div>
            </div> : null}
          </div>

          {canViewBookings || canViewInquiries ? <div className="dash-grid mt-4">
            {canViewBookings ? <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Bookings by Source</div>
                </div>
                <Radio className="h-4 w-4 text-[#003366]" />
              </div>
              <div className="card-body">
                <SourceList rows={sourceSummary?.bookingsBySource ?? []} emptyMessage="No data" />
              </div>
            </div> : null}

            {canViewInquiries ? <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Inquiries by Source</div>
                </div>
                <MessageSquare className="h-4 w-4 text-[#0062b1]" />
              </div>
              <div className="card-body">
                <SourceList rows={sourceSummary?.inquiriesBySource ?? []} emptyMessage="No data" />
              </div>
            </div> : null}
          </div> : null}

          {canViewReports || canViewFinance ? <div className="dash-grid mt-4">
            {canViewReports ? <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Top Campaigns</div>
                </div>
                <TrendingUp className="h-4 w-4 text-[#b8860b]" />
              </div>
              <div className="card-body">
                {sourceSummary?.topCampaigns.length ? (
                  <div className="space-y-2">
                    {sourceSummary.topCampaigns.map((campaign) => (
                      <div className="flex items-center justify-between gap-3" key={campaign.name}>
                        <span className="t-name">{campaign.name}</span>
                        <strong className="text-slate-700">{campaign.count}</strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="t-meta">No data</div>
                )}
              </div>
            </div> : null}

            {canViewFinance ? <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Revenue by Source</div>
                </div>
              </div>
              <div className="card-body">
                <SourceList
                  rows={sourceSummary?.revenueBySource ?? []}
                  emptyMessage="No data"
                  formatValue={(value) => money(value)}
                />
              </div>
            </div> : null}
          </div> : null}
        </>
      )}
    </>
  );
}
