import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { useReducedMotion } from 'motion/react'
import { today } from '@/lib/utils'
import { SimpleChartTooltip, StackedChartTooltip } from './ChartTooltip'

interface BarData {
  label: string
  count: number
  date?: string
}

interface SimpleBarChartProps {
  data: BarData[]
  color?: string
  height?: number
  highlightToday?: boolean
  activeDate?: string
  onBarClick?: (date: string) => void
  showYAxis?: boolean
}

export function SimpleBarChart({
  data,
  color = '#f97316',
  height = 180,
  highlightToday = true,
  activeDate,
  onBarClick,
  showYAxis = true,
}: SimpleBarChartProps) {
  const reduceMotion = useReducedMotion()

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: showYAxis ? -28 : 8, bottom: 0 }} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="2 4" stroke="rgba(28,25,23,0.08)" vertical={false} />
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: '#7d6b58', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600 }}
        />
        <YAxis
          allowDecimals={false}
          axisLine={false}
          tickLine={false}
          hide={!showYAxis}
          width={showYAxis ? undefined : 0}
          tick={{ fontSize: 11, fill: '#7d6b58', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
        />
        <Tooltip
          cursor={{ fill: '#f5f5f4', radius: 8 }}
          content={<SimpleChartTooltip />}
        />
        <Bar
          dataKey="count"
          radius={[6, 6, 3, 3]}
          minPointSize={onBarClick ? 6 : 0}
          maxBarSize={40}
          isAnimationActive={!reduceMotion}
          animationDuration={reduceMotion ? 0 : 620}
          animationBegin={reduceMotion ? 0 : 40}
          animationEasing="ease-out"
          onClick={(entry) => {
            const date = (entry as { payload?: { date?: string } })?.payload?.date
            if (date && onBarClick) onBarClick(date)
          }}
          style={onBarClick ? { cursor: 'pointer' } : undefined}
        >
          {data.map((entry, index) => {
            const isToday = highlightToday && entry.date === today()
            const isActive = activeDate !== undefined && entry.date === activeDate
            return (
              <Cell
                key={`cell-${index}`}
                fill={isActive ? color : isToday ? color : color + '55'}
                opacity={isActive ? 1 : 0.95}
              />
            )
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

/* Stacked bar chart for multiple habits */
interface StackedBarData {
  label: string
  date: string
  [habitName: string]: string | number
}

interface StackedBarChartProps {
  data: StackedBarData[]
  habits: Array<{ id: string; name: string; color: string }>
  height?: number
  activeDate?: string
  onBarClick?: (date: string) => void
}

export function StackedBarChart({ data, habits, height = 200, onBarClick }: StackedBarChartProps) {
  const reduceMotion = useReducedMotion()

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 0, left: -28, bottom: 0 }} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="2 4" stroke="rgba(28,25,23,0.08)" vertical={false} />
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: '#7d6b58', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600 }}
        />
        <YAxis
          allowDecimals={false}
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: '#7d6b58', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
        />
        <Tooltip
          cursor={{ fill: '#f5f5f4', radius: 8 }}
          content={<StackedChartTooltip />}
        />
        {habits.map((h) => (
          <Bar
            key={h.id}
            dataKey={h.name}
            name={h.name}
            stackId="a"
            fill={h.color}
            radius={[0, 0, 0, 0]}
            maxBarSize={40}
            isAnimationActive={!reduceMotion}
            animationDuration={reduceMotion ? 0 : 620}
            animationBegin={reduceMotion ? 0 : 45}
            animationEasing="ease-out"
            onClick={(entry) => {
              const date = (entry as { payload?: { date?: string } })?.payload?.date
              if (date && onBarClick) onBarClick(date)
            }}
            style={onBarClick ? { cursor: 'pointer' } : undefined}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
