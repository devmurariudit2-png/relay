export default function Card({ children, className = "" }) {
  return (
    <div className={`card p-6 rounded-2xl ${className}`}>{children}</div>
  );
}
