"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import { portfolioApi, PortfolioData } from "@/lib/api";

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
function CreatePortfolioModal({
  isOpen,
  onClose,
  onCreatePortfolio,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreatePortfolio: (data: Partial<PortfolioData>) => Promise<void>;
}) {
  const [formData, setFormData] = useState({
    portfolio_code: "",
    portfolio_desc: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await onCreatePortfolio(formData);
      setFormData({ portfolio_code: "", portfolio_desc: "" });
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr.response?.data?.detail || "Failed to create portfolio");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-content">
        <h3>Add New Portfolio</h3>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Portfolio Code</label>
            <input
              className="form-input"
              type="text"
              value={formData.portfolio_code}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, portfolio_code: e.target.value }))
              }
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <input
              className="form-input"
              type="text"
              value={formData.portfolio_desc}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, portfolio_desc: e.target.value }))
              }
              required
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
              {isLoading ? "Creating..." : "Add Portfolio"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Edit Modal ─── */
function EditPortfolioModal({
  isOpen,
  onClose,
  onUpdatePortfolio,
  portfolio,
}: {
  isOpen: boolean;
  onClose: () => void;
  onUpdatePortfolio: (id: number, data: Partial<PortfolioData>) => Promise<void>;
  portfolio?: PortfolioData;
}) {
  const [formData, setFormData] = useState({
    portfolio_code: "",
    portfolio_desc: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (portfolio && isOpen) {
      setFormData({
        portfolio_code: portfolio.portfolio_code,
        portfolio_desc: portfolio.portfolio_desc || "",
      });
    }
  }, [portfolio, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portfolio) return;
    setIsLoading(true);
    setError(null);
    try {
      await onUpdatePortfolio(portfolio.id, formData);
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr.response?.data?.detail || "Failed to update portfolio");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-content">
        <h3>Edit Portfolio</h3>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Portfolio Code</label>
            <input
              className="form-input"
              type="text"
              value={formData.portfolio_code}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, portfolio_code: e.target.value }))
              }
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <input
              className="form-input"
              type="text"
              value={formData.portfolio_desc}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, portfolio_desc: e.target.value }))
              }
              required
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
              {isLoading ? "Updating..." : "Update Portfolio"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Portfolios Content ─── */
function PortfoliosContent() {
  const [portfolios, setPortfolios] = useState<PortfolioData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPortfolio, setSelectedPortfolio] = useState<PortfolioData | undefined>(
    undefined,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPortfolios();
  }, []);

  const loadPortfolios = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await portfolioApi.getAll();
      setPortfolios(data);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr.response?.data?.detail || "Failed to load portfolios");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPortfolios = portfolios.filter(
    (portfolio) =>
      portfolio.portfolio_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      portfolio.portfolio_desc.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleCreatePortfolio = async (data: Partial<PortfolioData>) => {
    const newPortfolio = await portfolioApi.create(data);
    setPortfolios((prev) => [...prev, newPortfolio]);
  };

  const handleUpdatePortfolio = async (id: number, data: Partial<PortfolioData>) => {
    const updated = await portfolioApi.update(id, data);
    setPortfolios((prev) => prev.map((p) => (p.id === id ? updated : p)));
  };

  const handleEditPortfolio = (portfolio: PortfolioData) => {
    setSelectedPortfolio(portfolio);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedPortfolio(undefined);
  };

  const handleDeletePortfolio = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this portfolio?")) {
      try {
        await portfolioApi.delete(id);
        setPortfolios((prev) => prev.filter((p) => p.id !== id));
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { detail?: string } } };
        alert(axiosErr.response?.data?.detail || "Failed to delete portfolio");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="loading-screen" style={{ height: "16rem" }}>
        <div className="loading-spinner" />
        <span>Loading portfolios...</span>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="alert-error" style={{ marginBottom: "var(--spacing-lg)" }}>
          <span>{error}</span>
          <button
            onClick={loadPortfolios}
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
            <h2>Portfolios</h2>
            <p>Manage portfolio definitions for grouping positions.</p>
          </div>
          <button
            className="btn btn-primary btn-add-file"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <PlusIcon size={16} />
            Add Portfolio
          </button>
        </div>

        <input
          className="files-search"
          type="text"
          placeholder="Search portfolios..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="files-table-wrapper">
        <table className="files-table">
          <thead>
            <tr>
              <th>Portfolio Code</th>
              <th>Description</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPortfolios.map((portfolio) => (
              <tr key={portfolio.id}>
                <td>{portfolio.portfolio_code}</td>
                <td>{portfolio.portfolio_desc}</td>
                <td>
                  {portfolio.is_active && (
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
                <td>{formatDate(portfolio.created_at)}</td>
                <td>
                  <div className="file-actions">
                    <button
                      className="file-action-btn file-action-edit"
                      onClick={() => handleEditPortfolio(portfolio)}
                      title="Edit portfolio"
                    >
                      <EditIcon />
                    </button>
                    <button
                      className="file-action-btn file-action-delete"
                      onClick={() => handleDeletePortfolio(portfolio.id)}
                      title="Delete portfolio"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredPortfolios.length === 0 && (
          <div className="files-empty">
            <p>No portfolios found matching your search.</p>
          </div>
        )}
      </div>

      <CreatePortfolioModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreatePortfolio={handleCreatePortfolio}
      />

      <EditPortfolioModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onUpdatePortfolio={handleUpdatePortfolio}
        portfolio={selectedPortfolio}
      />
    </div>
  );
}

export default function PortfoliosPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <PortfoliosContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
