import { useRegisterSW } from 'virtual:pwa-register/react'
import Button from './Button'

export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <div className="max-w-lg mx-auto flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 shadow-lg">
        <p className="flex-1 text-sm text-ink">A new version is ready.</p>
        <Button variant="ghost" size="sm" onClick={() => setNeedRefresh(false)}>
          Later
        </Button>
        <Button variant="primary" accent="pizza" size="sm" onClick={() => updateServiceWorker(true)}>
          Reload
        </Button>
      </div>
    </div>
  )
}
