"use client";

import { BookOpen, MessageSquare, Plane, Plus, Radio, TrendingUp, Users } from "lucide-react";
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
import type { BlogPost, Booking, DashboardSourceSummary, Inquiry, SourceSummaryRow, Tour, User } from "@/types/api";

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

  const tours = useApiData<Tour[]>("/tours");
  const blogs = useApiData<BlogPost[]>("/blogs");
  const bookings = useApiData<Booking[]>("/admin/bookings", true, canViewBookings);
  const inquiries = useApiData<Inquiry[]>("/inquiries", true, canViewInquiries);
  const sourceSummary = useApiData<DashboardSourceSummary>("/admin/dashboard/sources", true);
  const loading = tours.loading || blogs.loading || bookings.loading || inquiries.loading || sourceSummary.loading;

  const errors = [tours.error, blogs.error, bookings.error, inquiries.error, sourceSummary.error].filter(Boolean);
  const recentInquiries = inquiries.data?.slice(0, 5) ?? [];

  return (
    <>
      <PageHeader
        title="Good day, Administrator"
        description="Today’s overview for tours, content, and customer requests."
        actions={<Link className="btn btn-primary" href="/inquiries">View Inquiries</Link>}
      />

      {errors.map((error, index) => (
        <div className="mb-4" key={index}>
          <ErrorState title="Some records could not be loaded" message={error?.message ?? "Unknown error."} />
        </div>
      ))}

      {loading ? (
        <LoadingState />
      ) : (
        <>
          <div className="stats-grid">
            <StatCard icon={Plane} label="Tours" value={tours.data?.length ?? 0} meta="Active tour packages" tone="gold" />
            <StatCard icon={BookOpen} label="Blogs" value={blogs.data?.length ?? 0} meta="Published content items" />
            <StatCard
              icon={MessageSquare}
              label="Inquiries"
              value={canViewInquiries ? inquiries.data?.length ?? 0 : "Hidden"}
              meta={canViewInquiries ? "Customer requests received" : "No inquiry permission"}
              tone="blue"
            />
            <StatCard
              icon={Users}
              label="Bookings"
              value={canViewBookings ? bookings.data?.length ?? 0 : "Hidden"}
              meta={canViewBookings ? "Tracked booking records" : "No booking permission"}
              tone="green"
            />
          </div>

          <div className="dash-grid">
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Recent Inquiries</div>
                  <div className="card-subtitle">Newest customer requests</div>
                </div>
              </div>
              {!canViewInquiries ? (
                <div className="card-body">
                  <EmptyState title="Inquiries hidden" message="This user does not have inquiry permission." />
                </div>
              ) : recentInquiries.length ? (
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
                      {recentInquiries.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <div className="t-name">{item.name}</div>
                            <div className="t-meta">{item.id}</div>
                          </td>
                          <td><span className="badge badge-blue">{item.type}</span></td>
                          <td>
                            {item.email}
                            <div className="t-meta">{item.phone || "No phone"}</div>
                          </td>
                          <td>{formatDateTime(item.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="card-body">
                  <EmptyState title="No inquiries found" message="New customer requests will appear here." />
                </div>
              )}
            </div>

            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Quick Actions</div>
                  <div className="card-subtitle">Common admin tasks</div>
                </div>
              </div>
              <div className="card-body space-y-3 text-sm text-slate-700">
                <Link className="btn btn-gold w-full justify-start" href="/tours">
                  <Plus className="h-4 w-4" /> Manage Tours
                </Link>
                <Link className="btn btn-secondary w-full justify-start" href="/blogs">
                  <BookOpen className="h-4 w-4" /> Manage Blogs
                </Link>
                {canViewInquiries ? <Link className="btn btn-secondary w-full justify-start" href="/inquiries">
                  <MessageSquare className="h-4 w-4" /> Review Inquiries
                </Link> : null}
              </div>
            </div>
          </div>

          <div className="dash-grid mt-4">
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Bookings by Source</div>
                  <div className="card-subtitle">Booking inquiries grouped by attribution</div>
                </div>
                <Radio className="h-4 w-4 text-[#003366]" />
              </div>
              <div className="card-body">
                <SourceList rows={sourceSummary.data?.bookingsBySource ?? []} emptyMessage="No booking source data yet." />
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Inquiries by Source</div>
                  <div className="card-subtitle">All inquiries grouped by source</div>
                </div>
                <MessageSquare className="h-4 w-4 text-[#0062b1]" />
              </div>
              <div className="card-body">
                <SourceList rows={sourceSummary.data?.inquiriesBySource ?? []} emptyMessage="No inquiry source data yet." />
              </div>
            </div>
          </div>

          <div className="dash-grid mt-4">
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Top Campaigns</div>
                  <div className="card-subtitle">Based on campaign name and UTM campaign</div>
                </div>
                <TrendingUp className="h-4 w-4 text-[#b8860b]" />
              </div>
              <div className="card-body">
                {sourceSummary.data?.topCampaigns.length ? (
                  <div className="space-y-2">
                    {sourceSummary.data.topCampaigns.map((campaign) => (
                      <div className="flex items-center justify-between gap-3" key={campaign.name}>
                        <span className="t-name">{campaign.name}</span>
                        <strong className="text-slate-700">{campaign.count}</strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="t-meta">No campaign data yet.</div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Revenue by Source</div>
                  <div className="card-subtitle">Available once booking amount is stored</div>
                </div>
              </div>
              <div className="card-body">
                <SourceList
                  rows={sourceSummary.data?.revenueBySource ?? []}
                  emptyMessage="No booking revenue data yet."
                  formatValue={(value) => money(value)}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
