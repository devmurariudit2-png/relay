import { useState, useCallback, lazy, Suspense } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import Footer from "./Footer.jsx";
import Toast from "../ui/Toast.jsx";
import Spinner from "../ui/Spinner.jsx";

// Lazy-loaded pages — each becomes its own chunk, loaded on first visit
const Dashboard = lazy(() => import("../../pages/Dashboard.jsx"));
const Transactions = lazy(() => import("../../pages/Transactions.jsx"));
const Team = lazy(() => import("../../pages/Team.jsx"));
const Reconcile = lazy(() => import("../../pages/Reconcile.jsx"));
const Ledger = lazy(() => import("../../pages/Ledger.jsx"));
const Tickets = lazy(() => import("../../pages/Tickets.jsx"));
const Admin = lazy(() => import("../../pages/Admin.jsx"));
const Settings = lazy(() => import("../../pages/Settings.jsx"));
const ApiDocs = lazy(() => import("../../pages/ApiDocs.jsx"));
const Subscription = lazy(() => import("../../pages/Subscription.jsx"));

const PageLoader = () => (
  <div className="flex-1 p-6 md:p-8 w-full max-w-7xl mx-auto w-full">
    {/* Header Skeleton */}
    <div className="flex justify-between items-center mb-8">
      <div>
        <div className="h-8 w-48 bg-gray-200 rounded-md animate-pulse mb-3"></div>
        <div className="h-4 w-64 bg-gray-100 rounded-md animate-pulse"></div>
      </div>
      <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse hidden sm:block"></div>
    </div>

    {/* Stats/Cards Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-32 bg-gray-50 rounded-xl border border-gray-100 animate-pulse"></div>
      ))}
    </div>

    {/* Table Skeleton */}
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
      <div className="h-14 bg-gray-50 border-b border-gray-100 animate-pulse"></div>
      <div className="divide-y divide-gray-50">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="p-4 flex items-center justify-between">
            <div className="flex gap-4 w-1/2">
              <div className="h-4 w-24 bg-gray-100 rounded animate-pulse"></div>
              <div className="h-4 w-40 bg-gray-100 rounded animate-pulse hidden sm:block"></div>
            </div>
            <div className="h-4 w-20 bg-gray-100 rounded animate-pulse"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default function AppShell({ user, setUser, onLogout }) {
  const [toasts, setToasts] = useState([]);
  const [loggingOut, setLoggingOut] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 transition-transform duration-200 ease-in-out`}>
        <Sidebar tab={tab} user={user} onLogout={handleLogout} loggingOut={loggingOut} onClose={() => setIsSidebarOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-400 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            <span className="font-bold text-gray-900">Relay</span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
        </div>

        <div className="flex-1 flex flex-col overflow-auto h-full relative">
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
