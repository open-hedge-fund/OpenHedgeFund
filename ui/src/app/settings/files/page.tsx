"use client";

import React, { useState, useEffect, useMemo } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import {
  fileApi,
  FileData,
  FileCreateData,
  FileUpdateData,
  columnDefinitionApi,
  ColumnDefinitionData,
  columnMappingApi,
  AvailableMappingsResponse,
} from "@/lib/api";
import { FileIcon } from "@/components/icons/SidebarIcons";

const FILE_TYPES = ["CSV", "PIPE"];

function getFileTypeBadgeClass(type: string): string {
  switch (type.toUpperCase()) {
    case "CSV":
      return "file-type-badge file-type-csv";
    case "PIPE":
      return "file-type-badge file-type-pipe";
    default:
      return "file-type-badge file-type-default";
  }
}

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

/* ─── Table display names ─── */
const TABLE_DISPLAY_NAMES: Record<string, string> = {
  holdings: "Holdings",
  securities: "Security",
  asset_types: "Asset Type",
  continents: "Continent",
  custodians: "Custodian",
  countries: "Country",
  currencies: "Currency",
};

/* ─── Validate-against options ─── */
const VALIDATE_AGAINST_OPTIONS: { value: string; label: string }[] = [
  { value: "asset_types", label: "Asset Types" },
  { value: "brokers", label: "Brokers" },
  { value: "continents", label: "Continents" },
  { value: "countries", label: "Countries" },
  { value: "currencies", label: "Currencies" },
  { value: "custodians", label: "Custodians" },
  { value: "funds", label: "Funds" },
  { value: "market_categories", label: "Market Categories" },
  { value: "portfolios", label: "Portfolios" },
  { value: "sectors", label: "Sectors" },
  { value: "strategies", label: "Strategies" },
];

