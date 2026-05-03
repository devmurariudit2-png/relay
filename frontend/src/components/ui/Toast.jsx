import { useEffect } from "react";

export default function Toast({ msg, type = "success", onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, []);
  const colors = { success: "#16A34A", error: "#DC2626", info: "#2563EB" };
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: "#FFFFFF", border: `1px solid ${colors[type]}33`, borderRadius: 10, padding: "12px 18px", maxWidth: 320, display: "flex", alignItems: "center", gap: 10, animation: "fadeUp .3s both", boxShadow: "0 8px 32px rgba(0,0,0,.1)" }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: colors[type], flexShrink: 0 }} />
      <span style={{ fontSize: 13, color: "#374151", flex: 1 }}>{msg}</span>
      <button onClick={onClose} style={{ background: "none", border: "none", color: "#9CA3AF", fontSize: 16, padding: 0 }}>×</button>
    </div>
  );
}
