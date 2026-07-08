"use client";

import { FormEvent, useEffect, useState } from "react";
import { PermissionToggle } from "@/components/PermissionToggle";
import type { AdminRole, Permission, PermissionKey, User, UserStatus } from "@/types/api";

export type UserPayload = {
  username: string;
  password?: string;
  name: string | null;
  role: AdminRole;
  status: UserStatus;
  permissions: PermissionKey[];
};

const roles: AdminRole[] = ["SUPER_ADMIN", "FINANCE", "HR", "OPERATIONS", "EMPLOYEE"];
const statuses: UserStatus[] = ["ACTIVE", "DISABLED"];

function defaultPermissions(role: AdminRole, permissions: Permission[]): PermissionKey[] {
  const keys = permissions.map((permission) => permission.key);

  if (role === "SUPER_ADMIN") return keys;
  if (role === "FINANCE") return keys.filter((key) => ["VIEW_DASHBOARD", "VIEW_BOOKINGS", "VIEW_FINANCE", "VIEW_REPORTS"].includes(key));
  if (role === "HR") return keys.filter((key) => ["VIEW_DASHBOARD", "VIEW_CUSTOMERS", "VIEW_USERS"].includes(key));
  if (role === "OPERATIONS") return keys.filter((key) => ["VIEW_DASHBOARD", "VIEW_BOOKINGS", "VIEW_TOURS", "VIEW_INQUIRIES"].includes(key));

  return ["VIEW_DASHBOARD"];
}

export function UserForm({
  user,
  permissions,
  saving,
  onCancel,
  onSubmit
}: {
  user: User | null;
  permissions: Permission[];
  saving: boolean;
  onCancel: () => void;
  onSubmit: (payload: UserPayload) => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<AdminRole>("OPERATIONS");
  const [status, setStatus] = useState<UserStatus>("ACTIVE");
  const [selectedPermissions, setSelectedPermissions] = useState<PermissionKey[]>([]);

  useEffect(() => {
    setUsername(user?.username ?? "");
    setPassword("");
    setName(user?.name ?? "");
    setRole(user?.role ?? "OPERATIONS");
    setStatus(user?.status ?? "ACTIVE");
    setSelectedPermissions(user?.permissions ?? defaultPermissions("OPERATIONS", permissions));
  }, [permissions, user]);

  function changeRole(nextRole: AdminRole) {
    setRole(nextRole);
    if (!user) {
      setSelectedPermissions(defaultPermissions(nextRole, permissions));
    }
  }

  function togglePermission(key: PermissionKey, enabled: boolean) {
    setSelectedPermissions((current) => {
      if (enabled) return current.includes(key) ? current : [...current, key];
      return current.filter((item) => item !== key);
    });
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    onSubmit({
      username,
      password: password || undefined,
      name: name.trim() || null,
      role,
      status,
      permissions: selectedPermissions
    });
  }

  return (
    <form className="modal-panel" onSubmit={submit}>
      <div className="modal-header">
        <div>
          <h2>{user ? "Edit Admin User" : "Create Admin User"}</h2>
          <p>Assign role, status, and module access.</p>
        </div>
      </div>

      <div className="form-grid">
        <label>
          Username
          <input value={username} onChange={(event) => setUsername(event.target.value)} required minLength={3} />
        </label>
        <label>
          Password
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            minLength={6}
            required={!user}
            placeholder={user ? "Leave blank to keep current password" : ""}
          />
        </label>
        <label>
          Name
          <input value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label>
          Role
          <select value={role} onChange={(event) => changeRole(event.target.value as AdminRole)}>
            {roles.map((item) => (
              <option value={item} key={item}>{item.replace(/_/g, " ")}</option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select value={status} onChange={(event) => setStatus(event.target.value as UserStatus)}>
            {statuses.map((item) => (
              <option value={item} key={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="permissions-panel">
        <div>
          <h3>Permissions</h3>
          <p>Switch modules on or off for this admin user.</p>
        </div>
        <div className="permissions-grid">
          {permissions.map((permission) => (
            <PermissionToggle
              enabled={selectedPermissions.includes(permission.key)}
              key={permission.key}
              onChange={(enabled) => togglePermission(permission.key, enabled)}
              permission={permission}
            />
          ))}
        </div>
      </div>

      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="btn btn-gold" disabled={saving}>{saving ? "Saving..." : "Save User"}</button>
      </div>
    </form>
  );
}
