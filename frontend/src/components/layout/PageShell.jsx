export default function PageShell({ title, sub, actions, children }) {
  return (
    <div className="flex flex-col h-full bg-[#F9FAFB]">
      <div className="px-4 py-5 sm:px-8 sm:py-6 border-b border-gray-200 bg-white flex flex-col sm:flex-row sm:justify-between sm:items-center flex-shrink-0 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">{title}</h1>
          {sub && <div className="text-xs sm:text-sm text-gray-400 mt-1 font-medium">{sub}</div>}
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 pb-12 sm:pb-16">
        <div className="max-w-[1400px] mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
