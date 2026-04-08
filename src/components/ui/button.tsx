import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Spinner } from '@/components/ui/spinner'

const buttonVariants = cva(
  'relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-[var(--radius-control)] font-semibold transition-all duration-[var(--duration-fast)] tap-scale focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--focus-ring-offset)] focus-visible:shadow-[0_0_0_3px_rgba(249,115,22,0.12)] disabled:pointer-events-none disabled:opacity-60 disabled:saturate-75 select-none active:translate-y-[1px]',
  {
    variants: {
      variant: {
        default: 'bg-gradient-to-b from-brand-500 to-brand-600 text-white shadow-[0_8px_16px_rgb(249_115_22/0.34)] hover:from-brand-400 hover:to-brand-600 hover:shadow-[0_12px_24px_rgb(249_115_22/0.38)] active:from-brand-600 active:to-brand-700 bg-[length:100%_200%] bg-[position:top] hover:bg-[position:bottom]',
        secondary: 'bg-[var(--color-panel-strong)] text-[var(--color-ink-800)] border border-[var(--color-line-soft)] shadow-[0_3px_10px_rgb(26_22_17/0.08)] hover:bg-white hover:shadow-[0_6px_16px_rgb(26_22_17/0.1)]',
        outline: 'border border-[var(--color-line-strong)] bg-white/88 text-[var(--color-ink-800)] hover:bg-white hover:border-[var(--color-line-soft)] active:bg-stone-100',
        ghost: 'text-[var(--color-ink-700)] hover:bg-white/70 active:bg-white',
        danger: 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700',
        'danger-ghost': 'text-red-600 hover:bg-red-50 active:bg-red-100',
      },
      size: {
        sm: 'h-9 px-3.5 text-sm',
        default: 'h-10 px-5 text-sm',
        lg: 'h-12 px-6 text-base',
        xl: 'h-14 px-8 text-base',
        icon: 'h-10 w-10',
        'icon-sm': 'h-11 w-11',
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
  isLoading?: boolean
  loadingText?: string
  requestGuard?: boolean
  requestGuardMs?: number
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant,
    size,
    asChild = false,
    isLoading = false,
    loadingText = '处理中…',
    requestGuard = false,
    requestGuardMs = 850,
    onClick,
    children,
    disabled,
    ...props
  }, ref) => {
    const reduceMotion = useReducedMotion()
    const [guardLocked, setGuardLocked] = React.useState(false)
    const guardTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

    React.useEffect(() => {
      return () => {
        if (guardTimerRef.current) {
          clearTimeout(guardTimerRef.current)
          guardTimerRef.current = null
        }
      }
    }, [])

    React.useEffect(() => {
      if (isLoading) {
        setGuardLocked(false)
      }
    }, [isLoading])

    const handleClick: React.MouseEventHandler<HTMLButtonElement> = (event) => {
      if (disabled || isLoading || guardLocked) {
        event.preventDefault()
        event.stopPropagation()
        return
      }

      if (requestGuard) {
        setGuardLocked(true)
        if (guardTimerRef.current) {
          clearTimeout(guardTimerRef.current)
        }
        guardTimerRef.current = setTimeout(() => {
          setGuardLocked(false)
          guardTimerRef.current = null
        }, requestGuardMs)
      }

      onClick?.(event)
    }

    const spinnerVariant =
      variant === 'default' || variant === 'danger' ? 'light' : 'muted'

    const showLoadingOverlay = isLoading && !reduceMotion
    const finalDisabled = disabled || isLoading || guardLocked
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={finalDisabled}
        aria-busy={isLoading}
        data-loading={isLoading ? 'true' : 'false'}
        onClick={handleClick}
        {...props}
      >
        {showLoadingOverlay && (
          <span className="pointer-events-none absolute inset-0">
            <span className="absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/42 to-transparent animate-request-sheen" />
            <span
              className={cn(
                'absolute bottom-0 left-0 h-[2px] w-full origin-left animate-request-progress',
                variant === 'default' || variant === 'danger'
                  ? 'bg-white/85'
                  : 'bg-brand-500/80'
              )}
            />
          </span>
        )}

        <AnimatePresence initial={false} mode="wait">
          {isLoading ? (
            <motion.span
              key="loading"
              className="relative z-10 inline-flex items-center gap-2"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.97 }}
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: reduceMotion ? 0.08 : 0.16 }}
            >
              <Spinner variant={spinnerVariant} />
              {loadingText}
            </motion.span>
          ) : (
            <motion.span
              key="idle"
              className="relative z-10 inline-flex items-center gap-2"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.98 }}
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 5, scale: 0.97 }}
              transition={{ duration: reduceMotion ? 0.08 : 0.16 }}
            >
              {children}
            </motion.span>
          )}
        </AnimatePresence>
      </Comp>
    )
  }
)
Button.displayName = 'Button'

export { buttonVariants }
