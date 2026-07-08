import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/State";

export default function CustomersPage() {
  return (
    <>
      <PageHeader title="Customers" description="Customer records and profiles for HR/customer operations." />
      <EmptyState title="Customer management is ready for data" message="Connect customer records here when the backend customer module is added." />
    </>
  );
}
