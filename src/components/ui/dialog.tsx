import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { motion, useReducedMotion } from 'motion/react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { spring } from '@/lib/motion'

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-[rgb(22_18_13/0.42)]',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200',
      'backdrop-blur-[10px]',
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  const reduceMotion = useReducedMotion()

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        aria-describedby={undefined}
        asChild
        {...props}
      >
        <motion.div
          className={cn(
            'surface-frame fixed left-[50%] top-[50%] z-50 w-[calc(100%-1.5rem)] max-w-md translate-x-[-50%] translate-y-[-50%] p-6 sm:w-full',
            className
          )}
          initial={reduceMotion
            ? { opacity: 0 }
            : { opacity: 0, scale: 0.92, y: 8, filter: 'blur(3px)' }
          }
          animate={reduceMotion
            ? { opacity: 1 }
            : { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }
          }
          exit={reduceMotion
            ? { opacity: 0 }
            : { opacity: 0, scale: 0.96, y: -4, filter: 'blur(2px)' }
          }
          transition={reduceMotion ? { duration: 0.15 } : spring.emphasized}
        >
          {children}
          <DialogClose className="absolute right-4 top-4 rounded-xl p-1.5 text-[var(--color-ink-500)] hover:text-[var(--color-ink-800)] hover:bg-white/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
            <X className="h-4 w-4" />
            <span className="sr-only">关闭</span>
          </DialogClose>
        </motion.div>
      </DialogPrimitive.Content>
    </DialogPortal>
  )
})
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-1.5 mb-5', className)} {...props} />
)

const DialogTitle = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('headline-premium text-xl font-normal text-[var(--color-ink-950)]', className)}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-[var(--color-ink-600)] leading-relaxed', className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
}
