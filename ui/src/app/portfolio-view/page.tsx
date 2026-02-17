"use client";

import { useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import PortfolioPositionReport from "@/components/PortfolioPositionReport";

function PortfolioReportPage() {
  return (
    <DashboardLayout>
      <PortfolioPositionReport />
    </DashboardLayout>
  );
}

export default function Page() {
  return (
    <ProtectedRoute>
      <PortfolioReportPage />
    </ProtectedRoute>
  );
}
