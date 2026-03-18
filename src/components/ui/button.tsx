import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] font-semibold transition-all duration-[var(--duration-fast)] tap-scale focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f5f1] disabled:pointer-events-none disabled:opacity-55 select-none active:translate-y-[1px]',
  {
    variants: {
      variant: {
        default: 'bg-gradient-to-b from-brand-500 to-brand-600 text-white shadow-[0_8px_16px_rgb(249_115_22/0.34)] hover:from-brand-400 hover:to-brand-600 active:from-brand-600 active:to-brand-700',
        secondary: 'bg-[var(--color-panel-strong)] text-[var(--color-ink-800)] border border-[var(--color-line-soft)] shadow-[0_3px_10px_rgb(26_22_17/0.08)] hover:bg-white',
        outline: 'border border-[var(--color-line-strong)] bg-white/88 text-[var(--color-ink-800)] hover:bg-white active:bg-stone-100',
        ghost: 'text-[var(--color-ink-700)] hover:bg-white/70 active:bg-white',
        danger: 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700',
        'danger-ghost': 'text-red-600 hover:bg-red-50 active:bg-red-100',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        default: 'h-10 px-5 text-sm',
        lg: 'h-12 px-6 text-base',
        xl: 'h-14 px-8 text-base',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8',
        'icon-lg': 'h-12 w-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { buttonVariants }
