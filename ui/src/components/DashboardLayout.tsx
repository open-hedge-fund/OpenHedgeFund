"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import { HamburgerIcon } from "@/components/icons/SidebarIcons";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const openSidebar = useCallback(() => setSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="app-layout">
      <Sidebar open={sidebarOpen} onClose={closeSidebar} />

      <div className="app-main">
        <header className="dashboard-header">
          <button
            className="dashboard-header-hamburger"
            onClick={openSidebar}
            aria-label="Open sidebar"
          >
            <HamburgerIcon size={20} />
          </button>
          <div className="dashboard-header-actions">
            <span className="dashboard-header-user">{user?.email}</span>
            <button className="btn btn-logout" onClick={logout}>
              Sign Out
            </button>
          </div>
        </header>

        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
}
