"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import {
  countryExposureApi,
  CountryExposureData,
  fundApi,
  FundData,
} from "@/lib/api";
import { formatDecimal2 } from "@/lib/formatters";

function formatCurrency(val: number | null): string {
  if (val == null) return "";
  return Number(val).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function CountryExposureContent() {
  const [items, setItems] = useState<CountryExposureData[]>([]);
  const [funds, setFunds] = useState<FundData[]>([]);
  const [positionDate, setPositionDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [fundId, setFundId] = useState<number | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fundApi.getAll().then(setFunds).catch(() => {});
  }, []);

  useEffect(() => {
    loadData();
  }, [positionDate, fundId]);

  async function loadData() {
    try {
      setIsLoading(true);
      setError("");
      const data = await countryExposureApi.get({
        position_date: positionDate,
        fund_id: fundId,
      });
      setItems(data);
    } catch (err: any) {
      setError(err.message || "Failed to load exposure data");
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }

  const filteredItems = items.filter((item) => {
    if (!searchQuery) return true;
    return item.country.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Separate totals row from data rows
  const dataRows = filteredItems.filter((item) => item.country !== "Total");
  const totalsRow = items.find((item) => item.country === "Total");

  return (
    <div>
      <div className="files-card">
        <div className="files-header">
          <div>
            <h2>Country Exposure</h2>
            <p>Exposure by country of issue</p>
          </div>
        </div>

        <div className="files-search" style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <input
            type="date"
            value={positionDate}
            onChange={(e) => setPositionDate(e.target.value)}
            style={{ width: "180px" }}
          />
          <select
            value={fundId ?? ""}
            onChange={(e) => setFundId(e.target.value ? Number(e.target.value) : undefined)}
            style={{ width: "180px" }}
          >
            <option value="">All Funds</option>
            {funds.map((f) => (
              <option key={f.id} value={f.id}>{f.fund_code}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Search by country..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, minWidth: "200px" }}
          />
        </div>

        {error && <div className="modal-error">{error}</div>}

        <div className="files-table-wrapper">
          {isLoading ? (
            <div className="files-empty">Loading...</div>
          ) : dataRows.length === 0 ? (
            <div className="files-empty">No exposure data found</div>
          ) : (
            <table className="files-table">
              <thead>
                <tr>
                  <th>COUNTRY</th>
                  <th style={{ textAlign: "right" }}>LONG</th>
                  <th style={{ textAlign: "right" }}>SHORT</th>
                  <th style={{ textAlign: "right" }}>GROSS</th>
                  <th style={{ textAlign: "right" }}>NET</th>
                </tr>
              </thead>
              <tbody>
                {dataRows.map((item) => (
                  <tr key={item.country}>
                    <td>{item.country}</td>
                    <td style={{ textAlign: "right", fontFamily: "monospace" }}>
                      {formatCurrency(item.long_exposure)}
                    </td>
                    <td style={{ textAlign: "right", fontFamily: "monospace" }}>
                      {formatCurrency(item.short_exposure)}
                    </td>
                    <td style={{ textAlign: "right", fontFamily: "monospace" }}>
                      {formatCurrency(item.gross_exposure)}
                    </td>
                    <td style={{
                      textAlign: "right",
                      fontFamily: "monospace",
                      color: item.net_exposure >= 0 ? "#16a34a" : "#dc2626",
                    }}>
                      {formatCurrency(item.net_exposure)}
                    </td>
                  </tr>
                ))}
                {totalsRow && (
                  <tr style={{ fontWeight: 700, borderTop: "2px solid var(--color-border)" }}>
                    <td>{totalsRow.country}</td>
                    <td style={{ textAlign: "right", fontFamily: "monospace" }}>
                      {formatCurrency(totalsRow.long_exposure)}
                    </td>
                    <td style={{ textAlign: "right", fontFamily: "monospace" }}>
                      {formatCurrency(totalsRow.short_exposure)}
                    </td>
                    <td style={{ textAlign: "right", fontFamily: "monospace" }}>
                      {formatCurrency(totalsRow.gross_exposure)}
                    </td>
                    <td style={{
                      textAlign: "right",
                      fontFamily: "monospace",
                      color: totalsRow.net_exposure >= 0 ? "#16a34a" : "#dc2626",
                    }}>
                      {formatCurrency(totalsRow.net_exposure)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CountryExposurePage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <CountryExposureContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
