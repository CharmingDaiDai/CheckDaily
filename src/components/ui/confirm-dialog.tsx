import { useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'danger'
  loading?: boolean
  onConfirm: () => void | Promise<void>
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = '确认',
  cancelText = '取消',
  variant = 'default',
  loading = false,
  onConfirm,
}: ConfirmDialogProps) {
  const [pending, setPending] = useState(false)
  const isLoading = loading || pending

  const handleConfirm = async () => {
    setPending(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {description && (
          <p className="text-sm text-stone-500 -mt-1">{description}</p>
        )}
        <div className="flex gap-3 mt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'default'}
            className="flex-1"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Spinner />
                处理中…
              </span>
            ) : confirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/** Hook to simplify confirm dialog usage */
export function useConfirmDialog() {
  const [state, setState] = useState<{
    open: boolean
    title: string
    description?: string
    confirmText?: string
    variant?: 'default' | 'danger'
    resolve?: (confirmed: boolean) => void
  }>({ open: false, title: '' })

  const confirm = useCallback((opts: {
    title: string
    description?: string
    confirmText?: string
    variant?: 'default' | 'danger'
  }) => {
    return new Promise<boolean>((resolve) => {
      setState({ ...opts, open: true, resolve })
    })
  }, [])

  const dialog = (
    <ConfirmDialog
      open={state.open}
      onOpenChange={(open) => {
        if (!open) {
          state.resolve?.(false)
          setState((s) => ({ ...s, open: false }))
        }
      }}
      title={state.title}
      description={state.description}
      confirmText={state.confirmText}
      variant={state.variant}
      onConfirm={() => {
        state.resolve?.(true)
        setState((s) => ({ ...s, open: false }))
      }}
    />
  )

  return { confirm, dialog }
}
