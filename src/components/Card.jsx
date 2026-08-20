export default function Card({ children, title, icon, className = '' }) {
  return (
    <div className={`bg-surface border border-line rounded-2xl p-4 sm:p-5 ${className}`}>
      {(title || icon) && (
        <div className="flex items-center gap-2 mb-4">
          {icon && <span className="text-ink-muted">{icon}</span>}
          {title && <h2 className="text-sm font-semibold text-ink">{title}</h2>}
        </div>
      )}
      {children}
    </div>
  )
}
