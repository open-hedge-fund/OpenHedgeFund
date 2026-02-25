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

/* ─── Column Mappings (available mapping options) ─── */
export interface ColumnMappingOption {
  key: string;
  label: string;
  table: string;
  data_type: string;
  description: string;
  db_field: string;
  csv_column: string;
}

export interface AvailableMappingsResponse {
  mappings: ColumnMappingOption[];
  grouped_mappings: Record<string, ColumnMappingOption[]>;
  summary: Record<string, string[]>;
}

export const columnMappingApi = {
  getAvailableMappings: async (): Promise<AvailableMappingsResponse> => {
    const response = await api.get("/column-mappings/available-mappings");
    return response.data;
  },
  getMappingKeys: async (): Promise<string[]> => {
    const response = await api.get("/column-mappings/mapping-keys");
    return response.data;
  },
  validateMapping: async (key: string): Promise<{ valid: boolean; mapping?: ColumnMappingOption; error?: string }> => {
    const response = await api.get(`/column-mappings/validate-mapping/${key}`);
    return response.data;
  },
};

/* ─── Column Definitions ─── */
export interface ColumnDefinitionData {
  id: number;
  file_id: number;
  column_name: string;
  table_mapping: string;
  column_mapping: string;
  date_format: string | null;
  tenant_id: string;
  created_at: string;
  updated_at: string | null;
}

export interface ColumnDefinitionCreateData {
  file_id: number;
  column_name: string;
  table_mapping: string;
  column_mapping: string;
  date_format?: string | null;
}

export interface ColumnDefinitionUpdateData {
  column_name?: string;
  table_mapping?: string;
  column_mapping?: string;
  date_format?: string | null;
}

