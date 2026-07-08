import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/State";

export default function ReportsPage() {
  return (
    <>
      <PageHeader title="Reports" description="Reporting workspace for operational and finance summaries." />
      <EmptyState title="Reports module is ready" message="Add report APIs here when you decide which metrics to expose." />
    </>
  );
}
