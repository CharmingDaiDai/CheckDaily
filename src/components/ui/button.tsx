import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 tap-scale focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none',
  {
    variants: {
      variant: {
        default: 'bg-brand-500 text-white shadow-sm hover:bg-brand-600 active:bg-brand-700',
        secondary: 'bg-stone-100 text-stone-800 hover:bg-stone-200 active:bg-stone-300',
        outline: 'border border-stone-200 bg-white text-stone-800 hover:bg-stone-50 active:bg-stone-100',
        ghost: 'text-stone-700 hover:bg-stone-100 active:bg-stone-200',
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
