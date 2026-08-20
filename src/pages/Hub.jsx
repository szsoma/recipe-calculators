import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import PageContainer from '../components/PageContainer'

const CALCULATORS = [
  { name: 'Kombucha', description: 'Batch scaling and delayed sugar', icon: '🍵', path: '/kombucha', dot: 'bg-kombucha' },
  { name: 'Slambuc', description: 'Ingredient ratios by people or by weight', icon: '🍲', path: '/slambuc', dot: 'bg-slambuc' },
  { name: 'Pizza', description: 'Biga dough, schedule, and saved recipes', icon: '🍕', path: '/pizza', dot: 'bg-pizza' },
]

export default function Hub() {
  return (
    <PageContainer>
      <div className="px-4 pt-12 pb-8 max-w-lg mx-auto">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-muted">Recipe calculators</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">Scale it right.</h1>
          <p className="mt-2 text-ink-muted">Three kitchen calculators. Everything stays on this device.</p>
        </header>

        <nav className="grid gap-3 sm:grid-cols-2">
          {CALCULATORS.map((calc) => (
            <Link
              key={calc.name}
              to={calc.path}
              className="group flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 min-h-11 transition-colors hover:border-ink-muted focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <span className="text-3xl" aria-hidden="true">{calc.icon}</span>
              <span className="flex-1 min-w-0">
                <span className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${calc.dot}`} aria-hidden="true" />
                  <span className="font-semibold text-ink">{calc.name}</span>
                </span>
                <span className="block text-sm text-ink-muted mt-0.5">{calc.description}</span>
              </span>
              <ChevronRight className="w-5 h-5 text-ink-muted group-hover:text-ink" aria-hidden="true" />
            </Link>
          ))}
        </nav>
      </div>
    </PageContainer>
  )
}
