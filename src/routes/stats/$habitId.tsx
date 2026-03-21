import { useMemo, useState, lazy, Suspense } from 'react'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { ArrowLeft, Flame, Trophy, Target, Hash, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
const HabitHeatmap = lazy(() => import('@/components/charts/HabitHeatmap'))
import { TrendLineChart } from '@/components/charts/LineCharts'
import { StatCard } from '@/components/charts/StatCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useHabits } from '@/hooks/useHabits'
import { useCheckIns, useYearlyCheckInCounts, useDeleteCheckIn } from '@/hooks/useCheckIns'
import {
  formatDate,
  formatTime,
  getLast30Days,
  computeStreak,
  computeLongestStreak,
} from '@/lib/utils'
import { pageChoreography } from '@/lib/motion'
import type { CalendarDatum } from '@/types'

function HabitStatsPage() {
  const { habitId } = Route.useParams()
  const { data: habits } = useHabits()
  const habit = habits?.find((h) => h.id === habitId)

  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const queryStart = selectedYear === currentYear ? `${selectedYear - 1}-12-01` : `${selectedYear}-01-01`
  const { data: allCheckIns, isLoading } = useCheckIns({
    habitId,
    startDate: queryStart,
    endDate: `${selectedYear}-12-31`,
  })
  const { data: yearCounts } = useYearlyCheckInCounts(habitId, selectedYear)
  const deleteCheckIn = useDeleteCheckIn()
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [displayCount, setDisplayCount] = useState(60)

  const allDates = useMemo(
    () => (allCheckIns ?? []).map((ci) => formatDate(ci.checked_at)),
    [allCheckIns]
  )
  const streak = computeStreak(allDates)
  const longest = computeLongestStreak(allDates)
  const yearStart = `${selectedYear}-01-01`
  const total = useMemo(
    () => (allCheckIns ?? []).filter((ci) => formatDate(ci.checked_at) >= yearStart).length,
    [allCheckIns, yearStart]
  )
  const uniqueDays = useMemo(
    () => new Set((allCheckIns ?? []).filter((ci) => formatDate(ci.checked_at) >= yearStart).map((ci) => formatDate(ci.checked_at))).size,
    [allCheckIns, yearStart]
  )
  const avgPerDay = uniqueDays > 0 ? (total / uniqueDays).toFixed(1) : '0'

  // Heatmap
  const heatmapData = useMemo<CalendarDatum[]>(() => {
    return Object.entries(yearCounts ?? {}).map(([day, value]) => ({ day, value }))
  }, [yearCounts])

  // 30 day line chart
  const last30 = useMemo(() => getLast30Days(), [])
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
    const yearRecords = (allCheckIns ?? []).filter((ci) => formatDate(ci.checked_at) >= yearStart)
    for (const ci of yearRecords.slice(0, displayCount)) {
      const d = formatDate(ci.checked_at)
      if (!groups[d]) groups[d] = []
      groups[d]!.push(ci)
    }
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]))
  }, [allCheckIns, displayCount, yearStart])

  function handleDelete(id: string) {
    setDeleteTarget(id)
  }

  const color = habit?.color ?? '#f97316'

  return (
    <motion.div
      className="max-w-2xl mx-auto px-4 pt-6 sm:pt-8 pb-6 space-y-6"
      variants={pageChoreography}
      initial="initial"
      animate="animate"
    >
      {/* Header */}
      <div>
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
              <div className="flex items-center gap-2 mt-0.5">
                <button
                  className="p-0.5 text-stone-300 hover:text-stone-600 transition-colors"
                  onClick={() => setSelectedYear(y => y - 1)}
                  aria-label="上一年"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-sm text-stone-400 font-medium">{selectedYear} 年度统计</span>
                <button
                  className="p-0.5 text-stone-300 hover:text-stone-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  onClick={() => setSelectedYear(y => y + 1)}
                  disabled={selectedYear >= currentYear}
                  aria-label="下一年"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <Skeleton className="h-12 w-40 rounded-xl" />
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="当前连续" value={`${streak} 天`} icon={Flame} iconColor={color} loading={isLoading} primary />
        <StatCard label="全年总计" value={total} sublabel="次" icon={Hash} iconColor={color} loading={isLoading} />
        <StatCard label="最长连续" value={`${longest} 天`} icon={Trophy} iconColor={color} loading={isLoading} />
        <StatCard label="日均次数" value={avgPerDay} sublabel="次/打卡日" icon={Target} iconColor={color} loading={isLoading} />
      </div>

      {/* Heatmap */}
      <div className="bg-white rounded-2xl p-5 shadow-[var(--shadow-card)] border border-stone-200/60">
        <div className="text-sm font-semibold text-stone-500 mb-4 pb-3 border-b border-stone-50">{selectedYear} 年日历热力图</div>
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <Suspense fallback={<Skeleton className="h-40 w-full" />}>
            <HabitHeatmap
              data={heatmapData}
              from={`${selectedYear}-01-01`}
              to={`${selectedYear}-12-31`}
              color={color}
            />
          </Suspense>
        )}
      </div>

      {/* 30-day trend */}
      <div className="bg-white rounded-2xl p-5 shadow-[var(--shadow-card)] border border-stone-200/60">
        <div className="text-sm font-semibold text-stone-500 mb-4 pb-3 border-b border-stone-50">近30天趋势</div>
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <TrendLineChart data={lineData} color={color} height={170} />
        )}
      </div>

      {/* History list */}
      <div className="bg-white rounded-2xl shadow-[var(--shadow-card)] border border-stone-200/60 overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-50">
          <span className="font-bold text-stone-800 text-sm">打卡历史</span>
          <span className="text-xs text-stone-400 font-medium ml-2">
            {total} 条
          </span>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : groupedHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-stone-400 gap-3">
            <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center">
              <span className="text-2xl">📭</span>
            </div>
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
                      {formatDate(ci.checked_at) !== formatDate(ci.created_at) && (
                        <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 font-medium">
                          补
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="shrink-0 opacity-60 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 transition-opacity text-stone-300 hover:text-red-500 hover:bg-red-50"
                      onClick={() => handleDelete(ci.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            ))}
            {total > displayCount && (
              <button
                className="w-full py-3 text-xs font-semibold text-stone-400 hover:text-brand-500 transition-colors border-t border-stone-50"
                onClick={() => setDisplayCount(n => n + 60)}
              >
                加载更多（还有 {total - displayCount} 条）
              </button>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="确认删除这条打卡记录？"
        description="删除后无法恢复。"
        confirmText="删除"
        variant="danger"
        onConfirm={async () => {
          if (deleteTarget) await deleteCheckIn.mutateAsync(deleteTarget)
        }}
      />
    </motion.div>
  )
}

export const Route = createFileRoute('/stats/$habitId')({
  component: HabitStatsPage,
  beforeLoad: ({ context }) => {
    if (context.auth.loading) return
    if (!context.auth.user) throw redirect({ to: '/login' })
  },
})
