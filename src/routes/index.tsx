import { getCurrentAuth } from '@/hooks/useAuth'
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  CalendarDays,
  TrendingUp,
  LayoutGrid,
  List,
  CalendarClock,
  ListCheck,
  ChevronDown,
  ArrowUpRight,
  Plus,
  Search,
  X,
} from "lucide-react";
import { Check } from "lucide-react";
import { useHabits } from '@/hooks/useHabits';
import { useCombos } from '@/hooks/useCombos';
import { useTodayCheckIns, useCheckIns, useCheckInCombo, useDeleteCheckIn, useStreakCheckIns } from '@/hooks/useCheckIns';
import { toast } from '@/hooks/useToast';
import { HabitCard } from "@/components/habits/HabitCard";
import { CheckInDayDetailDialog } from "@/components/habits/CheckInDayDetailDialog";
import { SimpleBarChart } from "@/components/charts/BarCharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BackdateSheet } from "@/components/habits/BackdateSheet";
import { cn, formatDate, getLast7Days, computeStreak } from "@/lib/utils";
import { sectionReveal, pageChoreography } from "@/lib/motion";
import { HabitIcon } from '@/lib/habitIcons'

function Dashboard() {
  const navigate = useNavigate();
  const [compact, setCompact] = useState(
    () => localStorage.getItem("dashboard-compact") === "true",
  );
  const [backdateOpen, setBackdateOpen] = useState(false);
  const [dayDetailOpen, setDayDetailOpen] = useState(false);
  const [completedCollapsed, setCompletedCollapsed] = useState(false);
  const [query, setQuery] = useState("");
  const [onlyPending, setOnlyPending] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [recentCompletion, setRecentCompletion] = useState<{ id: string; previousCount: number } | null>(null);

  const { data: habits, isLoading: habitsLoading, isFetching: habitsFetching, error: habitsError, refetch: refetchHabits } = useHabits();
  const { data: combos, isLoading: combosLoading } = useCombos();
  const checkInCombo = useCheckInCombo();
  const deleteCheckIn = useDeleteCheckIn();
  const {
    data: todayCheckIns,
    isLoading: todayLoading,
    isFetching: todayFetching,
    error: todayError,
    refetch: refetchToday,
  } = useTodayCheckIns();

  const last7 = useMemo(() => getLast7Days(), []);
  const {
    data: recentCheckIns,
    isFetching: recentFetching,
    error: recentError,
    refetch: refetchRecent,
  } = useCheckIns({
    startDate: last7[0],
    endDate: last7[last7.length - 1],
  });

  const {
    data: streakCheckIns,
    isFetching: streakFetching,
    error: streakError,
    refetch: refetchStreak,
  } = useStreakCheckIns();

  const [selectedDate, setSelectedDate] = useState(() =>
    formatDate(new Date()),
  );

  // Today's counts per habit
  const todayCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const ci of todayCheckIns ?? []) {
      map[ci.habit_id] = (map[ci.habit_id] ?? 0) + 1;
    }
    return map;
  }, [todayCheckIns]);

  useEffect(() => {
    if (!recentCompletion || (todayCountMap[recentCompletion.id] ?? 0) <= recentCompletion.previousCount) return;
    const frame = requestAnimationFrame(() => {
      // A filtered or collapsed row has intentionally left the DOM.
      // Hand focus to the next action only if focus has fallen back to body.
      if ((onlyPending || completedCollapsed) && document.activeElement === document.body) {
        const next = document.querySelector<HTMLElement>(".dashboard-page .habit-row:not(.habit-row-done) .habit-check-button")
          ?? document.querySelector<HTMLElement>(".dashboard-page .completed-toggle")
          ?? document.querySelector<HTMLElement>(".dashboard-page .dashboard-filter");
        next?.focus({ preventScroll: true });
      }
      setRecentCompletion(null);
    });
    return () => cancelAnimationFrame(frame);
  }, [recentCompletion, todayCountMap, onlyPending, completedCollapsed]);

  // Latest check-in id per habit (for undo) — todayCheckIns is ordered desc by checked_at
  const latestCheckInMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const ci of todayCheckIns ?? []) {
      if (!map[ci.habit_id]) map[ci.habit_id] = ci.id;
    }
    return map;
  }, [todayCheckIns]);

  // Streak per habit
  const streakMap = useMemo(() => {
    const map: Record<string, number> = {};
    if (!streakCheckIns || !habits) return map;
    const byHabit: Record<string, string[]> = {};
    for (const ci of streakCheckIns) {
      if (!byHabit[ci.habit_id]) byHabit[ci.habit_id] = [];
      byHabit[ci.habit_id].push(formatDate(ci.checked_at));
    }
    for (const h of habits) {
      map[h.id] = computeStreak(byHabit[h.id] ?? []);
    }
    return map;
  }, [streakCheckIns, habits]);

  // Combos status — ignore habit ids that no longer resolve to an active habit
  const renderedCombos = useMemo(() => {
    if (!combos || !habits) return [];
    const activeIds = new Set(habits.map((h) => h.id));
    return combos
      .map((combo) => {
        const validIds = combo.habit_ids.filter((id) => activeIds.has(id));
        const missingCount = combo.habit_ids.length - validIds.length;
        const isDone =
          validIds.length > 0 && validIds.every((id) => (todayCountMap[id] ?? 0) > 0);
        return { ...combo, validIds, missingCount, isDone };
      })
      .sort((a, b) => (a.isDone === b.isDone ? 0 : a.isDone ? 1 : -1));
  }, [combos, habits, todayCountMap]);

  const handleComboCheckIn = async (combo: (typeof renderedCombos)[number]) => {
    if (checkInCombo.isPending || combo.validIds.length === 0) return;
    try {
      const result = await checkInCombo.mutateAsync({ habitIds: combo.validIds });
      if (result && result.length > 0) {
        toast.success(`已打卡组合「${combo.name}」`, {
          action: {
            label: '撤销',
            onClick: async () => {
              try {
                await deleteCheckIn.mutateAsync(result.map((r) => r.id));
                toast.success('已撤销组合打卡');
              } catch {
                // error handled in useDeleteCheckIn
              }
            },
          },
        });
      }
    } catch {
      toast.error('组合打卡失败，请重试')
    }
  };

  // Apply search + pending filter, then sort: incomplete first, completed at bottom
  const normalizedQuery = query.trim().toLowerCase();
  const isFiltering = normalizedQuery.length > 0 || onlyPending;
  const sortedHabits = useMemo(() => {
    if (!habits) return [];
    const filtered = habits.filter((h) => {
      const isDone = (todayCountMap[h.id] ?? 0) > 0;
      if (onlyPending && isDone) return false;
      if (normalizedQuery && !h.name.toLowerCase().includes(normalizedQuery)) return false;
      return true;
    });
    return filtered.sort((a, b) => {
      const aDone = (todayCountMap[a.id] ?? 0) > 0 ? 1 : 0;
      const bDone = (todayCountMap[b.id] ?? 0) > 0 ? 1 : 0;
      return aDone - bDone;
    });
  }, [habits, todayCountMap, normalizedQuery, onlyPending]);

  // Last 7 days bar chart data
  const weekData = useMemo(() => {
    const countByDate: Record<string, number> = {};
    for (const ci of recentCheckIns ?? []) {
      const d = formatDate(ci.checked_at);
      countByDate[d] = (countByDate[d] ?? 0) + 1;
    }
    const days = ["日", "一", "二", "三", "四", "五", "六"];
    return last7.map((d) => ({
      label: days[new Date(d).getDay()],
      count: countByDate[d] ?? 0,
      date: d,
      clickTarget: 1,
    }));
  }, [recentCheckIns, last7]);

  const habitsMap = useMemo(() => {
    const map: Record<string, { name: string; color: string; icon: string }> =
      {};
    for (const h of habits ?? []) {
      map[h.id] = { name: h.name, color: h.color, icon: h.icon };
    }
    return map;
  }, [habits]);

  const selectedDateCheckIns = useMemo(() => {
    const list = (recentCheckIns ?? []).filter(
      (ci) => formatDate(ci.checked_at) === selectedDate,
    );
    return list.sort((a, b) => a.checked_at.localeCompare(b.checked_at));
  }, [recentCheckIns, selectedDate]);

  const today = new Date();
  const todayStr = today.toLocaleDateString("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "long",
  });
  const doneCount = (habits ?? []).filter((habit) => (todayCountMap[habit.id] ?? 0) > 0).length;
  const totalCount = habits?.length ?? 0;

  const isLoading = habitsLoading || todayLoading || combosLoading;
  const isRefreshing = !isLoading && (habitsFetching || todayFetching || recentFetching || streakFetching);
  const hasLoadError = Boolean(habitsError || todayError || recentError || streakError);

  const pendingHabits = sortedHabits.filter((habit) => !(todayCountMap[habit.id] > 0));
  const completedHabits = sortedHabits.filter((habit) => todayCountMap[habit.id] > 0);
  const remaining = Math.max(0, totalCount - doneCount);
  const todayUnavailable = Boolean(habitsError || todayError);
  const allDone = totalCount > 0 && remaining === 0 && !todayUnavailable;
  const progress = totalCount ? doneCount / totalCount : 0;
  const gridClass = compact ? "habit-grid-compact" : "space-y-2.5";
  const summaryText = todayUnavailable ? "今日数据待同步"
    : totalCount === 0 ? "从一个小习惯开始"
      : allDone ? "今天的清单，完成了。" : `还有 ${remaining} 项，按自己的节奏来。`;

  const renderHabit = (habit: NonNullable<typeof habits>[number]) => (
    <HabitCard
      key={habit.id}
      habit={habit}
      todayCount={todayCountMap[habit.id] ?? 0}
      streak={streakMap[habit.id] ?? 0}
      compact={compact}
      latestCheckInId={latestCheckInMap[habit.id]}
      onCheckInSuccess={(id, previousCount) => {
        setAnnouncement(`${habit.name}已打卡，今日第 ${previousCount + 1} 次。`);
        setRecentCompletion({ id, previousCount });
      }}
    />
  );

  const retryAll = () => {
    void refetchHabits();
    void refetchToday();
    void refetchRecent();
    void refetchStreak();
  };

  return (
    <motion.div className="app-page dashboard-page space-y-7" variants={pageChoreography} initial="initial" animate="animate">
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</p>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="page-kicker mb-2"><CalendarDays className="h-3.5 w-3.5" />{todayStr}</div>
          <h1 className="headline-premium text-[2rem] sm:text-[2.5rem]">今日打卡</h1>
        </div>
        {totalCount > 0 && !isLoading && (
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setBackdateOpen(true)} className="dashboard-tool" aria-label="补卡">
              <CalendarClock className="h-4 w-4" /><span>补卡</span>
            </button>
            <button
              type="button"
              onClick={() => setCompact((value) => {
                const next = !value;
                localStorage.setItem("dashboard-compact", String(next));
                return next;
              })}
              className="dashboard-tool"
              aria-label="紧凑视图"
              title={compact ? "切换到列表视图" : "切换到紧凑视图"}
              aria-pressed={compact}
            >
              {compact ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
              <span>{compact ? "列表" : "紧凑"}</span>
            </button>
          </div>
        )}
      </header>

      <motion.section variants={sectionReveal} className={cn("daily-summary", allDone && "daily-summary-complete")} aria-label="今日摘要">
        <div>
          <div className="dashboard-eyebrow">今日进度</div>
          {isLoading ? <Skeleton className="mt-3 h-12 w-40" /> : (
            <div className="mt-2 flex items-baseline gap-2">
              <span className="daily-summary-number">{todayUnavailable ? "—" : doneCount}</span>
              <span className="text-lg text-[var(--color-ink-600)] tabular-nums">/ {totalCount}</span>
              <span className="ml-1 text-sm text-[var(--color-ink-600)]">项已完成</span>
            </div>
          )}
        </div>
        <div className="daily-summary-detail">
          <p className="text-[15px] font-semibold text-[var(--color-ink-800)]" aria-live="polite">
            {isLoading ? "正在准备今天的清单…" : summaryText}
          </p>
          <div className="daily-progress-track" role="progressbar" aria-label="今日完成进度" aria-valuenow={isLoading || todayUnavailable ? undefined : doneCount} aria-valuemin={0} aria-valuemax={totalCount || 1} aria-valuetext={isLoading || todayUnavailable ? "等待同步" : `${doneCount} / ${totalCount} 项已完成`}>
            <motion.div className="daily-progress-fill" initial={false} animate={{ scaleX: isLoading || todayUnavailable ? 0 : progress }} transition={{ duration: 0.3 }} />
          </div>
          <p className="mt-2 text-xs text-[var(--color-ink-600)]">{allDone ? "完成之后，也给自己留一点休息时间。" : "每完成一项，都算向前。"}</p>
        </div>
      </motion.section>

      {isRefreshing && <div role="status" className="flex items-center gap-2 text-xs text-[var(--color-ink-600)]"><span className="h-1.5 w-1.5 rounded-full bg-brand-500" />正在同步今日与趋势数据…</div>}
      {hasLoadError && (
        <div role="alert" className="dashboard-error">
          <div><p className="font-semibold">部分数据暂时未能同步</p><p className="mt-1 text-xs">请重新同步后确认今日进度与连续记录。</p></div>
          <Button variant="outline" size="sm" onClick={retryAll}>重新同步</Button>
        </div>
      )}

      <div className="dashboard-layout">
        <section className="min-w-0 space-y-5" aria-labelledby="habit-list-title">
          <div className="flex items-center justify-between gap-3">
            <h2 id="habit-list-title" className="dashboard-section-title">今日清单 <span className="dashboard-count">{totalCount}</span></h2>
            {totalCount > 0 && <button type="button" onClick={() => void navigate({ to: "/habits" })} className="dashboard-text-link">管理项目<ArrowUpRight className="h-3.5 w-3.5" /></button>}
          </div>

          {!isLoading && (totalCount > 5 || isFiltering) && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[140px] flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-600)]" />
                <Input placeholder="搜索习惯…" value={query} onChange={(event) => setQuery(event.target.value)} className="h-11 pl-10 pr-11" aria-label="搜索习惯" />
                {query && <button type="button" onClick={() => setQuery("")} aria-label="清除搜索" className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-xl text-[var(--color-ink-600)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"><X className="h-4 w-4" /></button>}
              </div>
              <button type="button" onClick={() => setOnlyPending((value) => !value)} aria-pressed={onlyPending} className={cn("dashboard-filter", onlyPending && "dashboard-filter-active")}>只看未打卡</button>
            </div>
          )}

          {isLoading ? (
            <div className={gridClass} aria-label="正在加载习惯">
              {Array.from({ length: compact ? 6 : 4 }, (_, index) => <Skeleton key={index} className={compact ? "h-40 rounded-2xl" : "h-24 rounded-2xl"} />)}
            </div>
          ) : todayUnavailable && sortedHabits.length === 0 ? (
            <div className="dashboard-empty"><ListCheck className="mb-4 h-8 w-8 text-[var(--color-ink-600)]" /><h3>今日清单暂时不可用</h3><p>检查网络后重新同步，即可继续打卡。</p><Button variant="outline" onClick={retryAll}>重新同步</Button></div>
          ) : sortedHabits.length === 0 ? (
            <div className="dashboard-empty">
              {isFiltering ? <Search className="mb-4 h-8 w-8 text-[var(--color-ink-600)]" /> : <ListCheck className="mb-4 h-8 w-8 text-brand-600" />}
              <h3>{isFiltering ? normalizedQuery ? `没有找到「${query.trim()}」` : "今天的项目都已打卡" : "让一个小习惯，成为日常"}</h3>
              <p>{isFiltering ? "清除筛选，看看全部习惯。" : "添加第一个项目，从今天开始记录。"}</p>
              {isFiltering ? <Button variant="outline" onClick={() => { setQuery(""); setOnlyPending(false); }}>清除筛选</Button> : <Button onClick={() => void navigate({ to: "/habits" })}><Plus className="h-4 w-4" />添加项目</Button>}
            </div>
          ) : (
            <>
              <div className={gridClass}>
                {[
                  ...pendingHabits.map(renderHabit),
                  ...(completedHabits.length > 0 ? [
                    <button
                      key="completed-heading"
                      type="button"
                      className="completed-toggle"
                      aria-expanded={normalizedQuery ? true : !completedCollapsed}
                      onClick={() => setCompletedCollapsed((value) => !value)}
                      disabled={Boolean(normalizedQuery)}
                    >
                      <span className="flex items-center gap-2"><Check className="h-4 w-4 text-[#4f7642]" />已完成<span className="dashboard-count">{completedHabits.length}</span></span>
                      <span className="flex items-center gap-1 text-xs text-[var(--color-ink-600)]">{normalizedQuery ? "搜索结果" : completedCollapsed ? "展开" : "收起"}<ChevronDown className={cn("h-4 w-4 transition-transform", (normalizedQuery || !completedCollapsed) && "rotate-180")} /></span>
                    </button>,
                    ...((normalizedQuery || !completedCollapsed) ? completedHabits.map(renderHabit) : []),
                  ] : []),
                ]}
              </div>
              <p className="px-1 text-xs leading-relaxed text-[var(--color-ink-600)]">点击右侧按钮打卡，更多选项中可添加备注或撤销记录。</p>
            </>
          )}
        </section>

        {totalCount > 0 && (
          <aside className="dashboard-aside space-y-5" aria-label="快捷组合与回顾">
            {!isLoading && !isFiltering && renderedCombos.length > 0 && (
              <section aria-labelledby="combo-title" className="content-panel p-5">
                <div className="mb-4 flex items-center justify-between"><h2 id="combo-title" className="dashboard-section-title text-sm">快捷组合</h2><span className="text-xs text-[var(--color-ink-600)]">一键完成多项</span></div>
                <div className="space-y-2">
                  {renderedCombos.map((combo) => (
                    <button
                      key={combo.id}
                      type="button"
                      disabled={checkInCombo.isPending || combo.validIds.length === 0}
                      aria-busy={checkInCombo.isPending}
                      onClick={() => void handleComboCheckIn(combo)}
                      className="combo-shortcut"
                      aria-label={combo.isDone ? `再次打卡组合：${combo.name}` : `打卡组合：${combo.name}`}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: combo.color + "12" }}><HabitIcon icon={combo.icon} className="h-5 w-5" color={combo.color} fallback="📌" /></span>
                      <span className="min-w-0 flex-1 text-left"><span className="block break-words text-sm font-semibold">{combo.name}</span><span className="mt-1 block text-xs text-[var(--color-ink-600)]">{checkInCombo.isPending ? "正在打卡…" : combo.isDone ? "已完成 · 可再记一次" : `包含 ${combo.validIds.length} 项`}{combo.missingCount > 0 && ` · ${combo.missingCount} 项已删除`}</span></span>
                      {combo.isDone ? <Check className="h-4 w-4 shrink-0 text-[#4f7642]" /> : <Plus className="h-4 w-4 shrink-0 text-brand-600" />}
                    </button>
                  ))}
                </div>
              </section>
            )}
            <section className="content-panel p-5" aria-labelledby="week-title">
              <div className="mb-2 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-brand-600" /><h2 id="week-title" className="dashboard-section-title text-sm">近七天</h2></div>
              <p className="mb-5 text-xs text-[var(--color-ink-600)]">每天的积累，都在这里。</p>
              {recentError ? <div className="py-5 text-sm text-[var(--color-ink-600)]"><p>趋势暂时无法加载</p><button type="button" className="dashboard-text-link mt-3" onClick={() => void refetchRecent()}>重新加载<ArrowUpRight className="h-3.5 w-3.5" /></button></div> : <SimpleBarChart data={weekData} color="#b95422" height={150} highlightToday showYAxis={false} activeDate={selectedDate} onBarClick={(date) => { setSelectedDate(date); setDayDetailOpen(true); }} />}
              <p className="mt-3 border-t border-[var(--color-line-soft)] pt-3 text-[11px] text-[var(--color-ink-600)]">点选柱形，查看当天的打卡记录</p>
            </section>
          </aside>
        )}
      </div>

      <CheckInDayDetailDialog open={dayDetailOpen} onOpenChange={setDayDetailOpen} dateLabel={selectedDate} checkIns={selectedDateCheckIns} habitsMap={habitsMap} />
      {habits && <BackdateSheet open={backdateOpen} onOpenChange={setBackdateOpen} habits={habits} />}
    </motion.div>
  );
}

export const Route = createFileRoute("/")({
  component: Dashboard,
  beforeLoad: async () => {
    const auth = await getCurrentAuth();
    if (!auth.user) throw redirect({ to: "/login" });
  },
});
