import axios from "axios";
import Cookies from "js-cookie";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = Cookies.get("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove("access_token");
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export interface FileData {
  id: number;
  name: string;
  type: string;
  is_active: boolean;
  tenant_id: string;
  created_at: string;
  updated_at: string | null;
}

export interface FileCreateData {
  name: string;
  type: string;
  is_active?: boolean;
}

export interface FileUpdateData {
  name?: string;
  type?: string;
  is_active?: boolean;
}

export const fileApi = {
  getFiles: async (): Promise<FileData[]> => {
    const response = await api.get("/files/");
    return response.data;
  },
  createFile: async (data: FileCreateData): Promise<FileData> => {
    const response = await api.post("/files/", data);
    return response.data;
  },
  getFile: async (id: number): Promise<FileData> => {
    const response = await api.get(`/files/${id}`);
    return response.data;
  },
  updateFile: async (id: number, data: FileUpdateData): Promise<FileData> => {
    const response = await api.patch(`/files/${id}`, data);
    return response.data;
  },
  deleteFile: async (id: number): Promise<void> => {
    await api.delete(`/files/${id}`);
  },
};

export interface FileImportData {
  id: string;
  file_id: number | null;
  import_type: string;
  status: string;
  file_name: string | null;
  file_size: number | null;
  rows_processed: number | null;
  rows_failed: number | null;
  started_at: string | null;
  completed_at: string | null;
  duration_seconds: number | null;
  error_message: string | null;
  created_at: string;
}

export const fileImportApi = {
  getImports: async (limit = 20): Promise<FileImportData[]> => {
    const response = await api.get("/file-imports/", { params: { limit } });
    return response.data;
  },
  uploadFile: async (
    file: File,
    fileId?: number,
  ): Promise<FileImportData> => {
    const formData = new FormData();
    formData.append("file", file);
    const params = fileId ? `?file_id=${fileId}` : "";
    const response = await api.post(`/file-imports/upload${params}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
};

export default api;
