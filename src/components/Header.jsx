import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const LEGACY_ACCENT = {
  amber: 'kombucha',
  orange: 'slambuc',
  red: 'pizza',
}

const accentStyles = {
  kombucha: 'bg-kombucha',
  slambuc: 'bg-slambuc',
  pizza: 'bg-pizza',
}

export default function Header({ icon, title, accent = 'kombucha' }) {
  const navigate = useNavigate()
  const resolvedAccent = LEGACY_ACCENT[accent] || accent

  return (
    <header className="sticky top-0 z-50 bg-canvas/85 backdrop-blur border-b border-line">
      <div className="flex items-center h-14 px-4 max-w-lg mx-auto">
        <button
          onClick={() => navigate('/')}
          className="w-11 h-11 -ml-2 flex items-center justify-center hover:bg-sunken rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
          aria-label="Back to hub"
        >
          <ArrowLeft className="w-5 h-5 text-ink" />
        </button>
        <h1 className="flex-1 text-center text-lg font-semibold text-ink">{title}</h1>
        <span className="text-2xl w-10 text-right">{icon}</span>
      </div>
      <div className={`h-[3px] ${accentStyles[resolvedAccent]}`} aria-hidden="true" />
    </header>
  )
}
