import { motion, useReducedMotion } from 'motion/react'

interface ChartTooltipProps {
  active?: boolean
  payload?: Array<{ value?: number; name?: string; fill?: string; dataKey?: string | number }>
  label?: string
}

export function SimpleChartTooltip({ active, payload, label }: ChartTooltipProps) {
  const reduceMotion = useReducedMotion()
  if (!active || !payload?.length) return null
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 4, scale: 0.98 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
      transition={reduceMotion ? undefined : { duration: 0.2, ease: [0.22, 0.61, 0.36, 1] }}
      className="bg-[rgba(26,22,17,0.94)] text-white text-xs px-3 py-2 rounded-[var(--radius-control)] shadow-[var(--shadow-elevated)] font-medium backdrop-blur-sm border border-white/10"
    >
      <div className="text-stone-300 mb-0.5">{label}</div>
      <div>{payload[0]?.value} 次</div>
    </motion.div>
  )
}

export function StackedChartTooltip({ active, payload, label }: ChartTooltipProps) {
  const reduceMotion = useReducedMotion()
  if (!active || !payload?.length) return null
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 4, scale: 0.98 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
      transition={reduceMotion ? undefined : { duration: 0.2, ease: [0.22, 0.61, 0.36, 1] }}
      className="bg-[rgba(26,22,17,0.94)] text-white text-xs px-3 py-2 rounded-[var(--radius-control)] shadow-[var(--shadow-elevated)] font-medium space-y-0.5 min-w-[110px] backdrop-blur-sm border border-white/10"
    >
      <div className="text-stone-300 mb-1">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.fill }} />
          {p.name}: {p.value}
        </div>
      ))}
    </motion.div>
  )
}
