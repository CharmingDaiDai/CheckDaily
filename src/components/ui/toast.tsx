import * as ToastPrimitive from '@radix-ui/react-toast'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { X } from 'lucide-react'
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
                'group pointer-events-auto relative flex items-center gap-3 overflow-hidden rounded-[var(--radius-control)] px-4 py-3 shadow-[var(--shadow-card-hover)] border transition-all duration-[var(--duration-fast)]',
                'data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]',
                'data-[swipe=cancel]:translate-x-0 data-[swipe=cancel]:transition-transform',
                t.variant === 'error'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : t.variant === 'success'
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-white border-stone-200 text-stone-800',
              )}
              // Success: green glow pulse on border
              style={t.variant === 'success' ? {
                animation: 'glow-pulse 1.2s ease-in-out 1',
                '--glow-color': 'rgba(34,197,94,0.3)',
              } as React.CSSProperties : undefined}
            >
              <ToastPrimitive.Description className="text-sm font-medium flex-1">
                {t.message}
              </ToastPrimitive.Description>
              <ToastPrimitive.Close className="shrink-0 rounded-lg p-1 opacity-50 hover:opacity-100 transition-opacity">
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
