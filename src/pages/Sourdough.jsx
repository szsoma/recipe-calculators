import { useEffect, useMemo, useState } from 'react'
import Header from '../components/Header'
import PageContainer from '../components/PageContainer'
import Tabs from '../components/Tabs'
import Button from '../components/Button'
import SourDoughCalculator from './sourdough/SourdoughCalculator'
import SourDoughRecipes from './sourdough/SourdoughRecipes'
import SaveRecipeDialog from './pizza/SaveRecipeDialog'
import { DEFAULT_SOURDOUGH_PARAMS } from '../lib/sourdough'
import { getSourdough as getRecipe, saveSourdough as saveRecipe } from '../db/recipes'
import { isPersistent } from '../db/store'
import { SOURDOUGH_PARAM_KEYS, normalizeSourdoughParams } from '../db/schema'
import { loadSession } from '../db/session'
import useSessionSync from '../hooks/useSessionSync'

const TABS = [
  { id: 'calculator', label: 'Calculator' },
  { id: 'recipes', label: 'Recipes' },
]

export default function Sourdough() {
  const [tab, setTab] = useState('calculator')
  const initial = useMemo(() => {
    const stored = loadSession('sourdough', {
      params: DEFAULT_SOURDOUGH_PARAMS,
      loadedRecipeId: null,
    })
    return {
      params: normalizeSourdoughParams(stored.params),
      loadedRecipeId: typeof stored.loadedRecipeId === 'string' ? stored.loadedRecipeId : null,
    }
  }, [])
  const [params, setParams] = useState(initial.params)
  const [loadedRecipe, setLoadedRecipe] = useState(() =>
    initial.loadedRecipeId ? getRecipe(initial.loadedRecipeId) : null,
  )
  const [dialog, setDialog] = useState(null)
  const [saveError, setSaveError] = useState('')

  function setParam(key, value) {
    setParams((prev) => ({ ...prev, [key]: value }))
  }

  const isDirty = useMemo(() => {
    if (!loadedRecipe) return false
    return SOURDOUGH_PARAM_KEYS.some((k) => String(params[k]) !== String(loadedRecipe.params[k]))
  }, [params, loadedRecipe])

  useSessionSync('sourdough', { params, loadedRecipeId: loadedRecipe?.id ?? null })

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

  function handleLoad(recipe) {
    setParams(recipe.params)
    setLoadedRecipe(recipe)
    setTab('calculator')
  }

  function handleRecipesChanged() {
    if (!loadedRecipe) return
    setLoadedRecipe(getRecipe(loadedRecipe.id))
  }

  function handleOverwrite() {
    const current = getRecipe(loadedRecipe.id)
    if (!current) {
      setLoadedRecipe(null)
      setDialog('save')
      return
    }
    try {
      const record = saveRecipe({
        id: current.id,
        name: current.name,
        note: current.note,
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
          <Button variant="secondary" fullWidth onClick={() => setDialog('saveAs')}>
            Save as new
          </Button>
          <Button variant="primary" accent="sourdough" fullWidth disabled={!isDirty} onClick={handleOverwrite}>
            {isDirty ? 'Save changes' : 'Saved'}
          </Button>
        </div>
      ) : (
        <Button variant="primary" accent="sourdough" fullWidth onClick={() => setDialog('save')}>
          Save recipe
        </Button>
      )}
    </div>
  )

  return (
    <PageContainer>
      <Header icon="🍞" title="Sourdough" accent="sourdough" />
      <div className="sticky top-14 z-40 bg-canvas">
        <div className="max-w-lg mx-auto px-4">
          <Tabs items={TABS} value={tab} onChange={setTab} accent="sourdough" />
        </div>
      </div>

      {tab === 'calculator' ? (
        <SourDoughCalculator
          params={params}
          setParam={setParam}
          loadedRecipe={loadedRecipe}
          isDirty={isDirty}
          footer={saveFooter}
        />
      ) : (
        <SourDoughRecipes onLoad={handleLoad} onRecipesChanged={handleRecipesChanged} />
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
