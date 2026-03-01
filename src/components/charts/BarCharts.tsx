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
}

export function SimpleBarChart({
  data,
  color = '#f97316',
  height = 180,
  highlightToday = true,
}: SimpleBarChartProps) {
  const today = new Date().toLocaleDateString('zh-CN', { weekday: 'short' })

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 0, left: -28, bottom: 0 }} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" vertical={false} />
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: '#a8a29e', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600 }}
        />
        <YAxis
          allowDecimals={false}
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: '#a8a29e', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
        />
        <Tooltip
          cursor={{ fill: '#f5f5f4', radius: 8 }}
          content={({ active, payload, label }) => {
            if (active && payload?.length) {
              return (
                <div className="bg-stone-900 text-white text-xs px-3 py-2 rounded-xl shadow-lg font-medium">
                  <div className="text-stone-300 mb-0.5">{label}</div>
                  <div>{payload[0]?.value} 次</div>
                </div>
              )
            }
            return null
          }}
        />
        <Bar dataKey="count" radius={[6, 6, 3, 3]} maxBarSize={40}>
          {data.map((entry, index) => {
            const isToday = highlightToday && entry.label === today
            return (
              <Cell
                key={`cell-${index}`}
                fill={isToday ? color : color + '55'}
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
  [habitName: string]: string | number
}

interface StackedBarChartProps {
  data: StackedBarData[]
  habits: Array<{ id: string; name: string; color: string }>
  height?: number
}

export function StackedBarChart({ data, habits, height = 200 }: StackedBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 0, left: -28, bottom: 0 }} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" vertical={false} />
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: '#a8a29e', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600 }}
        />
        <YAxis
          allowDecimals={false}
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: '#a8a29e', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
        />
        <Tooltip
          cursor={{ fill: '#f5f5f4', radius: 8 }}
          content={({ active, payload, label }) => {
            if (active && payload?.length) {
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
            return null
          }}
        />
        {habits.map((h) => (
          <Bar key={h.id} dataKey={h.name} name={h.name} stackId="a" fill={h.color} radius={[0, 0, 0, 0]} maxBarSize={40} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
