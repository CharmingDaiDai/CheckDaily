import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Spinner } from '@/components/ui/spinner'

const buttonVariants = cva(
  'group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-[var(--radius-control)] border border-transparent font-semibold tracking-[0] transition-[transform,box-shadow,background-color,border-color,color,filter] duration-[var(--duration-fast)] tap-scale focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--focus-ring-offset)] focus-visible:shadow-[0_0_0_3px_rgba(216,111,47,0.14)] disabled:pointer-events-none disabled:opacity-55 disabled:saturate-75 select-none active:translate-y-[1px]',
  {
    variants: {
      variant: {
        default: 'text-white border-brand-500/35 bg-[linear-gradient(155deg,#e99658_0%,#d86f2f_46%,#a94b22_100%)] shadow-[0_10px_24px_rgb(185_84_34/0.24),inset_0_1px_0_rgb(255_255_255/0.28)] hover:shadow-[0_14px_28px_rgb(185_84_34/0.3),inset_0_1px_0_rgb(255_255_255/0.36)] hover:brightness-[1.03] active:brightness-[0.96]',
        secondary: 'text-[var(--color-ink-800)] border-[color:rgb(255_255_255/0.58)] bg-[linear-gradient(160deg,rgba(255,255,255,0.8)_0%,rgba(248,246,240,0.66)_100%)] shadow-[0_8px_18px_rgb(61_52_41/0.1),inset_0_1px_0_rgb(255_255_255/0.76)] backdrop-blur-xl hover:border-[color:rgb(255_255_255/0.76)] hover:bg-[linear-gradient(160deg,rgba(255,255,255,0.92)_0%,rgba(248,246,240,0.8)_100%)] hover:shadow-[0_12px_24px_rgb(61_52_41/0.12)]',
        outline: 'border-[color:rgb(39_35_31/0.16)] bg-[rgba(255,255,255,0.6)] text-[var(--color-ink-800)] shadow-[0_2px_10px_rgb(61_52_41/0.06)] backdrop-blur-md hover:bg-[rgba(255,255,255,0.84)] hover:border-[color:rgb(39_35_31/0.24)] active:bg-[rgba(255,255,255,0.94)]',
        ghost: 'text-[var(--color-ink-700)] bg-transparent hover:bg-[rgba(255,255,255,0.56)] hover:text-[var(--color-ink-900)] active:bg-[rgba(255,255,255,0.72)]',
        danger: 'text-white border-red-600/40 bg-[linear-gradient(160deg,#fb7a7a_0%,#ef4444_48%,#dc2626_100%)] shadow-[0_10px_20px_rgb(239_68_68/0.24)] hover:brightness-[1.03] active:brightness-[0.95]',
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

      const isSubmitButton = event.currentTarget.type === 'submit'

      if (requestGuard && !isSubmitButton) {
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
