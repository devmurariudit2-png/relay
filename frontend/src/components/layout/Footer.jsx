export default function Footer({ compact = false }) {
  if (compact) {
    return (
      <footer style={{ flexShrink: 0, padding: "8px 20px", borderTop: "1px solid #333", background: "#000000", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 20, height: 20, background: "linear-gradient(135deg,#EF4444,#F87171)", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: "#fff" }}>R</span>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#F9FAFB" }}>Relay</span>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          {[{ l: "Product", href: "#" }, { l: "Pricing", href: "#" }, { l: "Support", href: "#" }].map(item => (
            <a key={item.l} href={item.href} style={{ fontSize: 11, color: "#9CA3AF", transition: "color .2s" }}
              onMouseEnter={e => e.currentTarget.style.color = "#F9FAFB"} onMouseLeave={e => e.currentTarget.style.color = "#9CA3AF"}>{item.l}</a>
          ))}
        </div>
        <div style={{ fontSize: 11, color: "#6B7280" }}>© 2026 Relay. All rights reserved.</div>
      </footer>
    );
  }
  return (
    <footer style={{ flexShrink: 0, padding: "28px 6% 24px", borderTop: "1px solid #222", background: "#000000" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, background: "linear-gradient(135deg,#EF4444,#F87171)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#fff" }}>R</span>
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#F9FAFB" }}>Relay</span>
        </div>
        <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
          {[{ l: "Product", href: "#" }, { l: "Pricing", href: "#" }, { l: "Support", href: "#" }, { l: "Documentation", href: "/app/api-docs" }].map(item => (
            <a key={item.l} href={item.href} style={{ fontSize: 13, color: "#9CA3AF", transition: "color .2s" }}
              onMouseEnter={e => e.currentTarget.style.color = "#F9FAFB"} onMouseLeave={e => e.currentTarget.style.color = "#9CA3AF"}>{item.l}</a>
          ))}
        </div>
        <div style={{ fontSize: 12, color: "#6B7280" }}>© 2026 Relay. All rights reserved.</div>
      </div>
    </footer>
  );
}
