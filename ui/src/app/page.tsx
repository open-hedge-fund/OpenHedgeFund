"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";

export default function Home() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}

function Dashboard() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="dashboard-welcome-card">
        <h2>Welcome back{user?.email ? `, ${user.email}` : ""}</h2>
        <p>Your dashboard is being built. More features coming soon.</p>
      </div>
    </DashboardLayout>
  );
}
