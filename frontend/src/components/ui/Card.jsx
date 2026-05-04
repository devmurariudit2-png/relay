export default function Card({ children, className = "", style }) {
  return (
    <div 
      className={`bg-white border border-gray-200 shadow-sm p-4 sm:p-6 rounded-xl sm:rounded-2xl transition-all duration-200 hover:border-gray-300 hover:shadow-md ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}
