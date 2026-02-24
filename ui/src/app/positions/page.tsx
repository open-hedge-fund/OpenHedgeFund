"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import {
  positionApi,
  PositionData,
  securityApi,
  SecurityData,
  fundApi,
  FundData,
} from "@/lib/api";

function formatDate(d: string | null): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
}

function formatQty(val: number | null): string {
  if (val == null) return "";
  return Number(val).toLocaleString();
}

function formatDecimal2(val: number | null): string {
  if (val == null) return "";
  return Number(val).toFixed(2);
}

function formatDecimal6(val: number | null): string {
  if (val == null) return "";
  return Number(val).toFixed(6);
}

function PositionsContent() {
  const [items, setItems] = useState<PositionData[]>([]);
  const [securities, setSecurities] = useState<Record<number, string>>({});
  const [funds, setFunds] = useState<Record<number, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setIsLoading(true);
      const [positionsData, secData, fundData] = await Promise.all([
        positionApi.getAll(),
        securityApi.getAll(),
        fundApi.getAll(),
      ]);

      const secLookup: Record<number, string> = {};
      secData.forEach((s: SecurityData) => {
        secLookup[s.id] = s.symbol || s.security_des || String(s.id);
      });

      const fundLookup: Record<number, string> = {};
      fundData.forEach((f: FundData) => {
        fundLookup[f.id] = f.fund_code;
      });

      setSecurities(secLookup);
      setFunds(fundLookup);
      setItems(positionsData);
    } catch (err: any) {
      setError(err.message || "Failed to load positions");
    } finally {
      setIsLoading(false);
    }
  }

  const filteredItems = items.filter((item) => {
    const q = searchQuery.toLowerCase();
    const sec = securities[item.security_id]?.toLowerCase() || "";
    const fund = funds[item.fund_id]?.toLowerCase() || "";
    const side = item.side?.toLowerCase() || "";
    const dateStr = item.position_date || "";
    return sec.includes(q) || fund.includes(q) || side.includes(q) || dateStr.includes(q);
  });

  return (
    <div>
      <div className="files-card">
        <div className="files-header">
          <div>
            <h2>Positions</h2>
            <p>Aggregated positions by security and fund</p>
          </div>
        </div>

        <div className="files-search">
          <input
            type="text"
            placeholder="Search by security, fund, side, or date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {error && <div className="modal-error">{error}</div>}

        <div className="files-table-wrapper">
          {isLoading ? (
            <div className="files-empty">Loading...</div>
          ) : filteredItems.length === 0 ? (
            <div className="files-empty">No positions found</div>
          ) : (
            <table className="files-table">
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>SECURITY</th>
                  <th>FUND</th>
                  <th>SIDE</th>
                  <th style={{ textAlign: "right" }}>QUANTITY</th>
                  <th style={{ textAlign: "right" }}>COST</th>
                  <th style={{ textAlign: "right" }}>PRICE LOCAL</th>
                  <th style={{ textAlign: "right" }}>PRICE BASE</th>
                  <th style={{ textAlign: "right" }}>MKT CAP</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td>{formatDate(item.position_date)}</td>
                    <td>{securities[item.security_id] || "?"}</td>
                    <td>{funds[item.fund_id] || "?"}</td>
                    <td>
                      <span style={{
                        display: "inline-flex",
                        padding: "0.125rem 0.5rem",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        borderRadius: "0.25rem",
                        backgroundColor: item.side === "Short" ? "#FEE2E2" : "#DBEAFE",
                        color: item.side === "Short" ? "#991B1B" : "#1E40AF",
                      }}>
                        {item.side}
                      </span>
                    </td>
                    <td style={{ textAlign: "right", fontFamily: "monospace" }}>{formatQty(item.quantity)}</td>
                    <td style={{ textAlign: "right", fontFamily: "monospace" }}>{formatDecimal2(item.cost)}</td>
                    <td style={{ textAlign: "right", fontFamily: "monospace" }}>{formatDecimal6(item.price_local)}</td>
                    <td style={{ textAlign: "right", fontFamily: "monospace" }}>{formatDecimal6(item.price_base)}</td>
                    <td style={{ textAlign: "right", fontFamily: "monospace" }}>{formatDecimal2(item.market_cap)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PositionsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <PositionsContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
