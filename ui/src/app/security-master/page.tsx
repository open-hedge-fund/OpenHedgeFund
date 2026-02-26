"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import {
  securityApi,
  SecurityData,
  SecurityCreateData,
  assetTypeApi,
  AssetTypeData,
  securitySubTypeApi,
  SecuritySubTypeData,
  currencyApi,
  CurrencyData,
  countryApi,
  CountryData,
  marketCategoryApi,
  MarketCategoryData,
} from "@/lib/api";

/* ─── Types ─── */
interface RefData {
  assetTypes: AssetTypeData[];
  securitySubTypes: SecuritySubTypeData[];
  currencies: CurrencyData[];
  countries: CountryData[];
  marketCategories: MarketCategoryData[];
}

type EditFormData = {
  symbol: string;
  security_des: string;
  id_1: string;
  id_2: string;
  id_3: string;
  cntry_of_risk_id: string;
  cntry_of_domicile_id: string;
  is_active: boolean;
  coupon: string;
  maturity_date: string;
  issue_date: string;
  first_coupon_date: string;
  penultimate_coupon_date: string;
  ccy_id: string;
  country_id: string;
  security_subtype_id: string;
  asset_type_id: string;
  market_category_id: string;
};

const TABS = ["General", "Identifiers", "Classification", "Geographic", "Financial", "Dates"] as const;
type TabName = (typeof TABS)[number];

const STATUS_OPTIONS = ["All", "Active", "Inactive"];

/* ─── Icons ─── */
function PlusIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function ChevronIcon({ direction = "down", size = 14 }: { direction?: "up" | "down"; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: direction === "up" ? "rotate(180deg)" : undefined }}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function EditIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

/* ─── Helpers ─── */
function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
}

function buildLookup<T extends { id: number }>(items: T[], labelFn: (item: T) => string): Map<number, string> {
  const map = new Map<number, string>();
  items.forEach((item) => map.set(item.id, labelFn(item)));
  return map;
}

function securityToForm(s: SecurityData): EditFormData {
  return {
    symbol: s.symbol ?? "",
    security_des: s.security_des ?? "",
    id_1: s.id_1 ?? "",
    id_2: s.id_2 ?? "",
    id_3: s.id_3 ?? "",
    cntry_of_risk_id: s.cntry_of_risk_id !== null ? String(s.cntry_of_risk_id) : "",
    cntry_of_domicile_id: s.cntry_of_domicile_id !== null ? String(s.cntry_of_domicile_id) : "",
    is_active: s.is_active,
    coupon: s.coupon !== null && s.coupon !== undefined ? String(s.coupon) : "",
    maturity_date: s.maturity_date ?? "",
    issue_date: s.issue_date ?? "",
    first_coupon_date: s.first_coupon_date ?? "",
    penultimate_coupon_date: s.penultimate_coupon_date ?? "",
    ccy_id: s.ccy_id !== null ? String(s.ccy_id) : "",
    country_id: s.country_id !== null ? String(s.country_id) : "",
    security_subtype_id: s.security_subtype_id !== null ? String(s.security_subtype_id) : "",
    asset_type_id: s.asset_type_id !== null ? String(s.asset_type_id) : "",
    market_category_id: s.market_category_id !== null ? String(s.market_category_id) : "",
  };
}

function emptyForm(): EditFormData {
  return {
    symbol: "", security_des: "", id_1: "", id_2: "", id_3: "",
    cntry_of_risk_id: "", cntry_of_domicile_id: "", is_active: true,
    coupon: "", maturity_date: "", issue_date: "",
    first_coupon_date: "", penultimate_coupon_date: "",
    ccy_id: "", country_id: "", security_subtype_id: "",
    asset_type_id: "", market_category_id: "",
  };
}

