import { useState, useCallback, lazy, Suspense } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import Footer from "./Footer.jsx";
import Toast from "../ui/Toast.jsx";
import Spinner from "../ui/Spinner.jsx";

// Lazy-loaded pages — each becomes its own chunk, loaded on first visit
const Dashboard    = lazy(() => import("../../pages/Dashboard.jsx"));
const Transactions = lazy(() => import("../../pages/Transactions.jsx"));
const Team         = lazy(() => import("../../pages/Team.jsx"));
const Reconcile    = lazy(() => import("../../pages/Reconcile.jsx"));
const Ledger       = lazy(() => import("../../pages/Ledger.jsx"));
const Tickets      = lazy(() => import("../../pages/Tickets.jsx"));
const Admin        = lazy(() => import("../../pages/Admin.jsx"));
const Settings     = lazy(() => import("../../pages/Settings.jsx"));
const ApiDocs      = lazy(() => import("../../pages/ApiDocs.jsx"));
const Subscription = lazy(() => import("../../pages/Subscription.jsx"));

const PageLoader = () => (
  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
    <Spinner size={28} />
  </div>
);

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
          <Suspense fallback={<PageLoader />}>
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
          </Suspense>
        </div>
        <Footer compact />
      </div>
      {toasts.map(t => <Toast key={t.id} msg={t.msg} type={t.type} onClose={() => setToasts(p => p.filter(x => x.id !== t.id))} />)}
    </div>
  );
}