export const columnDefinitionApi = {
  getByFile: async (fileId: number): Promise<ColumnDefinitionData[]> => {
    const response = await api.get("/column-definitions/", { params: { file_id: fileId } });
    return response.data;
  },
  create: async (data: ColumnDefinitionCreateData): Promise<ColumnDefinitionData> => {
    const response = await api.post("/column-definitions/", data);
    return response.data;
  },
  update: async (id: number, data: ColumnDefinitionUpdateData): Promise<ColumnDefinitionData> => {
    const response = await api.patch(`/column-definitions/${id}`, data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/column-definitions/${id}`);
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

/* ─── Generic CRUD Factory ─── */
function createCrudApi<T, TCreate = Partial<T>, TUpdate = Partial<T>>(endpoint: string) {
  return {
    getAll: async (): Promise<T[]> => {
      const response = await api.get(`${endpoint}/`);
      return response.data;
    },
    get: async (id: number): Promise<T> => {
      const response = await api.get(`${endpoint}/${id}`);
      return response.data;
    },
    create: async (data: TCreate): Promise<T> => {
      const response = await api.post(`${endpoint}/`, data);
      return response.data;
    },
    update: async (id: number, data: TUpdate): Promise<T> => {
      const response = await api.patch(`${endpoint}/${id}`, data);
      return response.data;
    },
    delete: async (id: number): Promise<void> => {
      await api.delete(`${endpoint}/${id}`);
    },
  };
}

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

export const assetTypeApi = createCrudApi<AssetTypeData>("/asset-types");

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

export const continentApi = createCrudApi<ContinentData>("/continents");

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

export const countryApi = createCrudApi<CountryData>("/countries");

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

export const currencyApi = createCrudApi<CurrencyData>("/currencies");

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

export const custodianApi = createCrudApi<CustodianData>("/custodians");

/* ─── Strategies ─── */
export interface StrategyData {
  id: number;
  strategy_code: string;
  strategy_description: string;
  is_active: boolean;
  tenant_id: string;
  created_at: string;
  updated_at: string | null;
}

export const strategyApi = createCrudApi<StrategyData>("/strategies");

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

export const fundApi = createCrudApi<FundData>("/funds");

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

export const marketCategoryApi = createCrudApi<MarketCategoryData>("/market-categories");

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

export const securityTypeApi = createCrudApi<SecurityTypeData>("/security-types");

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

export const securitySubTypeApi = createCrudApi<SecuritySubTypeData>("/security-subtypes");

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
  ...createCrudApi<SecurityData, SecurityCreateData, SecurityUpdateData>("/securities"),
  getAll: async (skip = 0, limit = 500): Promise<SecurityData[]> => {
    const response = await api.get("/securities/", { params: { skip, limit } });
    return response.data;
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
  ...createCrudApi<PriceData, PriceCreateData, PriceUpdateData>("/prices"),
  getAll: async (params?: { price_date?: string; security_id?: number; skip?: number; limit?: number }): Promise<PriceData[]> => {
    const response = await api.get("/prices/", { params });
    return response.data;
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
  ...createCrudApi<FxRateData, FxRateCreateData, FxRateUpdateData>("/fx-rates"),
  getAll: async (params?: { rate_date?: string; ref_currency_id?: number; currency_id?: number; skip?: number; limit?: number }): Promise<FxRateData[]> => {
    const response = await api.get("/fx-rates/", { params });
    return response.data;
  },
};

/* ─── Brokers ─── */
export interface BrokerData {
  id: number;
  broker_code: string;
  broker_description: string;
  tenant_id: string;
  created_at: string;
  updated_at: string | null;
}

export interface BrokerCreateData {
  broker_code: string;
  broker_description: string;
}

export interface BrokerUpdateData {
  broker_code?: string;
  broker_description?: string;
}

export const brokerApi = createCrudApi<BrokerData, BrokerCreateData, BrokerUpdateData>("/brokers");

/* ─── Positions ─── */
export interface PositionData {
  id: number;
  position_date: string;
  security_id: number;
  fund_id: number | null;
  strategy_id: number | null;
  ccy_id: number | null;
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
  fund_id?: number;
  strategy_id?: number;
  ccy_id?: number;
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
  strategy_id?: number;
  ccy_id?: number;
  side?: string;
  quantity?: number;
  cost?: number;
  price_local?: number;
  price_base?: number;
  outstanding_shares?: number;
  market_cap?: number;
}

export const positionApi = {
  ...createCrudApi<PositionData, PositionCreateData, PositionUpdateData>("/positions"),
  getAll: async (params?: { position_date?: string; security_id?: number; fund_id?: number; skip?: number; limit?: number }): Promise<PositionData[]> => {
    const response = await api.get("/positions/", { params });
    return response.data;
  },
  createBulk: async (data: PositionCreateData[]): Promise<PositionData[]> => {
    const response = await api.post("/positions/bulk", data);
    return response.data;
  },
};

/* ─── Holdings ─── */
export interface HoldingData {
  id: number;
  holding_date: string;
  security_id: number;
  fund_id: number | null;
  custodian_id: number | null;
  broker_id: number | null;
  strategy_id: number | null;
  ccy_id: number | null;
  side: string;
  quantity_start: number | null;
  quantity_end: number | null;
  cost_local: number | null;
  cost_base: number | null;
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
  fund_id?: number;
  custodian_id?: number;
  broker_id?: number;
  strategy_id?: number;
  ccy_id?: number;
  side: string;
  quantity_start?: number;
  quantity_end?: number;
  cost_local?: number;
  cost_base?: number;
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
  broker_id?: number;
  strategy_id?: number;
  ccy_id?: number;
  side?: string;
  quantity_start?: number;
  quantity_end?: number;
  cost_local?: number;
  cost_base?: number;
  price_local?: number;
  price_base?: number;
  outstanding_shares?: number;
  market_cap?: number;
}

export const holdingApi = {
  ...createCrudApi<HoldingData, HoldingCreateData, HoldingUpdateData>("/holdings"),
  getAll: async (params?: { holding_date?: string; security_id?: number; fund_id?: number; custodian_id?: number; skip?: number; limit?: number }): Promise<HoldingData[]> => {
    const response = await api.get("/holdings/", { params });
    return response.data;
  },
  createBulk: async (data: HoldingCreateData[]): Promise<HoldingData[]> => {
    const response = await api.post("/holdings/bulk", data);
    return response.data;
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

/* ─── Market Category Exposure Report ─── */
export interface MarketCategoryExposureData {
  market_category: string;
  long_exposure: number;
  short_exposure: number;
  gross_exposure: number;
  net_exposure: number;
}

export const marketCategoryExposureApi = {
  get: async (params: { position_date: string; fund_id?: number }): Promise<MarketCategoryExposureData[]> => {
    const response = await api.get("/reports/market-category-exposure", { params });
    return response.data;
  },
};

export default api;