function CheckIcon({ size = 16 }: { size?: number }) {
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
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CloseIcon({ size = 16 }: { size?: number }) {
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
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

/* ─── Column Mappings Panel ─── */
function ColumnMappingsPanel({
  file,
  onClose,
}: {
  file: FileData;
  onClose: () => void;
}) {
  const [mappings, setMappings] = useState<ColumnDefinitionData[]>([]);
  const [availableMappings, setAvailableMappings] = useState<AvailableMappingsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newColumnName, setNewColumnName] = useState("");
  const [newMapping, setNewMapping] = useState(""); // "table|column_mapping" combined
  const [newDateFormat, setNewDateFormat] = useState("");
  const [newValidateAgainst, setNewValidateAgainst] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editColumnName, setEditColumnName] = useState("");
  const [editMapping, setEditMapping] = useState("");
  const [editDateFormat, setEditDateFormat] = useState("");
  const [editValidateAgainst, setEditValidateAgainst] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [file.id]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [defs, avail] = await Promise.all([
        columnDefinitionApi.getByFile(file.id),
        columnMappingApi.getAvailableMappings(),
      ]);
      setMappings(defs);
      setAvailableMappings(avail);
    } catch {
      setError("Failed to load column mappings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Check if the currently selected mapping is a date type
  const selectedMappingKey = newMapping ? newMapping.split("|")[1] : "";
  const selectedMappingOption = availableMappings?.mappings.find(
    (m) => m.key === selectedMappingKey,
  );
  const isDateMapping = selectedMappingOption?.data_type === "date";

  const handleAdd = async () => {
    if (!newColumnName.trim() || !newMapping) return;
    setIsAdding(true);
    const [tableMapping, columnMapping] = newMapping.split("|");
    try {
      const created = await columnDefinitionApi.create({
        file_id: file.id,
        column_name: newColumnName.trim(),
        table_mapping: tableMapping,
        column_mapping: columnMapping,
        date_format: newDateFormat.trim() || null,
        validate_against: newValidateAgainst || null,
      });
      setMappings((prev) => [...prev, created]);
      setNewColumnName("");
      setNewMapping("");
      setNewDateFormat("");
      setNewValidateAgainst("");
    } catch {
      alert("Failed to add column mapping");
    } finally {
      setIsAdding(false);
    }
  };

  const filteredGroupedMappings = useMemo(() => {
    if (!availableMappings) return null;
    const usedKeys = new Set(mappings.map((m) => `${m.table_mapping}|${m.column_mapping}`));
    const filtered: Record<string, typeof availableMappings.grouped_mappings[string]> = {};
    for (const [table, opts] of Object.entries(availableMappings.grouped_mappings)) {
      const available = opts.filter((opt) => !usedKeys.has(`${table}|${opt.key}`));
      if (available.length > 0) {
        filtered[table] = available;
      }
    }
    return filtered;
  }, [availableMappings, mappings]);

  // Clear selection if the chosen mapping was already used
  useEffect(() => {
    if (newMapping && filteredGroupedMappings) {
      const stillAvailable = Object.entries(filteredGroupedMappings).some(
        ([table, opts]) => opts.some((opt) => `${table}|${opt.key}` === newMapping),
      );
      if (!stillAvailable) {
        setNewMapping("");
      }
    }
  }, [filteredGroupedMappings, newMapping]);

  const handleDelete = async (id: number) => {
    try {
      await columnDefinitionApi.delete(id);
      setMappings((prev) => prev.filter((m) => m.id !== id));
    } catch {
      alert("Failed to delete column mapping");
    }
  };

  const startEdit = (m: ColumnDefinitionData) => {
    setEditingId(m.id);
    setEditColumnName(m.column_name);
    setEditMapping(`${m.table_mapping}|${m.column_mapping}`);
    setEditDateFormat(m.date_format || "");
    setEditValidateAgainst(m.validate_against || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editColumnName.trim() || !editMapping) return;
    setIsSaving(true);
    const [tableMapping, columnMapping] = editMapping.split("|");
    try {
      const updated = await columnDefinitionApi.update(editingId, {
        column_name: editColumnName.trim(),
        table_mapping: tableMapping,
        column_mapping: columnMapping,
        date_format: editDateFormat.trim() || null,
        validate_against: editValidateAgainst || null,
      });
      setMappings((prev) => prev.map((m) => (m.id === editingId ? updated : m)));
      setEditingId(null);
    } catch {
      alert("Failed to update column mapping");
    } finally {
      setIsSaving(false);
    }
  };

  // For edit mode: build mapping options that include the current row's mapping
  const editFilteredGroupedMappings = useMemo(() => {
    if (!availableMappings || editingId === null) return null;
    const editingRow = mappings.find((m) => m.id === editingId);
    const usedKeys = new Set(
      mappings
        .filter((m) => m.id !== editingId)
        .map((m) => `${m.table_mapping}|${m.column_mapping}`),
    );
    const filtered: Record<string, typeof availableMappings.grouped_mappings[string]> = {};
    for (const [table, opts] of Object.entries(availableMappings.grouped_mappings)) {
      const available = opts.filter(
        (opt) =>
          !usedKeys.has(`${table}|${opt.key}`) ||
          (editingRow && table === editingRow.table_mapping && opt.key === editingRow.column_mapping),
      );
      if (available.length > 0) {
        filtered[table] = available;
      }
    }
    return filtered;
  }, [availableMappings, mappings, editingId]);

  const editSelectedKey = editMapping ? editMapping.split("|")[1] : "";
  const editSelectedOption = availableMappings?.mappings.find((m) => m.key === editSelectedKey);
  const isEditDateMapping = editSelectedOption?.data_type === "date";

  return (
    <div className="column-mappings-panel">
      <div className="column-mappings-header">
        <h4>Column Mappings for &ldquo;{file.name}&rdquo;</h4>
        <button
          className="column-mappings-close"
          onClick={onClose}
          title="Close panel"
        >
          <CloseIcon size={18} />
        </button>
      </div>

      {isLoading ? (
        <div className="column-mappings-loading">Loading mappings...</div>
      ) : error ? (
        <div className="alert-error" style={{ margin: "var(--spacing-md)" }}>
          <span>{error}</span>
          <button
            onClick={loadData}
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
      ) : (
        <>
          <table className="column-mappings-table">
            <thead>
              <tr>
                <th>Column Name</th>
                <th>Table</th>
                <th>Mapping</th>
                <th>Date Format</th>
                <th>Validate Against</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {mappings.map((m) =>
                editingId === m.id ? (
                  <tr key={m.id}>
                    <td>
                      <input
                        type="text"
                        className="form-input"
                        value={editColumnName}
                        onChange={(e) => setEditColumnName(e.target.value)}
                        style={{ minWidth: "120px" }}
                      />
                    </td>
                    <td>
                      <span className="mapping-badge">
                        {TABLE_DISPLAY_NAMES[editMapping.split("|")[0]] || editMapping.split("|")[0]}
                      </span>
                    </td>
                    <td>
                      <select
                        className="form-select"
                        value={editMapping}
                        onChange={(e) => {
                          setEditMapping(e.target.value);
                          setEditDateFormat("");
                        }}
                        style={{ width: "100%" }}
                      >
                        <option value="">Select mapping...</option>
                        {editFilteredGroupedMappings &&
                          Object.entries(editFilteredGroupedMappings).map(
                            ([table, opts]) => (
                              <optgroup
                                key={table}
                                label={TABLE_DISPLAY_NAMES[table] || table}
                              >
                                {opts.map((opt) => (
                                  <option key={opt.key} value={`${table}|${opt.key}`}>
                                    {opt.key}
                                  </option>
                                ))}
                              </optgroup>
                            ),
                          )}
                      </select>
                    </td>
                    <td>
                      {isEditDateMapping && (
                        <input
                          type="text"
                          className="form-input"
                          placeholder="%m/%d/%Y"
                          value={editDateFormat}
                          onChange={(e) => setEditDateFormat(e.target.value)}
                          style={{ minWidth: "100px" }}
                        />
                      )}
                    </td>
                    <td>
                      <select
                        className="form-select"
                        value={editValidateAgainst}
                        onChange={(e) => setEditValidateAgainst(e.target.value)}
                        style={{ width: "100%" }}
                      >
                        <option value="">No validation</option>
                        {VALIDATE_AGAINST_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td />
                    <td>
                      <div className="file-actions">
                        <button
                          className="file-action-btn file-action-edit"
                          onClick={handleSaveEdit}
                          disabled={isSaving || !editColumnName.trim() || !editMapping}
                          title="Save"
                          style={{ color: "var(--color-success, #16a34a)" }}
                        >
                          <CheckIcon />
                        </button>
                        <button
                          className="file-action-btn file-action-delete"
                          onClick={cancelEdit}
                          title="Cancel"
                        >
                          <CloseIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={m.id}>
                    <td>{m.column_name}</td>
                    <td>
                      <span className="mapping-badge">{TABLE_DISPLAY_NAMES[m.table_mapping] || m.table_mapping}</span>
                    </td>
                    <td>
                      <span className="mapping-badge">{m.column_mapping}</span>
                    </td>
                    <td>{m.date_format || ""}</td>
                    <td>
                      {m.validate_against ? (
                        <span className="mapping-badge">
                          {VALIDATE_AGAINST_OPTIONS.find((o) => o.value === m.validate_against)?.label || m.validate_against}
                        </span>
                      ) : ""}
                    </td>
                    <td>{formatDate(m.created_at)}</td>
                    <td>
                      <div className="file-actions">
                        <button
                          className="file-action-btn file-action-edit"
                          onClick={() => startEdit(m)}
                          title="Edit mapping"
                        >
                          <EditIcon />
                        </button>
                        <button
                          className="file-action-btn file-action-delete"
                          onClick={() => handleDelete(m.id)}
                          title="Delete mapping"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ),
              )}
              {mappings.length === 0 && (
                <tr>
                  <td colSpan={7} className="column-mappings-empty">
                    No column mappings defined yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="column-mappings-add-row">
            <input
              type="text"
              className="form-input"
              placeholder="Column name (e.g. Quantity)"
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
            />
            <select
              className="form-select"
              value={newMapping}
              onChange={(e) => {
                setNewMapping(e.target.value);
                setNewDateFormat("");
              }}
            >
              <option value="">Select mapping...</option>
              {filteredGroupedMappings &&
                Object.entries(filteredGroupedMappings).map(
                  ([table, opts]) => (
                    <optgroup
                      key={table}
                      label={TABLE_DISPLAY_NAMES[table] || table}
                    >
                      {opts.map((opt) => (
                        <option key={opt.key} value={`${table}|${opt.key}`}>
                          {opt.key}
                        </option>
                      ))}
                    </optgroup>
                  ),
                )}
            </select>
            {isDateMapping && (
              <input
                type="text"
                className="form-input"
                placeholder="Date format (e.g. %m/%d/%Y)"
                value={newDateFormat}
                onChange={(e) => setNewDateFormat(e.target.value)}
                style={{ maxWidth: "200px" }}
              />
            )}
            <select
              className="form-select"
              value={newValidateAgainst}
              onChange={(e) => setNewValidateAgainst(e.target.value)}
              style={{ maxWidth: "180px" }}
            >
              <option value="">No validation</option>
              {VALIDATE_AGAINST_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              className="btn btn-primary btn-add-mapping"
              onClick={handleAdd}
              disabled={isAdding || !newColumnName.trim() || !newMapping}
              title="Add mapping"
            >
              <PlusIcon size={16} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Create Modal ─── */
function CreateFileModal({
  isOpen,
  onClose,
  onCreateFile,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreateFile: (data: FileCreateData) => Promise<void>;
}) {
  const [formData, setFormData] = useState({
    name: "",
    type: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await onCreateFile(formData);
      setFormData({ name: "", type: "" });
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr.response?.data?.detail || "Failed to create file");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-content">
        <h3>Add New File</h3>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">File Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. SOD (Start of Day)"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">File Type</label>
            <select
              className="form-select"
              value={formData.type}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, type: e.target.value }))
              }
              required
            >
              <option value="">Select file type</option>
              {FILE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
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
              {isLoading ? "Creating..." : "Add File"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Edit Modal ─── */
function EditFileModal({
  isOpen,
  onClose,
  onUpdateFile,
  file,
}: {
  isOpen: boolean;
  onClose: () => void;
  onUpdateFile: (id: number, data: FileUpdateData) => Promise<void>;
  file?: FileData;
}) {
  const [formData, setFormData] = useState({
    name: "",
    type: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (file && isOpen) {
      setFormData({
        name: file.name,
        type: file.type,
      });
    }
  }, [file, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setIsLoading(true);
    setError(null);
    try {
      await onUpdateFile(file.id, formData);
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr.response?.data?.detail || "Failed to update file");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-content">
        <h3>Edit File</h3>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">File Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. SOD (Start of Day)"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">File Type</label>
            <select
              className="form-select"
              value={formData.type}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, type: e.target.value }))
              }
              required
            >
              <option value="">Select file type</option>
              {FILE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
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
              {isLoading ? "Updating..." : "Update File"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Files Content ─── */
function FilesContent() {
  const [files, setFiles] = useState<FileData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileData | undefined>(
    undefined,
  );
  const [expandedFileId, setExpandedFileId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fileApi.getFiles();
      setFiles(data);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr.response?.data?.detail || "Failed to load files");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredFiles = files.filter(
    (file) =>
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.type.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleCreateFile = async (data: FileCreateData) => {
    const newFile = await fileApi.createFile(data);
    setFiles((prev) => [...prev, newFile]);
  };

  const handleUpdateFile = async (id: number, data: FileUpdateData) => {
    const updated = await fileApi.updateFile(id, data);
    setFiles((prev) => prev.map((f) => (f.id === id ? updated : f)));
  };

  const handleEditFile = (file: FileData) => {
    setSelectedFile(file);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedFile(undefined);
  };

  const handleDeleteFile = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this file?")) {
      try {
        await fileApi.deleteFile(id);
        setFiles((prev) => prev.filter((f) => f.id !== id));
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { detail?: string } } };
        alert(axiosErr.response?.data?.detail || "Failed to delete file");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="loading-screen" style={{ height: "16rem" }}>
        <div className="loading-spinner" />
        <span>Loading files...</span>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="alert-error" style={{ marginBottom: "var(--spacing-lg)" }}>
          <span>{error}</span>
          <button
            onClick={loadFiles}
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
            <h2>Files</h2>
            <p>Manage your document files and their locations</p>
          </div>
          <button
            className="btn btn-primary btn-add-file"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <PlusIcon size={16} />
            Add File
          </button>
        </div>

        <input
          className="files-search"
          type="text"
          placeholder="Search files by name or type..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="files-table-wrapper">
        <table className="files-table">
          <thead>
            <tr>
              <th>File</th>
              <th>Type</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredFiles.map((file) => (
              <React.Fragment key={file.id}>
                <tr
                  className={`file-row-clickable${expandedFileId === file.id ? " file-row-expanded" : ""}`}
                  onClick={() =>
                    setExpandedFileId(expandedFileId === file.id ? null : file.id)
                  }
                >
                  <td>
                    <div className="file-name-cell">
                      <FileIcon size={18} />
                      <span>{file.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className={getFileTypeBadgeClass(file.type)}>
                      {file.type}
                    </span>
                  </td>
                  <td>{formatDate(file.created_at)}</td>
                  <td>
                    <div className="file-actions">
                      <button
                        className="file-action-btn file-action-edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditFile(file);
                        }}
                        title="Edit file"
                      >
                        <EditIcon />
                      </button>
                      <button
                        className="file-action-btn file-action-delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFile(file.id);
                        }}
                        title="Delete file"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedFileId === file.id && (
                  <tr className="file-mappings-row">
                    <td colSpan={4}>
                      <ColumnMappingsPanel
                        file={file}
                        onClose={() => setExpandedFileId(null)}
                      />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>

        {filteredFiles.length === 0 && (
          <div className="files-empty">
            <p>No files found matching your search.</p>
          </div>
        )}
      </div>

      <CreateFileModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateFile={handleCreateFile}
      />

      <EditFileModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onUpdateFile={handleUpdateFile}
        file={selectedFile}
      />
    </div>
  );
}

export default function FilesPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <FilesContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
