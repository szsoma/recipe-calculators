const accentBorders = {
  kombucha: 'border-line focus:border-kombucha focus-visible:outline-kombucha',
  slambuc: 'border-line focus:border-slambuc focus-visible:outline-slambuc',
  pizza: 'border-line focus:border-pizza focus-visible:outline-pizza',
}

export default function IngredientInput({
  label,
  value,
  onChange,
  unit,
  icon,
  accent = 'kombucha',
  badge = null,
}) {
  const inputId = `ingredient-${label.toLowerCase().replace(/\s+/g, '-')}`

  return (
    <div className="flex items-center gap-3">
      <span className="text-2xl">{icon}</span>
      <div className="flex-1">
        <label htmlFor={inputId} className="block text-sm font-medium text-ink mb-1">
          {label}
          {badge && (
            <span className="ml-2 px-2 py-0.5 bg-sunken text-ink-muted border border-line text-xs rounded-full font-bold">
              {badge}
            </span>
          )}
        </label>
        <div className="flex gap-2">
          <input
            id={inputId}
            type="number"
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            step="0.01"
            className={`flex-1 h-11 px-3 border-2 rounded-lg bg-surface text-ink text-base tabular-nums focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 ${accentBorders[accent]}`}
          />
          <span className="px-3 h-11 flex items-center bg-sunken border border-line rounded-lg text-ink-muted font-medium min-w-[50px] justify-center text-base tabular-nums">
            {unit}
          </span>
        </div>
      </div>
    </div>
  )
}
