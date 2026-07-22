import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  if (!description && !actions) return null;

  return (
    <div className="view-header" aria-label={`${title} page controls`}>
      {description ? <p className="view-description">{description}</p> : null}
      {actions ? <div className="view-actions">{actions}</div> : null}
    </div>
  );
}
