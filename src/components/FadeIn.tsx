import { cn } from '../lib/cn'

interface FadeInProps {
  children: React.ReactNode
  delay?: number
  className?: string
}

export function FadeIn({ children, delay = 0, className }: FadeInProps) {
  return (
    <div
      className={cn('fade-in-up', className)}
      style={{ animationDelay: `${delay * 120}ms` }}
    >
      {children}
    </div>
  )
}
