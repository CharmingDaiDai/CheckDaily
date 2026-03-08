import { cn } from '@/lib/utils'

interface SpinnerProps {
  size?: 'sm' | 'default'
  variant?: 'light' | 'brand' | 'muted'
  className?: string
}

const sizeClasses = {
  sm: 'w-4 h-4',
  default: 'w-5 h-5',
} as const

const variantClasses = {
  light: 'border-white/40 border-t-white',
  brand: 'border-brand-500/30 border-t-brand-500',
  muted: 'border-stone-300 border-t-stone-500',
} as const

export function Spinner({ size = 'sm', variant = 'light', className }: SpinnerProps) {
  return (
    <span
      className={cn(
        'inline-block border-2 rounded-full animate-spin',
        sizeClasses[size],
        variantClasses[variant],
        className,
      )}
    />
  )
}
