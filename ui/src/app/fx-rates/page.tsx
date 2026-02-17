"use client";

import { useState, useEffect } from "react";
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

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setIsLoading(true);
      const [ratesData, ccyData] = await Promise.all([
        fxRateApi.getAll(),
        currencyApi.getAll(),
      ]);

      const ccyLookup: Record<number, string> = {};
      ccyData.forEach((c: CurrencyData) => {
        ccyLookup[c.id] = c.ccy;
      });

      setCurrencies(ccyLookup);
      setItems(ratesData);
    } catch (err: any) {
      setError(err.message || "Failed to load FX rates");
    } finally {
      setIsLoading(false);
    }
  }

  const filteredItems = items.filter((item) => {
    const q = searchQuery.toLowerCase();
    const ccyCode = currencies[item.currency_id]?.toLowerCase() || "";
    const refCode = currencies[item.ref_currency_id]?.toLowerCase() || "";
    const dateStr = item.rate_date || "";
    return ccyCode.includes(q) || refCode.includes(q) || dateStr.includes(q);
  });

  return (
    <div>
      <div className="files-card">
        <div className="files-header">
          <div>
            <h2>FX Rates</h2>
            <p>Daily exchange rates (USD base)</p>
          </div>
        </div>

        <div className="files-search">
          <input
            type="text"
            placeholder="Search by currency code or date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
                      <td>{item.rate_date}</td>
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
