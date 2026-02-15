"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}

function LogoIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="10" fill="#3C50E0" />
      <path
        d="M14 32V16l10 8-10 8ZM24 32V16l10 8-10 8Z"
        fill="white"
        fillOpacity="0.9"
      />
    </svg>
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
