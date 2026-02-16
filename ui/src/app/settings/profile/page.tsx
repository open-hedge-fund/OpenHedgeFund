"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { userApi, tenantApi, TenantData } from "@/lib/api";

function ProfileContent() {
  const { user, refreshUser } = useAuth();
  const isAdmin = user?.is_superuser || user?.role === "admin";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [tenant, setTenant] = useState<TenantData | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || "");
      setLastName(user.last_name || "");
    }
  }, [user]);

  useEffect(() => {
    tenantApi.getMyTenant().then((t) => {
      setTenant(t);
      setOrgName(t.name);
    }).catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(null);
    setError(null);

    try {
      await userApi.updateProfile({
        first_name: firstName,
        last_name: lastName,
      });

      if (isAdmin && tenant) {
        await tenantApi.updateMyTenant({ name: orgName });
      }

      await refreshUser();
      setSuccess("Profile updated successfully.");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr.response?.data?.detail || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {success && <div className="alert-success">{success}</div>}
      {error && <div className="alert-error">{error}</div>}

      <div className="profile-page-card">
        <h2>Edit Profile</h2>
        <p>Update your personal information and organization settings.</p>

        <form onSubmit={handleSave}>
          <div className="profile-section-label">Personal Information</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input
                className="form-input"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input
                className="form-input"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              value={user?.email || ""}
              disabled
            />
          </div>

          <div className="profile-section-label">Organization</div>
          <div className="form-group">
            <label className="form-label">Organization Name</label>
            <input
              className="form-input"
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Organization name"
              disabled={!isAdmin}
            />
            {!isAdmin && (
              <p className="profile-disabled-hint">
                Only admins can update the organization name.
              </p>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary profile-save-btn"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <ProfileContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
