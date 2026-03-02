import { useState, useMemo } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Flame, Trophy, Target, BarChart2, ChevronRight, ChevronLeft, Search, X } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { HabitHeatmap } from '@/components/charts/HabitHeatmap'
import { SimpleBarChart, StackedBarChart } from '@/components/charts/BarCharts'
import { StatCard } from '@/components/charts/StatCard'
import { Skeleton } from '@/components/ui/skeleton'
import { useHabits } from '@/hooks/useHabits'
import { useCheckIns, useYearlyCheckInCounts } from '@/hooks/useCheckIns'
import {
  formatDate,
  getLast7Days,
  getLast30Days,
  getMonthRange,
  computeStreak,
  computeLongestStreak,
} from '@/lib/utils'
import type { CalendarDatum } from '@/types'

type TabValue = 'day' | 'week' | 'month' | 'year'

function StatsPage() {
  const currentYear = new Date().getFullYear()
  const [activeTab, setActiveTab] = useState<TabValue>(
    () => (sessionStorage.getItem('stats-tab') as TabValue) ?? 'week'
  )
  const [habitSearch, setHabitSearch] = useState('')
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const { data: habits } = useHabits()

  // Fetch all check-ins for selected year (extended to Dec 1 of prior year for cross-year streak)
  const queryStart = selectedYear === currentYear ? `${selectedYear - 1}-12-01` : `${selectedYear}-01-01`
  const { data: allCheckIns, isLoading } = useCheckIns({
    startDate: queryStart,
    endDate: `${selectedYear}-12-31`,
  })
  const yearStart = `${selectedYear}-01-01`

  // Today's check-ins
  const todayStr = formatDate(new Date())
  const todayCheckIns = useMemo(
    () => allCheckIns?.filter((ci) => formatDate(ci.checked_at) === todayStr) ?? [],
    [allCheckIns, todayStr]
  )

  // Streak
  const allDates = useMemo(
    () => (allCheckIns ?? []).map((ci) => formatDate(ci.checked_at)),
    [allCheckIns]
  )
  const streak = computeStreak(allDates)
  const longest = computeLongestStreak(allDates)
  const thisMonthRange = getMonthRange()
  const thisMonthCount = useMemo(
    () => (allCheckIns ?? []).filter(
      (ci) => formatDate(ci.checked_at) >= thisMonthRange.start && formatDate(ci.checked_at) <= thisMonthRange.end
    ).length,
    [allCheckIns, thisMonthRange]
  )

  // Yearly heatmap data
  const { data: yearCounts } = useYearlyCheckInCounts(undefined, selectedYear)
  const heatmapData = useMemo<CalendarDatum[]>(() => {
    return Object.entries(yearCounts ?? {}).map(([day, value]) => ({ day, value }))
  }, [yearCounts])

  // Week bar data
  const weekData = useMemo(() => {
    const countByDate: Record<string, number> = {}
    for (const ci of allCheckIns ?? []) {
      const d = formatDate(ci.checked_at)
      countByDate[d] = (countByDate[d] ?? 0) + 1
    }
    const days = ['日', '一', '二', '三', '四', '五', '六']
    return getLast7Days().map((d) => ({
      label: days[new Date(d).getDay()],
      count: countByDate[d] ?? 0,
      date: d,
    }))
  }, [allCheckIns])

  // Month stacked bar data
  const habitsMap = useMemo(() => {
    const m: Record<string, { name: string; color: string; icon: string }> = {}
    for (const h of habits ?? []) m[h.id] = { name: h.name, color: h.color, icon: h.icon }
    return m
  }, [habits])

  // Month stacked bar data
  const monthData = useMemo(() => {
    const last30 = getLast30Days()
    const map: Record<string, Record<string, number>> = {}
    for (const d of last30) map[d] = {}
    for (const ci of allCheckIns ?? []) {
      const d = formatDate(ci.checked_at)
      if (map[d] !== undefined) {
        const hName = habitsMap[ci.habit_id]?.name ?? 'other'
        map[d][hName] = (map[d][hName] ?? 0) + 1
      }
    }
    return last30.map((d, i) => ({
      label: i % 5 === 0 ? String(new Date(d).getDate()) : '',
      ...(map[d] ?? {}),
    }))
  }, [allCheckIns, habitsMap])

  // Day timeline
  const todayTimeline = useMemo(() => {
    return todayCheckIns.sort((a, b) => a.checked_at.localeCompare(b.checked_at))
  }, [todayCheckIns])

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 sm:pt-8 pb-6 space-y-6">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="text-2xl font-extrabold text-stone-900">统计分析</h1>
        <div className="flex items-center gap-2 mt-0.5">
          <button
            className="p-0.5 text-stone-300 hover:text-stone-600 transition-colors"
            onClick={() => setSelectedYear(y => y - 1)}
            aria-label="上一年"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-stone-400 font-medium">{selectedYear} 年度数据</span>
          <button
            className="p-0.5 text-stone-300 hover:text-stone-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            onClick={() => setSelectedYear(y => y + 1)}
            disabled={selectedYear >= currentYear}
            aria-label="下一年"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="当前连续" value={`${streak} 天`} icon={Flame} iconColor="#f97316" loading={isLoading} />
        <StatCard label="本月打卡" value={thisMonthCount} sublabel="次" icon={Target} iconColor="#3b82f6" loading={isLoading} />
        <StatCard label="最长连续" value={`${longest} 天`} icon={Trophy} iconColor="#eab308" loading={isLoading} />
        <StatCard label="全年总计" value={(allCheckIns ?? []).filter(ci => formatDate(ci.checked_at) >= yearStart).length} sublabel="次" icon={BarChart2} iconColor="#22c55e" loading={isLoading} />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl p-5 shadow-[var(--shadow-card)] border border-stone-100/80 animate-slide-up">
        <Tabs value={activeTab} onValueChange={(v) => {
          setActiveTab(v as TabValue)
          sessionStorage.setItem('stats-tab', v)
        }}>
          <TabsList className="w-full mb-5">
            <TabsTrigger value="day" className="flex-1">今日</TabsTrigger>
            <TabsTrigger value="week" className="flex-1">本周</TabsTrigger>
            <TabsTrigger value="month" className="flex-1">近30天</TabsTrigger>
            <TabsTrigger value="year" className="flex-1">全年</TabsTrigger>
          </TabsList>

          {/* Day view */}
          <TabsContent value="day">
            <div className="text-sm font-semibold text-stone-500 mb-3">
              今日打卡 {todayTimeline.length} 次
            </div>
            {todayTimeline.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-stone-400 gap-2">
                <span className="text-3xl">📭</span>
                <span className="text-sm font-medium">今天还没有打卡记录</span>
              </div>
            ) : (
              <div className="space-y-2.5">
                {todayTimeline.map((ci) => {
                  const h = habitsMap[ci.habit_id]
                  return (
                    <div key={ci.id} className="flex items-start gap-3 py-2">
                      <div className="w-1 h-full self-stretch bg-stone-100 rounded-full mt-1 shrink-0" />
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
                        style={{ backgroundColor: (h?.color ?? '#ccc') + '20' }}
                      >
                        {h?.icon ?? '📌'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-stone-800 text-sm">{h?.name ?? '未知项目'}</div>
                        {ci.note && (
                          <div className="text-xs text-stone-500 mt-0.5 font-medium">{ci.note}</div>
                        )}
                      </div>
                      <div className="text-xs text-stone-400 font-medium shrink-0">
                        {new Date(ci.checked_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* Week view */}
          <TabsContent value="week">
            <div className="text-sm font-semibold text-stone-500 mb-3">过去7天打卡趋势</div>
            {isLoading ? <Skeleton className="h-40 w-full" /> : <SimpleBarChart data={weekData} height={160} highlightToday />}
          </TabsContent>

          {/* Month view */}
          <TabsContent value="month">
            <div className="text-sm font-semibold text-stone-500 mb-3">近30天 · 各项目堆叠</div>
            {isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <StackedBarChart
                data={monthData}
                habits={habits?.map((h) => ({ id: h.id, name: h.name, color: h.color })) ?? []}
                height={180}
              />
            )}
          </TabsContent>

          {/* Year view */}
          <TabsContent value="year">
            <div className="text-sm font-semibold text-stone-500 mb-3">
              {selectedYear} 年全年打卡热力图
            </div>
            {isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <HabitHeatmap
                data={heatmapData}
                from={`${selectedYear}-01-01`}
                to={`${selectedYear}-12-31`}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Per-habit links */}
      {habits && habits.length > 0 && (
        <div className="bg-white rounded-2xl shadow-[var(--shadow-card)] border border-stone-100/80 overflow-hidden animate-slide-up">
          <div className="px-5 py-4 border-b border-stone-50 flex items-center justify-between gap-3">
            <span className="font-bold text-stone-800 text-sm shrink-0">各项目详情</span>
            {habits.length > 5 && (
              <div className="relative flex-1 max-w-[180px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
                <Input
                  placeholder="搜索项目…"
                  value={habitSearch}
                  onChange={(e) => setHabitSearch(e.target.value)}
                  className="pl-8 pr-7 h-8 text-xs"
                />
                {habitSearch && (
                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                    onClick={() => setHabitSearch('')}
                    aria-label="清除搜索"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="divide-y divide-stone-50">
            {habits
              .filter(h => h.name.toLowerCase().includes(habitSearch.toLowerCase()))
              .map((h) => {
                const cnt = (allCheckIns ?? []).filter(
                  (ci) => ci.habit_id === h.id && formatDate(ci.checked_at) >= yearStart
                ).length
                const habitDates = (allCheckIns ?? [])
                  .filter((ci) => ci.habit_id === h.id)
                  .map((ci) => formatDate(ci.checked_at))
                const habitStreak = computeStreak(habitDates)
                return (
                  <Link
                    key={h.id}
                    to="/stats/$habitId"
                    params={{ habitId: h.id }}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-stone-50 transition-colors"
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                      style={{ backgroundColor: h.color + '18' }}
                    >
                      {h.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-stone-900 text-sm truncate">{h.name}</div>
                      <div className="text-xs text-stone-400 font-medium mt-0.5">
                        全年 {cnt} 次 · 连续 {habitStreak} 天
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-300 shrink-0" />
                  </Link>
                )
              })}
            {habitSearch && habits.filter(h => h.name.toLowerCase().includes(habitSearch.toLowerCase())).length === 0 && (
              <div className="flex flex-col items-center py-8 text-stone-400 gap-2">
                <Search className="w-8 h-8 text-stone-200" strokeWidth={1.5} />
                <span className="text-sm font-medium">没有找到「{habitSearch}」</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export const Route = createFileRoute('/stats/')({
  component: StatsPage,
})
