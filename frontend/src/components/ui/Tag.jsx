export default function Tag({ label }) {
  const map = {
    matched:   "bg-green-50 text-green-700 border-green-100",
    pending:   "bg-gray-50 text-gray-600 border-gray-100",
    unmatched: "bg-red-50 text-red-700 border-red-100",
    exception: "bg-amber-50 text-amber-700 border-amber-100",
    duplicate: "bg-purple-50 text-purple-700 border-purple-100",
    open:      "bg-blue-50 text-blue-700 border-blue-100",
    closed:    "bg-green-50 text-green-700 border-green-100",
    resolved:  "bg-green-50 text-green-700 border-green-100",
    "in-progress": "bg-amber-50 text-amber-700 border-amber-100",
    admin:     "bg-indigo-50 text-indigo-700 border-indigo-100",
    member:    "bg-gray-50 text-gray-600 border-gray-100",
    bank:      "bg-blue-50 text-blue-700 border-blue-100",
    internal:  "bg-purple-50 text-purple-700 border-purple-100",
  };
  
  const theme = map[label?.toLowerCase()] || "bg-gray-50 text-gray-600 border-gray-100";
  return <span className={`tag border ${theme}`}>{label}</span>;
}
