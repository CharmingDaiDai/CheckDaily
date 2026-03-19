import { useId } from 'react'
import { useReducedMotion } from 'motion/react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Dot,
} from 'recharts'
import { SimpleChartTooltip } from './ChartTooltip'

interface LineData {
  label: string
  count: number
}

interface TrendLineChartProps {
  data: LineData[]
  color?: string
  height?: number
}

export function TrendLineChart({ data, color = '#f97316', height = 180 }: TrendLineChartProps) {
  const gradId = useId()
  const reduceMotion = useReducedMotion()
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -28, bottom: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.15} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" vertical={false} />
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 10, fill: '#a8a29e', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600 }}
          interval="preserveStartEnd"
        />
        <YAxis
          allowDecimals={false}
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: '#a8a29e', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
        />
        <Tooltip
          cursor={{ stroke: '#e7e5e4', strokeWidth: 2 }}
          content={<SimpleChartTooltip />}
        />
        <Line
          type="monotone"
          dataKey="count"
          stroke={color}
          strokeWidth={2.5}
          isAnimationActive={!reduceMotion}
          animationDuration={reduceMotion ? 0 : 640}
          animationEasing="ease-out"
          dot={<CustomDot color={color} />}
          activeDot={{ r: 5, fill: color, stroke: 'white', strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

function CustomDot(props: { cx?: number; cy?: number; value?: number; color: string }) {
  const { cx, cy, value, color } = props
  if (!value || value === 0) return <g />
  return <Dot cx={cx} cy={cy} r={3} fill={color} stroke="white" strokeWidth={1.5} />
}
