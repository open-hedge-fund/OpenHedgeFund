"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import { continentApi, ContinentData } from "@/lib/api";

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
function CreateContinentModal({
  isOpen,
  onClose,
  onCreateContinent,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreateContinent: (data: Partial<ContinentData>) => Promise<void>;
}) {
  const [formData, setFormData] = useState({
    continent_code: "",
    continent_desc: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await onCreateContinent(formData);
      setFormData({ continent_code: "", continent_desc: "" });
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr.response?.data?.detail || "Failed to create continent");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-content">
        <h3>Add New Continent</h3>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Continent Code</label>
            <input
              className="form-input"
              type="text"
              value={formData.continent_code}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, continent_code: e.target.value }))
              }
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <input
              className="form-input"
              type="text"
              value={formData.continent_desc}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, continent_desc: e.target.value }))
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
              {isLoading ? "Creating..." : "Add Continent"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Edit Modal ─── */
function EditContinentModal({
  isOpen,
  onClose,
  onUpdateContinent,
  continent,
}: {
  isOpen: boolean;
  onClose: () => void;
  onUpdateContinent: (id: number, data: Partial<ContinentData>) => Promise<void>;
  continent?: ContinentData;
}) {
  const [formData, setFormData] = useState({
    continent_code: "",
    continent_desc: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (continent && isOpen) {
      setFormData({
        continent_code: continent.continent_code,
        continent_desc: continent.continent_desc || "",
      });
    }
  }, [continent, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!continent) return;
    setIsLoading(true);
    setError(null);
    try {
      await onUpdateContinent(continent.id, formData);
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr.response?.data?.detail || "Failed to update continent");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-content">
        <h3>Edit Continent</h3>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Continent Code</label>
            <input
              className="form-input"
              type="text"
              value={formData.continent_code}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, continent_code: e.target.value }))
              }
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <input
              className="form-input"
              type="text"
              value={formData.continent_desc}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, continent_desc: e.target.value }))
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
              {isLoading ? "Updating..." : "Update Continent"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Continents Content ─── */
function ContinentsContent() {
  const [continents, setContinents] = useState<ContinentData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedContinent, setSelectedContinent] = useState<ContinentData | undefined>(
    undefined,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadContinents();
  }, []);

  const loadContinents = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await continentApi.getAll();
      setContinents(data);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr.response?.data?.detail || "Failed to load continents");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredContinents = continents.filter(
    (continent) =>
      continent.continent_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (continent.continent_desc?.toLowerCase() || "").includes(searchQuery.toLowerCase()),
  );

  const handleCreateContinent = async (data: Partial<ContinentData>) => {
    const newContinent = await continentApi.create(data);
    setContinents((prev) => [...prev, newContinent]);
  };

  const handleUpdateContinent = async (id: number, data: Partial<ContinentData>) => {
    const updated = await continentApi.update(id, data);
    setContinents((prev) => prev.map((c) => (c.id === id ? updated : c)));
  };

  const handleEditContinent = (continent: ContinentData) => {
    setSelectedContinent(continent);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedContinent(undefined);
  };

  const handleDeleteContinent = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this continent?")) {
      try {
        await continentApi.delete(id);
        setContinents((prev) => prev.filter((c) => c.id !== id));
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { detail?: string } } };
        alert(axiosErr.response?.data?.detail || "Failed to delete continent");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="loading-screen" style={{ height: "16rem" }}>
        <div className="loading-spinner" />
        <span>Loading continents...</span>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="alert-error" style={{ marginBottom: "var(--spacing-lg)" }}>
          <span>{error}</span>
          <button
            onClick={loadContinents}
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
            <h2>Continents</h2>
            <p>Manage continent definitions</p>
          </div>
          <button
            className="btn btn-primary btn-add-file"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <PlusIcon size={16} />
            Add Continent
          </button>
        </div>

        <input
          className="files-search"
          type="text"
          placeholder="Search continents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="files-table-wrapper">
        <table className="files-table">
          <thead>
            <tr>
              <th>Continent Code</th>
              <th>Description</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredContinents.map((continent) => (
              <tr key={continent.id}>
                <td>{continent.continent_code}</td>
                <td>{continent.continent_desc || "-"}</td>
                <td>
                  {continent.is_active && (
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
                <td>{formatDate(continent.created_at)}</td>
                <td>
                  <div className="file-actions">
                    <button
                      className="file-action-btn file-action-edit"
                      onClick={() => handleEditContinent(continent)}
                      title="Edit continent"
                    >
                      <EditIcon />
                    </button>
                    <button
                      className="file-action-btn file-action-delete"
                      onClick={() => handleDeleteContinent(continent.id)}
                      title="Delete continent"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredContinents.length === 0 && (
          <div className="files-empty">
            <p>No continents found matching your search.</p>
          </div>
        )}
      </div>

      <CreateContinentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateContinent={handleCreateContinent}
      />

      <EditContinentModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onUpdateContinent={handleUpdateContinent}
        continent={selectedContinent}
      />
    </div>
  );
}

export default function ContinentsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <ContinentsContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
