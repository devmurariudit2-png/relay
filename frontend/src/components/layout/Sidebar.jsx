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

export default function Sidebar({ tab, setTab, user, onLogout, loggingOut }) {
  return (
    <div style={{ width: 220, background: "#FFFFFF", borderRight: "1px solid #E5E7EB", display: "flex", flexDirection: "column", flexShrink: 0, height: "100vh", position: "sticky", top: 0 }}>
      {/* Logo */}
      <div style={{ padding: "22px 20px 18px", borderBottom: "1px solid #E5E7EB" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: "linear-gradient(135deg,#EF4444,#F87171)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>R</span>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#111827", letterSpacing: "-.4px" }}>Relay</div>
            <div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 500 }}>v3.0 · {user?.role}</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
        {NAV.filter(n => !n.adminOnly || user?.role === "admin").map(n => (
          <button key={n.id} onClick={() => setTab(n.id)}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, background: tab === n.id ? "rgba(239,68,68,.06)" : "transparent", border: tab === n.id ? "1px solid rgba(239,68,68,.15)" : "1px solid transparent", color: tab === n.id ? "#EF4444" : "#6B7280", marginBottom: 2, transition: "all .15s", fontWeight: tab === n.id ? 600 : 400 }}
            onMouseEnter={e => { if (tab !== n.id) { e.currentTarget.style.background = "rgba(0,0,0,.02)"; e.currentTarget.style.color = "#374151"; } }}
            onMouseLeave={e => { if (tab !== n.id) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6B7280"; } }}>
            <span style={{ fontSize: 16, width: 20, textAlign: "center" }}>{n.icon}</span>
            <span style={{ fontSize: 13 }}>{n.label}</span>
            {n.id === "reconcile" && <div style={{ marginLeft: "auto", width: 7, height: 7, borderRadius: "50%", background: "#EF4444", animation: "pulse 2s infinite" }} />}
          </button>
        ))}
      </nav>

      {/* User */}
      <div style={{ padding: "14px", borderTop: "1px solid #E5E7EB" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#EF4444,#F87171)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff", fontWeight: 800, flexShrink: 0 }}>
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#1F2937", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.name || "User"}</div>
            <div style={{ fontSize: 10, color: "#9CA3AF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email}</div>
          </div>
        </div>
        <button onClick={onLogout} className="btn-ghost" style={{ width: "100%", padding: "8px", fontSize: 12 }} disabled={loggingOut}>
          {loggingOut ? "Signing out..." : "Sign out"}
        </button>
      </div>
    </div>
  );
}
