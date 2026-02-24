"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import { brokerApi, BrokerData } from "@/lib/api";

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

function BrokersContent() {
  const [items, setItems] = useState<BrokerData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<BrokerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    try {
      setIsLoading(true);
      const data = await brokerApi.getAll();
      setItems(data);
    } catch (err: any) {
      setError(err.message || "Failed to load brokers");
    } finally {
      setIsLoading(false);
    }
  }

  const filteredItems = items.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.broker_code?.toLowerCase().includes(q) ||
      item.broker_description?.toLowerCase().includes(q)
    );
  });

  async function handleCreate(data: Partial<BrokerData>) {
    try {
      setError("");
      await brokerApi.create(data);
      await loadItems();
      setIsCreateModalOpen(false);
    } catch (err: any) {
      setError(err.message || "Failed to create broker");
      throw err;
    }
  }

  async function handleUpdate(id: number, data: Partial<BrokerData>) {
    try {
      setError("");
      await brokerApi.update(id, data);
      await loadItems();
      setIsEditModalOpen(false);
      setSelectedItem(null);
    } catch (err: any) {
      setError(err.message || "Failed to update broker");
      throw err;
    }
  }

  function handleEdit(item: BrokerData) {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  }

  function handleCloseEdit() {
    setIsEditModalOpen(false);
    setSelectedItem(null);
    setError("");
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Are you sure you want to delete this broker?")) {
      return;
    }
    try {
      setError("");
      await brokerApi.delete(id);
      await loadItems();
    } catch (err: any) {
      setError(err.message || "Failed to delete broker");
    }
  }

  return (
    <div>
      <div className="files-card">
        <div className="files-header">
          <div>
            <h2>Brokers</h2>
            <p>Manage your brokers</p>
          </div>
          <button className="btn btn-primary btn-add-file" onClick={() => setIsCreateModalOpen(true)}>
            <PlusIcon size={16} />
            <span>Add Broker</span>
          </button>
        </div>

        <div className="files-search">
          <input
            type="text"
            placeholder="Search brokers by code or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {error && <div className="modal-error">{error}</div>}

        <div className="files-table-wrapper">
          {isLoading ? (
            <div className="files-empty">Loading...</div>
          ) : filteredItems.length === 0 ? (
            <div className="files-empty">No brokers found</div>
          ) : (
            <table className="files-table">
              <thead>
                <tr>
                  <th>CODE</th>
                  <th>DESCRIPTION</th>
                  <th>CREATED</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td>{item.broker_code}</td>
                    <td>{item.broker_description}</td>
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

function CreateModal({ onClose, onCreate, error }: { onClose: () => void; onCreate: (data: Partial<BrokerData>) => Promise<void>; error: string }) {
  const [formData, setFormData] = useState<Partial<BrokerData>>({
    broker_code: "",
    broker_description: "",
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
        <h3>Add Broker</h3>
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Broker Code</label>
            <input
              type="text"
              className="form-input"
              value={formData.broker_code || ""}
              onChange={(e) => setFormData({ ...formData, broker_code: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <input
              type="text"
              className="form-input"
              value={formData.broker_description || ""}
              onChange={(e) => setFormData({ ...formData, broker_description: e.target.value })}
              required
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

function EditModal({ item, onClose, onUpdate, error }: { item: BrokerData; onClose: () => void; onUpdate: (id: number, data: Partial<BrokerData>) => Promise<void>; error: string }) {
  const [formData, setFormData] = useState<Partial<BrokerData>>({
    broker_code: item.broker_code,
    broker_description: item.broker_description,
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
        <h3>Edit Broker</h3>
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Broker Code</label>
            <input
              type="text"
              className="form-input"
              value={formData.broker_code || ""}
              onChange={(e) => setFormData({ ...formData, broker_code: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <input
              type="text"
              className="form-input"
              value={formData.broker_description || ""}
              onChange={(e) => setFormData({ ...formData, broker_description: e.target.value })}
              required
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

export default function BrokersPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <BrokersContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
