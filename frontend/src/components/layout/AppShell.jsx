import { useState, useEffect, useCallback } from "react";
import Sidebar from "./Sidebar.jsx";
import Footer from "./Footer.jsx";
import Toast from "../ui/Toast.jsx";
import Dashboard from "../../pages/Dashboard.jsx";
import Transactions from "../../pages/Transactions.jsx";
import Team from "../../pages/Team.jsx";
import Reconcile from "../../pages/Reconcile.jsx";
import Ledger from "../../pages/Ledger.jsx";
import Tickets from "../../pages/Tickets.jsx";
import Admin from "../../pages/Admin.jsx";
import Settings from "../../pages/Settings.jsx";
import ApiDocs from "../../pages/ApiDocs.jsx";
import Subscription from "../../pages/Subscription.jsx";

function appTabFromPath(pathname) {
  const match = pathname.match(/^\/app\/([^/]+)/);
  return match ? match[1] : null;
}

function appPathForTab(tab) {
  return `/app/${tab}`;
}

export default function AppShell({ user, setUser, onLogout }) {
  const [tab, setTab] = useState(() => {
    if (typeof window === "undefined") return "dashboard";
    return window.history.state?.tab || appTabFromPath(window.location.pathname) || localStorage.getItem("rec_tab") || "dashboard";
  });
  const [toasts, setToasts] = useState([]);
  const [loggingOut, setLoggingOut] = useState(false);
  const toast = useCallback((msg, type = "success") => setToasts(p => [...p, { id: Date.now(), msg, type }]), []);
  const handleLogout = () => {
    if (loggingOut) return;
    setLoggingOut(true);
    onLogout();
  };
  const props = { user, toast };

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("rec_tab", tab);
      const nextPath = appPathForTab(tab);
      if (window.location.pathname !== nextPath) {
        window.history.pushState({ screen: "app", tab }, "", nextPath);
      } else if (window.history.state?.tab !== tab || window.history.state?.screen !== "app") {
        window.history.replaceState({ screen: "app", tab }, "", nextPath);
      }
    }
  }, [tab]);

  useEffect(() => {
    const handlePop = event => {
      if (event.state?.tab) {
        setTab(event.state.tab);
      } else {
        setTab(appTabFromPath(window.location.pathname) || "dashboard");
      }
    };
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, []);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#FFFFFF" }}>
      <Sidebar tab={tab} setTab={setTab} user={user} onLogout={handleLogout} loggingOut={loggingOut} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ display: tab === "dashboard" ? "flex" : "none", flexDirection: "column", overflow: "auto", height: "100%" }}>
            <Dashboard {...props} />
          </div>
          <div style={{ display: tab === "transactions" ? "flex" : "none", flexDirection: "column", overflow: "auto", height: "100%" }}>
            <Transactions {...props} />
          </div>
          <div style={{ display: tab === "team" ? "flex" : "none", flexDirection: "column", overflow: "auto", height: "100%" }}>
            <Team {...props} />
          </div>
          <div style={{ display: tab === "reconcile" ? "flex" : "none", flexDirection: "column", overflow: "auto", height: "100%" }}>
            <Reconcile {...props} />
          </div>
          <div style={{ display: tab === "ledger" ? "flex" : "none", flexDirection: "column", overflow: "auto", height: "100%" }}>
            <Ledger {...props} />
          </div>
          <div style={{ display: tab === "tickets" ? "flex" : "none", flexDirection: "column", overflow: "auto", height: "100%" }}>
            <Tickets {...props} />
          </div>

          <div style={{ display: tab === "admin" && user?.role === "admin" ? "flex" : "none", flexDirection: "column", overflow: "auto", height: "100%" }}>
            {user?.role === "admin" && <Admin {...props} />}
          </div>
          <div style={{ display: tab === "settings" ? "flex" : "none", flexDirection: "column", overflow: "auto", height: "100%" }}>
            <Settings {...props} setUser={setUser} />
          </div>
          <div style={{ display: tab === "api-docs" ? "flex" : "none", flexDirection: "column", overflow: "auto", height: "100%" }}>
            <ApiDocs {...props} />
          </div>
          <div style={{ display: tab === "subscription" ? "flex" : "none", flexDirection: "column", overflow: "auto", height: "100%" }}>
            <Subscription {...props} />
          </div>
        </div>
        <Footer compact />
      </div>
      {toasts.map(t => <Toast key={t.id} msg={t.msg} type={t.type} onClose={() => setToasts(p => p.filter(x => x.id !== t.id))} />)}
    </div>
  );
}
