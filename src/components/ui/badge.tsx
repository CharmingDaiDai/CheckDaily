import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-brand-100/80 text-brand-700 shadow-[inset_0_1px_0_rgb(255_255_255/0.55)]',
        secondary: 'bg-white/72 text-[var(--color-ink-700)] border border-white/70 shadow-[inset_0_1px_0_rgb(255_255_255/0.72)]',
        success: 'bg-brand-50 text-brand-700',
        destructive: 'bg-brand-50 text-brand-700',
        outline: 'border border-[var(--color-line-soft)] text-[var(--color-ink-700)] bg-white/46',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}
