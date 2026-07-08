import { AdminShell } from "@/components/AdminShell";

export default function CustomersLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
