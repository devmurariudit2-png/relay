export default function Modal({ title, onClose, children, width = 480 }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 14, width: "100%", maxWidth: width, maxHeight: "90vh", overflow: "auto", animation: "fadeUp .25s both", boxShadow: "0 24px 80px rgba(0,0,0,.15)" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#9CA3AF", fontSize: 20, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}
