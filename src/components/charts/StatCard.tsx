import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  sublabel?: string
  icon?: LucideIcon
  iconColor?: string
  loading?: boolean
  className?: string
}

export function StatCard({ label, value, sublabel, icon: Icon, iconColor = '#f97316', loading, className }: StatCardProps) {
  if (loading) {
    return (
      <div className={cn('bg-white rounded-2xl p-4 shadow-[var(--shadow-card)] border border-stone-100/80', className)}>
        <Skeleton className="h-3 w-16 mb-3" />
        <Skeleton className="h-7 w-12 mb-1" />
        <Skeleton className="h-3 w-20" />
      </div>
    )
  }

  return (
    <div className={cn('bg-white rounded-2xl p-4 shadow-[var(--shadow-card)] border border-stone-100/80 animate-fade-in', className)}>
      <div className="flex items-start justify-between">
        <div className="text-xs font-semibold text-stone-400 uppercase tracking-wide">{label}</div>
        {Icon && (
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: iconColor + '18' }}
          >
            <Icon className="w-3.5 h-3.5" style={{ color: iconColor }} strokeWidth={2.5} />
          </div>
        )}
      </div>
      <div className="mt-2 text-2xl font-extrabold text-stone-900 leading-none">{value}</div>
      {sublabel && <div className="mt-1 text-xs text-stone-400 font-medium">{sublabel}</div>}
    </div>
  )
}
