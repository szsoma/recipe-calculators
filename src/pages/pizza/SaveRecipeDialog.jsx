import { useEffect, useState } from 'react'
import Dialog from '../../components/Dialog'
import Button from '../../components/Button'
import Field from '../../components/Field'

export default function SaveRecipeDialog({ open, title = 'Save recipe', initialName = '', initialNote = '', onSubmit, onClose }) {
  const [name, setName] = useState(initialName)
  const [note, setNote] = useState(initialNote)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setName(initialName)
      setNote(initialNote)
      setError('')
    }
  }, [open, initialName, initialNote])

  function handleSubmit(e) {
    e.preventDefault()
    if (name.trim() === '') {
      setError('Give the recipe a name')
      return
    }
    onSubmit({ name: name.trim(), note: note.trim() })
  }

  return (
    <Dialog open={open} title={title} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Name" htmlFor="recipe-name">
          <input
            id="recipe-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Saturday 65%"
            className="w-full h-11 px-3 rounded-xl border border-line bg-surface text-ink focus:outline-none focus:border-pizza"
          />
        </Field>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Field label="Note" htmlFor="recipe-note" hint="Flour, oven, how it turned out — anything you want to remember.">
          <textarea
            id="recipe-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-xl border border-line bg-surface text-ink focus:outline-none focus:border-pizza"
          />
        </Field>
        <div className="flex gap-2">
          <Button variant="secondary" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" accent="pizza" fullWidth>
            Save
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
