import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

/* BottomSheet — slides up from bottom on mobile, centered modal on desktop */
const BottomSheet = DialogPrimitive.Root
const BottomSheetTrigger = DialogPrimitive.Trigger
const BottomSheetClose = DialogPrimitive.Close

const BottomSheetOverlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/40 backdrop-blur-sm',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200',
      className
    )}
    {...props}
  />
))
BottomSheetOverlay.displayName = 'BottomSheetOverlay'

const BottomSheetContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <BottomSheetOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        /* Mobile: full-width sheet from bottom */
        'fixed bottom-0 left-0 right-0 z-50',
        'bg-white rounded-t-3xl shadow-[var(--shadow-elevated)]',
        'pb-safe px-5 pt-5',
        'max-h-[90svh] overflow-y-auto',
        /* Desktop: centered modal */
        'sm:left-[50%] sm:top-[50%] sm:bottom-auto sm:right-auto sm:w-full sm:max-w-md',
        'sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-2xl sm:px-6 sm:pt-6 sm:pb-6',
        /* Animations */
        'data-[state=open]:animate-in data-[state=closed]:animate-out duration-300',
        'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
        'sm:data-[state=closed]:slide-out-to-bottom-0 sm:data-[state=open]:slide-in-from-bottom-0',
        'sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95',
        'sm:data-[state=closed]:fade-out-0 sm:data-[state=open]:fade-in-0',
        className
      )}
      {...props}
    >
      {/* Drag handle on mobile */}
      <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-stone-200 sm:hidden" />
      {children}
      <BottomSheetClose className="absolute right-4 top-4 rounded-xl p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 hidden sm:flex">
        <X className="h-4 w-4" />
        <span className="sr-only">关闭</span>
      </BottomSheetClose>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
))
BottomSheetContent.displayName = 'BottomSheetContent'

const BottomSheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-1 mb-5', className)} {...props} />
)

const BottomSheetTitle = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-lg font-bold text-stone-900', className)}
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
