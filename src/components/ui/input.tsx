import * as React from 'react'
import { cn } from '@/lib/utils'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-11 w-full rounded-[calc(var(--radius-control)+0.1rem)] border border-[color:rgb(130_108_87/0.22)] bg-[linear-gradient(165deg,rgba(255,255,255,0.94)_0%,rgba(255,249,243,0.86)_100%)] px-4 py-2',
          'text-sm font-medium text-[var(--color-ink-900)] placeholder:text-[var(--color-ink-500)]',
          'shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_2px_6px_rgba(38,30,20,0.06)] transition-all duration-[var(--duration-fast)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--focus-ring-offset)] focus-visible:border-brand-400 focus-visible:bg-white',
          'focus-visible:shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_0_0_3px_rgba(249,115,22,0.14),0_12px_22px_rgba(38,30,20,0.08)]',
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
          'flex min-h-[96px] w-full rounded-[calc(var(--radius-control)+0.1rem)] border border-[color:rgb(130_108_87/0.22)] bg-[linear-gradient(165deg,rgba(255,255,255,0.94)_0%,rgba(255,249,243,0.86)_100%)] px-4 py-3',
          'text-sm font-medium text-[var(--color-ink-900)] placeholder:text-[var(--color-ink-500)]',
          'resize-none shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_2px_6px_rgba(38,30,20,0.06)] transition-all duration-[var(--duration-fast)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--focus-ring-offset)] focus-visible:border-brand-400 focus-visible:bg-white',
          'focus-visible:shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_0_0_3px_rgba(249,115,22,0.14),0_12px_22px_rgba(38,30,20,0.08)]',
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
