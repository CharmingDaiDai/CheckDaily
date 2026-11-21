import * as React from 'react'
import { cn } from '@/lib/utils'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-11 w-full rounded-[calc(var(--radius-control)+0.08rem)] border border-[color:rgb(39_35_31/0.12)] glass-well px-4 py-2',
          'text-sm font-medium text-[var(--color-ink-900)] placeholder:text-[var(--color-ink-500)]',
          'transition-all duration-[var(--duration-fast)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--focus-ring-offset)] focus-visible:border-brand-400 focus:border-brand-300',
          'focus-visible:shadow-[inset_0_1px_2px_rgb(61_52_41/0.08),inset_0_6px_14px_-10px_rgb(61_52_41/0.16),0_0_0_3px_rgba(216,111,47,0.13),0_10px_20px_-10px_rgb(61_52_41/0.2)]',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:saturate-75',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[96px] w-full rounded-[calc(var(--radius-control)+0.08rem)] border border-[color:rgb(39_35_31/0.12)] glass-well px-4 py-3',
          'text-sm font-medium text-[var(--color-ink-900)] placeholder:text-[var(--color-ink-500)]',
          'resize-none transition-all duration-[var(--duration-fast)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--focus-ring-offset)] focus-visible:border-brand-400 focus:border-brand-300',
          'focus-visible:shadow-[inset_0_1px_2px_rgb(61_52_41/0.08),inset_0_6px_14px_-10px_rgb(61_52_41/0.16),0_0_0_3px_rgba(216,111,47,0.13),0_10px_20px_-10px_rgb(61_52_41/0.2)]',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:saturate-75',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = 'Textarea'
