export default function Tag({ label, color }) {
  const map = {
    matched:   ["#F0FDF4","#16A34A"], pending:   ["#F3F4F6","#6B7280"],
    unmatched: ["#FEF2F2","#DC2626"], exception: ["#FFFBEB","#D97706"],
    duplicate: ["#F5F3FF","#7C3AED"], open:      ["#EFF6FF","#2563EB"],
    closed:    ["#F0FDF4","#16A34A"], resolved:  ["#F0FDF4","#16A34A"],
    "in-progress":["#FFFBEB","#D97706"],
    admin:     ["#F5F3FF","#7C3AED"], member: ["#F3F4F6","#6B7280"], viewer: ["#F3F4F6","#9CA3AF"],
    bank:      ["#EFF6FF","#2563EB"], internal: ["#F5F3FF","#7C3AED"],
    low:       ["#F0FDF4","#16A34A"], medium: ["#FFFBEB","#D97706"], high: ["#FEF2F2","#DC2626"],
    healthy:   ["#F0FDF4","#16A34A"],
    connected: ["#F0FDF4","#16A34A"],
  };
  const [bg, cl] = map[label?.toLowerCase()] || ["#F3F4F6","#6B7280"];
  return <span className="tag" style={{ background: bg, color: cl }}>{label}</span>;
}
