import { useEffect, useId, useRef, useState } from 'react'
import { Info } from 'lucide-react'

export default function InfoPopover({ label, children, align = 'right' }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const id = useId()

  useEffect(() => {
    if (!open) return undefined
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    function onPointer(e) {
      if (!wrapRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  return (
    <span ref={wrapRef} className="relative inline-flex align-middle">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`About ${label}`}
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        className="w-6 h-6 -my-1 inline-flex items-center justify-center rounded-full text-ink-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pizza"
      >
        <Info className="w-3.5 h-3.5" />
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className={`absolute top-7 z-30 w-64 max-w-[75vw] rounded-xl border border-line bg-surface p-3 text-left text-xs font-normal leading-relaxed text-ink-muted normal-case tracking-normal shadow-lg ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          <span className="block font-semibold text-ink mb-1">{label}</span>
          {children}
        </span>
      )}
    </span>
  )
}
