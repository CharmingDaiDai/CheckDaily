import * as ToastPrimitive from '@radix-ui/react-toast'
import { X } from 'lucide-react'
import { useToastStore } from '@/hooks/useToast'
import { cn } from '@/lib/utils'

export function Toaster() {
  const { toasts, dismiss } = useToastStore()

  return (
    <ToastPrimitive.Provider swipeDirection="right" duration={3000}>
      {toasts.map((t) => (
        <ToastPrimitive.Root
          key={t.id}
          duration={t.duration ?? 3000}
          onOpenChange={(open) => { if (!open) dismiss(t.id) }}
          className={cn(
            'group pointer-events-auto relative flex items-center gap-3 overflow-hidden rounded-xl px-4 py-3 shadow-lg border transition-all',
            'data-[state=open]:animate-in data-[state=open]:slide-in-from-top-2 data-[state=open]:fade-in',
            'data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=closed]:fade-out',
            'data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]',
            'data-[swipe=cancel]:translate-x-0 data-[swipe=cancel]:transition-transform',
            'data-[swipe=end]:animate-out data-[swipe=end]:slide-out-to-right',
            t.variant === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : t.variant === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-white border-stone-200 text-stone-800',
          )}
        >
          <ToastPrimitive.Description className="text-sm font-medium flex-1">
            {t.message}
          </ToastPrimitive.Description>
          <ToastPrimitive.Close className="shrink-0 rounded-lg p-1 opacity-50 hover:opacity-100 transition-opacity">
            <X className="w-3.5 h-3.5" />
          </ToastPrimitive.Close>
        </ToastPrimitive.Root>
      ))}

      <ToastPrimitive.Viewport className="fixed z-[100] flex flex-col gap-2 w-[calc(100vw-2rem)] max-w-[360px] outline-none bottom-[88px] left-1/2 -translate-x-1/2 md:bottom-auto md:top-4 md:right-4 md:left-auto md:translate-x-0" />
    </ToastPrimitive.Provider>
  )
}
