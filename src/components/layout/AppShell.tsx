import { PanelLeftOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import ParaAssistant from "../assistant/ParaAssistant";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const SIDEBAR_KEY = "para-sidebar-visible";

export default function AppShell() {
  const [sidebarVisible, setSidebarVisible] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_KEY);
    return saved === null ? true : saved === "true";
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, String(sidebarVisible));
  }, [sidebarVisible]);

  return (
    <div className={`app-shell ${sidebarVisible ? "" : "sidebar-hidden"}`}>
      <div className="ambient-layer" aria-hidden="true">
        <span className="ambient-orb ambient-orb-one" />
        <span className="ambient-orb ambient-orb-two" />
        <span className="ambient-orb ambient-orb-three" />
        <span className="ambient-grid" />
      </div>

      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
        onDesktopHide={() => setSidebarVisible(false)}
      />

      {!sidebarVisible && (
        <button
          type="button"
          className="sidebar-reveal-fab"
          onClick={() => setSidebarVisible(true)}
          aria-label="Show sidebar"
          title="Show menu"
        >
          <PanelLeftOpen size={18} />
          <span>Menu</span>
        </button>
      )}

      <div className="main-shell">
        <Topbar onMobileMenu={() => setMobileSidebarOpen(true)} />

        <main className="page-container">
          <Outlet />
        </main>

        <footer className="app-footer glass-surface">
          <span><strong>PARA</strong> · Pricing Analytics and Recommendation Assistant</span>
          <span>Pricing decision support system</span>
        </footer>

        <ParaAssistant />
      </div>
    </div>
  );
}
