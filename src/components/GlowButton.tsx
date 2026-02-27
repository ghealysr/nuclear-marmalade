import { cn } from '../lib/cn'

interface GlowButtonProps {
  children: React.ReactNode
  variant: 'primary' | 'secondary'
  href?: string
  className?: string
  onClick?: () => void
}

export function GlowButton({ children, variant, href, className, onClick }: GlowButtonProps) {
  const classes = cn(
    'glow-button',
    'inline-flex items-center justify-center',
    'rounded-full',
    'px-[29px] py-[11px]',
    'text-[14px] font-medium',
    'transition-all duration-200',
    'cursor-pointer',
    variant === 'primary'
      ? 'bg-white text-black hover:bg-white/90'
      : 'bg-black text-white hover:bg-white/5',
    className
  )

  const borderStyle = { borderWidth: '0.6px', borderStyle: 'solid' as const, borderColor: 'rgba(255, 255, 255, 0.15)' }

  if (href) {
    return (
      <a href={href} className={classes} style={borderStyle}>
        {children}
      </a>
    )
  }

  return (
    <button onClick={onClick} className={classes} style={borderStyle}>
      {children}
    </button>
  )
}
