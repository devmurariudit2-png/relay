export default function Spark({ data, color = "#EF4444", h = 50, w = 200 }) {
  if (!data || data.length < 2) return null;
  const vals = data.map(d => typeof d === "object" ? (d.total || d.count || 0) : d);
  const max = Math.max(...vals), mn = Math.min(...vals) * .9;
  const pts = vals.map((v, i) => ({ x: (i / (vals.length - 1)) * w, y: h - ((v - mn) / (max - mn || 1)) * (h * .85) - h * .075 }));
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = `${line} L${pts[pts.length - 1].x},${h + 4} L0,${h + 4} Z`;
  const id = `sg${color.replace("#", "")}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: h }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
