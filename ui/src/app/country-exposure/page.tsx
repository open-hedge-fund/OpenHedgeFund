"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import { countryExposureApi, CountryExposureData, fundApi, FundData } from "@/lib/api";

function formatCurrency(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function CountryExposureContent() {
  const [data, setData] = useState<CountryExposureData[]>([]);
  const [funds, setFunds] = useState<FundData[]>([]);
  const [positionDate, setPositionDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [fundId, setFundId] = useState<number | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fundApi.getAll().then(setFunds).catch(() => {});
  }, []);

  useEffect(() => {
    loadData();
  }, [positionDate, fundId]);

  async function loadData() {
    try {
      setIsLoading(true);
      setError(null);
      const params: { position_date: string; fund_id?: number } = {
        position_date: positionDate,
      };
      if (fundId) params.fund_id = fundId;
      const result = await countryExposureApi.get(params);
      setData(result);
    } catch {
      setError("Failed to load exposure data");
    } finally {
      setIsLoading(false);
    }
  }

  const totalsRow = data.find((d) => d.country === "Total");
  const dataRows = data.filter((d) => d.country !== "Total");
  const filteredRows = dataRows.filter((d) =>
    d.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="files-card">
        <div className="files-header">
          <div>
            <h2>Country Exposure</h2>
            <p>Exposure by country of issue</p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "1rem", padding: "0 1.5rem 1rem", flexWrap: "wrap", alignItems: "center" }}>
          <input
            type="date"
            value={positionDate}
            onChange={(e) => setPositionDate(e.target.value)}
            style={{
              padding: "0.5rem",
              borderRadius: "0.375rem",
              border: "1px solid var(--color-border)",
              fontSize: "0.875rem",
            }}
          />
          <select
            value={fundId ?? ""}
            onChange={(e) => setFundId(e.target.value ? Number(e.target.value) : undefined)}
            style={{
              padding: "0.5rem",
              borderRadius: "0.375rem",
              border: "1px solid var(--color-border)",
              fontSize: "0.875rem",
            }}
          >
            <option value="">All Funds</option>
            {funds.map((f) => (
              <option key={f.id} value={f.id}>
                {f.fund_code} - {f.fund_description}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Search countries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: "0.5rem",
              borderRadius: "0.375rem",
              border: "1px solid var(--color-border)",
              fontSize: "0.875rem",
              flex: 1,
              minWidth: "200px",
            }}
          />
        </div>

        {error && <div className="modal-error" style={{ margin: "0 1.5rem 1rem" }}>{error}</div>}

        <div className="files-table-wrapper">
          {isLoading ? (
            <div className="files-empty">Loading...</div>
          ) : filteredRows.length === 0 && !totalsRow ? (
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
                {filteredRows.map((row) => (
                  <tr key={row.country}>
                    <td>{row.country}</td>
                    <td style={{ textAlign: "right", fontFamily: "monospace" }}>
                      {formatCurrency(row.long_exposure)}
                    </td>
                    <td style={{ textAlign: "right", fontFamily: "monospace" }}>
                      {formatCurrency(row.short_exposure)}
                    </td>
                    <td style={{ textAlign: "right", fontFamily: "monospace" }}>
                      {formatCurrency(row.gross_exposure)}
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        fontFamily: "monospace",
                        color: row.net_exposure >= 0 ? "#16a34a" : "#dc2626",
                      }}
                    >
                      {formatCurrency(row.net_exposure)}
                    </td>
                  </tr>
                ))}
                {totalsRow && (
                  <tr style={{ fontWeight: "bold", borderTop: "2px solid var(--color-border)" }}>
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
                    <td
                      style={{
                        textAlign: "right",
                        fontFamily: "monospace",
                        color: totalsRow.net_exposure >= 0 ? "#16a34a" : "#dc2626",
                      }}
                    >
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
