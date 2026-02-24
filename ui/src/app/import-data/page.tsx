"use client";

import { useState, useEffect, useRef } from "react";
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

  const loadImports = async () => {
    try {
      setImportsLoading(true);
      const data = await fileImportApi.getImports(20);
      setImports(data);
    } catch {
      console.error("Error loading imports");
    } finally {
      setImportsLoading(false);
    }
  };

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
                      {imp.error_message ? (
                        <div className="import-result-error" title={imp.error_message}>
                          {imp.error_message.substring(0, 60)}
                          {imp.error_message.length > 60 ? "..." : ""}
                        </div>
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
