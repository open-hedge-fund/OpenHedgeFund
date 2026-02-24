"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { LogoIcon } from "@/components/Brand";
import {
  DashboardIcon,
  FileIcon,
  ImportIcon,
  CloseIcon,
  SecurityMasterIcon,
  ReportIcon,
} from "@/components/icons/SidebarIcons";
import { useAuth } from "@/context/AuthContext";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

/* Icons for settings items */
function AssetTypeIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 3h-8l-2 4h12z" />
    </svg>
  );
}

function SecurityTypeIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function SecuritySubTypeIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function ContinentIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function CountryIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  );
}

function CurrencyIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function FxRateIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function CustodianIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18" />
      <path d="M3 10h18" />
      <path d="M5 6l7-3 7 3" />
      <line x1="7" y1="10" x2="7" y2="21" />
      <line x1="12" y1="10" x2="12" y2="21" />
      <line x1="17" y1="10" x2="17" y2="21" />
    </svg>
  );
}

function FundIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="18" rx="2" />
      <path d="M7 9h4" />
      <path d="M7 13h2" />
      <circle cx="16" cy="11" r="2" />
    </svg>
  );
}

function MarketCategoryIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

interface MenuItem {
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  href: string;
  badge?: string;
  requiresAdmin?: boolean;
}

const menuItems: MenuItem[] = [
  { label: "Portfolio View", icon: DashboardIcon, href: "/portfolio-view" },
  { label: "Security Master", icon: SecurityMasterIcon, href: "/security-master" },
  { label: "FX Rates", icon: FxRateIcon, href: "/fx-rates" },
  { label: "Import Data", icon: ImportIcon, href: "/import-data" },
];

const reportItems: MenuItem[] = [
  { label: "Country Exposure", icon: ReportIcon, href: "/country-exposure" },
  { label: "Currency Exposure", icon: ReportIcon, href: "/currency-exposure" },
  { label: "Sector Exposure", icon: ReportIcon, href: "/sector-exposure" },
  { label: "Asset Type Exposure", icon: ReportIcon, href: "/asset-type-exposure" },
];

const settingsItems: MenuItem[] = [
  { label: "Files", icon: FileIcon, href: "/settings/files" },
  { label: "Asset Types", icon: AssetTypeIcon, href: "/settings/asset-types" },
  { label: "Security Types", icon: SecurityTypeIcon, href: "/settings/security-types" },
  { label: "Security SubTypes", icon: SecuritySubTypeIcon, href: "/settings/security-subtypes" },
  { label: "Continents", icon: ContinentIcon, href: "/settings/continents" },
  { label: "Countries", icon: CountryIcon, href: "/settings/countries" },
  { label: "Currencies", icon: CurrencyIcon, href: "/settings/currencies" },
  { label: "Custodians", icon: CustodianIcon, href: "/settings/custodians" },
  { label: "Funds", icon: FundIcon, href: "/settings/funds" },
  { label: "Market Categories", icon: MarketCategoryIcon, href: "/settings/market-categories" },
];

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const isAdmin = user?.is_superuser || user?.role === "admin";

  const visibleSettingsItems = settingsItems.filter(
    (item) => !item.requiresAdmin || isAdmin,
  );

  return (
    <>
      <div
        className={`sidebar-overlay${open ? " visible" : ""}`}
        onClick={onClose}
      />
      <aside className={`sidebar${open ? " open" : ""}`}>
        <div className="sidebar-header">
          <Link href="/" className="sidebar-logo">
            <LogoIcon size={32} />
            <span className="sidebar-logo-text">OpenHedgeFund</span>
          </Link>
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
                <Link
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
                </Link>
              </li>
            ))}
          </ul>

          <div className="sidebar-section-title">Reports</div>
          <ul className="sidebar-menu">
            {reportItems.map((item) => (
              <li key={item.label} className="sidebar-menu-item">
                <Link
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
                </Link>
              </li>
            ))}
          </ul>

          <div className="sidebar-section-title">Settings</div>
          <ul className="sidebar-menu">
            {visibleSettingsItems.map((item) => (
              <li key={item.label} className="sidebar-menu-item">
                <Link href={item.href} className={`sidebar-menu-link${pathname === item.href ? " active" : ""}`}>
                  <span className="sidebar-menu-link-icon">
                    <item.icon size={22} />
                  </span>
                  <span className="sidebar-menu-link-label">{item.label}</span>
                  {item.badge && (
                    <span className="sidebar-badge">{item.badge}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}
