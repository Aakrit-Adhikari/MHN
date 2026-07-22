"use client";

import Link from "next/link";
import { BarChart3, MessageSquare, Radio, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/State";
import { money } from "@/lib/format";
import { getSourceBadgeClass } from "@/lib/source";
import { useApiData } from "@/lib/useApiData";
import type { DashboardSourceSummary, SourceSummaryRow } from "@/types/api";

function totalRows(rows: SourceSummaryRow[]) {
  return rows.reduce((sum, row) => sum + row.count, 0);
}

function totalCampaignHits(rows: Array<{ count: number }>) {
  return rows.reduce((sum, row) => sum + row.count, 0);
}

function SourceTable({
  title,
  rows,
  formatValue = (value) => String(value)
}: {
  title: string;
  rows: SourceSummaryRow[];
  formatValue?: (value: number) => string;
}) {
  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">{title}</div>
        </div>
      </div>
      {rows.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Source</th>
                <th>Type</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.sourceType ?? "unknown"}-${row.label}`}>
                  <td><span className={`badge ${getSourceBadgeClass(row.sourceType)}`}>{row.label}</span></td>
                  <td>{row.sourceType ?? "Unknown"}</td>
                  <td>{formatValue(row.count)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card-body">
          <EmptyState title="No source data" />
        </div>
      )}
    </div>
  );
}

export default function SourcesPage() {
  const { data, loading, error } = useApiData<DashboardSourceSummary>("/admin/dashboard/sources", true);

  const bookingRows = data?.bookingsBySource ?? [];
  const inquiryRows = data?.inquiriesBySource ?? [];
  const revenueRows = data?.revenueBySource ?? [];
  const campaignRows = data?.topCampaigns ?? [];

  return (
    <>
      <PageHeader
        title="Sources"
        actions={<Link className="btn btn-secondary" href="/bookings">Back to Bookings</Link>}
      />

      {loading ? <LoadingState label="Loading source reports..." /> : null}
      {error ? <ErrorState title="Sources could not be loaded" /> : null}

      {!loading && !error ? (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label"><Radio className="h-4 w-4" /> Booking Sources</div>
              <div className="stat-value">{bookingRows.length}</div>
              <div className="stat-meta">{totalRows(bookingRows)} bookings tracked</div>
            </div>
            <div className="stat-card blue">
              <div className="stat-label"><MessageSquare className="h-4 w-4" /> Inquiry Sources</div>
              <div className="stat-value">{inquiryRows.length}</div>
              <div className="stat-meta">{totalRows(inquiryRows)} inquiries tracked</div>
            </div>
            <div className="stat-card green">
              <div className="stat-label"><BarChart3 className="h-4 w-4" /> Revenue Sources</div>
              <div className="stat-value">{revenueRows.length}</div>
              <div className="stat-meta">{money(totalRows(revenueRows))} attributed value</div>
            </div>
            <div className="stat-card gold">
              <div className="stat-label"><TrendingUp className="h-4 w-4" /> Campaigns</div>
              <div className="stat-value">{campaignRows.length}</div>
              <div className="stat-meta">{totalCampaignHits(campaignRows)} campaign hits</div>
            </div>
          </div>

          <div className="dash-grid">
            <SourceTable
              title="Bookings by Source"
              rows={bookingRows}
            />
            <SourceTable
              title="Inquiries by Source"
              rows={inquiryRows}
            />
          </div>

          <div className="dash-grid mt-4">
            <SourceTable
              title="Revenue by Source"
              rows={revenueRows}
              formatValue={(value) => money(value)}
            />
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Top Campaigns</div>
                </div>
              </div>
              {campaignRows.length ? (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Campaign</th>
                        <th>Hits</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaignRows.map((campaign) => (
                        <tr key={campaign.name}>
                          <td><div className="t-name">{campaign.name}</div></td>
                          <td>{campaign.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="card-body">
                  <EmptyState title="No campaign data" />
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
