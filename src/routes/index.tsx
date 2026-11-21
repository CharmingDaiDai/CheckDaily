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
  Hand,
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
import { BackdateSheet } from "@/components/habits/BackdateSheet";
import { formatDate, getLast7Days, computeStreak } from "@/lib/utils";
import { sectionReveal, pageChoreography } from "@/lib/motion";
import { HabitIcon } from '@/lib/habitIcons'

function Dashboard() {
  const navigate = useNavigate();
  const [compact, setCompact] = useState(
    () => localStorage.getItem("dashboard-compact") === "true",
  );
  const [backdateOpen, setBackdateOpen] = useState(false);
  const [dayDetailOpen, setDayDetailOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [onlyPending, setOnlyPending] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 300);
    return () => clearTimeout(timer);
  }, []);

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
  const doneCount = Object.values(todayCountMap).filter((c) => c > 0).length;
  const totalCount = habits?.length ?? 0;

  const isLoading = habitsLoading || todayLoading || combosLoading;
  const isRefreshing = !isLoading && (habitsFetching || todayFetching || recentFetching || streakFetching);
  const hasLoadError = Boolean(habitsError || todayError || recentError || streakError);

  // Index where completed habits start (-1 = none done, 0 = all done) within the visible list
  const firstDoneIdx = sortedHabits.findIndex(
    (h) => (todayCountMap[h.id] ?? 0) > 0,
  );
  const visibleDoneCount = sortedHabits.filter(
    (h) => (todayCountMap[h.id] ?? 0) > 0,
  ).length;
  const hasMixed = firstDoneIdx > 0;

  const gridClass = compact
    ? "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2"
    : "grid grid-cols-2 sm:grid-cols-3 gap-2";

  return (
    <motion.div
      className="app-page space-y-6"
      variants={pageChoreography}
      initial="initial"
      animate="animate"
    >
      {/* Header */}
      <motion.div variants={sectionReveal}>
        <div className="page-kicker mb-1">
          <CalendarDays className="w-3.5 h-3.5" />
          {todayStr}
        </div>
        <div className="flex items-center justify-between">
          <h1 className="headline-premium text-[2.15rem] sm:text-[2.5rem] text-[var(--color-ink-950)]">
            今日打卡
          </h1>
          {totalCount > 0 && !isLoading && (
            <div className="page-actions">
              <button
                onClick={() => setBackdateOpen(true)}
                className="icon-action"
                aria-label="补卡"
              >
                <CalendarClock className="w-4 h-4" strokeWidth={2} />
                <span className="text-xs font-medium">补卡</span>
              </button>
              <button
                onClick={() =>
                  setCompact((v) => {
                    const next = !v;
                    localStorage.setItem("dashboard-compact", String(next));
                    return next;
                  })
                }
                className="icon-action"
                aria-label={compact ? "切换到卡片视图" : "切换到紧凑视图"}
              >
                {compact ? (
                  <LayoutGrid className="w-4 h-4" strokeWidth={2} />
                ) : (
                  <List className="w-4 h-4" strokeWidth={2} />
                )}
                <span className="text-xs font-medium">
                  {compact ? "卡片" : "紧凑"}
                </span>
              </button>
            </div>
          )}
        </div>
        <div className="mt-3 flex items-center gap-3">
          {!isLoading && (
            <>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-brand-500" />
                <span className="text-sm font-semibold text-[var(--color-ink-700)]">
                  已完成 {doneCount} / {totalCount} 项
                </span>
              </div>
              {totalCount > 0 && (
                <div
                  className="h-2.5 flex-1 bg-white/60 rounded-full overflow-hidden border border-white/65 shadow-[inset_0_1px_2px_rgb(61_52_41/0.08)]"
                  role="progressbar"
                  aria-valuenow={doneCount}
                  aria-valuemin={0}
                  aria-valuemax={totalCount}
                  aria-label={`今日进度：${doneCount}/${totalCount} 项已完成`}
                >
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${doneCount === totalCount ? "bg-gradient-to-r from-brand-400 via-brand-500 to-[#5d894e] animate-shimmer" : "bg-gradient-to-r from-brand-400 to-brand-500"}`}
                    style={{
                      width: mounted
                        ? `${(doneCount / totalCount) * 100}%`
                        : "0%",
                    }}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>

      {isRefreshing && (
        <motion.div
          variants={sectionReveal}
          className="floating-chrome rounded-[var(--radius-control)] px-3.5 py-2 text-xs font-semibold text-brand-700"
        >
          正在同步今日与趋势数据…
        </motion.div>
      )}

      {hasLoadError && (
        <motion.div
          variants={sectionReveal}
          className="surface-frame px-4 py-3"
        >
          <div className="text-sm font-semibold text-[var(--color-ink-900)]">首页数据加载失败</div>
          <div className="mt-0.5 text-xs text-[var(--color-ink-600)]">部分卡片可能展示不完整，请重新同步。</div>
          <button
            className="mt-3 inline-flex h-9 items-center rounded-[var(--radius-control)] border border-brand-200 bg-white/78 px-3 text-xs font-semibold text-brand-700 transition-colors hover:bg-white"
            onClick={() => {
              void refetchHabits();
              void refetchToday();
              void refetchRecent();
              void refetchStreak();
            }}
          >
            重新同步
          </button>
        </motion.div>
      )}

      {/* Filter row — only worth showing once there are enough habits to lose track of */}
      {!isLoading && totalCount > 5 && (
        <motion.div variants={sectionReveal} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-ink-500)]" />
            <Input
              placeholder="搜索习惯…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 pr-10 h-11"
              aria-label="搜索习惯"
            />
            {query && (
              <button
                className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-[var(--radius-control)] flex items-center justify-center text-[var(--color-ink-500)] hover:text-[var(--color-ink-700)] hover:bg-white/70 transition-colors"
                onClick={() => setQuery("")}
                aria-label="清除搜索"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setOnlyPending((v) => !v)}
            aria-pressed={onlyPending}
            className={
              onlyPending
                ? "h-11 shrink-0 rounded-[var(--radius-control)] border border-brand-300 bg-brand-50 px-3.5 text-xs font-semibold text-brand-700 transition-colors"
                : "h-11 shrink-0 rounded-[var(--radius-control)] border border-[var(--color-line-soft)] bg-white/70 px-3.5 text-xs font-semibold text-[var(--color-ink-500)] hover:text-[var(--color-ink-700)] transition-colors"
            }
          >
            只看未打卡
          </button>
        </motion.div>
      )}

      {/* All Done celebration banner */}
      {!isLoading && doneCount === totalCount && totalCount > 0 && (
        <motion.div variants={sectionReveal} className="relative overflow-hidden glass-card rounded-[var(--radius-card-lg)] px-5 py-4">
          {/* Confetti particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 12 }).map((_, i) => (
              <span
                key={i}
                className="absolute w-2 h-2 rounded-sm animate-confetti"
                style={{
                  backgroundColor: [
                    "#f97316",
                    "#fb923c",
                    "#fbbf24",
                    "#fdba74",
                    "#ea6c0c",
                    "#fed7aa",
                  ][i % 6],
                  left: `${8 + i * 7.5}%`,
                  top: `-8px`,
                  animationDelay: `${i * 80}ms`,
                  animationDuration: `${1000 + (i % 3) * 200}ms`,
                }}
              />
            ))}
          </div>
          <div className="font-semibold text-[var(--color-ink-900)]">
            今日已全部完成
          </div>
          <div className="text-sm text-[var(--color-ink-600)] mt-0.5">
            继续保持，养成好习惯
          </div>
        </motion.div>
      )}

      <CheckInDayDetailDialog
        open={dayDetailOpen}
        onOpenChange={setDayDetailOpen}
        dateLabel={selectedDate}
        checkIns={selectedDateCheckIns}
        habitsMap={habitsMap}
      />

      {/* Combos grid */}
      {!isLoading && !isFiltering && renderedCombos.length > 0 && (
        <motion.div variants={sectionReveal} className="space-y-3 mb-8">
          <div className="text-sm font-bold text-[var(--color-ink-600)] px-1 pb-1">运动组合</div>
          <div className={gridClass}>
            {renderedCombos.map(combo => (
              <button
                key={combo.id}
                disabled={checkInCombo.isPending || combo.validIds.length === 0}
                onClick={() => handleComboCheckIn(combo)}
                className={`group relative flex items-center gap-2.5 px-3 py-2.5 rounded-[var(--radius-card-lg)] glass-tile tap-scale text-left select-none overflow-hidden ${
                  combo.isDone ? 'glass-tile-done' : ''
                }`}
              >
                {/* Left color accent bar */}
                <div
                  className={`absolute top-0 left-0 w-1 h-full rounded-l-2xl transition-colors duration-300 ${combo.isDone ? 'opacity-100' : 'opacity-60'}`}
                  style={{ backgroundColor: combo.isDone ? combo.color : '#e7e5e4' }}
                />

                <div className="relative shrink-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] transition-all ${combo.isDone ? 'grayscale-[30%]' : ''}`}
                    style={{ background: `linear-gradient(135deg, ${combo.color}14, ${combo.color}22)` }}
                  >
                    <HabitIcon icon={combo.icon} className="w-[18px] h-[18px]" color={combo.color} fallback="🚀" />
                  </div>
                  {combo.isDone && (
                    <div
                      className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white"
                      style={{ backgroundColor: combo.color }}
                    >
                      <Check className="w-2.5 h-2.5 text-white" strokeWidth={3.5} />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 pr-1">
                  <div className={`font-bold text-[13px] leading-snug line-clamp-1 ${combo.isDone ? 'text-[var(--color-ink-500)]' : 'text-[var(--color-ink-900)]'}`}>
                    {combo.name}
                  </div>
                  <div className={`mt-0.5 flex flex-wrap items-center gap-1.5`}>
                    {combo.isDone ? (
                      <span
                        className="inline-flex items-center gap-0.5 text-[11px] font-semibold"
                        style={{ color: combo.color }}
                      >
                        <Check className="w-3 h-3" strokeWidth={2.5} />
                        全项已完成
                      </span>
                    ) : (
                      <span className="text-[11px] text-[var(--color-ink-500)] font-medium">
                        包含 {combo.validIds.length} 项
                        {combo.missingCount > 0 && (
                          <span className="text-amber-600"> · {combo.missingCount} 项已删除</span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Habit grid */}
      {hasLoadError && !isLoading && sortedHabits.length === 0 ? (
        <motion.div variants={sectionReveal} className="flex flex-col items-center justify-center py-16 text-center">
          <div className="font-bold text-rose-700 text-lg mb-1">今日数据暂时不可用</div>
          <div className="text-rose-500/80 text-sm mb-5">请检查网络后重试同步</div>
          <button
            className="px-5 py-2.5 bg-rose-600 text-white rounded-xl font-semibold text-sm hover:bg-rose-700 transition-colors tap-scale"
            onClick={() => {
              void refetchHabits();
              void refetchToday();
              void refetchRecent();
              void refetchStreak();
            }}
          >
            重新同步
          </button>
        </motion.div>
      ) : isLoading ? (
        <motion.div variants={sectionReveal} className="space-y-3">
          <div className="text-xs text-[var(--color-ink-500)] font-medium">加载今日打卡内容…</div>
          <div className={gridClass}>
            {Array.from({ length: compact ? 8 : 6 }).map((_, i) => (
              <Skeleton
                key={i}
                className={compact ? "h-24 rounded-[var(--radius-card-lg)]" : "h-14 rounded-[var(--radius-card-lg)]"}
              />
            ))}
          </div>
        </motion.div>
      ) : sortedHabits.length > 0 ? (
        <motion.div variants={sectionReveal} className="space-y-3">
          {/* Incomplete habits */}
          {firstDoneIdx !== 0 && (
            <div className={gridClass}>
              {sortedHabits
                .slice(0, firstDoneIdx === -1 ? undefined : firstDoneIdx)
                .map((habit, i) => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    todayCount={todayCountMap[habit.id] ?? 0}
                    streak={streakMap[habit.id] ?? 0}
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
              <div className="h-px flex-1 bg-[var(--color-line-soft)]" />
              <span className="text-xs text-[var(--color-ink-500)] font-semibold px-1">
                已完成 {visibleDoneCount} 项
              </span>
              <div className="h-px flex-1 bg-[var(--color-line-soft)]" />
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
                  streak={streakMap[habit.id] ?? 0}
                  compact={compact}
                  latestCheckInId={latestCheckInMap[habit.id]}
                  style={{ animationDelay: `${i * 40}ms` }}
                />
              ))}
            </div>
          )}
        </motion.div>
      ) : isFiltering ? (
        <motion.div variants={sectionReveal} className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-white/72 border border-white/72 shadow-[0_12px_28px_rgb(61_52_41/0.08)] flex items-center justify-center mb-4">
            <Search className="w-7 h-7 text-[var(--color-ink-500)]" strokeWidth={1.5} />
          </div>
          <div className="font-semibold text-[var(--color-ink-900)] text-base mb-1">
            {normalizedQuery ? `没有找到「${query.trim()}」` : "今天的项目都已打卡"}
          </div>
          <div className="text-[var(--color-ink-500)] text-sm mb-5">
            {normalizedQuery ? "换个关键词试试，或清除筛选" : "可以切回全部项目看看"}
          </div>
          <button
            className="px-4 py-2 rounded-[var(--radius-control)] border border-[var(--color-line-soft)] bg-white/80 text-brand-700 font-semibold text-sm hover:bg-white transition-colors tap-scale"
            onClick={() => {
              setQuery("");
              setOnlyPending(false);
            }}
          >
            清除筛选
          </button>
        </motion.div>
      ) : (
        <motion.div variants={sectionReveal} className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-white/72 border border-white/72 shadow-[0_12px_28px_rgb(61_52_41/0.08)] flex items-center justify-center mb-4">
            <ListCheck className="w-9 h-9 text-[var(--color-ink-500)]" strokeWidth={1.5} />
          </div>
          <div className="font-semibold text-[var(--color-ink-900)] text-lg mb-1">
            还没有打卡项目
          </div>
          <div className="text-[var(--color-ink-500)] text-sm mb-5">
            去添加你的第一个习惯吧
          </div>
          <button
            className="px-5 py-2.5 bg-[linear-gradient(155deg,#e98c4c_0%,#d86f2f_48%,#a94b22_100%)] text-white rounded-[var(--radius-control)] font-semibold text-sm shadow-[0_10px_24px_rgb(185_84_34/0.22)] hover:brightness-[1.02] transition-colors tap-scale"
            onClick={() => void navigate({ to: "/habits" })}
          >
            添加项目
          </button>
        </motion.div>
      )}

      {/* Onboarding hint */}
      {!isLoading && sortedHabits.length > 0 && doneCount === 0 && (
        <div className="flex items-center justify-center gap-1.5 py-1 text-[var(--color-ink-500)]/80">
          <Hand className="w-3.5 h-3.5" strokeWidth={1.8} />
          <span className="text-xs font-medium">轻触卡片即可完成今日打卡</span>
        </div>
      )}

      {/* Last 7 days mini chart */}
      {totalCount > 0 && (
        <motion.div variants={sectionReveal} className="surface-frame rounded-[var(--radius-card-lg)] p-5">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b luxury-divider">
            <TrendingUp className="w-4 h-4 text-brand-500" strokeWidth={2.5} />
            <span className="font-semibold text-[var(--color-ink-900)] text-sm">
              近7天打卡
            </span>
          </div>
          <SimpleBarChart
            data={weekData}
            height={130}
            highlightToday
            showYAxis={false}
            activeDate={selectedDate}
            onBarClick={(date) => {
              setSelectedDate(date);
              setDayDetailOpen(true);
            }}
          />
        </motion.div>
      )}

      {/* Backdate sheet */}
      {habits && (
        <BackdateSheet
          open={backdateOpen}
          onOpenChange={setBackdateOpen}
          habits={habits}
        />
      )}
    </motion.div>
  );
}

export const Route = createFileRoute("/")({
  component: Dashboard,
  beforeLoad: ({ context }) => {
    if (context.auth.loading) return;
    if (!context.auth.user) throw redirect({ to: "/login" });
  },
});