function formToPayload(form: EditFormData): SecurityCreateData {
  const payload: Record<string, unknown> = {};
  payload.symbol = form.symbol || null;
  payload.security_des = form.security_des || null;
  payload.id_1 = form.id_1 || null;
  payload.id_2 = form.id_2 || null;
  payload.id_3 = form.id_3 || null;
  payload.cntry_of_risk_id = form.cntry_of_risk_id ? parseInt(form.cntry_of_risk_id) : null;
  payload.cntry_of_domicile_id = form.cntry_of_domicile_id ? parseInt(form.cntry_of_domicile_id) : null;
  payload.is_active = form.is_active;
  payload.coupon = form.coupon ? parseFloat(form.coupon) : null;
  payload.maturity_date = form.maturity_date || null;
  payload.issue_date = form.issue_date || null;
  payload.first_coupon_date = form.first_coupon_date || null;
  payload.penultimate_coupon_date = form.penultimate_coupon_date || null;
  payload.ccy_id = form.ccy_id ? parseInt(form.ccy_id) : null;
  payload.country_id = form.country_id ? parseInt(form.country_id) : null;
  payload.security_subtype_id = form.security_subtype_id ? parseInt(form.security_subtype_id) : null;
  payload.asset_type_id = form.asset_type_id ? parseInt(form.asset_type_id) : null;
  payload.market_category_id = form.market_category_id ? parseInt(form.market_category_id) : null;
  return payload as SecurityCreateData;
}

/* ─── Reusable field components ─── */
function FieldView({ label, value }: { label: string; value: string | number | null }) {
  const display = value === null || value === undefined || value === "" ? null : String(value);
  return (
    <div className="sm-field-group">
      <span className="sm-field-label">{label}</span>
      {display ? (
        <span className="sm-field-value">{display}</span>
      ) : (
        <span className="sm-field-value-empty">{"\u2014"}</span>
      )}
    </div>
  );
}

