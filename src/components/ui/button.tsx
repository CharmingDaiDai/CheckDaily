import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Spinner } from '@/components/ui/spinner'

const buttonVariants = cva(
  'group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-[var(--radius-control)] border border-transparent font-semibold tracking-[0.01em] transition-[transform,box-shadow,background-color,border-color,color] duration-[var(--duration-fast)] tap-scale focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--focus-ring-offset)] focus-visible:shadow-[0_0_0_3px_rgba(249,115,22,0.14)] disabled:pointer-events-none disabled:opacity-55 disabled:saturate-75 select-none active:translate-y-[1px]',
  {
    variants: {
      variant: {
        default: 'text-white border-brand-500/40 bg-[linear-gradient(155deg,#fb923c_0%,#f97316_46%,#d55e08_100%)] shadow-[0_10px_24px_rgb(249_115_22/0.34),inset_0_1px_0_rgb(255_255_255/0.3)] hover:shadow-[0_14px_28px_rgb(249_115_22/0.4),inset_0_1px_0_rgb(255_255_255/0.38)] hover:brightness-[1.03] active:brightness-[0.95]',
        secondary: 'text-[var(--color-ink-800)] border-[color:rgb(130_108_87/0.2)] bg-[linear-gradient(160deg,rgba(255,255,255,0.92)_0%,rgba(255,250,244,0.82)_100%)] shadow-[0_6px_16px_rgb(26_22_17/0.1),inset_0_1px_0_rgb(255_255_255/0.72)] hover:border-[color:rgb(130_108_87/0.32)] hover:bg-[linear-gradient(160deg,rgba(255,255,255,0.98)_0%,rgba(255,247,238,0.88)_100%)] hover:shadow-[0_10px_20px_rgb(26_22_17/0.12)]',
        outline: 'border-[color:rgb(130_108_87/0.3)] bg-[rgba(255,255,255,0.72)] text-[var(--color-ink-800)] shadow-[0_2px_10px_rgb(26_22_17/0.08)] hover:bg-[rgba(255,255,255,0.9)] hover:border-[color:rgb(130_108_87/0.4)] active:bg-[rgba(255,255,255,0.95)]',
        ghost: 'text-[var(--color-ink-700)] bg-transparent hover:bg-[rgba(255,255,255,0.55)] hover:text-[var(--color-ink-900)] active:bg-[rgba(255,255,255,0.7)]',
        danger: 'text-white border-red-600/40 bg-[linear-gradient(160deg,#f87171_0%,#ef4444_48%,#dc2626_100%)] shadow-[0_10px_20px_rgb(239_68_68/0.28)] hover:brightness-[1.03] active:brightness-[0.95]',
        'danger-ghost': 'text-red-700 hover:bg-red-50/85 active:bg-red-100/70',
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
        <span className="pointer-events-none absolute inset-0 z-0">
          <span className="absolute inset-x-[12%] top-0 h-px bg-white/55 opacity-75" />
        </span>

        {showLoadingOverlay && (
          <span className="pointer-events-none absolute inset-0 z-0">
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
