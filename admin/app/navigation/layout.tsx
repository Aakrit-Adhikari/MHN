import { AdminShell } from "@/components/AdminShell";

export default function NavigationLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
