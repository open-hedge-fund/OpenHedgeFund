"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";

function AssetTypeExposureContent() {
  return (
    <div className="report-card">
      <h2 className="report-title">Asset Type Exposure</h2>
      <p style={{ color: "var(--color-text-secondary)", padding: "2rem 0" }}>
        Coming soon.
      </p>
    </div>
  );
}

export default function AssetTypeExposurePage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <AssetTypeExposureContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
