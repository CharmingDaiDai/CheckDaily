import { useState, useMemo, useRef, useEffect, lazy, Suspense } from "react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  Flame,
  Trophy,
  Target,
  BarChart2,
  ChevronRight,
  ChevronLeft,
  Search,
  X,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { CheckInDayDetailDialog } from "@/components/habits/CheckInDayDetailDialog";
const HabitHeatmap = lazy(() => import("@/components/charts/HabitHeatmap"));
import { SimpleBarChart, StackedBarChart } from "@/components/charts/BarCharts";
import { StatCard } from "@/components/charts/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useHabits } from "@/hooks/useHabits";
import { useCheckIns, useYearlyCheckInCounts } from "@/hooks/useCheckIns";
import {
  formatDate,
  today,
  getWeekRange,
  getDateRangeDays,
  getLast30Days,
  getMonthRange,
  computeStreak,
  computeLongestStreak,
} from "@/lib/utils";
import type { CalendarDatum } from "@/types";
import { pageChoreography, sectionReveal } from "@/lib/motion";

type TabValue = "day" | "week" | "month" | "year";

const weekLabels = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

function parseDateKey(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDateOption(dateStr: string): string {
  const d = parseDateKey(dateStr);
  return `${d.getMonth() + 1}月${d.getDate()}日 ${weekLabels[d.getDay()]}`;
}

function StatsPage() {
  const currentYear = new Date().getFullYear();
  const [activeTab, setActiveTab] = useState<TabValue>(
    () => (sessionStorage.getItem("stats-tab") as TabValue) ?? "week",
  );
  const tabOrder: TabValue[] = ["day", "week", "month", "year"];
  const prevTabIdx = useRef(tabOrder.indexOf(activeTab));
  const [slideDir, setSlideDir] = useState<"right" | "left">("right");
  const [habitSearch, setHabitSearch] = useState("");
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [isDayDetailOpen, setIsDayDetailOpen] = useState(false);
  const {
    data: habits,
    isFetching: habitsFetching,
    error: habitsError,
    refetch: refetchHabits,
  } = useHabits();
  const todayStr = useMemo(() => today(), []);
  const last30 = useMemo(() => getLast30Days(), []);
  const rollingStart = last30[0] ?? todayStr;

  // Year-scoped data for annual views and yearly counters.
  const queryStart =
    selectedYear === currentYear
      ? `${selectedYear - 1}-12-01`
      : `${selectedYear}-01-01`;
  const {
    data: yearCheckIns,
    isLoading: yearLoading,
    isFetching: yearFetching,
    error: yearError,
    refetch: refetchYear,
  } = useCheckIns({
    startDate: queryStart,
    endDate: `${selectedYear}-12-31`,
  });
  // Rolling window data for today/week/near-term charts, independent from selected year.
  const {
    data: rollingCheckIns,
    isLoading: rollingLoading,
    isFetching: rollingFetching,
    error: rollingError,
    refetch: refetchRolling,
  } = useCheckIns({
    startDate: rollingStart,
    endDate: todayStr,
  });

  const allCheckIns = useMemo(() => {
    const merged = new Map<string, NonNullable<typeof yearCheckIns>[number]>();
    for (const ci of yearCheckIns ?? []) merged.set(ci.id, ci);
    for (const ci of rollingCheckIns ?? []) merged.set(ci.id, ci);
    return Array.from(merged.values());
  }, [yearCheckIns, rollingCheckIns]);

  const isLoading = yearLoading || rollingLoading;
  const effectiveYear = activeTab === "year" ? selectedYear : currentYear;
  const yearStart = `${effectiveYear}-01-01`;
  const yearEnd = `${effectiveYear}-12-31`;
  const weekRange = useMemo(() => getWeekRange(), []);
  const weekDays = useMemo(
    () => getDateRangeDays(weekRange.start, weekRange.end),
    [weekRange.start, weekRange.end],
  );
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return weekDays.includes(todayStr)
      ? todayStr
      : (weekDays[weekDays.length - 1] ?? todayStr);
  });

  const checkInsByHabit = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const ci of allCheckIns ?? []) {
      const d = formatDate(ci.checked_at);
      const arr = map.get(ci.habit_id);
      if (arr) arr.push(d);
      else map.set(ci.habit_id, [d]);
    }
    return map;
  }, [allCheckIns]);

  // Today's check-ins
  const todayCheckIns = useMemo(
    () =>
      allCheckIns?.filter((ci) => formatDate(ci.checked_at) === todayStr) ?? [],
    [allCheckIns, todayStr],
  );

  // Streak
  const allDates = useMemo(
    () => (allCheckIns ?? []).map((ci) => formatDate(ci.checked_at)),
    [allCheckIns],
  );
  const streak = computeStreak(allDates);
  const longest = computeLongestStreak(allDates);
  const thisMonthRange = getMonthRange();
  const thisMonthCount = useMemo(
    () =>
      (allCheckIns ?? []).filter(
        (ci) =>
          formatDate(ci.checked_at) >= thisMonthRange.start &&
          formatDate(ci.checked_at) <= thisMonthRange.end,
      ).length,
    [allCheckIns, thisMonthRange],
  );

  // Yearly heatmap data
  const {
    data: yearCounts,
    isFetching: yearCountsFetching,
    error: yearCountsError,
    refetch: refetchYearCounts,
  } = useYearlyCheckInCounts(undefined, selectedYear);
  const heatmapData = useMemo<CalendarDatum[]>(() => {
    return Object.entries(yearCounts ?? {}).map(([day, value]) => ({
      day,
      value,
    }));
  }, [yearCounts]);

  // Week bar data
  const weekData = useMemo(() => {
    const countByDate: Record<string, number> = {};
    for (const ci of rollingCheckIns ?? []) {
      const d = formatDate(ci.checked_at);
      countByDate[d] = (countByDate[d] ?? 0) + 1;
    }
    return weekDays.map((d) => ({
      label: weekLabels[parseDateKey(d).getDay()],
      count: countByDate[d] ?? 0,
      date: d,
      clickTarget: 1,
    }));
  }, [rollingCheckIns, weekDays]);

  // Month stacked bar data
  const habitsMap = useMemo(() => {
    const m: Record<string, { name: string; color: string; icon: string }> = {};
    for (const h of habits ?? [])
      m[h.id] = { name: h.name, color: h.color, icon: h.icon };
    return m;
  }, [habits]);

  // Month stacked bar data
  const monthData = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    for (const d of last30) map[d] = {};
    for (const ci of rollingCheckIns ?? []) {
      const d = formatDate(ci.checked_at);
      if (map[d] !== undefined) {
        const hName = habitsMap[ci.habit_id]?.name ?? "other";
        map[d][hName] = (map[d][hName] ?? 0) + 1;
      }
    }
    return last30.map((d, i) => ({
      date: d,
      label: i % 5 === 0 ? String(new Date(d).getDate()) : "",
      clickTarget: 1,
      ...(map[d] ?? {}),
    }));
  }, [rollingCheckIns, habitsMap, last30]);

  // Day timeline
  const todayTimeline = useMemo(() => {
    return todayCheckIns.sort((a, b) =>
      a.checked_at.localeCompare(b.checked_at),
    );
  }, [todayCheckIns]);

  const yearDates = useMemo(() => {
    const items = new Set<string>();
    for (const ci of allCheckIns ?? []) {
      const d = formatDate(ci.checked_at);
      if (d >= yearStart && d <= yearEnd) items.add(d);
    }
    return Array.from(items).sort((a, b) => b.localeCompare(a));
  }, [allCheckIns, yearStart, yearEnd]);

  const dateOptions = useMemo(() => {
    if (activeTab === "week") return weekDays;
    if (activeTab === "month") return [...last30].reverse();
    if (activeTab === "year")
      return yearDates.length > 0 ? yearDates : [today()];
    return [];
  }, [activeTab, weekDays, last30, yearDates]);

  useEffect(() => {
    if (activeTab === "day") return;
    if (!dateOptions.includes(selectedDate)) {
      setSelectedDate(dateOptions[0] ?? today());
    }
  }, [activeTab, dateOptions, selectedDate]);

  const selectedDateCheckIns = useMemo(() => {
    const list = (allCheckIns ?? []).filter(
      (ci) => formatDate(ci.checked_at) === selectedDate,
    );
    return list.sort((a, b) => a.checked_at.localeCompare(b.checked_at));
  }, [allCheckIns, selectedDate]);

  const isRefreshing = !isLoading && (habitsFetching || yearFetching || rollingFetching || yearCountsFetching);
  const hasStatsError = Boolean(habitsError || yearError || rollingError || yearCountsError);

  return (
    <motion.div
      className="max-w-2xl mx-auto px-4 pt-6 sm:pt-8 pb-6 space-y-6"
      variants={pageChoreography}
      initial="initial"
      animate="animate"
    >
      {/* Header */}
      <motion.div variants={sectionReveal}>
        <h1 className="headline-premium text-[2.02rem] sm:text-[2.3rem] font-normal tracking-[0.01em] text-[var(--color-ink-950)]">
          统计分析
        </h1>
        <div className="flex items-center gap-2 mt-0.5">
          {activeTab === "year" ? (
            <>
              <button
                className="p-0.5 text-stone-300 hover:text-stone-600 transition-colors"
                onClick={() => setSelectedYear((y) => y - 1)}
                aria-label="上一年"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span
                className="text-sm text-[var(--color-ink-500)] font-medium"
                aria-live="polite"
              >
                {selectedYear} 年度数据
              </span>
              <button
                className="p-0.5 text-stone-300 hover:text-stone-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                onClick={() => setSelectedYear((y) => y + 1)}
                disabled={selectedYear >= currentYear}
                aria-label="下一年"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <span className="text-sm text-[var(--color-ink-500)] font-medium">
              实时数据（本周与近30天）
            </span>
          )}
        </div>
      </motion.div>

      {isRefreshing && (
        <motion.div
          variants={sectionReveal}
          className="rounded-xl border border-brand-100 bg-brand-50/70 px-3.5 py-2 text-xs font-medium text-brand-700"
        >
          正在同步统计数据…
        </motion.div>
      )}

      {hasStatsError && (
        <motion.div
          variants={sectionReveal}
          className="rounded-2xl border border-rose-200 bg-rose-50/70 px-4 py-3"
        >
          <div className="text-sm font-semibold text-rose-700">统计数据加载失败</div>
          <div className="mt-0.5 text-xs text-rose-600">图表或列表可能不完整，请重试同步。</div>
          <button
            className="mt-2 h-9 rounded-lg border border-rose-200 bg-white px-3 text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-colors"
            onClick={() => {
              void refetchHabits();
              void refetchYear();
              void refetchRolling();
              void refetchYearCounts();
            }}
          >
            重新同步
          </button>
        </motion.div>
      )}

      {/* Stat Cards */}
      <motion.div variants={sectionReveal} className="grid grid-cols-2 gap-3">
        <StatCard
          label="当前连续"
          value={`${streak} 天`}
          icon={Flame}
          iconColor="#f97316"
          loading={isLoading}
          primary
        />
        <StatCard
          label="本月打卡"
          value={thisMonthCount}
          sublabel="次"
          icon={Target}
          iconColor="#3b82f6"
          loading={isLoading}
        />
        <StatCard
          label="最长连续"
          value={`${longest} 天`}
          icon={Trophy}
          iconColor="#eab308"
          loading={isLoading}
        />
        <StatCard
          label="全年总计"
          value={
            (allCheckIns ?? []).filter(
              (ci) => formatDate(ci.checked_at) >= yearStart,
            ).length
          }
          sublabel="次"
          icon={BarChart2}
          iconColor="#22c55e"
          loading={isLoading}
        />
      </motion.div>

      {/* Tabs */}
      <motion.div variants={sectionReveal} className="glass-card rounded-[var(--radius-card-lg)] p-5">
        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            const newIdx = tabOrder.indexOf(v as TabValue);
            setSlideDir(newIdx > prevTabIdx.current ? "right" : "left");
            prevTabIdx.current = newIdx;
            setActiveTab(v as TabValue);
            sessionStorage.setItem("stats-tab", v);
          }}
        >
          <TabsList className="w-full mb-5" aria-label="统计维度">
            <TabsTrigger value="day" className="flex-1">
              今日
            </TabsTrigger>
            <TabsTrigger value="week" className="flex-1">
              本周
            </TabsTrigger>
            <TabsTrigger value="month" className="flex-1">
              近30天
            </TabsTrigger>
            <TabsTrigger value="year" className="flex-1">
              全年
            </TabsTrigger>
          </TabsList>

          {/* Day view */}
          <TabsContent
            value="day"
            className={
              slideDir === "right"
                ? "animate-slide-in-right"
                : "animate-slide-in-left"
            }
          >
            <div className="text-sm font-semibold text-stone-500 mb-3">
              今日打卡 {todayTimeline.length} 次
            </div>
            {todayTimeline.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-stone-400 gap-3">
                <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center">
                  <span className="text-2xl">📭</span>
                </div>
                <span className="text-sm font-medium">今天还没有打卡记录</span>
              </div>
            ) : (
              <div className="space-y-2.5">
                {todayTimeline.map((ci) => {
                  const h = habitsMap[ci.habit_id];
                  return (
                    <div key={ci.id} className="flex items-start gap-3 py-2">
                      <div className="w-1 h-full self-stretch bg-stone-100 rounded-full mt-1 shrink-0" />
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
                        style={{ backgroundColor: (h?.color ?? "#ccc") + "20" }}
                      >
                        {h?.icon ?? "📌"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-stone-800 text-sm">
                          {h?.name ?? "未知项目"}
                          {formatDate(ci.checked_at) !==
                            formatDate(ci.created_at) && (
                            <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 font-medium align-middle">
                              补
                            </span>
                          )}
                        </div>
                        {ci.note && (
                          <div className="text-xs text-stone-500 mt-0.5 font-medium">
                            {ci.note}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-stone-400 font-medium shrink-0">
                        {new Date(ci.checked_at).toLocaleTimeString("zh-CN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Week view */}
          <TabsContent
            value="week"
            className={
              slideDir === "right"
                ? "animate-slide-in-right"
                : "animate-slide-in-left"
            }
          >
            <div className="text-sm font-semibold text-stone-500 mb-3">
              本周打卡趋势
            </div>
            {isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <SimpleBarChart
                data={weekData}
                height={160}
                highlightToday
                activeDate={selectedDate}
                onBarClick={(date) => {
                  setSelectedDate(date);
                  setIsDayDetailOpen(true);
                }}
              />
            )}
            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-xs text-stone-500 font-medium">
                按日期查看项目
              </span>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-8 rounded-lg border border-stone-200 bg-white px-2.5 text-xs font-medium text-stone-700"
              >
                {dateOptions.map((d) => (
                  <option key={d} value={d}>
                    {formatDateOption(d)}
                  </option>
                ))}
              </select>
              <button
                className="h-8 rounded-lg border border-stone-200 px-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                onClick={() => setIsDayDetailOpen(true)}
              >
                查看
              </button>
            </div>
          </TabsContent>

          {/* Month view */}
          <TabsContent
            value="month"
            className={
              slideDir === "right"
                ? "animate-slide-in-right"
                : "animate-slide-in-left"
            }
          >
            <div className="text-sm font-semibold text-stone-500 mb-3">
              近30天 · 各项目堆叠
            </div>
            {isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <StackedBarChart
                data={monthData}
                habits={
                  habits?.map((h) => ({
                    id: h.id,
                    name: h.name,
                    color: h.color,
                  })) ?? []
                }
                height={180}
                activeDate={selectedDate}
                onBarClick={(date) => {
                  setSelectedDate(date);
                  setIsDayDetailOpen(true);
                }}
              />
            )}
            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-xs text-stone-500 font-medium">
                按日期查看项目
              </span>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-8 rounded-lg border border-stone-200 bg-white px-2.5 text-xs font-medium text-stone-700"
              >
                {dateOptions.map((d) => (
                  <option key={d} value={d}>
                    {formatDateOption(d)}
                  </option>
                ))}
              </select>
              <button
                className="h-8 rounded-lg border border-stone-200 px-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                onClick={() => setIsDayDetailOpen(true)}
              >
                查看
              </button>
            </div>
          </TabsContent>

          {/* Year view */}
          <TabsContent
            value="year"
            className={
              slideDir === "right"
                ? "animate-slide-in-right"
                : "animate-slide-in-left"
            }
          >
            <div className="text-sm font-semibold text-stone-500 mb-3">
              {selectedYear} 年全年打卡热力图
            </div>
            {isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <Suspense fallback={<Skeleton className="h-40 w-full" />}>
                <HabitHeatmap
                  data={heatmapData}
                  from={`${selectedYear}-01-01`}
                  to={`${selectedYear}-12-31`}
                />
              </Suspense>
            )}
            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-xs text-stone-500 font-medium">
                按日期查看项目
              </span>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-8 rounded-lg border border-stone-200 bg-white px-2.5 text-xs font-medium text-stone-700"
              >
                {dateOptions.map((d) => (
                  <option key={d} value={d}>
                    {formatDateOption(d)}
                  </option>
                ))}
              </select>
              <button
                className="h-8 rounded-lg border border-stone-200 px-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                onClick={() => setIsDayDetailOpen(true)}
              >
                查看
              </button>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      <CheckInDayDetailDialog
        open={isDayDetailOpen}
        onOpenChange={setIsDayDetailOpen}
        dateLabel={formatDateOption(selectedDate)}
        checkIns={selectedDateCheckIns}
        habitsMap={habitsMap}
      />

      {/* Per-habit links */}
      {habits && habits.length > 0 && (
        <motion.div variants={sectionReveal} className="glass-card rounded-[var(--radius-card-lg)] overflow-hidden">
          <div className="px-5 py-4 border-b luxury-divider flex items-center justify-between gap-3">
            <span className="font-bold text-[var(--color-ink-900)] text-sm shrink-0">
              各项目详情
            </span>
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
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-600 hover:bg-white transition-colors"
                    onClick={() => setHabitSearch("")}
                    aria-label="清除搜索"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="divide-y divide-[var(--color-line-soft)]">
            {habits
              .filter((h) =>
                h.name.toLowerCase().includes(habitSearch.toLowerCase()),
              )
              .map((h) => {
                const habitDates = checkInsByHabit.get(h.id) ?? [];
                const cnt = habitDates.filter((d) => d >= yearStart).length;
                const habitStreak = computeStreak(habitDates);
                return (
                  <Link
                    key={h.id}
                    to="/stats/$habitId"
                    params={{ habitId: h.id }}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/65 transition-colors"
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                      style={{ backgroundColor: h.color + "18" }}
                    >
                      {h.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[var(--color-ink-900)] text-sm truncate">
                        {h.name}
                      </div>
                      <div className="text-xs text-[var(--color-ink-500)] font-medium mt-0.5">
                        全年 {cnt} 次 · 连续 {habitStreak} 天
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-300 shrink-0" />
                  </Link>
                );
              })}
            {habitSearch &&
              habits.filter((h) =>
                h.name.toLowerCase().includes(habitSearch.toLowerCase()),
              ).length === 0 && (
                <div className="flex flex-col items-center py-8 text-stone-400 gap-2">
                  <Search
                    className="w-8 h-8 text-stone-200"
                    strokeWidth={1.5}
                  />
                  <span className="text-sm font-medium">
                    没有找到「{habitSearch}」
                  </span>
                </div>
              )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

export const Route = createFileRoute("/stats/")({
  component: StatsPage,
  beforeLoad: ({ context }) => {
    if (context.auth.loading) return;
    if (!context.auth.user) throw redirect({ to: "/login" });
  },
});
