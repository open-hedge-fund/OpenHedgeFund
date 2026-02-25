"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import { sectorApi, SectorData } from "@/lib/api";

function EditIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function CreateSectorModal({
  isOpen,
  onClose,
  onCreateSector,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreateSector: (data: Partial<SectorData>) => Promise<void>;
}) {
  const [formData, setFormData] = useState({ sector_code: "", sector_desc: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await onCreateSector(formData);
      setFormData({ sector_code: "", sector_desc: "" });
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr.response?.data?.detail || "Failed to create sector");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-content">
        <h3>Add New Sector</h3>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Sector Code</label>
            <input className="form-input" type="text" value={formData.sector_code} onChange={(e) => setFormData((prev) => ({ ...prev, sector_code: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <input className="form-input" type="text" value={formData.sector_desc} onChange={(e) => setFormData((prev) => ({ ...prev, sector_desc: e.target.value }))} required />
          </div>
          {error && <div className="modal-error">{error}</div>}
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={isLoading}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>{isLoading ? "Creating..." : "Add Sector"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditSectorModal({
  isOpen,
  onClose,
  onUpdateSector,
  sector,
}: {
  isOpen: boolean;
  onClose: () => void;
  onUpdateSector: (id: number, data: Partial<SectorData>) => Promise<void>;
  sector?: SectorData;
}) {
  const [formData, setFormData] = useState({ sector_code: "", sector_desc: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sector && isOpen) {
      setFormData({ sector_code: sector.sector_code, sector_desc: sector.sector_desc });
    }
  }, [sector, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sector) return;
    setIsLoading(true);
    setError(null);
    try {
      await onUpdateSector(sector.id, formData);
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr.response?.data?.detail || "Failed to update sector");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-content">
        <h3>Edit Sector</h3>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Sector Code</label>
            <input className="form-input" type="text" value={formData.sector_code} onChange={(e) => setFormData((prev) => ({ ...prev, sector_code: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <input className="form-input" type="text" value={formData.sector_desc} onChange={(e) => setFormData((prev) => ({ ...prev, sector_desc: e.target.value }))} required />
          </div>
          {error && <div className="modal-error">{error}</div>}
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={isLoading}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>{isLoading ? "Updating..." : "Update Sector"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SectorsContent() {
  const [sectors, setSectors] = useState<SectorData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSector, setSelectedSector] = useState<SectorData | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSectors();
  }, []);

  const loadSectors = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await sectorApi.getAll();
      setSectors(data);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr.response?.data?.detail || "Failed to load sectors");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSectors = sectors.filter(
    (s) =>
      s.sector_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.sector_desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateSector = async (data: Partial<SectorData>) => {
    const newSector = await sectorApi.create(data);
    setSectors((prev) => [...prev, newSector]);
  };

  const handleUpdateSector = async (id: number, data: Partial<SectorData>) => {
    const updated = await sectorApi.update(id, data);
    setSectors((prev) => prev.map((s) => (s.id === id ? updated : s)));
  };

  const handleEditSector = (sector: SectorData) => {
    setSelectedSector(sector);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedSector(undefined);
  };

  const handleDeleteSector = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this sector?")) {
      try {
        await sectorApi.delete(id);
        setSectors((prev) => prev.filter((s) => s.id !== id));
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { detail?: string } } };
        alert(axiosErr.response?.data?.detail || "Failed to delete sector");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="loading-screen" style={{ height: "16rem" }}>
        <div className="loading-spinner" />
        <span>Loading sectors...</span>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="alert-error" style={{ marginBottom: "var(--spacing-lg)" }}>
          <span>{error}</span>
          <button onClick={loadSectors} style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--color-error)", cursor: "pointer", textDecoration: "underline", fontSize: "var(--font-size-sm)" }}>
            Try again
          </button>
        </div>
      )}

      <div className="files-card">
        <div className="files-header">
          <div>
            <h2>Sectors</h2>
            <p>Manage sectors for your organization</p>
          </div>
          <button className="btn btn-primary btn-add-file" onClick={() => setIsCreateModalOpen(true)}>
            <PlusIcon size={16} />
            Add Sector
          </button>
        </div>

        <input className="files-search" type="text" placeholder="Search sectors..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
      </div>

      <div className="files-table-wrapper">
        <table className="files-table">
          <thead>
            <tr>
              <th>Sector Code</th>
              <th>Description</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSectors.map((sector) => (
              <tr key={sector.id}>
                <td>{sector.sector_code}</td>
                <td>{sector.sector_desc}</td>
                <td>
                  {sector.is_active && (
                    <span style={{ display: "inline-block", padding: "0.25rem 0.75rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: "500", backgroundColor: "#D1FAE5", color: "#065F46" }}>
                      Active
                    </span>
                  )}
                </td>
                <td>
                  <div className="file-actions">
                    <button className="file-action-btn file-action-edit" onClick={() => handleEditSector(sector)} title="Edit sector">
                      <EditIcon />
                    </button>
                    <button className="file-action-btn file-action-delete" onClick={() => handleDeleteSector(sector.id)} title="Delete sector">
                      <TrashIcon />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredSectors.length === 0 && (
          <div className="files-empty">
            <p>No sectors found matching your search.</p>
          </div>
        )}
      </div>

      <CreateSectorModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onCreateSector={handleCreateSector} />
      <EditSectorModal isOpen={isEditModalOpen} onClose={handleCloseEditModal} onUpdateSector={handleUpdateSector} sector={selectedSector} />
    </div>
  );
}

export default function SectorsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <SectorsContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
