import { ResponsiveCalendar } from '@nivo/calendar'
import type { CalendarDatum } from '@/types'

interface HabitHeatmapProps {
  data: CalendarDatum[]
  from: string
  to: string
  color?: string
}

export function HabitHeatmap({ data, from, to, color = '#f97316' }: HabitHeatmapProps) {
  const max = Math.max(...data.map((d) => d.value), 1)
  const colors = generateColorScale(color)

  return (
    <div className="w-full h-[160px]">
      <ResponsiveCalendar
        data={data}
        from={from}
        to={to}
        emptyColor="#f5f5f4"
        colors={colors}
        margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
        yearSpacing={40}
        monthBorderColor="#fafaf9"
        dayBorderWidth={2}
        dayBorderColor="#fafaf9"
        tooltip={({ day, value }) => (
          <div className="bg-stone-900 text-white text-xs px-2.5 py-1.5 rounded-lg shadow-lg font-medium">
            {day}：{value} 次
          </div>
        )}
        theme={{
          text: { fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', fontSize: 11, fill: '#a8a29e' },
          tooltip: { container: { background: 'transparent', boxShadow: 'none', padding: 0 } },
        }}
        maxValue={max > 4 ? max : 4}
      />
    </div>
  )
}

function generateColorScale(hex: string): string[] {
  const scales: Record<string, string[]> = {
    '#f97316': ['#fed7aa', '#fdba74', '#fb923c', '#f97316', '#c2540a'],
    '#ef4444': ['#fecaca', '#fca5a5', '#f87171', '#ef4444', '#b91c1c'],
    '#ec4899': ['#fbcfe8', '#f9a8d4', '#f472b6', '#ec4899', '#be185d'],
    '#a855f7': ['#e9d5ff', '#d8b4fe', '#c084fc', '#a855f7', '#7e22ce'],
    '#6366f1': ['#c7d2fe', '#a5b4fc', '#818cf8', '#6366f1', '#4338ca'],
    '#3b82f6': ['#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#1d4ed8'],
    '#06b6d4': ['#cffafe', '#a5f3fc', '#67e8f9', '#06b6d4', '#0e7490'],
    '#14b8a6': ['#ccfbf1', '#99f6e4', '#2dd4bf', '#14b8a6', '#0f766e'],
    '#22c55e': ['#bbf7d0', '#86efac', '#4ade80', '#22c55e', '#15803d'],
    '#84cc16': ['#d9f99d', '#bef264', '#a3e635', '#84cc16', '#4d7c0f'],
    '#eab308': ['#fef08a', '#fde047', '#facc15', '#eab308', '#a16207'],
    '#f59e0b': ['#fde68a', '#fcd34d', '#fbbf24', '#f59e0b', '#b45309'],
  }
  return scales[hex] ?? scales['#f97316']
}
