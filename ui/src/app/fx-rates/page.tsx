"use client";

import { useState, useEffect, useMemo } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import { fxRateApi, FxRateData, currencyApi, CurrencyData } from "@/lib/api";

function formatDate(d: string | null): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
}

function formatRate(rate: number | string): string {
  return Number(rate).toFixed(6);
}

function FxRatesContent() {
  const [items, setItems] = useState<FxRateData[]>([]);
  const [currencies, setCurrencies] = useState<Record<number, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");

  useEffect(() => {
    loadInitial();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      loadRates(selectedDate);
    }
  }, [selectedDate]);

  async function loadInitial() {
    try {
      setIsLoading(true);
      const [dates, ccyData] = await Promise.all([
        fxRateApi.getDates(),
        currencyApi.getAll(),
      ]);

      const ccyLookup: Record<number, string> = {};
      ccyData.forEach((c: CurrencyData) => {
        ccyLookup[c.id] = c.ccy;
      });
      setCurrencies(ccyLookup);
      setAvailableDates(dates);

      if (dates.length > 0) {
        setSelectedDate(dates[0]);
      } else {
        setIsLoading(false);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load FX rates");
      setIsLoading(false);
    }
  }

  async function loadRates(date: string) {
    try {
      setIsLoading(true);
      setError("");
      const ratesData = await fxRateApi.getAll({ rate_date: date });
      setItems(ratesData);
    } catch (err: any) {
      setError(err.message || "Failed to load FX rates");
    } finally {
      setIsLoading(false);
    }
  }

  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    const q = searchQuery.toLowerCase();
    return items.filter((item) => {
      const ccyCode = currencies[item.currency_id]?.toLowerCase() || "";
      const refCode = currencies[item.ref_currency_id]?.toLowerCase() || "";
      return ccyCode.includes(q) || refCode.includes(q);
    });
  }, [items, searchQuery, currencies]);

  return (
    <div>
      <div className="files-card">
        <div className="files-header">
          <div>
            <h2>FX Rates</h2>
            <p>Daily exchange rates (USD base)</p>
          </div>
        </div>

        <div className="files-search" style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid #D1D5DB", fontSize: "0.875rem" }}
          >
            {availableDates.length === 0 && <option value="">No dates available</option>}
            {availableDates.map((d) => (
              <option key={d} value={d}>
                {formatDate(d)}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Search by currency code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1 }}
          />
        </div>

        {error && <div className="modal-error">{error}</div>}

        <div className="files-table-wrapper">
          {isLoading ? (
            <div className="files-empty">Loading...</div>
          ) : filteredItems.length === 0 ? (
            <div className="files-empty">No FX rates found</div>
          ) : (
            <table className="files-table">
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>PAIR</th>
                  <th>CURRENCY</th>
                  <th style={{ textAlign: "right" }}>DIRECT (USD→CCY)</th>
                  <th style={{ textAlign: "right" }}>INDIRECT (CCY→USD)</th>
                  <th>SOURCE</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const refCcy = currencies[item.ref_currency_id] || "?";
                  const ccy = currencies[item.currency_id] || "?";
                  return (
                    <tr key={item.id}>
                      <td>{formatDate(item.rate_date)}</td>
                      <td>
                        <span style={{ display: "inline-flex", padding: "0.125rem 0.5rem", fontSize: "0.75rem", fontWeight: 600, borderRadius: "0.25rem", backgroundColor: "#DBEAFE", color: "#1E40AF" }}>
                          {refCcy}/{ccy}
                        </span>
                      </td>
                      <td>{ccy}</td>
                      <td style={{ textAlign: "right", fontFamily: "monospace" }}>{formatRate(item.direct)}</td>
                      <td style={{ textAlign: "right", fontFamily: "monospace" }}>{formatRate(item.indirect)}</td>
                      <td>
                        <span style={{ fontSize: "0.75rem", color: "#6B7280" }}>
                          {item.last_modified_by || "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FxRatesPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <FxRatesContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
