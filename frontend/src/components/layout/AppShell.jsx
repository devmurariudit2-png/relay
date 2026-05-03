import { useState, useCallback } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
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

export default function AppShell({ user, setUser, onLogout }) {
  const [toasts, setToasts] = useState([]);
  const [loggingOut, setLoggingOut] = useState(false);
  const location = useLocation();
  const tab = location.pathname.split("/").pop();

  const toast = useCallback((msg, type = "success") => setToasts(p => [...p, { id: Date.now(), msg, type }]), []);
  
  const handleLogout = () => {
    if (loggingOut) return;
    setLoggingOut(true);
    onLogout();
  };

  const props = { user, toast };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#FFFFFF" }}>
      <Sidebar tab={tab} user={user} onLogout={handleLogout} loggingOut={loggingOut} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto", height: "100%" }}>
          <Routes>
            <Route path="/" element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard {...props} />} />
            <Route path="transactions" element={<Transactions {...props} />} />
            <Route path="team" element={<Team {...props} />} />
            <Route path="reconcile" element={<Reconcile {...props} />} />
            <Route path="ledger" element={<Ledger {...props} />} />
            <Route path="tickets" element={<Tickets {...props} />} />
            {user?.role === "admin" && <Route path="admin" element={<Admin {...props} />} />}
            <Route path="settings" element={<Settings {...props} setUser={setUser} />} />
            <Route path="api-docs" element={<ApiDocs {...props} />} />
            <Route path="subscription" element={<Subscription {...props} />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Routes>
        </div>
        <Footer compact />
      </div>
      {toasts.map(t => <Toast key={t.id} msg={t.msg} type={t.type} onClose={() => setToasts(p => p.filter(x => x.id !== t.id))} />)}
    </div>
  );
}
