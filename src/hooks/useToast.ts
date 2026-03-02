import { create } from 'zustand'

export interface ToastItem {
  id: string
  message: string
  variant?: 'default' | 'error' | 'success'
  duration?: number
}

interface ToastState {
  toasts: ToastItem[]
  add: (toast: Omit<ToastItem, 'id'>) => void
  dismiss: (id: string) => void
}

let counter = 0

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

export function toast(message: string) {
  useToastStore.getState().add({ message, variant: 'default' })
}

toast.success = (message: string) => {
  useToastStore.getState().add({ message, variant: 'success' })
}

toast.error = (message: string) => {
  useToastStore.getState().add({ message, variant: 'error' })
}
