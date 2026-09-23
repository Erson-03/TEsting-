import { Bell, ChevronDown, LogOut, Menu, Moon, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import Button from "../ui/Button";

const shortcuts: Array<[string, string[]]> = [
  ["/dashboard", ["dashboard", "home", "overview"]],
  ["/products", ["product", "catalog"]],
  ["/inventory", ["inventory", "stock"]],
  ["/sales-data", ["sales", "csv", "revenue"]],
  ["/demand-prediction", ["demand", "forecast"]],
  ["/price-recommendation", ["recommend", "recommendation", "price"]],
  ["/price-optimization", ["optimize", "optimization"]],
  ["/constraint-center", ["constraint", "guardrail", "policy"]],
  ["/sensitivity-analysis", ["sensitivity", "scenario"]],
  ["/fairness-monitor", ["fairness", "responsible"]],
  ["/explainability", ["explain", "explainability"]],
  ["/pricing-history", ["history", "audit"]],
  ["/model-monitoring", ["model", "accuracy", "monitoring"]],
  ["/settings", ["setting", "preferences"]],
];

interface TopbarProps {
  onMobileMenu: () => void;
}

export default function Topbar({ onMobileMenu }: TopbarProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const [query, setQuery] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setProfileOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    const normalized = query.trim().toLowerCase();
    if (!normalized) return;

    const match = shortcuts.find(([, keywords]) =>
      keywords.some((keyword) => normalized.includes(keyword)),
    );

    if (match) {
      navigate(match[0]);
      setQuery("");
    } else {
      window.dispatchEvent(new CustomEvent("para:assistant:open", { detail: { message: query } }));
      setQuery("");
      showToast("I sent your question to PARA AI.", "info");
    }
  }

  function handleLogout() {
    setProfileOpen(false);
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="topbar glass-surface">
      <div className="topbar-left-controls">
        <Button
          className="menu-button icon-only-mobile"
          variant="ghost"
          icon={<Menu size={19} />}
          onClick={onMobileMenu}
          title="Open navigation menu"
        >
          <span className="control-label">Menu</span>
        </Button>
      </div>

      <form className="top-search glass-input" onSubmit={submitSearch}>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search pages, products, history, pricing..."
          aria-label="Quick page search"
        />
      </form>

      <div className="topbar-right">
        <button
          className="notification-button glass-control"
          type="button"
          aria-label="Notifications"
          title="Notifications"
          onClick={() => showToast("No new critical pricing alerts.", "info")}
        >
          <Bell size={20} /><span>3</span>
        </button>

        <Button
          className="theme-button"
          variant="ghost"
          icon={theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          onClick={toggleTheme}
          title={theme === "dark" ? "Use light theme" : "Use dark theme"}
          aria-label={theme === "dark" ? "Use light theme" : "Use dark theme"}
        >
          <span className="topbar-action-label">{theme === "dark" ? "Light" : "Dark"}</span>
        </Button>

        <div className="profile-menu" ref={profileRef}>
          <button
            type="button"
            className={`profile profile-trigger glass-control ${profileOpen ? "profile-trigger-open" : ""}`}
            title={`${user?.name ?? "Admin"} · ${user?.role ?? "Administrator"}`}
            onClick={() => setProfileOpen((value) => !value)}
            aria-haspopup="menu"
            aria-expanded={profileOpen}
          >
            <div className="avatar">{user?.name?.slice(0, 1).toUpperCase() ?? "A"}</div>
            <div>
              <strong>{user?.name ?? "Admin"}</strong>
              <small>{user?.role ?? "Administrator"}</small>
            </div>
            <ChevronDown size={16} className={`profile-caret ${profileOpen ? "profile-caret-open" : ""}`} />
          </button>

          {profileOpen && (
            <div className="profile-dropdown glass-surface" role="menu" aria-label="Profile menu">
              <div className="profile-dropdown-user">
                <div className="avatar">{user?.name?.slice(0, 1).toUpperCase() ?? "A"}</div>
                <div>
                  <strong>{user?.name ?? "Admin"}</strong>
                  <small>{user?.role ?? "Administrator"}</small>
                </div>
              </div>
              <button type="button" className="profile-dropdown-action" onClick={handleLogout} role="menuitem">
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
