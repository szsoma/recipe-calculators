import { useId } from 'react'

const toggleColors = {
  kombucha: 'bg-kombucha',
  slambuc: 'bg-slambuc',
  pizza: 'bg-pizza',
}

export default function Toggle({ label, checked, onChange, accent = 'kombucha' }) {
  const labelId = useId()
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelId}
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between gap-3 text-left p-3 bg-sunken border border-line rounded-xl min-h-11 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      <span id={labelId} className="text-sm font-medium text-ink">
        {label}
      </span>
      <span
        aria-hidden="true"
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
          checked ? toggleColors[accent] : 'bg-line'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </span>
    </button>
  )
}