function FieldInput({ label, value, onChange, type = "text" }: {
  label: string; value: string; onChange: (val: string) => void; type?: string;
}) {
  return (
    <div className="sm-field-group">
      <span className="sm-field-label">{label}</span>
      <input className="sm-field-input" type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function FieldRefSelect({ label, value, options, onChange }: {
  label: string; value: string; options: { id: number; label: string }[]; onChange: (val: string) => void;
}) {
  return (
    <div className="sm-field-group">
      <span className="sm-field-label">{label}</span>
      <select className="sm-field-select" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">-- None --</option>
        {options.map((opt) => (
          <option key={opt.id} value={String(opt.id)}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

/* ─── Lookup helper ─── */
function useLookups(ref: RefData) {
  return useMemo(() => ({
    assetType: buildLookup(ref.assetTypes, (a) => a.asset_type_code),
    subType: buildLookup(ref.securitySubTypes, (s) => s.security_subtype_code),
    currency: buildLookup(ref.currencies, (c) => c.ccy),
    country: buildLookup(ref.countries, (c) => c.country_code),
    marketCat: buildLookup(ref.marketCategories, (m) => m.market_category_code),
  }), [ref]);
}

/* ─── Tab components ─── */
interface TabProps {
  security: SecurityData;
  lookups: ReturnType<typeof useLookups>;
  ref: RefData;
  editing: boolean;
  form?: EditFormData;
  setForm?: (f: EditFormData) => void;
}

function TabGeneral({ security, lookups, ref: refData, editing, form, setForm }: TabProps) {
  if (editing && form && setForm) {
    return (
      <div className="sm-field-grid">
        <FieldInput label="Symbol" value={form.symbol} onChange={(v) => setForm({ ...form, symbol: v })} />
        <FieldInput label="Description" value={form.security_des} onChange={(v) => setForm({ ...form, security_des: v })} />
        <FieldRefSelect label="Asset Type" value={form.asset_type_id} options={refData.assetTypes.map((a) => ({ id: a.id, label: a.asset_type_code }))} onChange={(v) => setForm({ ...form, asset_type_id: v })} />
        <div className="sm-field-group">
          <span className="sm-field-label">Status</span>
          <select className="sm-field-select" value={form.is_active ? "true" : "false"} onChange={(e) => setForm({ ...form, is_active: e.target.value === "true" })}>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
        <FieldRefSelect label="Security SubType" value={form.security_subtype_id} options={refData.securitySubTypes.map((s) => ({ id: s.id, label: s.security_subtype_code }))} onChange={(v) => setForm({ ...form, security_subtype_id: v })} />
        <FieldRefSelect label="Currency" value={form.ccy_id} options={refData.currencies.map((c) => ({ id: c.id, label: `${c.ccy} - ${c.ccy_des}` }))} onChange={(v) => setForm({ ...form, ccy_id: v })} />
        <FieldRefSelect label="Country" value={form.country_id} options={refData.countries.map((c) => ({ id: c.id, label: `${c.country_code} - ${c.country_desc}` }))} onChange={(v) => setForm({ ...form, country_id: v })} />
      </div>
    );
  }
  return (
    <div className="sm-field-grid">
      <FieldView label="Symbol" value={security.symbol} />
      <FieldView label="Description" value={security.security_des} />
      <FieldView label="Asset Type" value={lookups.assetType.get(security.asset_type_id ?? 0) ?? null} />
      <FieldView label="Status" value={security.is_active ? "Active" : "Inactive"} />
      <FieldView label="Security SubType" value={lookups.subType.get(security.security_subtype_id ?? 0) ?? null} />
      <FieldView label="Currency" value={lookups.currency.get(security.ccy_id ?? 0) ?? null} />
      <FieldView label="Country" value={lookups.country.get(security.country_id ?? 0) ?? null} />
    </div>
  );
}

function TabIdentifiers({ security, editing, form, setForm }: TabProps) {
  if (editing && form && setForm) {
    return (
      <div className="sm-field-grid-3">
        <FieldInput label="ID 1" value={form.id_1} onChange={(v) => setForm({ ...form, id_1: v })} />
        <FieldInput label="ID 2" value={form.id_2} onChange={(v) => setForm({ ...form, id_2: v })} />
        <FieldInput label="ID 3" value={form.id_3} onChange={(v) => setForm({ ...form, id_3: v })} />
      </div>
    );
  }
  return (
    <div className="sm-field-grid-3">
      <FieldView label="ID 1" value={security.id_1} />
      <FieldView label="ID 2" value={security.id_2} />
      <FieldView label="ID 3" value={security.id_3} />
    </div>
  );
}

function TabClassification({ security, lookups, ref: refData, editing, form, setForm }: TabProps) {
  if (editing && form && setForm) {
    return (
      <div className="sm-field-grid">
        <FieldRefSelect label="Security SubType" value={form.security_subtype_id} options={refData.securitySubTypes.map((s) => ({ id: s.id, label: s.security_subtype_code }))} onChange={(v) => setForm({ ...form, security_subtype_id: v })} />
        <FieldRefSelect label="Asset Type" value={form.asset_type_id} options={refData.assetTypes.map((a) => ({ id: a.id, label: a.asset_type_code }))} onChange={(v) => setForm({ ...form, asset_type_id: v })} />
        <FieldRefSelect label="Market Category" value={form.market_category_id} options={refData.marketCategories.map((m) => ({ id: m.id, label: m.market_category_code }))} onChange={(v) => setForm({ ...form, market_category_id: v })} />
      </div>
    );
  }
  return (
    <div className="sm-field-grid">
      <FieldView label="Security SubType" value={lookups.subType.get(security.security_subtype_id ?? 0) ?? null} />
      <FieldView label="Asset Type" value={lookups.assetType.get(security.asset_type_id ?? 0) ?? null} />
      <FieldView label="Market Category" value={lookups.marketCat.get(security.market_category_id ?? 0) ?? null} />
    </div>
  );
}

function TabGeographic({ security, lookups, ref: refData, editing, form, setForm }: TabProps) {
  if (editing && form && setForm) {
    return (
      <div className="sm-field-grid">
        <FieldRefSelect label="Country" value={form.country_id} options={refData.countries.map((c) => ({ id: c.id, label: `${c.country_code} - ${c.country_desc}` }))} onChange={(v) => setForm({ ...form, country_id: v })} />
        <FieldRefSelect label="Country of Risk" value={form.cntry_of_risk_id} options={refData.countries.map((c) => ({ id: c.id, label: `${c.country_code} - ${c.country_desc}` }))} onChange={(v) => setForm({ ...form, cntry_of_risk_id: v })} />
        <FieldRefSelect label="Country of Domicile" value={form.cntry_of_domicile_id} options={refData.countries.map((c) => ({ id: c.id, label: `${c.country_code} - ${c.country_desc}` }))} onChange={(v) => setForm({ ...form, cntry_of_domicile_id: v })} />
        <FieldRefSelect label="Market Category" value={form.market_category_id} options={refData.marketCategories.map((m) => ({ id: m.id, label: m.market_category_code }))} onChange={(v) => setForm({ ...form, market_category_id: v })} />
      </div>
    );
  }
  return (
    <div className="sm-field-grid">
      <FieldView label="Country" value={lookups.country.get(security.country_id ?? 0) ?? null} />
      <FieldView label="Country of Risk" value={lookups.country.get(security.cntry_of_risk_id ?? 0) ?? null} />
      <FieldView label="Country of Domicile" value={lookups.country.get(security.cntry_of_domicile_id ?? 0) ?? null} />
      <FieldView label="Market Category" value={lookups.marketCat.get(security.market_category_id ?? 0) ?? null} />
    </div>
  );
}

function TabFinancial({ security, lookups, ref: refData, editing, form, setForm }: TabProps) {
  if (editing && form && setForm) {
    return (
      <div className="sm-field-grid-3">
        <FieldRefSelect label="Currency" value={form.ccy_id} options={refData.currencies.map((c) => ({ id: c.id, label: `${c.ccy} - ${c.ccy_des}` }))} onChange={(v) => setForm({ ...form, ccy_id: v })} />
        <FieldInput label="Coupon (%)" value={form.coupon} type="number" onChange={(v) => setForm({ ...form, coupon: v })} />
      </div>
    );
  }
  return (
    <div className="sm-field-grid-3">
      <FieldView label="Currency" value={lookups.currency.get(security.ccy_id ?? 0) ?? null} />
      <FieldView label="Coupon" value={security.coupon !== null ? `${security.coupon}%` : null} />
    </div>
  );
}

function TabDates({ security, editing, form, setForm }: TabProps) {
  if (editing && form && setForm) {
    return (
      <div className="sm-field-grid">
        <FieldInput label="Issue Date" value={form.issue_date} type="date" onChange={(v) => setForm({ ...form, issue_date: v })} />
        <FieldInput label="Maturity Date" value={form.maturity_date} type="date" onChange={(v) => setForm({ ...form, maturity_date: v })} />
        <FieldInput label="First Coupon Date" value={form.first_coupon_date} type="date" onChange={(v) => setForm({ ...form, first_coupon_date: v })} />
        <FieldInput label="Penultimate Coupon Date" value={form.penultimate_coupon_date} type="date" onChange={(v) => setForm({ ...form, penultimate_coupon_date: v })} />
      </div>
    );
  }
  return (
    <div className="sm-field-grid">
      <FieldView label="Issue Date" value={formatDate(security.issue_date)} />
      <FieldView label="Maturity Date" value={formatDate(security.maturity_date)} />
      <FieldView label="First Coupon Date" value={formatDate(security.first_coupon_date)} />
      <FieldView label="Penultimate Coupon Date" value={formatDate(security.penultimate_coupon_date)} />
      <FieldView label="Last Updated" value={formatDate(security.last_update_date)} />
    </div>
  );
}

/* ─── Detail Panel ─── */
function DetailPanel({
  security,
  lookups,
  refData,
  collapsed,
  onToggleCollapse,
  onSave,
  onDelete,
  creating,
  onCancelCreate,
}: {
  security: SecurityData | null;
  lookups: ReturnType<typeof useLookups>;
  refData: RefData;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onSave: (id: number | null, data: SecurityCreateData) => Promise<void>;
  onDelete: (id: number) => void;
  creating: boolean;
  onCancelCreate: () => void;
}) {
  const [activeTab, setActiveTab] = useState<TabName>("General");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditFormData>(emptyForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (creating) {
      setForm(emptyForm());
      setEditing(true);
      setActiveTab("General");
    }
  }, [creating]);

  useEffect(() => {
    if (!creating) {
      setEditing(false);
    }
  }, [security?.id, creating]);

  const handleEdit = () => {
    if (security) {
      setForm(securityToForm(security));
      setEditing(true);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    if (creating) onCancelCreate();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(creating ? null : security?.id ?? null, formToPayload(form));
      setEditing(false);
      if (creating) onCancelCreate();
    } catch {
      alert("Failed to save security");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (security && window.confirm(`Delete "${security.symbol}"? This cannot be undone.`)) {
      onDelete(security.id);
    }
  };

  const displaySecurity = security;
  const isEditing = editing;

  const tabProps: TabProps | null = displaySecurity ? {
    security: displaySecurity,
    lookups,
    ref: refData,
    editing: isEditing,
    form,
    setForm,
  } : null;

  const tabContent = tabProps ? (() => {
    switch (activeTab) {
      case "General": return <TabGeneral {...tabProps} />;
      case "Identifiers": return <TabIdentifiers {...tabProps} />;
      case "Classification": return <TabClassification {...tabProps} />;
      case "Geographic": return <TabGeographic {...tabProps} />;
      case "Financial": return <TabFinancial {...tabProps} />;
      case "Dates": return <TabDates {...tabProps} />;
    }
  })() : null;

  const showEditableContent = creating || displaySecurity;

  return (
    <div className={`sm-detail-panel${collapsed ? " sm-detail-collapsed" : ""}`}>
      <div className="sm-detail-header">
        <h3>
          {creating ? (
            "New Security"
          ) : displaySecurity ? (
            <>
              {displaySecurity.symbol || "Untitled"} {"\u2014"} {displaySecurity.security_des || "No description"}
              <span className={displaySecurity.is_active ? "sm-badge-active" : "sm-badge-inactive"}>
                {displaySecurity.is_active ? "Active" : "Inactive"}
              </span>
            </>
          ) : (
            "No security selected"
          )}
        </h3>
        <div className="sm-detail-actions">
          {displaySecurity && !isEditing && !creating && (
            <>
              <button className="btn btn-outline sm-btn-edit" onClick={handleEdit}>
                <EditIcon /> Edit
              </button>
              <button className="btn btn-outline sm-btn-delete" onClick={handleDelete}>
                <TrashIcon /> Delete
              </button>
            </>
          )}
          <button className="sm-toggle-btn" onClick={onToggleCollapse} title={collapsed ? "Expand" : "Collapse"}>
            <ChevronIcon direction={collapsed ? "up" : "down"} />
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          <div className="sm-tabs">
            {TABS.map((tab) => (
              <button
                key={tab}
                className={`sm-tab${activeTab === tab ? " sm-tab-active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {showEditableContent ? (
            <>
              <div className="sm-tab-content">
                {creating && !displaySecurity ? (
                  // Creating mode: render form fields using a dummy SecurityData
                  (() => {
                    const dummySecurity: SecurityData = {
                      id: 0, symbol: null, security_des: null, id_1: null, id_2: null, id_3: null,
                      cntry_of_risk_id: null, cntry_of_domicile_id: null, is_active: true,
                      coupon: null, maturity_date: null, issue_date: null,
                      first_coupon_date: null, penultimate_coupon_date: null, last_update_date: null,
                      ccy_id: null, country_id: null, security_subtype_id: null,
                      asset_type_id: null, sector_id: null, market_category_id: null,
                      tenant_id: "", created_at: "", updated_at: null,
                    };
                    const createTabProps: TabProps = { security: dummySecurity, lookups, ref: refData, editing: true, form, setForm };
                    switch (activeTab) {
                      case "General": return <TabGeneral {...createTabProps} />;
                      case "Identifiers": return <TabIdentifiers {...createTabProps} />;
                      case "Classification": return <TabClassification {...createTabProps} />;
                      case "Geographic": return <TabGeographic {...createTabProps} />;
                      case "Financial": return <TabFinancial {...createTabProps} />;
                      case "Dates": return <TabDates {...createTabProps} />;
                    }
                  })()
                ) : (
                  tabContent
                )}
              </div>
              {isEditing && (
                <div className="sm-save-bar">
                  <button className="btn btn-outline" onClick={handleCancel} disabled={saving}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                    {saving ? "Saving..." : creating ? "Create Security" : "Save Changes"}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="sm-tab-content">
              <div className="sm-empty-state">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="9" y1="3" x2="9" y2="21" />
                </svg>
                <span>Select a security from the list to view details</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ─── Main Content ─── */
function SecurityMasterContent() {
  const [securities, setSecurities] = useState<SecurityData[]>([]);
  const [refData, setRefData] = useState<RefData>({
    assetTypes: [], securitySubTypes: [], currencies: [], countries: [], marketCategories: [],
  });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [detailCollapsed, setDetailCollapsed] = useState(false);
  const [creating, setCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const lookups = useLookups(refData);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [secs, assetTypes, subTypes, currencies, countries, marketCats] = await Promise.all([
        securityApi.getAll(),
        assetTypeApi.getAll(),
        securitySubTypeApi.getAll(),
        currencyApi.getAll(),
        countryApi.getAll(),
        marketCategoryApi.getAll(),
      ]);
      setSecurities(secs);
      setRefData({ assetTypes, securitySubTypes: subTypes, currencies, countries, marketCategories: marketCats });
    } catch {
      setError("Failed to load data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Build type filter options from actual security subtypes
  const typeFilterOptions = useMemo(() => {
    const codes = new Set(refData.securitySubTypes.map((s) => s.security_subtype_code));
    return ["All Types", ...Array.from(codes).sort()];
  }, [refData.securitySubTypes]);

  const [typeFilter, setTypeFilter] = useState("All Types");

  const filtered = useMemo(() => {
    return securities.filter((s) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        (s.symbol ?? "").toLowerCase().includes(q) ||
        (s.security_des ?? "").toLowerCase().includes(q) ||
        (s.id_1 ?? "").toLowerCase().includes(q) ||
        (s.id_2 ?? "").toLowerCase().includes(q) ||
        (s.id_3 ?? "").toLowerCase().includes(q);

      const subtypeName = lookups.subType.get(s.security_subtype_id ?? 0) ?? "";
      const matchesType = typeFilter === "All Types" || subtypeName === typeFilter;

      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Active" && s.is_active) ||
        (statusFilter === "Inactive" && !s.is_active);

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [securities, searchQuery, typeFilter, statusFilter, lookups.subType]);

  const selectedSecurity = securities.find((s) => s.id === selectedId) ?? null;

  const handleSave = async (id: number | null, data: SecurityCreateData) => {
    if (id === null) {
      const created = await securityApi.create(data);
      setSecurities((prev) => [...prev, created]);
      setSelectedId(created.id);
    } else {
      const updated = await securityApi.update(id, data);
      setSecurities((prev) => prev.map((s) => (s.id === id ? updated : s)));
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await securityApi.delete(id);
      setSecurities((prev) => prev.filter((s) => s.id !== id));
      if (selectedId === id) setSelectedId(null);
    } catch {
      alert("Failed to delete security");
    }
  };

  const handleAddSecurity = () => {
    setSelectedId(null);
    setCreating(true);
    setDetailCollapsed(false);
  };

  if (isLoading) {
    return (
      <div className="loading-screen" style={{ height: "16rem" }}>
        <div className="loading-spinner" />
        <span>Loading securities...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert-error" style={{ margin: "var(--spacing-xl)" }}>
        <span>{error}</span>
        <button
          onClick={loadData}
          style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--color-error)", cursor: "pointer", textDecoration: "underline" }}
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="sm-content">
      {/* Securities List */}
      <div className="sm-list-panel">
        <div className="sm-list-header">
          <h2>
            Securities
            <span className="sm-list-count">({filtered.length} total)</span>
          </h2>
          <div className="sm-list-toolbar">
            <input
              type="text"
              className="sm-search"
              placeholder="Search by symbol, ID, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select
              className="sm-filter-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              {typeFilterOptions.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <select
              className="sm-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button className="btn btn-primary sm-btn-add" onClick={handleAddSecurity}>
              <PlusIcon /> Add Security
            </button>
          </div>
        </div>

        <div className="sm-table-wrapper">
          <table className="sm-table">
            <thead>
              <tr>
                <th style={{ width: 50 }}>ID</th>
                <th>Symbol</th>
                <th>Description</th>
                <th>ID 1</th>
                <th>ID 2</th>
                <th>Type</th>
                <th>SubType</th>
                <th>Country</th>
                <th>CCY</th>
                <th style={{ width: 70 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr
                  key={s.id}
                  className={selectedId === s.id ? "sm-row-selected" : ""}
                  onClick={() => {
                    setSelectedId(s.id);
                    setCreating(false);
                    setDetailCollapsed(false);
                  }}
                >
                  <td className="sm-text-muted">{s.id}</td>
                  <td className="sm-symbol">{s.symbol || "\u2014"}</td>
                  <td>{s.security_des || "\u2014"}</td>
                  <td className="sm-text-muted">{s.id_1 || "\u2014"}</td>
                  <td className="sm-text-muted">{s.id_2 || "\u2014"}</td>
                  <td>
                    {s.asset_type_id ? (
                      <span className="sm-badge-type">{lookups.assetType.get(s.asset_type_id) ?? "\u2014"}</span>
                    ) : "\u2014"}
                  </td>
                  <td>{lookups.subType.get(s.security_subtype_id ?? 0) ?? "\u2014"}</td>
                  <td>{lookups.country.get(s.country_id ?? 0) ?? "\u2014"}</td>
                  <td>{lookups.currency.get(s.ccy_id ?? 0) ?? "\u2014"}</td>
                  <td>
                    <span className="sm-status-cell">
                      <span className={`sm-status-dot ${s.is_active ? "sm-status-dot-active" : "sm-status-dot-inactive"}`} />
                      {s.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ textAlign: "center", padding: "3rem 2rem", color: "var(--color-text-light)" }}>
                    {securities.length === 0 ? "No securities yet. Click \"Add Security\" to create one." : "No securities found matching your filters."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Panel */}
      <DetailPanel
        security={selectedSecurity}
        lookups={lookups}
        refData={refData}
        collapsed={detailCollapsed}
        onToggleCollapse={() => setDetailCollapsed((prev) => !prev)}
        onSave={handleSave}
        onDelete={handleDelete}
        creating={creating}
        onCancelCreate={() => setCreating(false)}
      />
    </div>
  );
}

/* ─── Page Export ─── */
export default function SecurityMasterPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <SecurityMasterContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
