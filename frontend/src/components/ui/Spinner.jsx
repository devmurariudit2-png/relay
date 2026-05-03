export default function Spinner({ size = 18, color = "#EF4444" }) {
  return (
    <div style={{ width: size, height: size, border: `2px solid ${color}22`, borderTopColor: color, borderRadius: "50%", animation: "spin .8s linear infinite", flexShrink: 0 }} />
  );
}
