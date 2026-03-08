import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { CalendarDays, TrendingUp, LayoutGrid, List, CalendarClock } from 'lucide-react'
import { useHabits } from '@/hooks/useHabits'
import { useTodayCheckIns, useCheckIns } from '@/hooks/useCheckIns'
import { HabitCard } from '@/components/habits/HabitCard'
import { SimpleBarChart } from '@/components/charts/BarCharts'
import { Skeleton } from '@/components/ui/skeleton'
import { BackdateSheet } from '@/components/habits/BackdateSheet'
import { formatDate, getLast7Days } from '@/lib/utils'

function Dashboard() {
  const navigate = useNavigate()
  const [compact, setCompact] = useState(() => localStorage.getItem('dashboard-compact') === 'true')
  const [backdateOpen, setBackdateOpen] = useState(false)

  const { data: habits, isLoading: habitsLoading } = useHabits()
  const { data: todayCheckIns, isLoading: todayLoading } = useTodayCheckIns()

  const last7 = useMemo(() => getLast7Days(), [])
  const { data: recentCheckIns } = useCheckIns({
    startDate: last7[0],
    endDate: last7[last7.length - 1],
  })

  // Today's counts per habit
  const todayCountMap = useMemo(() => {
    const map: Record<string, number> = {}
    for (const ci of todayCheckIns ?? []) {
      map[ci.habit_id] = (map[ci.habit_id] ?? 0) + 1
    }
    return map
  }, [todayCheckIns])

  // Latest check-in id per habit (for undo) — todayCheckIns is ordered desc by checked_at
  const latestCheckInMap = useMemo(() => {
    const map: Record<string, string> = {}
    for (const ci of todayCheckIns ?? []) {
      if (!map[ci.habit_id]) map[ci.habit_id] = ci.id
    }
    return map
  }, [todayCheckIns])

  // Sort: incomplete first, completed at bottom
  const sortedHabits = useMemo(() => {
    if (!habits) return []
    return [...habits].sort((a, b) => {
      const aDone = (todayCountMap[a.id] ?? 0) > 0 ? 1 : 0
      const bDone = (todayCountMap[b.id] ?? 0) > 0 ? 1 : 0
      return aDone - bDone
    })
  }, [habits, todayCountMap])

  // Last 7 days bar chart data
  const weekData = useMemo(() => {
    const countByDate: Record<string, number> = {}
    for (const ci of recentCheckIns ?? []) {
      const d = formatDate(ci.checked_at)
      countByDate[d] = (countByDate[d] ?? 0) + 1
    }
    const days = ['日', '一', '二', '三', '四', '五', '六']
    return last7.map((d) => ({
      label: days[new Date(d).getDay()],
      count: countByDate[d] ?? 0,
      date: d,
    }))
  }, [recentCheckIns, last7])

  const today = new Date()
  const todayStr = today.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })
  const doneCount = Object.values(todayCountMap).filter(c => c > 0).length
  const totalCount = habits?.length ?? 0

  const isLoading = habitsLoading || todayLoading

  // Index where completed habits start (-1 = none done, 0 = all done)
  const firstDoneIdx = sortedHabits.findIndex(h => (todayCountMap[h.id] ?? 0) > 0)
  const hasMixed = firstDoneIdx > 0 && doneCount < totalCount

  const gridClass = compact
    ? 'grid grid-cols-4 sm:grid-cols-5 gap-2'
    : 'grid grid-cols-2 sm:grid-cols-3 gap-3'

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 sm:pt-8 pb-6 space-y-6">
      {/* Header */}
      <div className="animate-slide-up">
        <div className="flex items-center gap-2 text-sm text-stone-400 font-medium mb-1">
          <CalendarDays className="w-3.5 h-3.5" />
          {todayStr}
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-stone-900">今日打卡</h1>
          {totalCount > 0 && !isLoading && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setBackdateOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
                aria-label="补卡"
              >
                <CalendarClock className="w-4 h-4" strokeWidth={2} />
                <span className="text-xs font-medium">补卡</span>
              </button>
              <button
                onClick={() => setCompact(v => {
                  const next = !v
                  localStorage.setItem('dashboard-compact', String(next))
                  return next
                })}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
                aria-label={compact ? '切换到卡片视图' : '切换到紧凑视图'}
              >
                {compact
                  ? <LayoutGrid className="w-4 h-4" strokeWidth={2} />
                  : <List className="w-4 h-4" strokeWidth={2} />
                }
                <span className="text-xs font-medium">{compact ? '卡片' : '紧凑'}</span>
              </button>
            </div>
          )}
        </div>
        <div className="mt-2 flex items-center gap-3">
          {!isLoading && (
            <>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-brand-500" />
                <span className="text-sm font-semibold text-stone-600">
                  已完成 {doneCount} / {totalCount} 项
                </span>
              </div>
              {totalCount > 0 && (
                <div
                  className="h-1.5 flex-1 bg-stone-100 rounded-full overflow-hidden"
                  role="progressbar"
                  aria-valuenow={doneCount}
                  aria-valuemin={0}
                  aria-valuemax={totalCount}
                  aria-label={`今日进度：${doneCount}/${totalCount} 项已完成`}
                >
                  <div
                    className="h-full rounded-full bg-brand-400 transition-all duration-700"
                    style={{ width: `${totalCount > 0 ? (doneCount / totalCount) * 100 : 0}%` }}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Last 7 days mini chart */}
      {totalCount > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-[var(--shadow-card)] border border-stone-100/80 animate-slide-up">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-brand-500" strokeWidth={2.5} />
            <span className="font-bold text-stone-800 text-sm">近7天打卡</span>
          </div>
          <SimpleBarChart data={weekData} height={130} highlightToday />
        </div>
      )}

      {/* Habit grid */}
      {isLoading ? (
        <div className={gridClass}>
          {Array.from({ length: compact ? 8 : 6 }).map((_, i) => (
            <Skeleton key={i} className={compact ? 'h-24 rounded-2xl' : 'h-28 rounded-2xl'} />
          ))}
        </div>
      ) : sortedHabits.length > 0 ? (
        <div className="space-y-3">
          {/* Incomplete habits */}
          {firstDoneIdx !== 0 && (
            <div className={gridClass}>
              {sortedHabits.slice(0, firstDoneIdx === -1 ? undefined : firstDoneIdx).map((habit, i) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  todayCount={todayCountMap[habit.id] ?? 0}
                  compact={compact}
                  latestCheckInId={latestCheckInMap[habit.id]}
                  style={{ animationDelay: `${i * 40}ms` }}
                />
              ))}
            </div>
          )}

          {/* Divider between incomplete and completed */}
          {hasMixed && (
            <div className="flex items-center gap-2 py-0.5">
              <div className="h-px flex-1 bg-stone-100" />
              <span className="text-xs text-stone-400 font-medium px-1">已完成 {doneCount} 项</span>
              <div className="h-px flex-1 bg-stone-100" />
            </div>
          )}

          {/* Completed habits */}
          {firstDoneIdx >= 0 && (
            <div className={gridClass}>
              {sortedHabits.slice(firstDoneIdx).map((habit, i) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  todayCount={todayCountMap[habit.id] ?? 0}
                  compact={compact}
                  latestCheckInId={latestCheckInMap[habit.id]}
                  style={{ animationDelay: `${i * 40}ms` }}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
          <div className="text-5xl mb-4">📋</div>
          <div className="font-bold text-stone-700 text-lg mb-1">还没有打卡项目</div>
          <div className="text-stone-400 text-sm mb-5">去添加你的第一个习惯吧</div>
          <button
            className="px-5 py-2.5 bg-brand-500 text-white rounded-xl font-semibold text-sm hover:bg-brand-600 transition-colors tap-scale"
            onClick={() => void navigate({ to: '/habits' })}
          >
            添加项目
          </button>
        </div>
      )}

      {/* Onboarding hint */}
      {!isLoading && sortedHabits.length > 0 && doneCount === 0 && (
        <div className="flex items-center justify-center gap-1.5 py-1 text-stone-300 animate-fade-in">
          <span className="text-sm">👆</span>
          <span className="text-xs font-medium">轻触卡片即可完成今日打卡</span>
        </div>
      )}

      {/* Backdate sheet */}
      {habits && (
        <BackdateSheet open={backdateOpen} onOpenChange={setBackdateOpen} habits={habits} />
      )}
    </div>
  )
}

export const Route = createFileRoute('/')({
  component: Dashboard,
  beforeLoad: ({ context }) => {
    if (context.auth.loading) return
    if (!context.auth.user) throw redirect({ to: '/login' })
  },
})
