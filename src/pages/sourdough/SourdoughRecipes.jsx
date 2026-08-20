import { useState } from 'react'
import { Trash2, Copy } from 'lucide-react'
import Card from '../../components/Card'
import recipeSummary from './recipeSummary'
import { listSourdough, removeSourdough, duplicateSourdough } from '../../db/recipes'

export default function SourDoughRecipes({ onLoad, onRecipesChanged }) {
  const [recipes, setRecipes] = useState(() => listSourdough())

  function refresh() {
    setRecipes(listSourdough())
    onRecipesChanged?.()
  }

  function handleDelete(id) {
    removeSourdough(id)
    refresh()
  }

  function handleDuplicate(id) {
    duplicateSourdough(id)
    refresh()
  }

  if (recipes.length === 0) {
    return (
      <div className="px-4 py-12 max-w-lg mx-auto text-center">
        <p className="text-ink-muted text-sm">No saved recipes yet.</p>
        <p className="text-ink-muted text-xs mt-1">Calculate your dough, then tap "Save recipe".</p>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-3">
      {recipes.map((r) => (
        <Card key={r.id}>
          <div className="flex items-start justify-between gap-3">
            <button
              onClick={() => onLoad(r)}
              className="flex-1 text-left min-w-0"
            >
              <div className="font-semibold text-ink truncate">{r.name}</div>
              <div className="text-xs text-ink-muted mt-0.5 font-mono">
                {recipeSummary(r.params)}
              </div>
              {r.note && (
                <div className="text-xs text-ink-muted mt-1 line-clamp-2">{r.note}</div>
              )}
            </button>
            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => handleDuplicate(r.id)}
                className="p-2 rounded-lg text-ink-muted hover:text-ink hover:bg-sunken transition-colors"
                title="Duplicate"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(r.id)}
                className="p-2 rounded-lg text-ink-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
