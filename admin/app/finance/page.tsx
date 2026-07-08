import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/State";

export default function FinancePage() {
  return (
    <>
      <PageHeader title="Finance" description="Finance-only view for revenue, booking value, and future profit tracking." />
      <EmptyState title="Finance module is permission-protected" message="Booking amounts are being stored now; finance reports can build on that data next." />
    </>
  );
}
