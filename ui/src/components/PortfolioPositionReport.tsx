"use client";

import { useState } from "react";

function getTodayString(): string {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

export default function PortfolioPositionReport() {
  const [reportDate, setReportDate] = useState(getTodayString);
  const [loading, setLoading] = useState(false);
  const [positions, setPositions] = useState<Record<string, unknown>[]>([]);
  const [summary, setSummary] = useState<{
    total_positions: number;
    total_market_value_base: number;
    unique_funds: number;
    unique_securities: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasRun, setHasRun] = useState(false);

  const handleRunReport = async () => {
    if (!reportDate) {
      setError("Please select a report date.");
      return;
    }

    setLoading(true);
    setError(null);
    setSummary(null);
    setPositions([]);
    setHasRun(true);

    try {
      // TODO: Wire up when backend endpoint exists
      // const response = await api.get(`/reports/position-report?report_date=${reportDate}`);
      // setSummary(response.data.summary);
      // setPositions(response.data.positions);
      setError(
        "Portfolio report endpoint is not yet available. The positions table and report API need to be created first.",
      );
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr.response?.data?.detail || "Failed to run report.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (positions.length === 0) return;

    const headers = [
      "Fund Code",
      "Symbol",
      "Description",
      "Asset Class",
      "Side",
      "Quantity",
      "Cost",
      "Price Local",
      "Price Base",
      "Market Value Base",
      "Currency",
      "Country of Risk",
      "CUSIP",
      "ISIN",
      "SEDOL",
    ];

    const rows = positions.map((p) =>
      headers.map((h) => {
        const key = h.toLowerCase().replace(/ /g, "_");
        const val = p[key] ?? "";
        return typeof val === "string" && val.includes(",")
          ? `"${val}"`
          : String(val);
      }),
    );

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `portfolio_report_${reportDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    if (positions.length === 0) return;
    // TODO: Implement with html2canvas + jsPDF when data is available
  };

  const formatNumber = (n: number) =>
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);

  return (
    <>
      <div className="report-card">
        <h2 className="report-title">Portfolio View</h2>

        <div className="report-controls">
          <div className="report-date-group">
            <input
              type="date"
              className="form-input report-date-input"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
            />
          </div>

          <div className="report-actions">
            <button
              className="btn btn-primary report-action-btn"
              onClick={handleRunReport}
              disabled={loading}
            >
              {loading ? "Running..." : "Run Report"}
            </button>
            <button
              className="btn report-action-btn report-btn-secondary"
              onClick={handleExportCSV}
              disabled={positions.length === 0}
            >
              Export to CSV
            </button>
            <button
              className="btn report-action-btn report-btn-secondary"
              onClick={handleExportPDF}
              disabled={positions.length === 0}
            >
              Export to PDF
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div
          className="alert-error"
          style={{ marginTop: "var(--spacing-lg)" }}
        >
          {error}
        </div>
      )}

      {summary && (
        <div className="report-summary">
          <div className="report-summary-card">
            <span className="report-summary-label">Total Positions</span>
            <span className="report-summary-value">
              {summary.total_positions.toLocaleString()}
            </span>
          </div>
          <div className="report-summary-card">
            <span className="report-summary-label">Market Value (Base)</span>
            <span className="report-summary-value">
              ${formatNumber(summary.total_market_value_base)}
            </span>
          </div>
          <div className="report-summary-card">
            <span className="report-summary-label">Unique Funds</span>
            <span className="report-summary-value">
              {summary.unique_funds}
            </span>
          </div>
          <div className="report-summary-card">
            <span className="report-summary-label">Unique Securities</span>
            <span className="report-summary-value">
              {summary.unique_securities}
            </span>
          </div>
        </div>
      )}

      {positions.length > 0 && (
        <div
          className="files-table-wrapper"
          style={{ marginTop: "var(--spacing-lg)" }}
        >
          <table className="files-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Description</th>
                <th>Fund</th>
                <th>Asset Class</th>
                <th>Side</th>
                <th style={{ textAlign: "right" }}>Quantity</th>
                <th style={{ textAlign: "right" }}>Price</th>
                <th style={{ textAlign: "right" }}>Market Value</th>
                <th>Currency</th>
                <th>Country</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 500 }}>
                    {String(p.symbol ?? "")}
                  </td>
                  <td>{String(p.security_description ?? "")}</td>
                  <td>{String(p.fund_code ?? "")}</td>
                  <td>{String(p.asset_class ?? "")}</td>
                  <td>{String(p.side ?? "")}</td>
                  <td style={{ textAlign: "right" }}>
                    {formatNumber(Number(p.quantity ?? 0))}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {formatNumber(Number(p.price_base ?? 0))}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {formatNumber(Number(p.market_value_base ?? 0))}
                  </td>
                  <td>{String(p.security_currency_code ?? "")}</td>
                  <td>{String(p.country_of_risk ?? "")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {hasRun && !loading && positions.length === 0 && !error && (
        <div className="report-empty-card">
          <p>No positions found for this date.</p>
        </div>
      )}

      {!hasRun && (
        <div className="report-empty-card">
          <p>
            Select a report date and click &quot;Run Report&quot; to view
            portfolio positions
          </p>
        </div>
      )}
    </>
  );
}
