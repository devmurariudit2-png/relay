import Card from "./Card.jsx";

export default function Metric({ label, value, sub, color = "text-blue-600", icon }) {
  return (
    <Card className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{label}</span>
        {icon && <span className="text-lg opacity-40">{icon}</span>}
      </div>
      <div className={`text-2xl font-extrabold tracking-tight tabular-nums ${color}`}>{value ?? "—"}</div>
      {sub && <div className="text-[12px] text-gray-400 font-medium">{sub}</div>}
    </Card>
  );
}
