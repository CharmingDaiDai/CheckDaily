import * as ToastPrimitive from '@radix-ui/react-toast'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { X, CheckCircle2, AlertCircle, TriangleAlert, Info } from 'lucide-react'
import { useToastStore } from '@/hooks/useToast'
import { cn } from '@/lib/utils'
import { spring, durations, easing } from '@/lib/motion'

export function Toaster() {
  const { toasts, dismiss } = useToastStore()
  const reduceMotion = useReducedMotion()

  return (
    <ToastPrimitive.Provider swipeDirection="right" duration={3000}>
      <AnimatePresence initial={false}>
        {toasts.map((t, index) => (
          <motion.div
            key={t.id}
            layout
            initial={reduceMotion ? false : { opacity: 0, y: 14, scale: 0.96, filter: 'blur(4px)' }}
            animate={reduceMotion
              ? undefined
              : {
                  opacity: 1, y: 0, scale: 1, filter: 'blur(0px)',
                  // Error: subtle shake on entrance
                  ...(t.variant === 'error' ? { x: [0, -4, 4, -2, 2, 0] } : {}),
                }
            }
            exit={reduceMotion
              ? { opacity: 0 }
              : { opacity: 0, x: 40, scale: 0.95, filter: 'blur(4px)' }
            }
            transition={reduceMotion
              ? { duration: durations.micro, ease: easing.exit }
              : { ...spring.smooth, delay: Math.min(index * 0.04, 0.12) }
            }
          >
            <ToastPrimitive.Root
              duration={t.duration ?? 3000}
              onOpenChange={(open) => { if (!open) dismiss(t.id) }}
              role={t.variant === 'error' ? 'alert' : 'status'}
              aria-live={t.variant === 'error' ? 'assertive' : 'polite'}
              className={cn(
                'group pointer-events-auto relative flex items-center gap-3 overflow-hidden rounded-[var(--radius-control)] px-4 py-3 border transition-all duration-[var(--duration-fast)]',
                'backdrop-blur-2xl backdrop-saturate-150',
                'data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]',
                'data-[swipe=cancel]:translate-x-0 data-[swipe=cancel]:transition-transform',
                t.variant === 'error'
                  ? 'bg-[linear-gradient(160deg,rgb(255_250_245/0.95)_0%,rgb(254_243_234/0.88)_100%)] border-brand-200/70 text-brand-800 shadow-[0_1px_1px_rgb(61_52_41/0.05),0_12px_26px_-8px_rgb(61_52_41/0.2),0_30px_56px_-24px_rgb(61_52_41/0.24),inset_0_1px_0_rgb(255_255_255/0.92)]'
                  : 'bg-[linear-gradient(160deg,rgb(255_255_255/0.95)_0%,rgb(250_247_241/0.88)_100%)] border-white/80 text-[var(--color-ink-800)] shadow-[0_1px_1px_rgb(61_52_41/0.05),0_12px_26px_-8px_rgb(61_52_41/0.2),0_30px_56px_-24px_rgb(61_52_41/0.24),inset_0_1px_0_rgb(255_255_255/0.92)]',
              )}
            >
              <span className="shrink-0" aria-hidden="true">
                {t.variant === 'success' ? <CheckCircle2 className="h-4 w-4 text-[#4f7642]" />
                  : t.variant === 'error' ? <AlertCircle className="h-4 w-4 text-red-700" />
                    : t.variant === 'warning' ? <TriangleAlert className="h-4 w-4 text-amber-700" />
                      : <Info className="h-4 w-4 text-[var(--color-ink-600)]" />}
              </span>
              <ToastPrimitive.Description className="text-sm font-medium flex-1">
                {t.message}
              </ToastPrimitive.Description>
              {t.action && (
                <button
                  type="button"
                  className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold text-brand-700 bg-white/78 hover:bg-white transition-colors"
                  onClick={() => {
                    try {
                      const maybePromise = t.action?.onClick()
                      if (maybePromise instanceof Promise) {
                        void maybePromise.catch(() => undefined)
                      }
                    } finally {
                      dismiss(t.id)
                    }
                  }}
                >
                  {t.action.label}
                </button>
              )}
              <ToastPrimitive.Close aria-label="关闭通知" className="shrink-0 rounded-lg p-1 opacity-50 hover:opacity-100 transition-opacity text-[var(--color-ink-500)] hover:text-[var(--color-ink-800)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
                <X className="w-3.5 h-3.5" />
              </ToastPrimitive.Close>
            </ToastPrimitive.Root>
          </motion.div>
        ))}
      </AnimatePresence>

      <ToastPrimitive.Viewport className="fixed z-[100] flex flex-col gap-2 w-[calc(100vw-2rem)] max-w-[360px] outline-none bottom-[96px] left-1/2 -translate-x-1/2 md:bottom-auto md:top-4 md:right-4 md:left-auto md:translate-x-0" />
    </ToastPrimitive.Provider>
  )
}
