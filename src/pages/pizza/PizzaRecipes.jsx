import { useEffect, useRef, useState } from 'react'
import { Copy, Share2, Pencil, Trash2, Download } from 'lucide-react'
import Card from '../../components/Card'
import Button from '../../components/Button'
import SaveRecipeDialog from './SaveRecipeDialog'
import recipeSummary from './recipeSummary'
import { list, remove, duplicate, save, importRecipe, skippedCount } from '../../db/recipes'
import { buildShareUrl, decodeRecipe, ShareError } from '../../lib/share'

export default function PizzaRecipes({ onLoad }) {
  const [recipes, setRecipes] = useState(() => list())
  const [editing, setEditing] = useState(null)
  const [importing, setImporting] = useState(false)
  const [importText, setImportText] = useState('')
  const [message, setMessage] = useState('')
  const [confirmingDelete, setConfirmingDelete] = useState(null)
  const [editError, setEditError] = useState('')
  const flashTimer = useRef(null)

  function refresh() {
    setRecipes(list())
  }

  function flash(text) {
    setMessage(text)
    if (flashTimer.current) clearTimeout(flashTimer.current)
    flashTimer.current = setTimeout(() => setMessage(''), 2500)
  }

  useEffect(() => {
    return () => {
      if (flashTimer.current) clearTimeout(flashTimer.current)
    }
  }, [])

  async function handleShare(recipe) {
    const url = buildShareUrl(recipe, window.location.origin)
    if (navigator.share) {
      try {
        await navigator.share({ title: recipe.name, url })
        return
      } catch {
        /* user dismissed the sheet — fall through to clipboard */
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      flash('Link copied')
    } catch {
      flash('Could not copy link')
    }
  }

  async function handleCopyJson(recipe) {
    try {
      await navigator.clipboard.writeText(
        JSON.stringify({ name: recipe.name, note: recipe.note, params: recipe.params }, null, 2),
      )
      flash('JSON copied')
    } catch {
      flash('Could not copy JSON')
    }
  }

  function handleImport() {
    const text = importText.trim()
    if (text === '') return
    let payload = null
    try {
      payload = JSON.parse(text)
    } catch {
      try {
        payload = decodeRecipe(text.split('r=').pop())
      } catch (err) {
        flash(err instanceof ShareError ? err.message : 'That is not a recipe')
        return
      }
    }
    const saved = importRecipe(payload)
    if (!saved) {
      flash('That is not a recipe')
      return
    }
    setImporting(false)
    setImportText('')
    refresh()
    flash(`Imported "${saved.name}"`)
  }

  if (recipes.length === 0 && !importing) {
    return (
      <div className="px-4 py-12 max-w-lg mx-auto text-center space-y-4">
        <p className="text-ink font-medium">No saved recipes yet</p>
        <p className="text-sm text-ink-muted">
          Set up a dough on the Calculator tab, then press Save recipe at the bottom.
        </p>
        <Button variant="secondary" onClick={() => setImporting(true)}>
          Import a recipe
        </Button>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-muted">
          {recipes.length} {recipes.length === 1 ? 'recipe' : 'recipes'}
          {skippedCount() > 0 && (
            <span className="ml-2 text-amber-700 dark:text-amber-400">
              {skippedCount()} unreadable {skippedCount() === 1 ? 'entry' : 'entries'} skipped
            </span>
          )}
        </p>
        <Button variant="ghost" size="sm" onClick={() => setImporting((v) => !v)}>
          <Download className="w-4 h-4" /> Import
        </Button>
      </div>

      {importing && (
        <Card>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={3}
            placeholder="Paste a share link or recipe JSON"
            className="w-full px-3 py-2 rounded-xl border border-line bg-surface text-ink text-sm focus:outline-none focus:border-pizza"
          />
          <div className="flex gap-2 mt-3">
            <Button variant="secondary" fullWidth onClick={() => setImporting(false)}>
              Cancel
            </Button>
            <Button variant="primary" accent="pizza" fullWidth onClick={handleImport}>
              Import
            </Button>
          </div>
        </Card>
      )}

      {message && <p className="text-sm text-center text-ink-muted">{message}</p>}

      {recipes.map((recipe) => (
        <Card key={recipe.id}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-semibold text-ink truncate">{recipe.name}</h3>
              <p className="text-xs text-ink-muted tabular-nums mt-0.5">{recipeSummary(recipe.params)}</p>
              {recipe.note && <p className="text-sm text-ink-muted mt-2 line-clamp-2">{recipe.note}</p>}
            </div>
            <Button variant="primary" accent="pizza" size="sm" onClick={() => onLoad(recipe)}>
              Load
            </Button>
          </div>

          <div className="flex flex-wrap gap-1 mt-4 pt-3 border-t border-line">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditError('')
                setEditing(recipe)
              }}
            >
              <Pencil className="w-4 h-4" /> Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const copy = duplicate(recipe.id)
                if (!copy) {
                  flash('Could not duplicate — recipe no longer exists')
                  refresh()
                  return
                }
                refresh()
              }}
            >
              <Copy className="w-4 h-4" /> Duplicate
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleShare(recipe)}>
              <Share2 className="w-4 h-4" /> Share
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleCopyJson(recipe)}>
              JSON
            </Button>
            {confirmingDelete === recipe.id ? (
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  remove(recipe.id)
                  setConfirmingDelete(null)
                  refresh()
                }}
              >
                <Trash2 className="w-4 h-4" /> Really delete
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setConfirmingDelete(recipe.id)}>
                <Trash2 className="w-4 h-4" /> Delete
              </Button>
            )}
          </div>
        </Card>
      ))}

      <SaveRecipeDialog
        open={editing !== null}
        title="Edit recipe"
        initialName={editing?.name ?? ''}
        initialNote={editing?.note ?? ''}
        onSubmit={({ name, note }) => {
          try {
            save({ id: editing.id, name, note, params: editing.params })
            setEditing(null)
            setEditError('')
            refresh()
          } catch (err) {
            setEditError(err.message || 'Could not save recipe.')
          }
        }}
        onClose={() => {
          setEditing(null)
          setEditError('')
        }}
        submitError={editError}
      />
    </div>
  )
}
