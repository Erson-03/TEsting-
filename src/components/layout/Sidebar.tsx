import {
  Boxes,
  Bot,
  BrainCircuit,
  ChartNoAxesCombined,
  CircleDollarSign,
  Gauge,
  History,
  LayoutDashboard,
  PackageSearch,
  PanelLeftClose,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Store,
  TrendingUp,
  Warehouse,
  X,
  type LucideIcon,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import Button from "../ui/Button";

type NavItem = { to: string; label: string; icon: LucideIcon };
type NavGroup = { label: string; items: NavItem[] };

const navGroups: NavGroup[] = [
  {
    label: "OVERVIEW",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/products", label: "Products", icon: Boxes },
      { to: "/inventory", label: "Inventory", icon: Warehouse },
      { to: "/sales-data", label: "Sales Data", icon: Store },
    ],
  },
  {
    label: "PRICING INTELLIGENCE",
    items: [
      { to: "/demand-prediction", label: "Demand Prediction", icon: TrendingUp },
      { to: "/price-recommendation", label: "Price Recommendation", icon: CircleDollarSign },
      { to: "/price-optimization", label: "Price Optimization", icon: Gauge },
      { to: "/constraint-center", label: "Constraint Center", icon: ShieldCheck },
      { to: "/sensitivity-analysis", label: "Sensitivity Analysis", icon: SlidersHorizontal },
    ],
  },
  {
    label: "GOVERNANCE",
    items: [
      { to: "/fairness-monitor", label: "Fairness Monitor", icon: Sparkles },
      { to: "/explainability", label: "Explainability", icon: BrainCircuit },
      { to: "/pricing-history", label: "Pricing History", icon: History },
      { to: "/model-monitoring", label: "Model Monitoring", icon: ChartNoAxesCombined },
      { to: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
  onDesktopHide: () => void;
}

export default function Sidebar({ mobileOpen, onMobileClose, onDesktopHide }: SidebarProps) {
  return (
    <>
      {mobileOpen && (
        <button
          className="sidebar-overlay"
          onClick={onMobileClose}
          aria-label="Close navigation menu"
        />
      )}

      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`} aria-label="Main navigation">
        <div className="brand-row">
          <div className="brand-logo" aria-hidden="true"><span /><span /><span /></div>
          <div className="brand-copy">
            <strong>PARA</strong>
            <small>Pricing Analytics and<br />Recommendation Assistant</small>
          </div>

          <Button
            className="sidebar-close"
            variant="ghost"
            icon={<X size={18} />}
            onClick={onMobileClose}
            title="Close menu"
            aria-label="Close menu"
          >
            <span className="sr-only">Close menu</span>
          </Button>
        </div>

        <button
          className="sidebar-edge-toggle"
          type="button"
          onClick={onDesktopHide}
          title="Hide menu"
          aria-label="Hide menu"
        >
          <PanelLeftClose size={17} />
          <span>Hide menu</span>
        </button>

        <nav className="sidebar-nav" aria-label="Primary navigation">
          {navGroups.map((group) => (
            <div className="nav-group" key={group.label}>
              <span className="nav-group-label">{group.label}</span>
              {group.items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onMobileClose}
                  className={({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""}`}
                >
                  <Icon size={19} aria-hidden="true" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            className="sidebar-ai-button"
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("para:assistant:open"))}
          >
            <span className="sidebar-ai-icon"><Bot size={19} /></span>
            <span><strong>PARA AI Assistant</strong><small>Ask pricing, inventory, and analytics questions</small></span>
          </button>

          <div className="sidebar-brand-note">
            <PackageSearch size={27} />
            <div>
              <strong>Fair Prices.<br />Smarter Decisions.</strong>
              <small>Decision support interface</small>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
