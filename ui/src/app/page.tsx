"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { LogoIcon } from "@/components/Brand";

export default function Home() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}

function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard-wrapper">
      <header className="dashboard-header">
        <div className="dashboard-header-brand">
          <LogoIcon />
          <span className="dashboard-header-title">OpenHedgeFund</span>
        </div>
        <div className="dashboard-header-actions">
          <span className="dashboard-header-user">{user?.email}</span>
          <button className="btn btn-logout" onClick={logout}>
            Sign Out
          </button>
        </div>
      </header>
      <main className="dashboard-content">
        <div className="dashboard-welcome-card">
          <h2>Welcome back{user?.email ? `, ${user.email}` : ""}</h2>
          <p>Your dashboard is being built. More features coming soon.</p>
        </div>
      </main>
    </div>
  );
}
