import type { Permission } from "@/types/api";

export function PermissionToggle({
  permission,
  enabled,
  onChange
}: {
  permission: Permission;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <button
      type="button"
      className={`permission-toggle ${enabled ? "is-on" : ""}`}
      onClick={() => onChange(!enabled)}
      aria-pressed={enabled}
    >
      <span>
        <strong>{permission.name}</strong>
        <small>{permission.key}</small>
      </span>
      <span className="switch-track">
        <span className="switch-thumb" />
      </span>
    </button>
  );
}
