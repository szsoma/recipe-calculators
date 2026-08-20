export default function Stat({ label, value, unit, tone = 'default' }) {
  return (
    <div className="flex items-baseline justify-between gap-3 rounded-xl bg-sunken border border-line px-3 py-2.5">
      <span className="text-sm text-ink-muted">{label}</span>
      <span
        className={`font-semibold tabular-nums ${tone === 'strong' ? 'text-lg text-ink' : 'text-ink'}`}
      >
        {value}
        {unit && <span className="ml-0.5 text-ink-muted font-normal">{unit}</span>}
      </span>
    </div>
  )
}
