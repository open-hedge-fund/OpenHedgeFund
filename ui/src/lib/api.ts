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

/* ─── Asset Types ─── */
export interface AssetTypeData {
  id: number;
  asset_type_code: string;
  asset_type_desc: string | null;
  is_active: boolean;
  tenant_id: string;
  created_at: string;
  updated_at: string | null;
}

export const assetTypeApi = {
  getAll: async (): Promise<AssetTypeData[]> => {
    const response = await api.get("/asset-types/");
    return response.data;
  },
  create: async (data: Partial<AssetTypeData>): Promise<AssetTypeData> => {
    const response = await api.post("/asset-types/", data);
    return response.data;
  },
  update: async (id: number, data: Partial<AssetTypeData>): Promise<AssetTypeData> => {
    const response = await api.patch(`/asset-types/${id}`, data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/asset-types/${id}`);
  },
};

/* ─── Continents ─── */
export interface ContinentData {
  id: number;
  continent_code: string;
  continent_desc: string | null;
  is_active: boolean;
  tenant_id: string;
  created_at: string;
  updated_at: string | null;
}

export const continentApi = {
  getAll: async (): Promise<ContinentData[]> => {
    const response = await api.get("/continents/");
    return response.data;
  },
  create: async (data: Partial<ContinentData>): Promise<ContinentData> => {
    const response = await api.post("/continents/", data);
    return response.data;
  },
  update: async (id: number, data: Partial<ContinentData>): Promise<ContinentData> => {
    const response = await api.patch(`/continents/${id}`, data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/continents/${id}`);
  },
};

/* ─── Countries ─── */
export interface CountryData {
  id: number;
  country_code: string;
  country_desc: string;
  country_code_iso_alpha3: string | null;
  geographic_region: string | null;
  continent: string | null;
  is_active: boolean;
  tenant_id: string;
  created_at: string;
  updated_at: string | null;
}

export const countryApi = {
  getAll: async (): Promise<CountryData[]> => {
    const response = await api.get("/countries/");
    return response.data;
  },
  create: async (data: Partial<CountryData>): Promise<CountryData> => {
    const response = await api.post("/countries/", data);
    return response.data;
  },
  update: async (id: number, data: Partial<CountryData>): Promise<CountryData> => {
    const response = await api.patch(`/countries/${id}`, data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/countries/${id}`);
  },
};

/* ─── Currencies ─── */
export interface CurrencyData {
  id: number;
  ccy: string;
  ccy_des: string;
  is_active: boolean;
  tenant_id: string;
  created_at: string;
  updated_at: string | null;
}

export const currencyApi = {
  getAll: async (): Promise<CurrencyData[]> => {
    const response = await api.get("/currencies/");
    return response.data;
  },
  create: async (data: Partial<CurrencyData>): Promise<CurrencyData> => {
    const response = await api.post("/currencies/", data);
    return response.data;
  },
  update: async (id: number, data: Partial<CurrencyData>): Promise<CurrencyData> => {
    const response = await api.patch(`/currencies/${id}`, data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/currencies/${id}`);
  },
};

/* ─── Custodians ─── */
export interface CustodianData {
  id: number;
  custodian_name: string;
  custodian_code: string;
  account_number: string;
  email: string;
  is_active: boolean;
  tenant_id: string;
  created_at: string;
  updated_at: string | null;
}

export const custodianApi = {
  getAll: async (): Promise<CustodianData[]> => {
    const response = await api.get("/custodians/");
    return response.data;
  },
  create: async (data: Partial<CustodianData>): Promise<CustodianData> => {
    const response = await api.post("/custodians/", data);
    return response.data;
  },
  update: async (id: number, data: Partial<CustodianData>): Promise<CustodianData> => {
    const response = await api.patch(`/custodians/${id}`, data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/custodians/${id}`);
  },
};

/* ─── Funds ─── */
export interface FundData {
  id: number;
  fund_code: string;
  fund_description: string;
  is_active: boolean;
  is_offshore: boolean;
  is_master: boolean;
  tenant_id: string;
  created_at: string;
  updated_at: string | null;
}

export const fundApi = {
  getAll: async (): Promise<FundData[]> => {
    const response = await api.get("/funds/");
    return response.data;
  },
  create: async (data: Partial<FundData>): Promise<FundData> => {
    const response = await api.post("/funds/", data);
    return response.data;
  },
  update: async (id: number, data: Partial<FundData>): Promise<FundData> => {
    const response = await api.patch(`/funds/${id}`, data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/funds/${id}`);
  },
};

/* ─── Market Categories ─── */
export interface MarketCategoryData {
  id: number;
  market_category_code: string;
  market_category_desc: string | null;
  is_active: boolean;
  tenant_id: string;
  created_at: string;
  updated_at: string | null;
}

export const marketCategoryApi = {
  getAll: async (): Promise<MarketCategoryData[]> => {
    const response = await api.get("/market-categories/");
    return response.data;
  },
  create: async (data: Partial<MarketCategoryData>): Promise<MarketCategoryData> => {
    const response = await api.post("/market-categories/", data);
    return response.data;
  },
  update: async (id: number, data: Partial<MarketCategoryData>): Promise<MarketCategoryData> => {
    const response = await api.patch(`/market-categories/${id}`, data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/market-categories/${id}`);
  },
};

/* ─── Security Types ─── */
export interface SecurityTypeData {
  id: number;
  security_type_code: string;
  security_type_desc: string;
  settlement_days: number | null;
  is_active: boolean;
  tenant_id: string;
  created_at: string;
  updated_at: string | null;
}

export const securityTypeApi = {
  getAll: async (): Promise<SecurityTypeData[]> => {
    const response = await api.get("/security-types/");
    return response.data;
  },
  create: async (data: Partial<SecurityTypeData>): Promise<SecurityTypeData> => {
    const response = await api.post("/security-types/", data);
    return response.data;
  },
  update: async (id: number, data: Partial<SecurityTypeData>): Promise<SecurityTypeData> => {
    const response = await api.patch(`/security-types/${id}`, data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/security-types/${id}`);
  },
};

/* ─── Security SubTypes ─── */
export interface SecuritySubTypeData {
  id: number;
  security_subtype_code: string;
  security_subtype_desc: string;
  security_type_id: number;
  is_active: boolean;
  tenant_id: string;
  created_at: string;
  updated_at: string | null;
}

export const securitySubTypeApi = {
  getAll: async (): Promise<SecuritySubTypeData[]> => {
    const response = await api.get("/security-subtypes/");
    return response.data;
  },
  create: async (data: Partial<SecuritySubTypeData>): Promise<SecuritySubTypeData> => {
    const response = await api.post("/security-subtypes/", data);
    return response.data;
  },
  update: async (id: number, data: Partial<SecuritySubTypeData>): Promise<SecuritySubTypeData> => {
    const response = await api.patch(`/security-subtypes/${id}`, data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/security-subtypes/${id}`);
  },
};

/* ─── Users ─── */
export interface UserData {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  tenant_id: string;
  is_active: boolean;
  is_superuser: boolean;
  is_verified: boolean;
  role: "member" | "admin";
}

export const userApi = {
  getUsers: async (): Promise<UserData[]> => {
    const response = await api.get("/users/");
    return response.data;
  },
  updateUserRole: async (
    userId: string,
    role: "member" | "admin",
  ): Promise<UserData> => {
    const response = await api.patch(`/users/${userId}/role`, { role });
    return response.data;
  },
};

export default api;
