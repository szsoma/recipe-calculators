const ACCENTS = {
  pizza: 'bg-pizza text-white hover:opacity-90 focus-visible:outline-pizza',
  kombucha: 'bg-kombucha text-white hover:opacity-90 focus-visible:outline-kombucha',
  slambuc: 'bg-slambuc text-white hover:opacity-90 focus-visible:outline-slambuc',
}

const OUTLINE = {
  pizza: 'focus-visible:outline-pizza',
  kombucha: 'focus-visible:outline-kombucha',
  slambuc: 'focus-visible:outline-slambuc',
}

export default function Button({
  children,
  onClick,
  variant = 'primary',
  accent = 'pizza',
  size = 'md',
  fullWidth = false,
  disabled = false,
  type = 'button',
  className = '',
  ...rest
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors ' +
    'focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:pointer-events-none'
  const sizes = { md: 'min-h-11 px-4 text-sm', sm: 'min-h-11 px-3 text-xs' }
  const variants = {
    primary: ACCENTS[accent],
    secondary: `bg-sunken text-ink border border-line hover:bg-line ${OUTLINE[accent]}`,
    ghost: `text-ink-muted hover:text-ink hover:bg-sunken ${OUTLINE[accent]}`,
    danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
