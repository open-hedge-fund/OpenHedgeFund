"use client";

import { useState, useEffect } from "react";
import {
  portfolioViewApi,
  PortfolioViewSection,
  PortfolioViewRow,
  PortfolioViewTotals,
  fundApi,
  FundData,
} from "@/lib/api";

function getTodayString(): string {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

function formatInt(n: number | null): string {
  if (n === null || n === undefined) return "";
  return Math.round(n).toLocaleString("en-US");
}

function formatMoney(n: number | null): string {
  if (n === null || n === undefined) return "";
  return Math.round(n).toLocaleString("en-US");
}

function formatPrice(n: number | null): string {
  if (n === null || n === undefined) return "";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatPct(n: number | null): string {
  if (n === null || n === undefined) return "";
  return (n * 100).toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }) + "%";
}

const rightMono: React.CSSProperties = {
  textAlign: "right",
  fontFamily: "monospace",
};

function SectionTable({
  section,
}: {
  section: PortfolioViewSection;
}) {
  return (
    <div className="files-card" style={{ marginBottom: "var(--spacing-lg)" }}>
      <div className="files-header">
        <div>
          <h2>{section.fund_code}</h2>
        </div>
      </div>
      <div className="files-table-wrapper">
        <table className="files-table">
          <thead>
            <tr>
              <th>Underlier</th>
              <th>Security Description</th>
              <th style={{ textAlign: "right" }}>Last Price</th>
              <th style={{ textAlign: "right" }}>Current Qty</th>
              <th style={{ textAlign: "right" }}>Market Value ($)</th>
              <th style={{ textAlign: "right" }}>Unrealized P&L %</th>
              <th style={{ textAlign: "right" }}>Unrealized P&L (Base) %</th>
              <th style={{ textAlign: "right" }}>% of Portfolio</th>
            </tr>
          </thead>
          <tbody>
            {section.rows.map((row: PortfolioViewRow, i: number) => (
              <tr key={`${row.underlier}-${i}`}>
                <td style={{ fontWeight: 500 }}>{row.underlier}</td>
                <td>{row.security_description}</td>
                <td style={rightMono}>{formatPrice(row.last_price)}</td>
                <td style={rightMono}>{formatInt(row.current_qty)}</td>
                <td style={rightMono}>{formatMoney(row.market_value_base)}</td>
                <td style={{ ...rightMono, color: plColor(row.unrealized_pl_pct) }}>
                  {formatPct(row.unrealized_pl_pct)}
                </td>
                <td style={{ ...rightMono, color: plColor(row.unrealized_pl_base_pct) }}>
                  {formatPct(row.unrealized_pl_base_pct)}
                </td>
                <td style={rightMono}>{formatPct(row.pct_of_portfolio)}</td>
              </tr>
            ))}
            <TotalsRow label="Subtotal - Other Assets" totals={section.subtotal_other_assets} />
            <TotalsRow label="Total - Portfolio" totals={section.total_portfolio} bold />
          </tbody>
        </table>
      </div>
    </div>
  );
}

function plColor(val: number | null | undefined): string | undefined {
  if (val === null || val === undefined) return undefined;
  if (val >= 0) return "#16a34a";
  return "#dc2626";
}

function TotalsRow({
  label,
  totals,
  bold,
}: {
  label: string;
  totals: PortfolioViewTotals;
  bold?: boolean;
}) {
  const style: React.CSSProperties = bold
    ? { fontWeight: "bold", borderTop: "2px solid var(--color-border)" }
    : { fontWeight: 600, borderTop: "1px solid var(--color-border)" };

  return (
    <tr style={style}>
      <td colSpan={2}>{label}</td>
      <td />
      <td />
      <td style={rightMono}>{formatMoney(totals.market_value_base)}</td>
      <td style={{ ...rightMono, color: plColor(totals.unrealized_pl_pct) }}>
        {formatPct(totals.unrealized_pl_pct)}
      </td>
      <td style={{ ...rightMono, color: plColor(totals.unrealized_pl_base_pct) }}>
        {formatPct(totals.unrealized_pl_base_pct)}
      </td>
      <td style={rightMono}>{formatPct(totals.pct_of_portfolio)}</td>
    </tr>
  );
}

export default function PortfolioPositionReport() {
  const [reportDate, setReportDate] = useState(getTodayString);
  const [fundId, setFundId] = useState<number | undefined>(undefined);
  const [funds, setFunds] = useState<FundData[]>([]);
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState<PortfolioViewSection[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasRun, setHasRun] = useState(false);

  useEffect(() => {
    fundApi.getAll().then(setFunds).catch(() => {});
  }, []);

  const handleRunReport = async () => {
    if (!reportDate) {
      setError("Please select a report date.");
      return;
    }

    setLoading(true);
    setError(null);
    setSections([]);
    setHasRun(true);

    try {
      const params: { position_date: string; fund_id?: number } = {
        position_date: reportDate,
      };
      if (fundId) params.fund_id = fundId;
      const response = await portfolioViewApi.get(params);
      setSections(response.sections);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr.response?.data?.detail || "Failed to run report.");
    } finally {
      setLoading(false);
    }
  };

  const allRows = sections.flatMap((s) => s.rows);

  const handleExportCSV = () => {
    if (sections.length === 0) return;

    const headers = [
      "Fund",
      "Underlier",
      "Security Description",
      "Last Price",
      "Current Qty",
      "Market Value ($)",
      "Cost Local",
      "Unrealized P&L %",
      "Cost Base",
      "Unrealized P&L (Base) %",
      "% of Portfolio",
    ];

    const csvRows: string[][] = [];
    for (const section of sections) {
      for (const row of section.rows) {
        csvRows.push([
          section.fund_code,
          row.underlier,
          row.security_description ?? "",
          row.last_price !== null ? String(row.last_price) : "",
          row.current_qty !== null ? String(row.current_qty) : "",
          String(row.market_value_base),
          String(row.cost_local),
          row.unrealized_pl_pct !== null ? String(row.unrealized_pl_pct) : "",
          String(row.cost_base),
          row.unrealized_pl_base_pct !== null ? String(row.unrealized_pl_base_pct) : "",
          row.pct_of_portfolio !== null ? String(row.pct_of_portfolio) : "",
        ]);
      }
    }

    const csv = [
      headers.join(","),
      ...csvRows.map((r) =>
        r.map((v) => (v.includes(",") ? `"${v}"` : v)).join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `portfolio_view_${reportDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
            <select
              value={fundId ?? ""}
              onChange={(e) =>
                setFundId(e.target.value ? Number(e.target.value) : undefined)
              }
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
              disabled={allRows.length === 0}
            >
              Export to CSV
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

      {loading && (
        <div className="report-empty-card">
          <p>Loading...</p>
        </div>
      )}

      {!loading &&
        sections.map((section, i) => (
          <SectionTable key={`${section.fund_code}-${i}`} section={section} />
        ))}

      {hasRun && !loading && sections.length === 0 && !error && (
        <div className="report-empty-card">
          <p>No positions found for this date.</p>
        </div>
      )}

      {!hasRun && !loading && (
        <div className="report-empty-card">
          <p>
            Select a report date and click &quot;Run Report&quot; to view the
            portfolio
          </p>
        </div>
      )}
    </>
  );
}
