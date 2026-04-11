import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { motion, useMotionValue, useTransform, useReducedMotion, useDragControls } from 'motion/react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { spring } from '@/lib/motion'

/* BottomSheet — slides up from bottom on mobile, centered modal on desktop */
const BottomSheet = DialogPrimitive.Root
const BottomSheetTrigger = DialogPrimitive.Trigger
const BottomSheetClose = DialogPrimitive.Close

const BottomSheetOverlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay> & { style?: React.CSSProperties }
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-[rgb(22_18_13/0.42)] backdrop-blur-[10px]',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200',
      className
    )}
    {...props}
  />
))
BottomSheetOverlay.displayName = 'BottomSheetOverlay'

interface BottomSheetContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  /** "default" = max 82svh; "tall" = max 92svh, ideal for detail panels with scrollable lists */
  size?: 'default' | 'tall'
}

const BottomSheetContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  BottomSheetContentProps
>(({ className, children, size = 'default', ...props }, ref) => {
  const reduceMotion = useReducedMotion()
  const closeRef = React.useRef<HTMLButtonElement>(null)
  const dragY = useMotionValue(0)
  const dragControls = useDragControls()
  const overlayOpacity = useTransform(dragY, [0, 300], [1, 0.2])
  const handleWidth = useTransform(dragY, [0, 80], [40, 48])
  const [isDragging, setIsDragging] = React.useState(false)

  return (
    <DialogPrimitive.Portal>
      <BottomSheetOverlay style={{ opacity: isDragging ? overlayOpacity.get() : undefined }} />
      <DialogPrimitive.Content
        ref={ref}
        aria-describedby={undefined}
        asChild
        {...props}
      >
        <motion.div
          className={cn(
            /* Mobile: full-width sheet from bottom */
            'surface-frame fixed bottom-0 left-0 right-0 z-50 rounded-t-[1.65rem]',
            'pb-safe px-5 pt-safe',
            size === 'tall' ? 'max-h-[92svh]' : 'max-h-[82svh]',
            'overflow-hidden',
            /* Desktop: centered modal */
            'sm:left-[50%] sm:top-[50%] sm:bottom-auto sm:right-auto sm:w-[calc(100%-1.5rem)] sm:max-w-md',
            'sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-[1.5rem] sm:px-6 sm:pt-6 sm:pb-6',
            className
          )}
          initial={reduceMotion
            ? { opacity: 0 }
            : { opacity: 0, y: '100%' }
          }
          animate={reduceMotion
            ? { opacity: 1 }
            : { opacity: 1, y: 0 }
          }
          exit={reduceMotion
            ? { opacity: 0 }
            : { opacity: 0, y: '100%' }
          }
          transition={reduceMotion ? { duration: 0.15 } : spring.emphasized}
          drag={reduceMotion ? false : 'y'}
          dragListener={false}
          dragControls={dragControls}
          dragConstraints={{ top: 0, bottom: 320 }}
          dragElastic={0.2}
          dragMomentum={false}
          style={{ y: dragY }}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={(_e, info) => {
            setIsDragging(false)
            const threshold = Math.min(120, Math.round(window.innerHeight * 0.15))
            if (info.offset.y > threshold || info.velocity.y > 300) {
              closeRef.current?.click()
            } else {
              dragY.set(0)
            }
          }}
        >
          <div className="pt-3 sm:pt-0 sheet-scroll-body">
            {/* Drag handle on mobile */}
            <div
              className="flex justify-center mb-4 sm:hidden cursor-grab active:cursor-grabbing py-2 -my-2 touch-none"
              onPointerDown={(event) => {
                if (reduceMotion) return
                dragControls.start(event)
              }}
            >
              <motion.div
                className="h-1.5 rounded-full bg-[linear-gradient(90deg,rgba(120,100,80,0.3),rgba(120,100,80,0.46),rgba(120,100,80,0.3))]"
                style={{ width: handleWidth }}
                transition={spring.snappy}
              />
            </div>
            {children}
          </div>
          {/* Hidden close trigger for drag dismiss */}
          <DialogPrimitive.Close ref={closeRef} className="sr-only" aria-hidden tabIndex={-1} />
          {/* Visible close button for desktop */}
          <BottomSheetClose className="absolute right-4 top-4 rounded-xl p-1.5 text-[var(--color-ink-500)] hover:text-[var(--color-ink-800)] hover:bg-white/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 hidden sm:flex">
            <X className="h-4 w-4" />
            <span className="sr-only">关闭</span>
          </BottomSheetClose>
        </motion.div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
})
BottomSheetContent.displayName = 'BottomSheetContent'

const BottomSheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-1 mb-5 pb-3 border-b luxury-divider', className)} {...props} />
)

const BottomSheetTitle = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('headline-premium text-xl font-normal text-[var(--color-ink-950)]', className)}
    {...props}
  />
))
BottomSheetTitle.displayName = 'BottomSheetTitle'

export {
  BottomSheet,
  BottomSheetTrigger,
  BottomSheetClose,
  BottomSheetOverlay,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
}
