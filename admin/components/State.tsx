import { AlertTriangle, Loader2 } from "lucide-react";

export function LoadingState({ label = "Loading database records..." }: { label?: string }) {
  return (
    <div className="state-panel">
      <Loader2 className="h-5 w-5 animate-spin text-navy" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({ title, message }: { title: string; message: string }) {
  return (
    <div className="alert alert-warning">
      <AlertTriangle className="h-5 w-5" />
      <div>
        <strong>{title}</strong>
        <p>{message}</p>
      </div>
    </div>
  );
}

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="state-panel">
      <strong className="font-serif text-base text-navy">{title}</strong>
      <span>{message}</span>
    </div>
  );
}
