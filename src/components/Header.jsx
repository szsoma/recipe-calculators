import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const accentStyles = {
  amber: 'bg-amber-500',
  orange: 'bg-orange-700',
  red: 'bg-red-500',
}

export default function Header({ icon, title, accent = 'amber' }) {
  const navigate = useNavigate()

  return (
    <header className={`sticky top-0 z-50 ${accentStyles[accent]} text-white`}>
      <div className="flex items-center h-14 px-4 max-w-lg mx-auto">
        <button
          onClick={() => navigate('/')}
          className="p-3 -ml-2 hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Back to hub"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="flex-1 text-center text-lg font-semibold">{title}</h1>
        <span className="text-2xl w-10 text-right">{icon}</span>
      </div>
    </header>
  )
}
