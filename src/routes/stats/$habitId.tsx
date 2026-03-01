import { useMemo } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Flame, Trophy, Target, Hash, Trash2 } from 'lucide-react'
import { HabitHeatmap } from '@/components/charts/HabitHeatmap'
import { TrendLineChart } from '@/components/charts/LineCharts'
import { StatCard } from '@/components/charts/StatCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useHabits } from '@/hooks/useHabits'
import { useCheckIns, useYearlyCheckInCounts, useDeleteCheckIn } from '@/hooks/useCheckIns'
import {
  formatDate,
  formatTime,
  getLast30Days,
  computeStreak,
  computeLongestStreak,
} from '@/lib/utils'
import type { CalendarDatum } from '@/types'

function HabitStatsPage() {
  const { habitId } = Route.useParams()
  const { data: habits } = useHabits()
  const habit = habits?.find((h) => h.id === habitId)

  const year = new Date().getFullYear()
  const { data: allCheckIns, isLoading } = useCheckIns({
    habitId,
    startDate: `${year}-01-01`,
    endDate: `${year}-12-31`,
  })
  const { data: yearCounts } = useYearlyCheckInCounts(habitId)
  const deleteCheckIn = useDeleteCheckIn()

  const allDates = useMemo(
    () => (allCheckIns ?? []).map((ci) => formatDate(ci.checked_at)),
    [allCheckIns]
  )
  const streak = computeStreak(allDates)
  const longest = computeLongestStreak(allDates)
  const total = allCheckIns?.length ?? 0
  const uniqueDays = new Set(allDates).size
  const avgPerDay = uniqueDays > 0 ? (total / uniqueDays).toFixed(1) : '0'

  // Heatmap
  const heatmapData = useMemo<CalendarDatum[]>(() => {
    return Object.entries(yearCounts ?? {}).map(([day, value]) => ({ day, value }))
  }, [yearCounts])

  // 30 day line chart
  const last30 = getLast30Days()
  const lineData = useMemo(() => {
    const countByDate: Record<string, number> = {}
    for (const ci of allCheckIns ?? []) {
      const d = formatDate(ci.checked_at)
      countByDate[d] = (countByDate[d] ?? 0) + 1
    }
    return last30.map((d) => ({
      label: String(new Date(d).getDate()),
      count: countByDate[d] ?? 0,
    }))
  }, [allCheckIns, last30])

  // Group by date for history list
  const groupedHistory = useMemo(() => {
    const groups: Record<string, typeof allCheckIns> = {}
    for (const ci of (allCheckIns ?? []).slice(0, 60)) {
      const d = formatDate(ci.checked_at)
      if (!groups[d]) groups[d] = []
      groups[d]!.push(ci)
    }
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]))
  }, [allCheckIns])

  function handleDelete(id: string) {
    if (window.confirm('确认删除这条打卡记录？')) {
      void deleteCheckIn.mutateAsync(id)
    }
  }

  const color = habit?.color ?? '#f97316'

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 sm:pt-8 pb-6 space-y-6">
      {/* Header */}
      <div className="animate-slide-up">
        <Link to="/stats" className="inline-flex items-center gap-1.5 text-sm text-stone-400 font-semibold hover:text-stone-600 mb-4">
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.5} />
          返回统计
        </Link>

        {habit ? (
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{ backgroundColor: color + '18' }}
            >
              {habit.icon}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-stone-900">{habit.name}</h1>
              <p className="text-sm text-stone-400 font-medium mt-0.5">{year} 年度统计</p>
            </div>
          </div>
        ) : (
          <Skeleton className="h-12 w-40 rounded-xl" />
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="当前连续" value={`${streak} 天`} icon={Flame} iconColor={color} loading={isLoading} />
        <StatCard label="全年总计" value={total} sublabel="次" icon={Hash} iconColor={color} loading={isLoading} />
        <StatCard label="最长连续" value={`${longest} 天`} icon={Trophy} iconColor={color} loading={isLoading} />
        <StatCard label="日均次数" value={avgPerDay} sublabel="次/打卡日" icon={Target} iconColor={color} loading={isLoading} />
      </div>

      {/* Heatmap */}
      <div className="bg-white rounded-2xl p-5 shadow-[var(--shadow-card)] border border-stone-100/80 animate-slide-up">
        <div className="text-sm font-semibold text-stone-500 mb-4">{year} 年日历热力图</div>
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <HabitHeatmap
            data={heatmapData}
            from={`${year}-01-01`}
            to={`${year}-12-31`}
            color={color}
          />
        )}
      </div>

      {/* 30-day trend */}
      <div className="bg-white rounded-2xl p-5 shadow-[var(--shadow-card)] border border-stone-100/80 animate-slide-up">
        <div className="text-sm font-semibold text-stone-500 mb-4">近30天趋势</div>
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <TrendLineChart data={lineData} color={color} height={170} />
        )}
      </div>

      {/* History list */}
      <div className="bg-white rounded-2xl shadow-[var(--shadow-card)] border border-stone-100/80 overflow-hidden animate-slide-up">
        <div className="px-5 py-4 border-b border-stone-50">
          <span className="font-bold text-stone-800 text-sm">打卡历史</span>
          <span className="text-xs text-stone-400 font-medium ml-2">最近60条</span>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : groupedHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-stone-400 gap-2">
            <span className="text-3xl">📭</span>
            <span className="text-sm font-medium">暂无记录</span>
          </div>
        ) : (
          <div>
            {groupedHistory.map(([date, records]) => (
              <div key={date}>
                <div className="px-5 py-2 bg-stone-50 text-xs font-semibold text-stone-500">
                  {new Date(date).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' })}
                  <span className="ml-2 text-stone-400">{records?.length} 次</span>
                </div>
                {records?.map((ci) => (
                  <div key={ci.id} className="flex items-start gap-3 px-5 py-3 border-b border-stone-50 last:border-b-0 group">
                    <div className="text-xs font-semibold text-stone-400 mt-0.5 shrink-0 w-12">
                      {formatTime(ci.checked_at)}
                    </div>
                    <div className="flex-1 min-w-0">
                      {ci.note ? (
                        <div className="text-sm text-stone-600 font-medium">{ci.note}</div>
                      ) : (
                        <div className="text-sm text-stone-400 font-medium">无备注</div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-stone-300 hover:text-red-500 hover:bg-red-50"
                      onClick={() => handleDelete(ci.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export const Route = createFileRoute('/stats/$habitId')({
  component: HabitStatsPage,
})
