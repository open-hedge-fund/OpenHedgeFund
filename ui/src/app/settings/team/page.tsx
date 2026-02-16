"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { userApi, UserData } from "@/lib/api";
import { TeamIcon } from "@/components/icons/SidebarIcons";

function TeamContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = user?.is_superuser || user?.role === "admin";

  useEffect(() => {
    if (user && !isAdmin) {
      router.push("/");
      return;
    }
    if (user) {
      loadUsers();
    }
  }, [user, isAdmin, router]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await userApi.getUsers();
      setUsers(data);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr.response?.data?.detail || "Failed to load team members");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: "member" | "admin") => {
    try {
      const updated = await userApi.updateUserRole(userId, newRole);
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      alert(axiosErr.response?.data?.detail || "Failed to update role");
    }
  };

  if (!isAdmin) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="loading-screen" style={{ height: "16rem" }}>
        <div className="loading-spinner" />
        <span>Loading team members...</span>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="alert-error" style={{ marginBottom: "var(--spacing-lg)" }}>
          <span>{error}</span>
          <button
            onClick={loadUsers}
            style={{
              marginLeft: "auto",
              background: "none",
              border: "none",
              color: "var(--color-error)",
              cursor: "pointer",
              textDecoration: "underline",
              fontSize: "var(--font-size-sm)",
            }}
          >
            Try again
          </button>
        </div>
      )}

      <div className="files-card">
        <div className="files-header">
          <div>
            <h2>Team Members</h2>
            <p>Manage your team and assign roles</p>
          </div>
        </div>
      </div>

      <div className="files-table-wrapper">
        <table className="files-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((member) => {
              const isCurrentUser = member.id === user?.id;
              const displayName =
                [member.first_name, member.last_name].filter(Boolean).join(" ") ||
                member.email.split("@")[0];

              return (
                <tr key={member.id}>
                  <td>
                    <div className="file-name-cell">
                      <TeamIcon size={18} />
                      <span>{displayName}</span>
                    </div>
                  </td>
                  <td>{member.email}</td>
                  <td>
                    <span
                      className={`role-badge role-badge-${member.is_superuser ? "superadmin" : member.role}`}
                    >
                      {member.is_superuser ? "Superadmin" : member.role === "admin" ? "Admin" : "Member"}
                    </span>
                  </td>
                  <td>
                    {member.is_superuser ? (
                      <span style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)" }}>
                        --
                      </span>
                    ) : (
                      <select
                        className="form-select"
                        value={member.role}
                        onChange={(e) =>
                          handleRoleChange(member.id, e.target.value as "member" | "admin")
                        }
                        disabled={isCurrentUser}
                        style={{ width: "auto", minWidth: "120px" }}
                        title={isCurrentUser ? "Cannot change your own role" : "Change role"}
                      >
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                      </select>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="files-empty">
            <p>No team members found.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TeamPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <TeamContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
