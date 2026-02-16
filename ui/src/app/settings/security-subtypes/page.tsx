"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import { securitySubTypeApi, SecuritySubTypeData, securityTypeApi, SecurityTypeData } from "@/lib/api";

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

function SecuritySubTypesContent() {
  const [items, setItems] = useState<SecuritySubTypeData[]>([]);
  const [securityTypes, setSecurityTypes] = useState<SecurityTypeData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SecuritySubTypeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadItems = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [subTypesData, typesData] = await Promise.all([
        securitySubTypeApi.getAll(),
        securityTypeApi.getAll()
      ]);
      setItems(subTypesData);
      setSecurityTypes(typesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load security subtypes");
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
      item.security_subtype_code?.toLowerCase().includes(query) ||
      item.security_subtype_desc?.toLowerCase().includes(query)
    );
  });

  const getSecurityTypeCode = (securityTypeId: number | null | undefined): string => {
    if (!securityTypeId) return "-";
    const securityType = securityTypes.find(st => st.id === securityTypeId);
    return securityType?.security_type_code || "-";
  };

  const handleCreate = async (data: Partial<SecuritySubTypeData>) => {
    try {
      await securitySubTypeApi.create(data);
      await loadItems();
      setIsCreateModalOpen(false);
    } catch (err) {
      throw err;
    }
  };

  const handleUpdate = async (id: number, data: Partial<SecuritySubTypeData>) => {
    try {
      await securitySubTypeApi.update(id, data);
      await loadItems();
      setIsEditModalOpen(false);
      setSelectedItem(null);
    } catch (err) {
      throw err;
    }
  };

  const handleEdit = (item: SecuritySubTypeData) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  };

  const handleCloseEdit = () => {
    setIsEditModalOpen(false);
    setSelectedItem(null);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this security subtype?")) {
      try {
        await securitySubTypeApi.delete(id);
        await loadItems();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to delete security subtype");
      }
    }
  };

  return (
    <div>
      <div className="files-card">
        <div className="files-header">
          <div>
            <h2>Security SubTypes</h2>
            <p>Manage security subtype definitions</p>
          </div>
          <button className="btn btn-primary btn-add-file" onClick={() => setIsCreateModalOpen(true)}>
            <PlusIcon size={16} />
            Add Security SubType
          </button>
        </div>

        <div className="files-search">
          <input
            type="text"
            placeholder="Search security subtypes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="files-table-wrapper">
          {isLoading ? (
            <div className="files-empty">Loading security subtypes...</div>
          ) : error ? (
            <div className="files-empty" style={{ color: "#DC2626" }}>{error}</div>
          ) : filteredItems.length === 0 ? (
            <div className="files-empty">
              {searchQuery ? "No security subtypes found matching your search." : "No security subtypes yet. Create your first one!"}
            </div>
          ) : (
            <table className="files-table">
              <thead>
                <tr>
                  <th>CODE</th>
                  <th>DESCRIPTION</th>
                  <th>SECURITY TYPE</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td>{item.security_subtype_code}</td>
                    <td>{item.security_subtype_desc || "-"}</td>
                    <td>{getSecurityTypeCode(item.security_type_id)}</td>
                    <td>
                      <span style={{ display: "inline-flex", padding: "0.125rem 0.5rem", fontSize: "0.75rem", fontWeight: 600, borderRadius: "9999px", backgroundColor: item.is_active ? "#D1FAE5" : "#FEE2E2", color: item.is_active ? "#065F46" : "#991B1B" }}>
                        {item.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
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

      {isCreateModalOpen && <CreateModal securityTypes={securityTypes} onClose={() => setIsCreateModalOpen(false)} onCreate={handleCreate} />}
      {isEditModalOpen && selectedItem && <EditModal item={selectedItem} securityTypes={securityTypes} onClose={handleCloseEdit} onUpdate={handleUpdate} />}
    </div>
  );
}

function CreateModal({ securityTypes, onClose, onCreate }: { securityTypes: SecurityTypeData[]; onClose: () => void; onCreate: (data: Partial<SecuritySubTypeData>) => Promise<void> }) {
  const [formData, setFormData] = useState({ security_subtype_code: "", security_subtype_desc: "", security_type_id: "" });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.security_subtype_code.trim()) {
      setError("Code is required");
      return;
    }
    if (!formData.security_subtype_desc.trim()) {
      setError("Description is required");
      return;
    }
    if (!formData.security_type_id) {
      setError("Security Type is required");
      return;
    }
    try {
      setIsSubmitting(true);
      setError(null);
      const payload: Partial<SecuritySubTypeData> = {
        security_subtype_code: formData.security_subtype_code,
        security_subtype_desc: formData.security_subtype_desc,
        security_type_id: parseInt(formData.security_type_id),
      };
      await onCreate(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create security subtype");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose}></div>
      <div className="modal-content">
        <h3>Add Security SubType</h3>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Code *</label>
            <input
              type="text"
              className="form-input"
              value={formData.security_subtype_code}
              onChange={(e) => setFormData({ ...formData, security_subtype_code: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description *</label>
            <input
              type="text"
              className="form-input"
              value={formData.security_subtype_desc}
              onChange={(e) => setFormData({ ...formData, security_subtype_desc: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Security Type *</label>
            <select
              className="form-input"
              value={formData.security_type_id}
              onChange={(e) => setFormData({ ...formData, security_type_id: e.target.value })}
              required
            >
              <option value="">Select a security type</option>
              {securityTypes.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.security_type_code}
                </option>
              ))}
            </select>
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

function EditModal({ item, securityTypes, onClose, onUpdate }: { item: SecuritySubTypeData; securityTypes: SecurityTypeData[]; onClose: () => void; onUpdate: (id: number, data: Partial<SecuritySubTypeData>) => Promise<void> }) {
  const [formData, setFormData] = useState({ security_subtype_code: item.security_subtype_code || "", security_subtype_desc: item.security_subtype_desc || "", security_type_id: item.security_type_id?.toString() || "" });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.security_subtype_code.trim()) {
      setError("Code is required");
      return;
    }
    if (!formData.security_subtype_desc.trim()) {
      setError("Description is required");
      return;
    }
    if (!formData.security_type_id) {
      setError("Security Type is required");
      return;
    }
    try {
      setIsSubmitting(true);
      setError(null);
      const payload: Partial<SecuritySubTypeData> = {
        security_subtype_code: formData.security_subtype_code,
        security_subtype_desc: formData.security_subtype_desc,
        security_type_id: parseInt(formData.security_type_id),
      };
      await onUpdate(item.id, payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update security subtype");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose}></div>
      <div className="modal-content">
        <h3>Edit Security SubType</h3>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Code *</label>
            <input
              type="text"
              className="form-input"
              value={formData.security_subtype_code}
              onChange={(e) => setFormData({ ...formData, security_subtype_code: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description *</label>
            <input
              type="text"
              className="form-input"
              value={formData.security_subtype_desc}
              onChange={(e) => setFormData({ ...formData, security_subtype_desc: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Security Type *</label>
            <select
              className="form-input"
              value={formData.security_type_id}
              onChange={(e) => setFormData({ ...formData, security_type_id: e.target.value })}
              required
            >
              <option value="">Select a security type</option>
              {securityTypes.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.security_type_code}
                </option>
              ))}
            </select>
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

export default function SecuritySubTypesPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <SecuritySubTypesContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
