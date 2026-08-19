const accentBorders = {
  amber: 'border-amber-300 focus:border-amber-500 focus:ring-amber-200',
  orange: 'border-orange-300 focus:border-orange-500 focus:ring-orange-200',
  red: 'border-red-300 focus:border-red-500 focus:ring-red-200',
}

export default function IngredientInput({
  label,
  value,
  onChange,
  unit,
  icon,
  accent = 'amber',
  badge = null,
}) {
  const inputId = `ingredient-${label.toLowerCase().replace(/\s+/g, '-')}`

  return (
    <div className="flex items-center gap-3">
      <span className="text-2xl">{icon}</span>
      <div className="flex-1">
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {badge && (
            <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-bold">
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
            className={`flex-1 px-3 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 text-base ${accentBorders[accent]}`}
          />
          <span className="px-3 py-2 bg-gray-100 rounded-lg text-gray-600 font-medium min-w-[50px] text-center text-base">
            {unit}
          </span>
        </div>
      </div>
    </div>
  )
}
