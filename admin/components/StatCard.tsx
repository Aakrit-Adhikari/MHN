import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  meta,
  icon: Icon,
  tone = "navy"
}: {
  label: string;
  value: string | number;
  meta?: string;
  icon: LucideIcon;
  tone?: "navy" | "gold" | "blue" | "green";
}) {
  return (
    <div className={`stat-card ${tone}`}>
      <div className="stat-label">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className="stat-value">{value}</div>
      {meta ? <div className="stat-meta">{meta}</div> : null}
    </div>
  );
}
