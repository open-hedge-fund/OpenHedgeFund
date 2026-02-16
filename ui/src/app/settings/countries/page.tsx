"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import { countryApi, CountryData } from "@/lib/api";

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
function CreateCountryModal({
  isOpen,
  onClose,
  onCreateCountry,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreateCountry: (data: Partial<CountryData>) => Promise<void>;
}) {
  const [formData, setFormData] = useState({
    country_code: "",
    country_desc: "",
    country_code_iso_alpha3: "",
    geographic_region: "",
    continent: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await onCreateCountry(formData);
      setFormData({
        country_code: "",
        country_desc: "",
        country_code_iso_alpha3: "",
        geographic_region: "",
        continent: "",
      });
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr.response?.data?.detail || "Failed to create country");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-content">
        <h3>Add New Country</h3>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Country Code</label>
            <input
              className="form-input"
              type="text"
              value={formData.country_code}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, country_code: e.target.value }))
              }
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <input
              className="form-input"
              type="text"
              value={formData.country_desc}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, country_desc: e.target.value }))
              }
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">ISO Alpha-3</label>
            <input
              className="form-input"
              type="text"
              maxLength={3}
              value={formData.country_code_iso_alpha3}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, country_code_iso_alpha3: e.target.value }))
              }
            />
          </div>
          <div className="form-group">
            <label className="form-label">Geographic Region</label>
            <input
              className="form-input"
              type="text"
              value={formData.geographic_region}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, geographic_region: e.target.value }))
              }
            />
          </div>
          <div className="form-group">
            <label className="form-label">Continent</label>
            <input
              className="form-input"
              type="text"
              value={formData.continent}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, continent: e.target.value }))
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
              {isLoading ? "Creating..." : "Add Country"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Edit Modal ─── */
function EditCountryModal({
  isOpen,
  onClose,
  onUpdateCountry,
  country,
}: {
  isOpen: boolean;
  onClose: () => void;
  onUpdateCountry: (id: number, data: Partial<CountryData>) => Promise<void>;
  country?: CountryData;
}) {
  const [formData, setFormData] = useState({
    country_code: "",
    country_desc: "",
    country_code_iso_alpha3: "",
    geographic_region: "",
    continent: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (country && isOpen) {
      setFormData({
        country_code: country.country_code,
        country_desc: country.country_desc,
        country_code_iso_alpha3: country.country_code_iso_alpha3 || "",
        geographic_region: country.geographic_region || "",
        continent: country.continent || "",
      });
    }
  }, [country, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!country) return;
    setIsLoading(true);
    setError(null);
    try {
      await onUpdateCountry(country.id, formData);
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr.response?.data?.detail || "Failed to update country");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-content">
        <h3>Edit Country</h3>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Country Code</label>
            <input
              className="form-input"
              type="text"
              value={formData.country_code}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, country_code: e.target.value }))
              }
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <input
              className="form-input"
              type="text"
              value={formData.country_desc}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, country_desc: e.target.value }))
              }
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">ISO Alpha-3</label>
            <input
              className="form-input"
              type="text"
              maxLength={3}
              value={formData.country_code_iso_alpha3}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, country_code_iso_alpha3: e.target.value }))
              }
            />
          </div>
          <div className="form-group">
            <label className="form-label">Geographic Region</label>
            <input
              className="form-input"
              type="text"
              value={formData.geographic_region}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, geographic_region: e.target.value }))
              }
            />
          </div>
          <div className="form-group">
            <label className="form-label">Continent</label>
            <input
              className="form-input"
              type="text"
              value={formData.continent}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, continent: e.target.value }))
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
              {isLoading ? "Updating..." : "Update Country"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Countries Content ─── */
function CountriesContent() {
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryData | undefined>(
    undefined,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCountries();
  }, []);

  const loadCountries = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await countryApi.getAll();
      setCountries(data);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr.response?.data?.detail || "Failed to load countries");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCountries = countries.filter(
    (country) =>
      country.country_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      country.country_desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (country.country_code_iso_alpha3?.toLowerCase() || "").includes(searchQuery.toLowerCase()),
  );

  const handleCreateCountry = async (data: Partial<CountryData>) => {
    const newCountry = await countryApi.create(data);
    setCountries((prev) => [...prev, newCountry]);
  };

  const handleUpdateCountry = async (id: number, data: Partial<CountryData>) => {
    const updated = await countryApi.update(id, data);
    setCountries((prev) => prev.map((c) => (c.id === id ? updated : c)));
  };

  const handleEditCountry = (country: CountryData) => {
    setSelectedCountry(country);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedCountry(undefined);
  };

  const handleDeleteCountry = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this country?")) {
      try {
        await countryApi.delete(id);
        setCountries((prev) => prev.filter((c) => c.id !== id));
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { detail?: string } } };
        alert(axiosErr.response?.data?.detail || "Failed to delete country");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="loading-screen" style={{ height: "16rem" }}>
        <div className="loading-spinner" />
        <span>Loading countries...</span>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="alert-error" style={{ marginBottom: "var(--spacing-lg)" }}>
          <span>{error}</span>
          <button
            onClick={loadCountries}
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
            <h2>Countries</h2>
            <p>Manage countries for your organization</p>
          </div>
          <button
            className="btn btn-primary btn-add-file"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <PlusIcon size={16} />
            Add Country
          </button>
        </div>

        <input
          className="files-search"
          type="text"
          placeholder="Search countries..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="files-table-wrapper">
        <table className="files-table">
          <thead>
            <tr>
              <th>Country Code</th>
              <th>Description</th>
              <th>ISO Alpha-3</th>
              <th>Geographic Region</th>
              <th>Continent</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCountries.map((country) => (
              <tr key={country.id}>
                <td>{country.country_code}</td>
                <td>{country.country_desc}</td>
                <td>{country.country_code_iso_alpha3 || "-"}</td>
                <td>{country.geographic_region || "-"}</td>
                <td>{country.continent || "-"}</td>
                <td>
                  {country.is_active && (
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
                <td>
                  <div className="file-actions">
                    <button
                      className="file-action-btn file-action-edit"
                      onClick={() => handleEditCountry(country)}
                      title="Edit country"
                    >
                      <EditIcon />
                    </button>
                    <button
                      className="file-action-btn file-action-delete"
                      onClick={() => handleDeleteCountry(country.id)}
                      title="Delete country"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredCountries.length === 0 && (
          <div className="files-empty">
            <p>No countries found matching your search.</p>
          </div>
        )}
      </div>

      <CreateCountryModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateCountry={handleCreateCountry}
      />

      <EditCountryModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onUpdateCountry={handleUpdateCountry}
        country={selectedCountry}
      />
    </div>
  );
}

export default function CountriesPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <CountriesContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
