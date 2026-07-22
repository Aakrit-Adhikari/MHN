"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/State";
import { UserForm, type UserPayload } from "@/components/UserForm";
import { UserTable } from "@/components/UserTable";
import { apiRequest, getStoredToken } from "@/lib/api";
import { useApiData } from "@/lib/useApiData";
import type { Permission, User } from "@/types/api";

export default function UsersPage() {
  const users = useApiData<User[]>("/admin/users", true);
  const permissions = useApiData<Permission[]>("/admin/permissions", true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");

  function openCreate() {
    setEditing(null);
    setActionError("");
    setOpen(true);
  }

  function openEdit(user: User) {
    setEditing(user);
    setActionError("");
    setOpen(true);
  }

  async function saveUser(payload: UserPayload) {
    setSaving(true);
    setActionError("");

    try {
      await apiRequest(editing ? `/admin/users/${editing.id}` : "/admin/users", {
        method: editing ? "PATCH" : "POST",
        token: getStoredToken(),
        body: JSON.stringify(payload)
      });
      setOpen(false);
      users.reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to save user.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(user: User) {
    setActionError("");

    try {
      await apiRequest(`/admin/users/${user.id}`, {
        method: "PATCH",
        token: getStoredToken(),
        body: JSON.stringify({ status: user.status === "ACTIVE" ? "DISABLED" : "ACTIVE" })
      });
      users.reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to update user status.");
    }
  }

  async function deleteUser(user: User) {
    if (!window.confirm(`Delete admin user "${user.username}"?`)) return;
    setActionError("");

    try {
      await apiRequest(`/admin/users/${user.id}`, {
        method: "DELETE",
        token: getStoredToken()
      });
      users.reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to delete user.");
    }
  }

  const loading = users.loading || permissions.loading;
  const error = users.error || permissions.error;

  return (
    <>
      <PageHeader
        title="Users & Roles"
        actions={<button className="btn btn-gold" onClick={openCreate}><Plus className="h-4 w-4" /> New User</button>}
      />

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState title="Users could not be loaded" /> : null}
      {actionError ? <div className="mb-4"><ErrorState title="Action failed" message={actionError} /></div> : null}

      {!loading && !error && !users.data?.length ? (
        <EmptyState title="No admin users found" />
      ) : null}

      {!loading && !error && users.data?.length ? (
        <UserTable users={users.data} onEdit={openEdit} onToggleStatus={toggleStatus} onDelete={deleteUser} />
      ) : null}

      {open ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-shell">
            <button type="button" className="modal-close-float" onClick={() => setOpen(false)} aria-label="Close">
              <X className="h-5 w-5" />
            </button>
            <UserForm
              user={editing}
              permissions={permissions.data ?? []}
              saving={saving}
              onCancel={() => setOpen(false)}
              onSubmit={saveUser}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
