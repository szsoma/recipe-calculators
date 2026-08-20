import { useMemo, useState } from 'react'
import Header from '../components/Header'
import PageContainer from '../components/PageContainer'
import Tabs from '../components/Tabs'
import Button from '../components/Button'
import PizzaCalculator from './pizza/PizzaCalculator'
import PizzaRecipes from './pizza/PizzaRecipes'
import SaveRecipeDialog from './pizza/SaveRecipeDialog'
import { DEFAULT_PIZZA_PARAMS } from '../lib/pizza'
import { save as saveRecipe } from '../db/recipes'
import { isPersistent } from '../db/store'
import { PARAM_KEYS } from '../db/schema'

const TABS = [
  { id: 'calculator', label: 'Calculator' },
  { id: 'recipes', label: 'Recipes' },
]

export default function Pizza() {
  const [tab, setTab] = useState('calculator')
  const [params, setParams] = useState(DEFAULT_PIZZA_PARAMS)
  const [bakeDateTimeStr, setBakeDateTimeStr] = useState('')
  const [loadedRecipe, setLoadedRecipe] = useState(null)
  const [dialog, setDialog] = useState(null) // null | 'save' | 'saveAs'
  const [saveError, setSaveError] = useState('')

  function setParam(key, value) {
    setParams((prev) => ({ ...prev, [key]: value }))
  }

  const isDirty = useMemo(() => {
    if (!loadedRecipe) return false
    return PARAM_KEYS.some((k) => String(params[k]) !== String(loadedRecipe.params[k]))
  }, [params, loadedRecipe])

  function openDialog(mode) {
    setSaveError('')
    setDialog(mode)
  }

  function handleSaveNew({ name, note }) {
    try {
      const record = saveRecipe({ name, note, params })
      setLoadedRecipe(record)
      setDialog(null)
      setSaveError('')
    } catch (err) {
      setSaveError(err.message || 'Could not save recipe.')
    }
  }

  function handleOverwrite() {
    try {
      const record = saveRecipe({
        id: loadedRecipe.id,
        name: loadedRecipe.name,
        note: loadedRecipe.note,
        params,
      })
      setLoadedRecipe(record)
      setSaveError('')
    } catch (err) {
      setSaveError(err.message || 'Could not save recipe.')
    }
  }

  const saveFooter = (
    <div className="space-y-2">
      {!isPersistent() && (
        <p className="text-xs text-amber-700 dark:text-amber-400 text-center">
          This browser is blocking storage — recipes will be lost when you close the app.
        </p>
      )}
      {dialog === null && saveError && (
        <p className="text-xs text-red-600 text-center">{saveError}</p>
      )}
      {loadedRecipe ? (
        <div className="flex gap-2">
          <Button variant="secondary" fullWidth onClick={() => openDialog('saveAs')}>
            Save as new
          </Button>
          <Button variant="primary" accent="pizza" fullWidth disabled={!isDirty} onClick={handleOverwrite}>
            {isDirty ? 'Save changes' : 'Saved'}
          </Button>
        </div>
      ) : (
        <Button variant="primary" accent="pizza" fullWidth onClick={() => openDialog('save')}>
          Save recipe
        </Button>
      )}
    </div>
  )

  return (
    <PageContainer>
      <Header icon="🍕" title="Pizza — Biga Bench" accent="pizza" />
      <div className="sticky top-14 z-40 bg-canvas">
        <div className="max-w-lg mx-auto px-4">
          <Tabs items={TABS} value={tab} onChange={setTab} accent="pizza" />
        </div>
      </div>

      {tab === 'calculator' ? (
        <PizzaCalculator
          params={params}
          setParam={setParam}
          bakeDateTimeStr={bakeDateTimeStr}
          setBakeDateTimeStr={setBakeDateTimeStr}
          loadedRecipe={loadedRecipe}
          isDirty={isDirty}
          footer={saveFooter}
        />
      ) : (
        <PizzaRecipes />
      )}

      <SaveRecipeDialog
        open={dialog !== null}
        title={dialog === 'saveAs' ? 'Save as new recipe' : 'Save recipe'}
        initialName={dialog === 'saveAs' && loadedRecipe ? `${loadedRecipe.name} (copy)` : ''}
        initialNote={dialog === 'saveAs' && loadedRecipe ? loadedRecipe.note : ''}
        onSubmit={handleSaveNew}
        onClose={() => setDialog(null)}
        submitError={saveError}
      />
    </PageContainer>
  )
}
