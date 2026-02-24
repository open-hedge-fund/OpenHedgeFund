"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import { strategyApi, StrategyData } from "@/lib/api";

function EditIcon({ size = 16 }: { size?: number }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>);
}

function TrashIcon({ size = 16 }: { size?: number }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>);
}

function PlusIcon({ size = 16 }: { size?: number }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>);
}

function formatDate(d: string | null): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
}

function StrategiesContent() {
  const [items, setItems] = useState<StrategyData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StrategyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    try {
      setIsLoading(true);
      const data = await strategyApi.getAll();
      setItems(data);
    } catch (err: any) {
      setError(err.message || "Failed to load strategies");
    } finally {
      setIsLoading(false);
    }
  }

  const filteredItems = items.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.strategy_code?.toLowerCase().includes(q) ||
      item.strategy_description?.toLowerCase().includes(q)
    );
  });

  async function handleCreate(data: Partial<StrategyData>) {
    try {
      setError("");
      await strategyApi.create(data);
      await loadItems();
      setIsCreateModalOpen(false);
    } catch (err: any) {
      setError(err.message || "Failed to create strategy");
      throw err;
    }
  }

  async function handleUpdate(id: number, data: Partial<StrategyData>) {
    try {
      setError("");
      await strategyApi.update(id, data);
      await loadItems();
      setIsEditModalOpen(false);
      setSelectedItem(null);
    } catch (err: any) {
      setError(err.message || "Failed to update strategy");
      throw err;
    }
  }

  function handleEdit(item: StrategyData) {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  }

  function handleCloseEdit() {
    setIsEditModalOpen(false);
    setSelectedItem(null);
    setError("");
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Are you sure you want to delete this strategy?")) {
      return;
    }
    try {
      setError("");
      await strategyApi.delete(id);
      await loadItems();
    } catch (err: any) {
      setError(err.message || "Failed to delete strategy");
    }
  }

  return (
    <div>
      <div className="files-card">
        <div className="files-header">
          <div>
            <h2>Strategies</h2>
            <p>Manage investment strategies for categorizing holdings</p>
          </div>
          <button className="btn btn-primary btn-add-file" onClick={() => setIsCreateModalOpen(true)}>
            <PlusIcon size={16} />
            <span>Add Strategy</span>
          </button>
        </div>

        <div className="files-search">
          <input
            type="text"
            placeholder="Search strategies by code or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {error && <div className="modal-error">{error}</div>}

        <div className="files-table-wrapper">
          {isLoading ? (
            <div className="files-empty">Loading...</div>
          ) : filteredItems.length === 0 ? (
            <div className="files-empty">No strategies found</div>
          ) : (
            <table className="files-table">
              <thead>
                <tr>
                  <th>CODE</th>
                  <th>DESCRIPTION</th>
                  <th>STATUS</th>
                  <th>CREATED</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td>{item.strategy_code}</td>
                    <td>{item.strategy_description}</td>
                    <td>
                      <span style={{ display: "inline-flex", padding: "0.125rem 0.5rem", fontSize: "0.75rem", fontWeight: 600, borderRadius: "9999px", backgroundColor: item.is_active ? "#D1FAE5" : "#FEE2E2", color: item.is_active ? "#065F46" : "#991B1B" }}>
                        {item.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>{formatDate(item.created_at)}</td>
                    <td>
                      <div className="file-actions">
                        <button className="file-action-btn file-action-edit" onClick={() => handleEdit(item)}>
                          <EditIcon size={16} />
                        </button>
                        <button className="file-action-btn file-action-delete" onClick={() => handleDelete(item.id)}>
                          <TrashIcon size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isCreateModalOpen && (
        <CreateModal
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleCreate}
          error={error}
        />
      )}

      {isEditModalOpen && selectedItem && (
        <EditModal
          item={selectedItem}
          onClose={handleCloseEdit}
          onUpdate={handleUpdate}
          error={error}
        />
      )}
    </div>
  );
}

function CreateModal({ onClose, onCreate, error }: { onClose: () => void; onCreate: (data: Partial<StrategyData>) => Promise<void>; error: string }) {
  const [formData, setFormData] = useState<Partial<StrategyData>>({
    strategy_code: "",
    strategy_description: "",
    is_active: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onCreate(formData);
    } catch (err) {
      // Error handled in parent
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose}></div>
      <div className="modal-content">
        <h3>Add Strategy</h3>
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Strategy Code</label>
            <input
              type="text"
              className="form-input"
              value={formData.strategy_code || ""}
              onChange={(e) => setFormData({ ...formData, strategy_code: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <input
              type="text"
              className="form-input"
              value={formData.strategy_description || ""}
              onChange={(e) => setFormData({ ...formData, strategy_description: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={formData.is_active || false}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
              <span className="form-label" style={{ margin: 0 }}>Active</span>
            </label>
          </div>

          {error && <div className="modal-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditModal({ item, onClose, onUpdate, error }: { item: StrategyData; onClose: () => void; onUpdate: (id: number, data: Partial<StrategyData>) => Promise<void>; error: string }) {
  const [formData, setFormData] = useState<Partial<StrategyData>>({
    strategy_code: item.strategy_code,
    strategy_description: item.strategy_description,
    is_active: item.is_active,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onUpdate(item.id, formData);
    } catch (err) {
      // Error handled in parent
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose}></div>
      <div className="modal-content">
        <h3>Edit Strategy</h3>
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Strategy Code</label>
            <input
              type="text"
              className="form-input"
              value={formData.strategy_code || ""}
              onChange={(e) => setFormData({ ...formData, strategy_code: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <input
              type="text"
              className="form-input"
              value={formData.strategy_description || ""}
              onChange={(e) => setFormData({ ...formData, strategy_description: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={formData.is_active || false}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
              <span className="form-label" style={{ margin: 0 }}>Active</span>
            </label>
          </div>

          {error && <div className="modal-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function StrategiesPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <StrategiesContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
