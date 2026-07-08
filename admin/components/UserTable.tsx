import { Edit, Power, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/format";
import type { User } from "@/types/api";

export function UserTable({
  users,
  onEdit,
  onToggleStatus,
  onDelete
}: {
  users: User[];
  onEdit: (user: User) => void;
  onToggleStatus: (user: User) => void;
  onDelete: (user: User) => void;
}) {
  return (
    <div className="card">
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>Permissions</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="t-name">{user.name || user.username}</div>
                  <div className="t-meta">@{user.username}</div>
                </td>
                <td><span className="badge badge-blue">{user.role.replace(/_/g, " ")}</span></td>
                <td>
                  <span className={`badge ${user.status === "ACTIVE" ? "badge-green" : "badge-grey"}`}>
                    {user.status}
                  </span>
                </td>
                <td>{user.permissions.length} modules</td>
                <td>{user.createdAt ? formatDate(user.createdAt) : "Not set"}</td>
                <td>
                  <div className="flex justify-end gap-2">
                    <button className="btn btn-secondary" onClick={() => onEdit(user)}>
                      <Edit className="h-4 w-4" /> Edit
                    </button>
                    <button className="btn btn-secondary" onClick={() => onToggleStatus(user)}>
                      <Power className="h-4 w-4" /> {user.status === "ACTIVE" ? "Disable" : "Enable"}
                    </button>
                    <button className="btn btn-ghost text-red-700 hover:text-red-700" onClick={() => onDelete(user)}>
                      <Trash2 className="h-4 w-4" /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
