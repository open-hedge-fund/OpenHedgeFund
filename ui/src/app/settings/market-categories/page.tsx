"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import { marketCategoryApi, MarketCategoryData } from "@/lib/api";

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

function MarketCategoriesContent() {
  const [items, setItems] = useState<MarketCategoryData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MarketCategoryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadItems = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await marketCategoryApi.getAll();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load market categories");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const filteredItems = items.filter((item) => {
    const query = searchQuery.toLowerCase();
    return (
      item.market_category_code?.toLowerCase().includes(query) ||
      item.market_category_desc?.toLowerCase().includes(query)
    );
  });

  const handleCreate = async (data: Partial<MarketCategoryData>) => {
    try {
      await marketCategoryApi.create(data);
      await loadItems();
      setIsCreateModalOpen(false);
    } catch (err) {
      throw err;
    }
  };

  const handleUpdate = async (id: number, data: Partial<MarketCategoryData>) => {
    try {
      await marketCategoryApi.update(id, data);
      await loadItems();
      setIsEditModalOpen(false);
      setSelectedItem(null);
    } catch (err) {
      throw err;
    }
  };

  const handleEdit = (item: MarketCategoryData) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  };

  const handleCloseEdit = () => {
    setIsEditModalOpen(false);
    setSelectedItem(null);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this market category?")) {
      try {
        await marketCategoryApi.delete(id);
        await loadItems();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to delete market category");
      }
    }
  };

  return (
    <div>
      <div className="files-card">
        <div className="files-header">
          <div>
            <h2>Market Categories</h2>
            <p>Manage market category classifications</p>
          </div>
          <button className="btn btn-primary btn-add-file" onClick={() => setIsCreateModalOpen(true)}>
            <PlusIcon size={16} />
            Add Market Category
          </button>
        </div>

        <div className="files-search">
          <input
            type="text"
            placeholder="Search market categories by code or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="files-table-wrapper">
          {isLoading ? (
            <div className="files-empty">Loading market categories...</div>
          ) : error ? (
            <div className="files-empty" style={{ color: "#DC2626" }}>{error}</div>
          ) : filteredItems.length === 0 ? (
            <div className="files-empty">
              {searchQuery ? "No market categories found matching your search." : "No market categories yet. Create your first one!"}
            </div>
          ) : (
            <table className="files-table">
              <thead>
                <tr>
                  <th>MARKET CATEGORY</th>
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
                    <td>
                      <div style={{ fontWeight: 600 }}>{item.market_category_code}</div>
                      <div style={{ fontSize: "0.75rem", color: "#6B7280" }}>ID: {item.id}</div>
                    </td>
                    <td>
                      <span style={{ display: "inline-flex", padding: "0.125rem 0.5rem", fontSize: "0.75rem", fontWeight: 600, borderRadius: "0.25rem", backgroundColor: "#DBEAFE", color: "#1E40AF" }}>
                        {item.market_category_code}
                      </span>
                    </td>
                    <td>{item.market_category_desc || "-"}</td>
                    <td>
                      <span style={{ display: "inline-flex", padding: "0.125rem 0.5rem", fontSize: "0.75rem", fontWeight: 600, borderRadius: "9999px", backgroundColor: item.is_active ? "#D1FAE5" : "#FEE2E2", color: item.is_active ? "#065F46" : "#991B1B" }}>
                        {item.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>{formatDate(item.created_at)}</td>
                    <td>
                      <div className="file-actions">
                        <button className="file-action-btn file-action-edit" onClick={() => handleEdit(item)} title="Edit">
                          <EditIcon size={16} />
                        </button>
                        <button className="file-action-btn file-action-delete" onClick={() => handleDelete(item.id)} title="Delete">
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

      {isCreateModalOpen && <CreateModal onClose={() => setIsCreateModalOpen(false)} onCreate={handleCreate} />}
      {isEditModalOpen && selectedItem && <EditModal item={selectedItem} onClose={handleCloseEdit} onUpdate={handleUpdate} />}
    </div>
  );
}

function CreateModal({ onClose, onCreate }: { onClose: () => void; onCreate: (data: Partial<MarketCategoryData>) => Promise<void> }) {
  const [formData, setFormData] = useState({ market_category_code: "", market_category_desc: "" });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.market_category_code.trim()) {
      setError("Code is required");
      return;
    }
    try {
      setIsSubmitting(true);
      setError(null);
      await onCreate(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create market category");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose}></div>
      <div className="modal-content">
        <h3>Add Market Category</h3>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Code *</label>
            <input
              type="text"
              className="form-input"
              value={formData.market_category_code}
              onChange={(e) => setFormData({ ...formData, market_category_code: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <input
              type="text"
              className="form-input"
              value={formData.market_category_desc}
              onChange={(e) => setFormData({ ...formData, market_category_desc: e.target.value })}
            />
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

function EditModal({ item, onClose, onUpdate }: { item: MarketCategoryData; onClose: () => void; onUpdate: (id: number, data: Partial<MarketCategoryData>) => Promise<void> }) {
  const [formData, setFormData] = useState({ market_category_code: item.market_category_code || "", market_category_desc: item.market_category_desc || "" });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.market_category_code.trim()) {
      setError("Code is required");
      return;
    }
    try {
      setIsSubmitting(true);
      setError(null);
      await onUpdate(item.id, formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update market category");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose}></div>
      <div className="modal-content">
        <h3>Edit Market Category</h3>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Code *</label>
            <input
              type="text"
              className="form-input"
              value={formData.market_category_code}
              onChange={(e) => setFormData({ ...formData, market_category_code: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <input
              type="text"
              className="form-input"
              value={formData.market_category_desc}
              onChange={(e) => setFormData({ ...formData, market_category_desc: e.target.value })}
            />
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

export default function MarketCategoriesPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <MarketCategoriesContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
