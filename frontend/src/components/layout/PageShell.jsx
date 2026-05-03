export default function PageShell({ title, sub, actions, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "24px 28px 20px", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-.5px", color: "#111827" }}>{title}</h1>
          {sub && <div style={{ fontSize: 13, color: "#9CA3AF", marginTop: 3 }}>{sub}</div>}
        </div>
        {actions}
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px 40px", background: "#F9FAFB" }}>{children}</div>
    </div>
  );
}
