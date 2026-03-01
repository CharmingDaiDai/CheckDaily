import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo } from 'react'
import { CalendarDays, TrendingUp } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useHabits } from '@/hooks/useHabits'
import { useTodayCheckIns, useCheckIns } from '@/hooks/useCheckIns'
import { HabitCard } from '@/components/habits/HabitCard'
import { SimpleBarChart } from '@/components/charts/BarCharts'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate, getLast7Days } from '@/lib/utils'

function Dashboard() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  // Redirect if not logged in
  useEffect(() => {
    if (!user) void navigate({ to: '/login' })
  }, [user, navigate])

  const { data: habits, isLoading: habitsLoading } = useHabits()
  const { data: todayCheckIns, isLoading: todayLoading } = useTodayCheckIns()

  const last7 = getLast7Days()
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

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 sm:pt-8 pb-6 space-y-6">
      {/* Header */}
      <div className="animate-slide-up">
        <div className="flex items-center gap-2 text-sm text-stone-400 font-medium mb-1">
          <CalendarDays className="w-3.5 h-3.5" />
          {todayStr}
        </div>
        <h1 className="text-2xl font-extrabold text-stone-900">今日打卡</h1>
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
                <div className="h-1.5 flex-1 bg-stone-100 rounded-full overflow-hidden">
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

      {/* Habit grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : habits && habits.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {habits.map((habit, i) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              todayCount={todayCountMap[habit.id] ?? 0}
              style={{ animationDelay: `${i * 60}ms` }}
            />
          ))}
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
    </div>
  )
}

export const Route = createFileRoute('/')({
  component: Dashboard,
})
