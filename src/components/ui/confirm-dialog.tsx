import { useState, useCallback, useId } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

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
  const descriptionId = useId()
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
      <DialogContent
        className="max-w-xs"
        role="alertdialog"
        aria-describedby={description ? descriptionId : undefined}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {description && (
          <DialogDescription id={descriptionId} className="text-sm text-stone-500 -mt-1">
            {description}
          </DialogDescription>
        )}
        <div className="flex gap-3 mt-2">
          <Button
            variant="outline"
            className="flex-1"
            autoFocus={variant === 'danger'}
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'default'}
            className="flex-1"
            onClick={() => void handleConfirm()}
            isLoading={isLoading}
            loadingText="处理中…"
            requestGuard
          >
            {confirmText}
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
