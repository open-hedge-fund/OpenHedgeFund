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
  ColumnMappingOption,
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

/* ─── Role badge styling ─── */
function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, { bg: string; color: string; label: string }> = {
    direct: { bg: "#dcfce7", color: "#166534", label: "Store" },
    resolver: { bg: "#dbeafe", color: "#1e40af", label: "Lookup" },
  };
  const s = styles[role] || { bg: "#f3f4f6", color: "#374151", label: role };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: "4px",
        fontSize: "var(--font-size-xs)",
        fontWeight: 500,
        backgroundColor: s.bg,
        color: s.color,
      }}
    >
      {s.label}
    </span>
  );
}

/* ─── Group mappings by role for dropdown ─── */
const ROLE_LABELS: Record<string, string> = {
  direct: "Store in Holdings",
  resolver: "Lookup",
};

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
  const [newMapping, setNewMapping] = useState("");
  const [newDateFormat, setNewDateFormat] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editColumnName, setEditColumnName] = useState("");
  const [editMapping, setEditMapping] = useState("");
  const [editDateFormat, setEditDateFormat] = useState("");
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

  // Helper to find a mapping option by key
  const findMapping = (key: string): ColumnMappingOption | undefined =>
    availableMappings?.mappings.find((m) => m.key === key);

  // Check if the currently selected mapping is a date type
  const selectedMappingOption = findMapping(newMapping);
  const isDateMapping = selectedMappingOption?.data_type === "date";

  // Group available mappings by role for the dropdown
  const groupedByRole = useMemo(() => {
    if (!availableMappings) return null;
    const groups: Record<string, ColumnMappingOption[]> = {};
    for (const m of availableMappings.mappings) {
      if (!groups[m.role]) groups[m.role] = [];
      groups[m.role].push(m);
    }
    return groups;
  }, [availableMappings]);

  // Filter out already-used mappings for the "add" dropdown
  const filteredByRole = useMemo(() => {
    if (!groupedByRole) return null;
    const usedKeys = new Set(mappings.map((m) => m.column_mapping));
    const filtered: Record<string, ColumnMappingOption[]> = {};
    for (const [role, opts] of Object.entries(groupedByRole)) {
      const available = opts.filter((opt) => !usedKeys.has(opt.key));
      if (available.length > 0) filtered[role] = available;
    }
    return filtered;
  }, [groupedByRole, mappings]);

  // Clear selection if the chosen mapping was already used
  useEffect(() => {
    if (newMapping && filteredByRole) {
      const stillAvailable = Object.values(filteredByRole).some((opts) =>
        opts.some((opt) => opt.key === newMapping),
      );
      if (!stillAvailable) setNewMapping("");
    }
  }, [filteredByRole, newMapping]);

  const handleAdd = async () => {
    if (!newColumnName.trim() || !newMapping) return;
    setIsAdding(true);
    try {
      const created = await columnDefinitionApi.create({
        file_id: file.id,
        column_name: newColumnName.trim(),
        column_mapping: newMapping,
        date_format: newDateFormat.trim() || null,
      });
      setMappings((prev) => [...prev, created]);
      setNewColumnName("");
      setNewMapping("");
      setNewDateFormat("");
    } catch {
      alert("Failed to add column mapping");
    } finally {
      setIsAdding(false);
    }
  };

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
    setEditMapping(m.column_mapping);
    setEditDateFormat(m.date_format || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editColumnName.trim() || !editMapping) return;
    setIsSaving(true);
    try {
      const updated = await columnDefinitionApi.update(editingId, {
        column_name: editColumnName.trim(),
        column_mapping: editMapping,
        date_format: editDateFormat.trim() || null,
      });
      setMappings((prev) => prev.map((m) => (m.id === editingId ? updated : m)));
      setEditingId(null);
    } catch {
      alert("Failed to update column mapping");
    } finally {
      setIsSaving(false);
    }
  };

  // For edit mode: include current row's mapping in available options
  const editFilteredByRole = useMemo(() => {
    if (!groupedByRole || editingId === null) return null;
    const editingRow = mappings.find((m) => m.id === editingId);
    const usedKeys = new Set(
      mappings.filter((m) => m.id !== editingId).map((m) => m.column_mapping),
    );
    const filtered: Record<string, ColumnMappingOption[]> = {};
    for (const [role, opts] of Object.entries(groupedByRole)) {
      const available = opts.filter(
        (opt) =>
          !usedKeys.has(opt.key) ||
          (editingRow && opt.key === editingRow.column_mapping),
      );
      if (available.length > 0) filtered[role] = available;
    }
    return filtered;
  }, [groupedByRole, mappings, editingId]);

  const editSelectedOption = findMapping(editMapping);
  const isEditDateMapping = editSelectedOption?.data_type === "date";

  // Render a mapping dropdown grouped by role
  const renderMappingDropdown = (
    value: string,
    onChange: (val: string) => void,
    options: Record<string, ColumnMappingOption[]> | null,
  ) => (
    <select
      className="form-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ width: "100%" }}
    >
      <option value="">Select system field...</option>
      {options &&
        Object.entries(options).map(([role, opts]) => (
          <optgroup key={role} label={ROLE_LABELS[role] || role}>
            {opts.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.description}
              </option>
            ))}
          </optgroup>
        ))}
    </select>
  );

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
                <th>Your File Column</th>
                <th>System Field</th>
                <th>Role</th>
                <th>Date Format</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {mappings.map((m) => {
                const mappingOpt = findMapping(m.column_mapping);
                return editingId === m.id ? (
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
                      {renderMappingDropdown(
                        editMapping,
                        (val) => {
                          setEditMapping(val);
                          setEditDateFormat("");
                        },
                        editFilteredByRole,
                      )}
                    </td>
                    <td>
                      {editSelectedOption && <RoleBadge role={editSelectedOption.role} />}
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
                      <span className="mapping-badge">
                        {mappingOpt?.description || m.column_mapping}
                      </span>
                    </td>
                    <td>
                      {mappingOpt && <RoleBadge role={mappingOpt.role} />}
                    </td>
                    <td>{m.date_format || ""}</td>
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
                );
              })}
              {mappings.length === 0 && (
                <tr>
                  <td colSpan={5} className="column-mappings-empty">
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
              placeholder="Your file column name (e.g. Quantity)"
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
            />
            {renderMappingDropdown(
              newMapping,
              (val) => {
                setNewMapping(val);
                setNewDateFormat("");
              },
              filteredByRole,
            )}
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
            <p>Manage your document files and column mappings</p>
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
