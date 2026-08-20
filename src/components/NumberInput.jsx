import { clamp } from '../lib/pizza'

export default function NumberInput({ label, value, onChange, min, max, step, unit, accent = 'pizza' }) {
  const id = `num-${label.toLowerCase().replace(/\s+/g, '-')}`
  const ring = {
    pizza: 'focus:border-pizza',
    kombucha: 'focus:border-kombucha',
    slambuc: 'focus:border-slambuc',
  }[accent]

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink mb-1.5">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={() => onChange(clamp(value - step, min, max))}
          className="w-11 h-11 shrink-0 rounded-xl border border-line bg-sunken text-lg font-bold text-ink hover:bg-line active:scale-95 transition"
        >
          −
        </button>
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => {
            const n = parseFloat(e.target.value)
            if (!isNaN(n)) onChange(n)
          }}
          onBlur={(e) => {
            const n = parseFloat(e.target.value)
            if (!isNaN(n)) onChange(clamp(n, min, max))
          }}
          className={`min-w-0 flex-1 h-11 px-2 rounded-xl border border-line bg-surface text-ink text-sm text-center tabular-nums focus:outline-none ${ring}`}
        />
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => onChange(clamp(value + step, min, max))}
          className="w-11 h-11 shrink-0 rounded-xl border border-line bg-sunken text-lg font-bold text-ink hover:bg-line active:scale-95 transition"
        >
          +
        </button>
        {unit && <span className="w-7 shrink-0 text-sm text-ink-muted">{unit}</span>}
      </div>
    </div>
  )
}
