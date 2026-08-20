export default function PageContainer({ children, className = '' }) {
  return (
    <div className={`min-h-screen bg-canvas text-ink pb-[env(safe-area-inset-bottom)] ${className}`}>
      {children}
    </div>
  )
}
