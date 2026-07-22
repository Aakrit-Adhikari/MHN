import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/State";

export default function FinancePage() {
  return (
    <>
      <PageHeader title="Finance" />
      <EmptyState title="No finance data available" />
    </>
  );
}
