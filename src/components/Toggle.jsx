const toggleColors = {
  kombucha: 'bg-kombucha',
  slambuc: 'bg-slambuc',
  pizza: 'bg-pizza',
}

export default function Toggle({ label, checked, onChange, accent = 'kombucha' }) {
  return (
    <div className="flex items-center justify-between p-3 bg-sunken border border-line rounded-xl min-h-11">
      <span className="text-sm font-medium text-ink">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
          checked ? toggleColors[accent] : 'bg-line'
        }`}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}
