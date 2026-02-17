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
  error_details: Record<string, unknown> | null;
  imported_by_user_id: string | null;
  imported_by_name: string | null;
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
    fileType?: string,
  ): Promise<FileImportData> => {
    const formData = new FormData();
    formData.append("file", file);
    const searchParams = new URLSearchParams();
    if (fileId) searchParams.set("file_id", String(fileId));
    if (fileType) searchParams.set("file_type", fileType);
    const qs = searchParams.toString();
    const response = await api.post(`/file-imports/upload${qs ? `?${qs}` : ""}`, formData, {
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

/* ─── Securities ─── */
export interface SecurityData {
  id: number;
  symbol: string | null;
  security_des: string | null;
  id_1: string | null;
  id_2: string | null;
  id_3: string | null;
  cntry_of_risk_id: number | null;
  cntry_of_domicile_id: number | null;
  is_active: boolean;
  coupon: number | null;
  maturity_date: string | null;
  issue_date: string | null;
  first_coupon_date: string | null;
  penultimate_coupon_date: string | null;
  last_update_date: string | null;
  ccy_id: number | null;
  country_id: number | null;
  security_subtype_id: number | null;
  asset_type_id: number | null;
  market_category_id: number | null;
  tenant_id: string;
  created_at: string;
  updated_at: string | null;
}

export interface SecurityCreateData {
  symbol?: string;
  security_des?: string;
  id_1?: string;
  id_2?: string;
  id_3?: string;
  cntry_of_risk_id?: number;
  cntry_of_domicile_id?: number;
  is_active?: boolean;
  coupon?: number;
  maturity_date?: string;
  issue_date?: string;
  first_coupon_date?: string;
  penultimate_coupon_date?: string;
  last_update_date?: string;
  ccy_id?: number;
  country_id?: number;
  security_subtype_id?: number;
  asset_type_id?: number;
  market_category_id?: number;
}

export interface SecurityUpdateData {
  symbol?: string;
  security_des?: string;
  id_1?: string;
  id_2?: string;
  id_3?: string;
  cntry_of_risk_id?: number;
  cntry_of_domicile_id?: number;
  is_active?: boolean;
  coupon?: number;
  maturity_date?: string;
  issue_date?: string;
  first_coupon_date?: string;
  penultimate_coupon_date?: string;
  last_update_date?: string;
  ccy_id?: number;
  country_id?: number;
  security_subtype_id?: number;
  asset_type_id?: number;
  market_category_id?: number;
}

export const securityApi = {
  getAll: async (skip = 0, limit = 500): Promise<SecurityData[]> => {
    const response = await api.get("/securities/", { params: { skip, limit } });
    return response.data;
  },
  create: async (data: SecurityCreateData): Promise<SecurityData> => {
    const response = await api.post("/securities/", data);
    return response.data;
  },
  get: async (id: number): Promise<SecurityData> => {
    const response = await api.get(`/securities/${id}`);
    return response.data;
  },
  update: async (id: number, data: SecurityUpdateData): Promise<SecurityData> => {
    const response = await api.patch(`/securities/${id}`, data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/securities/${id}`);
  },
};

/* ─── Prices ─── */
export interface PriceData {
  id: number;
  price_date: string;
  security_id: number;
  currency_id: number;
  last: number;
  next_day_open: number | null;
  last_modified_by: string | null;
  last_modified_on: string | null;
  tenant_id: string;
  created_at: string;
  updated_at: string | null;
}

export interface PriceCreateData {
  price_date: string;
  security_id: number;
  currency_id: number;
  last: number;
  next_day_open?: number;
  last_modified_by?: string;
  last_modified_on?: string;
}

export interface PriceUpdateData {
  price_date?: string;
  security_id?: number;
  currency_id?: number;
  last?: number;
  next_day_open?: number;
  last_modified_by?: string;
  last_modified_on?: string;
}

export const priceApi = {
  getAll: async (params?: { price_date?: string; security_id?: number; skip?: number; limit?: number }): Promise<PriceData[]> => {
    const response = await api.get("/prices/", { params });
    return response.data;
  },
  create: async (data: PriceCreateData): Promise<PriceData> => {
    const response = await api.post("/prices/", data);
    return response.data;
  },
  get: async (id: number): Promise<PriceData> => {
    const response = await api.get(`/prices/${id}`);
    return response.data;
  },
  update: async (id: number, data: PriceUpdateData): Promise<PriceData> => {
    const response = await api.patch(`/prices/${id}`, data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/prices/${id}`);
  },
};

/* ─── FX Rates ─── */
export interface FxRateData {
  id: number;
  rate_date: string;
  ref_currency_id: number;
  currency_id: number;
  direct: number;
  indirect: number;
  last_modified_by: string | null;
  last_modified_on: string | null;
  tenant_id: string;
  created_at: string;
  updated_at: string | null;
}

export interface FxRateCreateData {
  rate_date: string;
  ref_currency_id: number;
  currency_id: number;
  direct: number;
  indirect: number;
  last_modified_by?: string;
  last_modified_on?: string;
}

export interface FxRateUpdateData {
  rate_date?: string;
  ref_currency_id?: number;
  currency_id?: number;
  direct?: number;
  indirect?: number;
  last_modified_by?: string;
  last_modified_on?: string;
}

export const fxRateApi = {
  getAll: async (params?: { rate_date?: string; ref_currency_id?: number; currency_id?: number; skip?: number; limit?: number }): Promise<FxRateData[]> => {
    const response = await api.get("/fx-rates/", { params });
    return response.data;
  },
  create: async (data: FxRateCreateData): Promise<FxRateData> => {
    const response = await api.post("/fx-rates/", data);
    return response.data;
  },
  get: async (id: number): Promise<FxRateData> => {
    const response = await api.get(`/fx-rates/${id}`);
    return response.data;
  },
  update: async (id: number, data: FxRateUpdateData): Promise<FxRateData> => {
    const response = await api.patch(`/fx-rates/${id}`, data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/fx-rates/${id}`);
  },
};

/* ─── Positions ─── */
export interface PositionData {
  id: number;
  position_date: string;
  security_id: number;
  fund_id: number;
  side: string;
  quantity: number | null;
  cost: number | null;
  price_local: number | null;
  price_base: number | null;
  outstanding_shares: number | null;
  market_cap: number | null;
  tenant_id: string;
  created_at: string;
  updated_at: string | null;
}

export interface PositionCreateData {
  position_date: string;
  security_id: number;
  fund_id: number;
  side: string;
  quantity?: number;
  cost?: number;
  price_local?: number;
  price_base?: number;
  outstanding_shares?: number;
  market_cap?: number;
}

export interface PositionUpdateData {
  position_date?: string;
  security_id?: number;
  fund_id?: number;
  side?: string;
  quantity?: number;
  cost?: number;
  price_local?: number;
  price_base?: number;
  outstanding_shares?: number;
  market_cap?: number;
}

export const positionApi = {
  getAll: async (params?: { position_date?: string; security_id?: number; fund_id?: number; skip?: number; limit?: number }): Promise<PositionData[]> => {
    const response = await api.get("/positions/", { params });
    return response.data;
  },
  create: async (data: PositionCreateData): Promise<PositionData> => {
    const response = await api.post("/positions/", data);
    return response.data;
  },
  createBulk: async (data: PositionCreateData[]): Promise<PositionData[]> => {
    const response = await api.post("/positions/bulk", data);
    return response.data;
  },
  get: async (id: number): Promise<PositionData> => {
    const response = await api.get(`/positions/${id}`);
    return response.data;
  },
  update: async (id: number, data: PositionUpdateData): Promise<PositionData> => {
    const response = await api.patch(`/positions/${id}`, data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/positions/${id}`);
  },
};

/* ─── Holdings ─── */
export interface HoldingData {
  id: number;
  holding_date: string;
  security_id: number;
  fund_id: number;
  custodian_id: number;
  side: string;
  quantity: number | null;
  cost: number | null;
  price_local: number | null;
  price_base: number | null;
  outstanding_shares: number | null;
  market_cap: number | null;
  tenant_id: string;
  created_at: string;
  updated_at: string | null;
}

export interface HoldingCreateData {
  holding_date: string;
  security_id: number;
  fund_id: number;
  custodian_id: number;
  side: string;
  quantity?: number;
  cost?: number;
  price_local?: number;
  price_base?: number;
  outstanding_shares?: number;
  market_cap?: number;
}

export interface HoldingUpdateData {
  holding_date?: string;
  security_id?: number;
  fund_id?: number;
  custodian_id?: number;
  side?: string;
  quantity?: number;
  cost?: number;
  price_local?: number;
  price_base?: number;
  outstanding_shares?: number;
  market_cap?: number;
}

export const holdingApi = {
  getAll: async (params?: { holding_date?: string; security_id?: number; fund_id?: number; custodian_id?: number; skip?: number; limit?: number }): Promise<HoldingData[]> => {
    const response = await api.get("/holdings/", { params });
    return response.data;
  },
  create: async (data: HoldingCreateData): Promise<HoldingData> => {
    const response = await api.post("/holdings/", data);
    return response.data;
  },
  createBulk: async (data: HoldingCreateData[]): Promise<HoldingData[]> => {
    const response = await api.post("/holdings/bulk", data);
    return response.data;
  },
  get: async (id: number): Promise<HoldingData> => {
    const response = await api.get(`/holdings/${id}`);
    return response.data;
  },
  update: async (id: number, data: HoldingUpdateData): Promise<HoldingData> => {
    const response = await api.patch(`/holdings/${id}`, data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/holdings/${id}`);
  },
};

/* ─── Staging Holdings ─── */
export interface StagingHoldingData {
  id: number;
  account: string | null;
  account_name: string | null;
  symbol: string | null;
  security_description: string | null;
  issuing_country: string | null;
  local_currency: string | null;
  asset_class: string | null;
  side: string | null;
  quantity: number | null;
  cost: number | null;
  price_local: number | null;
  price_base: number | null;
  outstanding_shares: number | null;
  market_cap: number | null;
  underlier: string | null;
  sedol: string | null;
  isin: string | null;
  cusip: string | null;
  file_id: number | null;
  row_number: number | null;
  runid: string | null;
  tenant_id: string;
  processed_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface StagingHoldingCreateData {
  account?: string;
  account_name?: string;
  symbol?: string;
  security_description?: string;
  issuing_country?: string;
  local_currency?: string;
  asset_class?: string;
  side?: string;
  quantity?: number;
  cost?: number;
  price_local?: number;
  price_base?: number;
  outstanding_shares?: number;
  market_cap?: number;
  underlier?: string;
  sedol?: string;
  isin?: string;
  cusip?: string;
  file_id?: number;
  row_number?: number;
  runid?: string;
}

export const stagingHoldingApi = {
  getAll: async (params?: { runid?: string; file_id?: number; skip?: number; limit?: number }): Promise<StagingHoldingData[]> => {
    const response = await api.get("/staging-holdings/", { params });
    return response.data;
  },
  create: async (data: StagingHoldingCreateData): Promise<StagingHoldingData> => {
    const response = await api.post("/staging-holdings/", data);
    return response.data;
  },
  createBulk: async (data: StagingHoldingCreateData[]): Promise<StagingHoldingData[]> => {
    const response = await api.post("/staging-holdings/bulk", data);
    return response.data;
  },
  get: async (id: number): Promise<StagingHoldingData> => {
    const response = await api.get(`/staging-holdings/${id}`);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/staging-holdings/${id}`);
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
  created_at?: string;
}

export interface UserProfileUpdateData {
  first_name?: string;
  last_name?: string;
}

export interface UserCreateData {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  role?: "member" | "admin";
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
  updateProfile: async (data: UserProfileUpdateData): Promise<UserData> => {
    const response = await api.patch("/users/me", data);
    return response.data;
  },
  addUser: async (data: UserCreateData): Promise<UserData> => {
    const response = await api.post("/users/", data);
    return response.data;
  },
};

/* ─── Tenants ─── */
export interface TenantData {
  id: string;
  name: string;
  domain: string | null;
  created_at: string;
  updated_at: string;
}

export interface TenantUpdateData {
  name?: string;
  domain?: string;
}

export const tenantApi = {
  getMyTenant: async (): Promise<TenantData> => {
    const response = await api.get("/tenants/me");
    return response.data;
  },
  updateMyTenant: async (data: TenantUpdateData): Promise<TenantData> => {
    const response = await api.patch("/tenants/me", data);
    return response.data;
  },
};

export default api;
