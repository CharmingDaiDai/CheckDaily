import { useMemo } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'
import { spring, statNumberReveal } from '@/lib/motion'
import { Skeleton } from '@/components/ui/skeleton'
import { useCountUp } from '@/hooks/useCountUp'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  sublabel?: string
  icon?: LucideIcon
  iconColor?: string
  loading?: boolean
  className?: string
  primary?: boolean
}

function AnimatedValue({ value }: { value: string | number }) {
  const { num, suffix } = useMemo(() => {
    const str = String(value)
    const match = str.match(/^(\d+(?:\.\d+)?)(.*)$/)
    if (match) {
      return { num: parseFloat(match[1]), suffix: match[2] }
    }
    return { num: NaN, suffix: '' }
  }, [value])

  const animated = useCountUp(isNaN(num) ? 0 : num)

  if (isNaN(num)) return <>{value}</>
  return <>{animated}{suffix}</>
}

export function StatCard({ label, value, sublabel, icon: Icon, iconColor = '#f97316', loading, className, primary }: StatCardProps) {
  const reduceMotion = useReducedMotion()

  if (loading) {
    return (
      <div className={cn('glass-card rounded-[var(--radius-card)] p-4', className)}>
        <Skeleton className="h-3 w-16 mb-3" />
        <Skeleton className="h-7 w-12 mb-1" />
        <Skeleton className="h-3 w-20" />
      </div>
    )
  }

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.98 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
      transition={reduceMotion ? undefined : spring.gentle}
      whileHover={reduceMotion ? undefined : { y: -3, boxShadow: 'var(--shadow-card-hover)', transition: spring.smooth }}
      className={cn(
        'rounded-[var(--radius-card)] p-4',
        className,
        primary ? 'shine-border' : 'glass-card',
      )}
      style={primary ? { background: `linear-gradient(135deg, ${iconColor}12 0%, rgba(255,255,255,0.92) 48%, rgba(255,255,255,0.84) 100%)`, border: '1px solid var(--color-line-soft)', boxShadow: 'var(--shadow-card)' } : undefined}
    >
      <div className="flex items-start justify-between">
        <div className="text-xs font-semibold text-[var(--color-ink-500)] uppercase tracking-wide">{label}</div>
        {Icon && (
          <motion.div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: iconColor + '18' }}
            initial={reduceMotion ? false : { scale: 0.9 }}
            animate={reduceMotion ? undefined : { scale: 1 }}
            transition={spring.snappy}
          >
            <Icon className="w-3.5 h-3.5" style={{ color: iconColor }} strokeWidth={2.5} />
          </motion.div>
        )}
      </div>
      <motion.div
        className={cn('mt-2 font-extrabold text-[var(--color-ink-900)] leading-none tabular-nums', primary ? 'text-3xl' : 'text-2xl')}
        variants={statNumberReveal}
        initial={reduceMotion ? false : 'initial'}
        animate={reduceMotion ? undefined : 'animate'}
      >
        <AnimatedValue value={value} />
      </motion.div>
      {sublabel && <div className="mt-1 text-xs text-[var(--color-ink-500)] font-medium">{sublabel}</div>}
    </motion.div>
  )
}
