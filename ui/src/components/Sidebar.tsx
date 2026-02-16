"use client";

import { usePathname } from "next/navigation";
import { LogoIcon } from "@/components/Brand";
import {
  DashboardIcon,
  PortfolioIcon,
  AnalyticsIcon,
  TradingIcon,
  RiskIcon,
  TeamIcon,
  SettingsIcon,
  FileIcon,
  ImportIcon,
  CloseIcon,
} from "@/components/icons/SidebarIcons";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

/* Simple generic icons for settings items */
function DataIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  );
}

const menuItems = [
  { label: "Dashboard", icon: DashboardIcon, href: "/" },
  { label: "Import Data", icon: ImportIcon, href: "/import-data" },
  { label: "Portfolio", icon: PortfolioIcon, href: "#", badge: "Soon" },
  { label: "Analytics", icon: AnalyticsIcon, href: "#", badge: "Soon" },
  { label: "Trading", icon: TradingIcon, href: "#", badge: "Soon" },
  { label: "Risk Management", icon: RiskIcon, href: "#", badge: "Soon" },
];

const settingsItems = [
  { label: "Files", icon: FileIcon, href: "/settings/files" },
  { label: "Asset Types", icon: DataIcon, href: "/settings/asset-types" },
  { label: "Security Types", icon: DataIcon, href: "/settings/security-types" },
  { label: "Security SubTypes", icon: DataIcon, href: "/settings/security-subtypes" },
  { label: "Continents", icon: DataIcon, href: "/settings/continents" },
  { label: "Countries", icon: DataIcon, href: "/settings/countries" },
  { label: "Currencies", icon: DataIcon, href: "/settings/currencies" },
  { label: "Custodians", icon: DataIcon, href: "/settings/custodians" },
  { label: "Funds", icon: DataIcon, href: "/settings/funds" },
  { label: "Market Categories", icon: DataIcon, href: "/settings/market-categories" },
  { label: "Team", icon: TeamIcon, href: "#", badge: "Soon" },
  { label: "Settings", icon: SettingsIcon, href: "#", badge: "Soon" },
];

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
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
                  className={`sidebar-menu-link${pathname === item.href ? " active" : ""}`}
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

          <div className="sidebar-section-title">Settings</div>
          <ul className="sidebar-menu">
            {settingsItems.map((item) => (
              <li key={item.label} className="sidebar-menu-item">
                <a href={item.href} className={`sidebar-menu-link${pathname === item.href ? " active" : ""}`}>
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
