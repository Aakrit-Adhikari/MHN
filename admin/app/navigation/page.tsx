"use client";

import { PageHeader } from "@/components/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/State";
import { ApiError } from "@/lib/api";
import { useApiData } from "@/lib/useApiData";
import type { NavigationItem } from "@/types/api";

export default function NavigationPage() {
  const { data, loading, error } = useApiData<NavigationItem[]>("/navigation");
  const missing = error instanceof ApiError && error.missingEndpoint;

  return (
    <>
      <PageHeader title="Navigation" />

      {loading ? <LoadingState /> : null}
      {missing ? (
        <EmptyState title="Navigation is unavailable" />
      ) : error ? (
        <ErrorState title="Navigation could not be loaded" />
      ) : null}

      {data?.length ? (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Label</th>
                  <th>URL</th>
                  <th>Location</th>
                  <th>Order</th>
                  <th>Visibility</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={item.id}>
                    <td><div className="t-name">{item.label}</div><div className="t-meta">{item.slug}</div></td>
                    <td>{item.url}</td>
                    <td>{item.location}</td>
                    <td>{item.order}</td>
                    <td><span className={item.isVisible ? "badge badge-green" : "badge badge-grey"}>{item.isVisible ? "Visible" : "Hidden"}</span></td>
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
