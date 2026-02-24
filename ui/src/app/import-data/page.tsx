"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import { fileApi, fileImportApi, FileData, FileImportData } from "@/lib/api";

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString();
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "N/A";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function getStatusBadgeClass(status: string): string {
  switch (status.toUpperCase()) {
    case "RECEIVED":
      return "import-status-badge import-status-pending";
    case "PROCESSING":
      return "import-status-badge import-status-processing";
    case "PROCESSED":
      return "import-status-badge import-status-completed";
    case "FAILED":
      return "import-status-badge import-status-failed";
    default:
      return "import-status-badge";
  }
}

/* ─── Upload Icon ─── */
function UploadIcon({ size = 20 }: { size?: number }) {
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
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

/* ─── Document Icon ─── */
function DocumentIcon({ size = 20 }: { size?: number }) {
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
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

interface ErrorDetails {
  total_rows: number;
  valid_rows: number;
  failed_rows: number;
  error_summary: Record<string, number>;
  sample_errors: Array<{
    row: number;
    errors: string[];
    data: Record<string, string | null>;
  }>;
}

function ErrorDetailsModal({
  imp,
  onClose,
}: {
  imp: FileImportData;
  onClose: () => void;
}) {
  const details = imp.error_details as ErrorDetails | null;

  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-content error-details-modal">
        <div className="error-details-header">
          <div>
            <h3>Import Errors</h3>
            <p className="error-details-filename">{imp.file_name || "Unknown file"}</p>
          </div>
          <button className="error-details-close" onClick={onClose}>
            &times;
          </button>
        </div>

        {imp.error_message && (
          <div className="error-details-message">{imp.error_message}</div>
        )}

        {details ? (
          <>
            <div className="error-details-summary">
              <div className="error-details-stat">
                <span className="error-details-stat-value">{details.total_rows}</span>
                <span className="error-details-stat-label">Total Rows</span>
              </div>
              <div className="error-details-stat">
                <span className="error-details-stat-value error-details-stat-success">
                  {details.valid_rows}
                </span>
                <span className="error-details-stat-label">Valid</span>
              </div>
              <div className="error-details-stat">
                <span className="error-details-stat-value error-details-stat-error">
                  {details.failed_rows}
                </span>
                <span className="error-details-stat-label">Failed</span>
              </div>
            </div>

            {Object.keys(details.error_summary).length > 0 && (
              <div className="error-details-section">
                <h4>Error Breakdown</h4>
                <table className="files-table error-details-table">
                  <thead>
                    <tr>
                      <th>Count</th>
                      <th>Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(details.error_summary)
                      .sort(([, a], [, b]) => b - a)
                      .map(([msg, count]) => (
                        <tr key={msg}>
                          <td style={{ whiteSpace: "nowrap" }}>{count} rows</td>
                          <td>{msg}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            {details.sample_errors.length > 0 && (
              <div className="error-details-section">
                <h4>
                  Sample Failed Rows
                  {details.failed_rows > 10 && (
                    <span className="error-details-sample-note">
                      {" "}(showing 10 of {details.failed_rows})
                    </span>
                  )}
                </h4>
                <div className="error-details-samples">
                  {details.sample_errors.slice(0, 10).map((sample) => (
                    <div key={sample.row} className="error-details-sample-row">
                      <div className="error-details-sample-header">
                        <span className="error-details-row-label">Row {sample.row}</span>
                        <span className="error-details-row-errors">
                          {sample.errors.join("; ")}
                        </span>
                      </div>
                      <div className="error-details-sample-data">
                        {Object.entries(sample.data).map(([col, val]) => (
                          <span key={col} className="error-details-data-chip">
                            <span className="error-details-data-key">{col}:</span>{" "}
                            {val ?? <em>empty</em>}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)" }}>
            No detailed error information available.
          </p>
        )}

        <div className="modal-actions">
          <button className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function ImportDataContent() {
  const [files, setFiles] = useState<FileData[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<globalThis.File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imports, setImports] = useState<FileImportData[]>([]);
  const [importsLoading, setImportsLoading] = useState(false);
  const [errorModalImport, setErrorModalImport] = useState<FileImportData | null>(null);

  useEffect(() => {
    loadFiles();
    loadImports();
  }, []);

  const loadFiles = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fileApi.getFiles();
      setFiles(data);
      if (data.length > 0) {
        setSelectedFileId(String(data[0].id));
      }
    } catch {
      setError("Failed to load files. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadImports = useCallback(async () => {
    try {
      setImportsLoading(true);
      const data = await fileImportApi.getImports(20);
      setImports(data);
    } catch {
      console.error("Error loading imports");
    } finally {
      setImportsLoading(false);
    }
  }, []);

  // Poll for status updates when imports are in non-terminal states
  useEffect(() => {
    const hasActiveImports = imports.some((i) =>
      ["RECEIVED", "PROCESSING"].includes(i.status),
    );
    if (!hasActiveImports) return;
    const interval = setInterval(() => loadImports(), 3000);
    return () => clearInterval(interval);
  }, [imports, loadImports]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadSuccess(null);
      setUploadError(null);

      const maxSizeMB = 5;
      if (file.size > maxSizeMB * 1024 * 1024) {
        setUploadError(`File is too large. Maximum size is ${maxSizeMB}MB.`);
        return;
      }

      const allowedExtensions = [".csv", ".txt", ".pipe"];
      const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
      if (!allowedExtensions.includes(fileExtension)) {
        setUploadError(
          "Unsupported file format. Please upload CSV or pipe-delimited files.",
        );
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadSuccess(null);
    setUploadError(null);

    try {
      const fileId = selectedFileId ? Number(selectedFileId) : undefined;
      const selectedConfig = files.find((f) => String(f.id) === selectedFileId);
      await fileImportApi.uploadFile(selectedFile, fileId, selectedConfig?.type);
      setUploadSuccess("File uploaded successfully.");
      // Clear file input so re-uploading the same filename triggers onChange
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await loadImports();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setUploadError(
        axiosErr.response?.data?.detail || "Upload failed. Please try again.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-screen" style={{ height: "16rem" }}>
        <div className="loading-spinner" />
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div
          className="alert-error"
          style={{ marginBottom: "var(--spacing-lg)" }}
        >
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

      {/* Upload Section */}
      <div className="import-card">
        <div className="import-header">
          <div>
            <h2>Import Data</h2>
            <p>Select a file configuration and upload data</p>
          </div>
        </div>

        <div className="import-upload-section">
          <div className="import-file-select-row">
            <div className="import-file-select-wrapper">
              <label className="form-label">File Configuration</label>
              <select
                className="form-select"
                value={selectedFileId}
                onChange={(e) => setSelectedFileId(e.target.value)}
                disabled={files.length === 0}
              >
                {files.length === 0 ? (
                  <option value="">No files configured</option>
                ) : (
                  <>
                    <option value="">Select a file...</option>
                    {files.map((file) => (
                      <option key={file.id} value={String(file.id)}>
                        {file.name} ({file.type})
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt,.pipe"
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />
            <div className="import-choose-btn-wrapper">
              <button
                className="btn btn-primary btn-add-file"
                onClick={handleUploadClick}
              >
                <UploadIcon size={16} />
                Choose File
              </button>
            </div>
          </div>

          {/* Selected file display */}
          {selectedFile && (
            <div
              className={`import-file-preview ${
                uploadSuccess
                  ? "import-file-preview-success"
                  : uploadError
                    ? "import-file-preview-error"
                    : "import-file-preview-info"
              }`}
            >
              <div className="import-file-preview-row">
                <div className="import-file-preview-info-col">
                  <DocumentIcon size={18} />
                  <div>
                    <div className="import-file-preview-name">
                      {selectedFile.name}
                    </div>
                    <div className="import-file-preview-size">
                      {formatFileSize(selectedFile.size)}
                    </div>
                  </div>
                </div>

                {!uploadSuccess && !uploadError && (
                  <button
                    className="btn btn-primary btn-add-file"
                    onClick={handleFileUpload}
                    disabled={isUploading}
                  >
                    {isUploading ? "Uploading..." : "Upload"}
                  </button>
                )}
              </div>

              {uploadSuccess && (
                <div className="import-message import-message-success">
                  {uploadSuccess}
                </div>
              )}

              {uploadError && (
                <div className="import-message import-message-error">
                  {uploadError}
                  <button
                    className="btn btn-outline"
                    style={{
                      marginTop: "var(--spacing-sm)",
                      width: "auto",
                      padding: "0.375rem 1rem",
                      fontSize: "var(--font-size-xs)",
                    }}
                    onClick={() => {
                      setSelectedFile(null);
                      setUploadError(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          )}

          <p className="import-supported-formats">
            Supported formats: CSV, Pipe-delimited (.txt, .pipe) &bull; Max
            size: 5MB
          </p>
        </div>
      </div>

      {/* Import History */}
      <div className="import-card" style={{ marginTop: "var(--spacing-lg)" }}>
        <h3 className="import-history-title">Import History</h3>

        {importsLoading ? (
          <div className="loading-screen" style={{ height: "12rem" }}>
            <div className="loading-spinner" />
            <span>Loading import history...</span>
          </div>
        ) : imports.length === 0 ? (
          <div className="import-empty">
            <DocumentIcon size={40} />
            <p>No import history available</p>
            <p className="import-empty-sub">
              Import history will appear here after your first data import
            </p>
          </div>
        ) : (
          <div className="files-table-wrapper">
            <table className="files-table">
              <thead>
                <tr>
                  <th>File</th>
                  <th>Status</th>
                  <th>Imported By</th>
                  <th>Completed</th>
                  <th>Rows</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                {imports.map((imp) => (
                  <tr key={imp.id}>
                    <td>
                      <div className="import-file-cell">
                        <span className="import-file-cell-name">
                          {imp.file_name || "Unknown"}
                        </span>
                        {imp.file_size && (
                          <span className="import-file-cell-size">
                            {formatFileSize(imp.file_size)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={getStatusBadgeClass(imp.status)}>
                        {imp.status}
                      </span>
                    </td>
                    <td>{imp.imported_by_name || "—"}</td>
                    <td>{formatDate(imp.completed_at)}</td>
                    <td>
                      {imp.rows_processed !== null || imp.rows_failed !== null ? (
                        <div>
                          {imp.rows_processed !== null && (
                            <div className="import-result-success">
                              {imp.rows_processed} processed
                            </div>
                          )}
                          {imp.rows_failed !== null && imp.rows_failed > 0 && (
                            <div className="import-result-error">
                              {imp.rows_failed} failed
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: "var(--color-text-light)" }}>—</span>
                      )}
                    </td>
                    <td>
                      {imp.error_message || imp.error_details ? (
                        <button
                          className="btn-view-errors"
                          onClick={() => setErrorModalImport(imp)}
                        >
                          View Errors
                        </button>
                      ) : (
                        <span style={{ color: "var(--color-text-light)" }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {errorModalImport && (
        <ErrorDetailsModal
          imp={errorModalImport}
          onClose={() => setErrorModalImport(null)}
        />
      )}
    </div>
  );
}

export default function ImportDataPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <ImportDataContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
