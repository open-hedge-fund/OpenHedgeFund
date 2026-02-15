"use client";

import { LogoIcon } from "@/components/Brand";
import {
  DashboardIcon,
  PortfolioIcon,
  AnalyticsIcon,
  TradingIcon,
  RiskIcon,
  TeamIcon,
  SettingsIcon,
  CloseIcon,
} from "@/components/icons/SidebarIcons";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const menuItems = [
  { label: "Dashboard", icon: DashboardIcon, href: "/", active: true },
  { label: "Portfolio", icon: PortfolioIcon, href: "#", badge: "Soon" },
  { label: "Analytics", icon: AnalyticsIcon, href: "#", badge: "Soon" },
  { label: "Trading", icon: TradingIcon, href: "#", badge: "Soon" },
  { label: "Risk Management", icon: RiskIcon, href: "#", badge: "Soon" },
];

const othersItems = [
  { label: "Team", icon: TeamIcon, href: "#", badge: "Soon" },
  { label: "Settings", icon: SettingsIcon, href: "#", badge: "Soon" },
];

export default function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      <div
        className={`sidebar-overlay${open ? " visible" : ""}`}
        onClick={onClose}
      />
      <aside className={`sidebar${open ? " open" : ""}`}>
        <div className="sidebar-header">
          <a href="/" className="sidebar-logo">
            <LogoIcon size={32} />
            <span className="sidebar-logo-text">OpenHedgeFund</span>
          </a>
          <button
            className="sidebar-close"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-title">Menu</div>
          <ul className="sidebar-menu">
            {menuItems.map((item) => (
              <li key={item.label} className="sidebar-menu-item">
                <a
                  href={item.href}
                  className={`sidebar-menu-link${item.active ? " active" : ""}`}
                >
                  <span className="sidebar-menu-link-icon">
                    <item.icon size={22} />
                  </span>
                  <span className="sidebar-menu-link-label">{item.label}</span>
                  {item.badge && (
                    <span className="sidebar-badge">{item.badge}</span>
                  )}
                </a>
              </li>
            ))}
          </ul>

          <div className="sidebar-section-title">Others</div>
          <ul className="sidebar-menu">
            {othersItems.map((item) => (
              <li key={item.label} className="sidebar-menu-item">
                <a href={item.href} className="sidebar-menu-link">
                  <span className="sidebar-menu-link-icon">
                    <item.icon size={22} />
                  </span>
                  <span className="sidebar-menu-link-label">{item.label}</span>
                  {item.badge && (
                    <span className="sidebar-badge">{item.badge}</span>
                  )}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}
