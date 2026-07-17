import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/State";

export default function ReportsPage() {
  return (
    <>
      <PageHeader title="Reports" />
      <EmptyState title="No reports available" />
    </>
  );
}
