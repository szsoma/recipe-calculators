const ACTIVE = {
  pizza: 'text-pizza border-pizza',
  kombucha: 'text-kombucha border-kombucha',
  slambuc: 'text-slambuc border-slambuc',
}

export default function Tabs({ items, value, onChange, accent = 'pizza' }) {
  return (
    <div role="tablist" className="flex border-b border-line">
      {items.map((item) => {
        const selected = item.id === value
        return (
          <button
            key={item.id}
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(item.id)}
            className={`min-h-11 flex-1 px-4 text-sm font-semibold border-b-2 -mb-px transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] ${
              selected ? ACTIVE[accent] : 'text-ink-muted border-transparent hover:text-ink'
            }`}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
