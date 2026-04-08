import { create } from 'zustand'

export interface ToastAction {
  label: string
  onClick: () => void | Promise<void>
}

export interface ToastItem {
  id: string
  message: string
  variant?: 'default' | 'error' | 'success' | 'warning'
  duration?: number
  action?: ToastAction
}

interface ToastState {
  toasts: ToastItem[]
  add: (toast: Omit<ToastItem, 'id'>) => void
  dismiss: (id: string) => void
}

let counter = 0

type ToastOptions = Omit<ToastItem, 'id' | 'message'>

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  add: (toast) => {
    const id = String(++counter)
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }))
  },
  dismiss: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
  },
}))

export function toast(message: string, options?: ToastOptions) {
  useToastStore.getState().add({ message, variant: 'default', ...options })
}

toast.success = (message: string, options?: ToastOptions) => {
  useToastStore.getState().add({ message, variant: 'success', ...options })
}

toast.error = (message: string, options?: ToastOptions) => {
  useToastStore.getState().add({ message, variant: 'error', ...options })
}

toast.warning = (message: string, options?: ToastOptions) => {
  useToastStore.getState().add({ message, variant: 'warning', ...options })
}
