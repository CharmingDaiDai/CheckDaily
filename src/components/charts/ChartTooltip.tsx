interface ChartTooltipProps {
  active?: boolean
  payload?: Array<{ value?: number; name?: string; fill?: string; dataKey?: string | number }>
  label?: string
}

export function SimpleChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-stone-900 text-white text-xs px-3 py-2 rounded-xl shadow-lg font-medium">
      <div className="text-stone-300 mb-0.5">{label}</div>
      <div>{payload[0]?.value} 次</div>
    </div>
  )
}

export function StackedChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-stone-900 text-white text-xs px-3 py-2 rounded-xl shadow-lg font-medium space-y-0.5 min-w-[100px]">
      <div className="text-stone-300 mb-1">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.fill }} />
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  )
}
