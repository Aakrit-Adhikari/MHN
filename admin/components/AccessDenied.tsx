import { ShieldAlert } from "lucide-react";

export function AccessDenied() {
  return (
    <div className="access-denied">
      <div className="access-denied-icon">
        <ShieldAlert className="h-6 w-6" />
      </div>
      <h1>Access denied</h1>
      <p>Your account does not have access to this section.</p>
    </div>
  );
}
