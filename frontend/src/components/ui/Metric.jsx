import Card from "./Card.jsx";

export default function Metric({ label, value, sub, color = "#EF4444", icon }) {
  return (
    <Card style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: ".5px" }}>{label}</span>
        {icon && <span style={{ fontSize: 18, opacity: .5 }}>{icon}</span>}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color, letterSpacing: "-1px", fontVariantNumeric: "tabular-nums" }}>{value ?? "—"}</div>
      {sub && <div style={{ fontSize: 12, color: "#9CA3AF" }}>{sub}</div>}
    </Card>
  );
}
