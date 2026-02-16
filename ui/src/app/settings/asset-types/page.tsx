"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import { assetTypeApi, AssetTypeData } from "@/lib/api";

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

function EditIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function PlusIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

/* ─── Create Modal ─── */
function CreateAssetTypeModal({
  isOpen,
  onClose,
  onCreateAssetType,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreateAssetType: (data: Partial<AssetTypeData>) => Promise<void>;
}) {
  const [formData, setFormData] = useState({
    asset_type_code: "",
    asset_type_desc: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await onCreateAssetType(formData);
      setFormData({ asset_type_code: "", asset_type_desc: "" });
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr.response?.data?.detail || "Failed to create asset type");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-content">
        <h3>Add New Asset Type</h3>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Asset Type Code</label>
            <input
              className="form-input"
              type="text"
              value={formData.asset_type_code}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, asset_type_code: e.target.value }))
              }
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <input
              className="form-input"
              type="text"
              value={formData.asset_type_desc}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, asset_type_desc: e.target.value }))
              }
            />
          </div>

          {error && <div className="modal-error">{error}</div>}

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? "Creating..." : "Add Asset Type"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Edit Modal ─── */
function EditAssetTypeModal({
  isOpen,
  onClose,
  onUpdateAssetType,
  assetType,
}: {
  isOpen: boolean;
  onClose: () => void;
  onUpdateAssetType: (id: number, data: Partial<AssetTypeData>) => Promise<void>;
  assetType?: AssetTypeData;
}) {
  const [formData, setFormData] = useState({
    asset_type_code: "",
    asset_type_desc: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (assetType && isOpen) {
      setFormData({
        asset_type_code: assetType.asset_type_code,
        asset_type_desc: assetType.asset_type_desc || "",
      });
    }
  }, [assetType, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetType) return;
    setIsLoading(true);
    setError(null);
    try {
      await onUpdateAssetType(assetType.id, formData);
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr.response?.data?.detail || "Failed to update asset type");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-content">
        <h3>Edit Asset Type</h3>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Asset Type Code</label>
            <input
              className="form-input"
              type="text"
              value={formData.asset_type_code}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, asset_type_code: e.target.value }))
              }
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <input
              className="form-input"
              type="text"
              value={formData.asset_type_desc}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, asset_type_desc: e.target.value }))
              }
            />
          </div>

          {error && <div className="modal-error">{error}</div>}

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? "Updating..." : "Update Asset Type"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Asset Types Content ─── */
function AssetTypesContent() {
  const [assetTypes, setAssetTypes] = useState<AssetTypeData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAssetType, setSelectedAssetType] = useState<AssetTypeData | undefined>(
    undefined,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAssetTypes();
  }, []);

  const loadAssetTypes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await assetTypeApi.getAll();
      setAssetTypes(data);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr.response?.data?.detail || "Failed to load asset types");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAssetTypes = assetTypes.filter(
    (assetType) =>
      assetType.asset_type_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (assetType.asset_type_desc?.toLowerCase() || "").includes(searchQuery.toLowerCase()),
  );

  const handleCreateAssetType = async (data: Partial<AssetTypeData>) => {
    const newAssetType = await assetTypeApi.create(data);
    setAssetTypes((prev) => [...prev, newAssetType]);
  };

  const handleUpdateAssetType = async (id: number, data: Partial<AssetTypeData>) => {
    const updated = await assetTypeApi.update(id, data);
    setAssetTypes((prev) => prev.map((at) => (at.id === id ? updated : at)));
  };

  const handleEditAssetType = (assetType: AssetTypeData) => {
    setSelectedAssetType(assetType);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedAssetType(undefined);
  };

  const handleDeleteAssetType = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this asset type?")) {
      try {
        await assetTypeApi.delete(id);
        setAssetTypes((prev) => prev.filter((at) => at.id !== id));
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { detail?: string } } };
        alert(axiosErr.response?.data?.detail || "Failed to delete asset type");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="loading-screen" style={{ height: "16rem" }}>
        <div className="loading-spinner" />
        <span>Loading asset types...</span>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="alert-error" style={{ marginBottom: "var(--spacing-lg)" }}>
          <span>{error}</span>
          <button
            onClick={loadAssetTypes}
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
            <h2>Asset Types</h2>
            <p>Manage asset type classifications for your portfolio securities.</p>
          </div>
          <button
            className="btn btn-primary btn-add-file"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <PlusIcon size={16} />
            Add Asset Type
          </button>
        </div>

        <input
          className="files-search"
          type="text"
          placeholder="Search asset types..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="files-table-wrapper">
        <table className="files-table">
          <thead>
            <tr>
              <th>Asset Type</th>
              <th>Description</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssetTypes.map((assetType) => (
              <tr key={assetType.id}>
                <td>{assetType.asset_type_code}</td>
                <td>{assetType.asset_type_desc || "-"}</td>
                <td>
                  {assetType.is_active && (
                    <span
                      style={{
                        display: "inline-block",
                        padding: "0.25rem 0.75rem",
                        borderRadius: "9999px",
                        fontSize: "0.75rem",
                        fontWeight: "500",
                        backgroundColor: "#D1FAE5",
                        color: "#065F46",
                      }}
                    >
                      Active
                    </span>
                  )}
                </td>
                <td>{formatDate(assetType.created_at)}</td>
                <td>
                  <div className="file-actions">
                    <button
                      className="file-action-btn file-action-edit"
                      onClick={() => handleEditAssetType(assetType)}
                      title="Edit asset type"
                    >
                      <EditIcon />
                    </button>
                    <button
                      className="file-action-btn file-action-delete"
                      onClick={() => handleDeleteAssetType(assetType.id)}
                      title="Delete asset type"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredAssetTypes.length === 0 && (
          <div className="files-empty">
            <p>No asset types found matching your search.</p>
          </div>
        )}
      </div>

      <CreateAssetTypeModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateAssetType={handleCreateAssetType}
      />

      <EditAssetTypeModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onUpdateAssetType={handleUpdateAssetType}
        assetType={selectedAssetType}
      />
    </div>
  );
}

export default function AssetTypesPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <AssetTypesContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
