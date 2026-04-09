import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex items-center rounded-[calc(var(--radius-card)+0.2rem)] border border-[color:rgb(130_108_87/0.2)] bg-[linear-gradient(165deg,rgba(255,255,255,0.85)_0%,rgba(255,247,238,0.72)_100%)] p-1 text-[var(--color-ink-600)] shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_6px_16px_rgba(26,22,17,0.08)] backdrop-blur-md',
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center rounded-[calc(var(--radius-card)-0.1rem)] px-4 py-1.5 text-sm font-semibold tracking-[0.01em]',
      'transition-all duration-[var(--duration-base)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--focus-ring-offset)]',
      'disabled:pointer-events-none disabled:opacity-50 select-none',
      'data-[state=active]:bg-[linear-gradient(160deg,rgba(255,255,255,0.98)_0%,rgba(255,250,244,0.92)_100%)] data-[state=active]:text-[var(--color-ink-900)]',
      'data-[state=active]:shadow-[0_8px_16px_rgb(26_22_17/0.12),inset_0_1px_0_rgb(255_255_255/0.8)]',
      'data-[state=inactive]:hover:text-[var(--color-ink-800)] data-[state=inactive]:hover:bg-white/45',
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'rounded-[var(--radius-card)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
      'data-[state=active]:animate-fade-in',
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
