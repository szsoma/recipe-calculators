export default function Card({ children, title, icon, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 ${className}`}>
      {(title || icon) && (
        <div className="flex items-center gap-2 mb-4">
          {icon && <span className="text-gray-500">{icon}</span>}
          {title && <h2 className="text-lg font-semibold text-gray-900">{title}</h2>}
        </div>
      )}
      {children}
    </div>
  )
}
