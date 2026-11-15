import * as React from 'react'
import { cn } from '@/lib/utils'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-11 w-full rounded-[calc(var(--radius-control)+0.08rem)] border border-[color:rgb(39_35_31/0.14)] bg-[linear-gradient(165deg,rgba(255,255,255,0.82)_0%,rgba(248,246,240,0.68)_100%)] px-4 py-2',
          'text-sm font-medium text-[var(--color-ink-900)] placeholder:text-[var(--color-ink-500)]',
          'shadow-[inset_0_1px_0_rgba(255,255,255,0.82),0_2px_8px_rgba(61,52,41,0.05)] backdrop-blur-md transition-all duration-[var(--duration-fast)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--focus-ring-offset)] focus-visible:border-brand-400 focus-visible:bg-white',
          'focus-visible:shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_0_0_3px_rgba(216,111,47,0.14),0_12px_22px_rgba(61,52,41,0.08)]',
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
          'flex min-h-[96px] w-full rounded-[calc(var(--radius-control)+0.08rem)] border border-[color:rgb(39_35_31/0.14)] bg-[linear-gradient(165deg,rgba(255,255,255,0.82)_0%,rgba(248,246,240,0.68)_100%)] px-4 py-3',
          'text-sm font-medium text-[var(--color-ink-900)] placeholder:text-[var(--color-ink-500)]',
          'resize-none shadow-[inset_0_1px_0_rgba(255,255,255,0.82),0_2px_8px_rgba(61,52,41,0.05)] backdrop-blur-md transition-all duration-[var(--duration-fast)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--focus-ring-offset)] focus-visible:border-brand-400 focus-visible:bg-white',
          'focus-visible:shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_0_0_3px_rgba(216,111,47,0.14),0_12px_22px_rgba(61,52,41,0.08)]',
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
