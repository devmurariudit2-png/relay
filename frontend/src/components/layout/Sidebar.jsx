import { useNavigate } from "react-router-dom";

const NAV = [
  { id: "dashboard",    icon: "⊞", label: "Dashboard" },
  { id: "transactions", icon: "⇄", label: "Transactions" },
  { id: "reconcile",   icon: "◎", label: "Reconcile" },
  { id: "team",         icon: "◉", label: "Team" },
  { id: "ledger",      icon: "≡", label: "Ledger" },
  { id: "tickets",     icon: "◫", label: "Tickets" },
  { id: "subscription",icon: "💎", label: "Subscription" },
  { id: "admin",       icon: "⚙", label: "Admin", adminOnly: true },
  { id: "settings",    icon: "◈", label: "Settings" },
  { id: "api-docs",    icon: "⌘", label: "API Docs" },
];

export default function Sidebar({ tab, user, onLogout, loggingOut, onClose }) {
  const navigate = useNavigate();

  const handleNav = (id) => {
    navigate(`/app/${id}`);
    if (onClose) onClose();
  };

  return (
    <div className="w-[240px] bg-white border-r border-gray-200 flex flex-col h-full flex-shrink-0 relative">
      {/* Logo */}
      <div className="p-5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-400 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">R</span>
          </div>
          <div>
            <div className="text-[14px] font-bold text-gray-900 tracking-tight">Relay</div>
            <div className="text-[10px] text-gray-400 font-medium">v3.0 · {user?.role}</div>
          </div>
        </div>
        
        {/* Mobile Close Button */}
        <button 
          onClick={onClose}
          className="lg:hidden p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 overflow-y-auto space-y-1">
        {NAV.filter(n => !n.adminOnly || user?.role === "admin").map(n => (
          <button 
            key={n.id} 
            onClick={() => handleNav(n.id)}
            className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 group ${
              tab === n.id 
                ? "bg-red-50 text-red-600 font-semibold border border-red-100/50" 
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 border border-transparent"
            }`}
          >
            <span className={`text-lg w-5 flex justify-center transition-transform group-hover:scale-110 ${tab === n.id ? "text-red-500" : "text-gray-400"}`}>
              {n.icon}
            </span>
            <span className="text-[13px]">{n.label}</span>
            {n.id === "reconcile" && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
            )}
          </button>
        ))}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-red-400 flex items-center justify-center text-[12px] color-white font-bold flex-shrink-0 shadow-lg shadow-red-500/10">
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-bold text-gray-900 truncate">{user?.name || "User"}</div>
            <div className="text-[10px] text-gray-400 truncate tracking-wide">{user?.email}</div>
          </div>
        </div>
        <button 
          onClick={onLogout} 
          className="w-full py-2 px-3 text-[12px] font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all duration-200"
          disabled={loggingOut}
        >
          {loggingOut ? "Signing out..." : "Sign out"}
        </button>
      </div>
    </div>
  );
}
