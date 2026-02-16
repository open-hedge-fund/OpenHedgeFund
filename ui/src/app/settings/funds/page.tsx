"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import { fundApi, FundData } from "@/lib/api";

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

function FundsContent() {
  const [items, setItems] = useState<FundData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FundData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    try {
      setIsLoading(true);
      const data = await fundApi.getAll();
      setItems(data);
    } catch (err: any) {
      setError(err.message || "Failed to load funds");
    } finally {
      setIsLoading(false);
    }
  }

  const filteredItems = items.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.fund_code?.toLowerCase().includes(q) ||
      item.fund_description?.toLowerCase().includes(q)
    );
  });

  async function handleCreate(data: Partial<FundData>) {
    try {
      setError("");
      await fundApi.create(data);
      await loadItems();
      setIsCreateModalOpen(false);
    } catch (err: any) {
      setError(err.message || "Failed to create fund");
      throw err;
    }
  }

  async function handleUpdate(id: number, data: Partial<FundData>) {
    try {
      setError("");
      await fundApi.update(id, data);
      await loadItems();
      setIsEditModalOpen(false);
      setSelectedItem(null);
    } catch (err: any) {
      setError(err.message || "Failed to update fund");
      throw err;
    }
  }

  function handleEdit(item: FundData) {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  }

  function handleCloseEdit() {
    setIsEditModalOpen(false);
    setSelectedItem(null);
    setError("");
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Are you sure you want to delete this fund?")) {
      return;
    }
    try {
      setError("");
      await fundApi.delete(id);
      await loadItems();
    } catch (err: any) {
      setError(err.message || "Failed to delete fund");
    }
  }

  return (
    <div>
      <div className="files-card">
        <div className="files-header">
          <div>
            <h2>Funds</h2>
            <p>Manage your investment funds and portfolio allocations</p>
          </div>
          <button className="btn btn-primary btn-add-file" onClick={() => setIsCreateModalOpen(true)}>
            <PlusIcon size={16} />
            <span>Add Fund</span>
          </button>
        </div>

        <div className="files-search">
          <input
            type="text"
            placeholder="Search funds by code or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {error && <div className="modal-error">{error}</div>}

        <div className="files-table-wrapper">
          {isLoading ? (
            <div className="files-empty">Loading...</div>
          ) : filteredItems.length === 0 ? (
            <div className="files-empty">No funds found</div>
          ) : (
            <table className="files-table">
              <thead>
                <tr>
                  <th>FUND</th>
                  <th>DESCRIPTION</th>
                  <th>STATUS</th>
                  <th>LOCATION</th>
                  <th>TYPE</th>
                  <th>CREATED</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td>{item.fund_code}</td>
                    <td>{item.fund_description}</td>
                    <td>
                      <span style={{ display: "inline-flex", padding: "0.125rem 0.5rem", fontSize: "0.75rem", fontWeight: 600, borderRadius: "9999px", backgroundColor: item.is_active ? "#D1FAE5" : "#FEE2E2", color: item.is_active ? "#065F46" : "#991B1B" }}>
                        {item.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: "inline-flex", padding: "0.125rem 0.5rem", fontSize: "0.75rem", fontWeight: 600, borderRadius: "0.25rem", backgroundColor: item.is_offshore ? "#FEF3C7" : "#DBEAFE", color: item.is_offshore ? "#92400E" : "#1E40AF" }}>
                        {item.is_offshore ? "Offshore" : "Domestic"}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: "inline-flex", padding: "0.125rem 0.5rem", fontSize: "0.75rem", fontWeight: 600, borderRadius: "0.25rem", backgroundColor: item.is_master ? "#D1FAE5" : "#E0E7FF", color: item.is_master ? "#065F46" : "#3730A3" }}>
                        {item.is_master ? "Master" : "Feeder"}
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

function CreateModal({ onClose, onCreate, error }: { onClose: () => void; onCreate: (data: Partial<FundData>) => Promise<void>; error: string }) {
  const [formData, setFormData] = useState<Partial<FundData>>({
    fund_code: "",
    fund_description: "",
    is_active: true,
    is_offshore: false,
    is_master: false,
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
        <h3>Add Fund</h3>
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Fund Code</label>
            <input
              type="text"
              className="form-input"
              value={formData.fund_code || ""}
              onChange={(e) => setFormData({ ...formData, fund_code: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <input
              type="text"
              className="form-input"
              value={formData.fund_description || ""}
              onChange={(e) => setFormData({ ...formData, fund_description: e.target.value })}
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

          <div className="form-group">
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={formData.is_offshore || false}
                onChange={(e) => setFormData({ ...formData, is_offshore: e.target.checked })}
              />
              <span className="form-label" style={{ margin: 0 }}>Offshore</span>
            </label>
          </div>

          <div className="form-group">
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={formData.is_master || false}
                onChange={(e) => setFormData({ ...formData, is_master: e.target.checked })}
              />
              <span className="form-label" style={{ margin: 0 }}>Master</span>
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

function EditModal({ item, onClose, onUpdate, error }: { item: FundData; onClose: () => void; onUpdate: (id: number, data: Partial<FundData>) => Promise<void>; error: string }) {
  const [formData, setFormData] = useState<Partial<FundData>>({
    fund_code: item.fund_code,
    fund_description: item.fund_description,
    is_active: item.is_active,
    is_offshore: item.is_offshore,
    is_master: item.is_master,
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
        <h3>Edit Fund</h3>
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Fund Code</label>
            <input
              type="text"
              className="form-input"
              value={formData.fund_code || ""}
              onChange={(e) => setFormData({ ...formData, fund_code: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <input
              type="text"
              className="form-input"
              value={formData.fund_description || ""}
              onChange={(e) => setFormData({ ...formData, fund_description: e.target.value })}
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

          <div className="form-group">
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={formData.is_offshore || false}
                onChange={(e) => setFormData({ ...formData, is_offshore: e.target.checked })}
              />
              <span className="form-label" style={{ margin: 0 }}>Offshore</span>
            </label>
          </div>

          <div className="form-group">
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={formData.is_master || false}
                onChange={(e) => setFormData({ ...formData, is_master: e.target.checked })}
              />
              <span className="form-label" style={{ margin: 0 }}>Master</span>
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

export default function FundsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <FundsContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
