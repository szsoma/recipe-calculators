import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Header from '../components/Header'
import PageContainer from '../components/PageContainer'
import Tabs from '../components/Tabs'
import Button from '../components/Button'
import PizzaCalculator from './pizza/PizzaCalculator'
import PizzaRecipes from './pizza/PizzaRecipes'
import SaveRecipeDialog from './pizza/SaveRecipeDialog'
import { DEFAULT_PIZZA_PARAMS } from '../lib/pizza'
import { get as getRecipe, save as saveRecipe } from '../db/recipes'
import { isPersistent } from '../db/store'
import { PARAM_KEYS } from '../db/schema'
import { decodeRecipe, SHARE_PARAM, ShareError } from '../lib/share'
import { loadSession } from '../db/session'
import useSessionSync from '../hooks/useSessionSync'

const TABS = [
  { id: 'calculator', label: 'Calculator' },
  { id: 'recipes', label: 'Recipes' },
]

export default function Pizza() {
  const [tab, setTab] = useState('calculator')
  const initial = useMemo(
    () =>
      loadSession('pizza', {
        params: DEFAULT_PIZZA_PARAMS,
        bakeDateTimeStr: '',
        loadedRecipeId: null,
      }),
    [],
  )
  const [params, setParams] = useState(initial.params)
  const [bakeDateTimeStr, setBakeDateTimeStr] = useState(initial.bakeDateTimeStr)
  const [loadedRecipe, setLoadedRecipe] = useState(() =>
    initial.loadedRecipeId ? getRecipe(initial.loadedRecipeId) : null,
  )
  const [dialog, setDialog] = useState(null) // null | 'save' | 'saveAs'
  const [saveError, setSaveError] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()
  const [shareError, setShareError] = useState('')
  const [pendingShare, setPendingShare] = useState(null)

  function setParam(key, value) {
    setParams((prev) => ({ ...prev, [key]: value }))
  }

  useEffect(() => {
    const payload = searchParams.get(SHARE_PARAM)
    if (!payload) return
    try {
      const shared = decodeRecipe(payload)
      setParams(shared.params)
      setLoadedRecipe(null)
      setPendingShare({ name: shared.name, note: shared.note })
    } catch (err) {
      setShareError(err instanceof ShareError ? err.message : 'That recipe link is not readable')
    }
    searchParams.delete(SHARE_PARAM)
    setSearchParams(searchParams, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isDirty = useMemo(() => {
    if (!loadedRecipe) return false
    return PARAM_KEYS.some((k) => String(params[k]) !== String(loadedRecipe.params[k]))
  }, [params, loadedRecipe])

  useSessionSync('pizza', { params, bakeDateTimeStr, loadedRecipeId: loadedRecipe?.id ?? null })

  function openDialog(mode) {
    setSaveError('')
    setDialog(mode)
  }

  function handleSaveNew({ name, note }) {
    setPendingShare(null)
    setShareError('')
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
    setPendingShare(null)
    setShareError('')
    setParams(recipe.params)
    setLoadedRecipe(recipe)
    setTab('calculator')
  }

  function handleOverwrite() {
    setPendingShare(null)
    setShareError('')
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

      {shareError && <p className="px-4 py-2 text-sm text-red-600 text-center">{shareError}</p>}
      {pendingShare && (
        <div className="px-4 py-3 max-w-lg mx-auto flex items-center gap-3">
          <p className="flex-1 text-sm text-ink">
            Loaded <span className="font-semibold">{pendingShare.name}</span> from a link.
          </p>
          <Button
            variant="primary"
            accent="pizza"
            size="sm"
            onClick={() => {
              handleSaveNew(pendingShare)
              setPendingShare(null)
            }}
          >
            Save to my recipes
          </Button>
        </div>
      )}

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
        <PizzaRecipes onLoad={handleLoad} />
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
