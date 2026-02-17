"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";

function SectorExposureContent() {
  return (
    <div className="report-card">
      <h2 className="report-title">Sector Exposure</h2>
      <p style={{ color: "var(--color-text-secondary)", padding: "2rem 0" }}>
        Coming soon.
      </p>
    </div>
  );
}

export default function SectorExposurePage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <SectorExposureContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
