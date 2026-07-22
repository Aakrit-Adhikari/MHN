import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/State";

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" />
      <EmptyState title="No settings available" />
    </>
  );
}
