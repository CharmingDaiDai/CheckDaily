import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  CalendarDays,
  TrendingUp,
  LayoutGrid,
  List,
  CalendarClock,
} from "lucide-react";
import { Check } from "lucide-react";
import { useHabits } from '@/hooks/useHabits';
import { useCombos } from '@/hooks/useCombos';
import { useTodayCheckIns, useCheckIns, useCheckInCombo, useDeleteCheckIn } from '@/hooks/useCheckIns';
import { toast } from '@/hooks/useToast';
import { HabitCard } from "@/components/habits/HabitCard";
import { CheckInDayDetailDialog } from "@/components/habits/CheckInDayDetailDialog";
import { SimpleBarChart } from "@/components/charts/BarCharts";
import { Skeleton } from "@/components/ui/skeleton";
import { BackdateSheet } from "@/components/habits/BackdateSheet";
import { formatDate, getLast7Days, computeStreak } from "@/lib/utils";
import { sectionReveal } from "@/lib/motion";
import { HabitIcon } from '@/lib/habitIcons'
import type { HabitCombo } from '@/types'

function Dashboard() {
  const navigate = useNavigate();
  const [compact, setCompact] = useState(
    () => localStorage.getItem("dashboard-compact") === "true",
  );
  const [backdateOpen, setBackdateOpen] = useState(false);
  const [dayDetailOpen, setDayDetailOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

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

  // Fetch last 60 days of check-ins for streak calculation
  const streakRange = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 60);
    return formatDate(d);
  }, []);
  const {
    data: streakCheckIns,
    isFetching: streakFetching,
    error: streakError,
    refetch: refetchStreak,
  } = useCheckIns({
    startDate: streakRange,
    endDate: formatDate(new Date()),
  });

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

  // Combos status
  const renderedCombos = useMemo(() => {
    if (!combos || !habits) return [];
    return combos.map(combo => {
      const isDone = combo.habit_ids.length > 0 && combo.habit_ids.every(id => (todayCountMap[id] ?? 0) > 0);
      return { ...combo, isDone };
    }).sort((a, b) => (a.isDone === b.isDone ? 0 : a.isDone ? 1 : -1));
  }, [combos, habits, todayCountMap]);

  const handleComboCheckIn = async (combo: HabitCombo & { isDone: boolean }) => {
    if (checkInCombo.isPending) return;
    try {
      const result = await checkInCombo.mutateAsync({ habitIds: combo.habit_ids });
      if (result && result.length > 0) {
        toast.success(`已打卡组合「${combo.name}」`, {
          action: {
            label: '撤销',
            onClick: async () => {
              try {
                await deleteCheckIn.mutateAsync(result.map(r => r.id));
                toast.success('已撤销组合打卡');
              } catch {
                // error handled in useDeleteCheckIn
              }
            }
          }
        });
      }
    } catch {
      toast.error('组合打卡失败，请重试')
    }
  };

  // Sort: incomplete first, completed at bottom
  const sortedHabits = useMemo(() => {
    if (!habits) return [];
    return [...habits].sort((a, b) => {
      const aDone = (todayCountMap[a.id] ?? 0) > 0 ? 1 : 0;
      const bDone = (todayCountMap[b.id] ?? 0) > 0 ? 1 : 0;
      return aDone - bDone;
    });
  }, [habits, todayCountMap]);

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

  // Index where completed habits start (-1 = none done, 0 = all done)
  const firstDoneIdx = sortedHabits.findIndex(
    (h) => (todayCountMap[h.id] ?? 0) > 0,
  );
  const hasMixed = firstDoneIdx > 0 && doneCount < totalCount;

  const gridClass = compact
    ? "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2"
    : "grid grid-cols-2 sm:grid-cols-3 gap-2";

  return (
    <div className="app-page space-y-6">
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
                    "#eab308",
                    "#3b82f6",
                    "#22c55e",
                    "#ec4899",
                    "#8b5cf6",
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

      {/* Last 7 days mini chart */}
      {totalCount > 0 && (
        <motion.div variants={sectionReveal} className="glass-card rounded-[var(--radius-card-lg)] p-5">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b luxury-divider">
            <TrendingUp className="w-4 h-4 text-brand-500" strokeWidth={2.5} />
            <span className="font-bold text-[var(--color-ink-900)] text-sm">
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

      <CheckInDayDetailDialog
        open={dayDetailOpen}
        onOpenChange={setDayDetailOpen}
        dateLabel={selectedDate}
        checkIns={selectedDateCheckIns}
        habitsMap={habitsMap}
      />

      {/* Combos grid */}
      {!isLoading && renderedCombos.length > 0 && (
        <motion.div variants={sectionReveal} className="space-y-3 mb-8">
          <div className="text-sm font-bold text-[var(--color-ink-600)] px-1 pb-1">运动组合</div>
          <div className={gridClass}>
            {renderedCombos.map(combo => (
              <button
                key={combo.id}
                disabled={checkInCombo.isPending || combo.habit_ids.length === 0}
                onClick={() => handleComboCheckIn(combo)}
                className={`group relative flex items-center gap-2.5 px-3 py-2.5 rounded-[var(--radius-card-lg)] tap-scale text-left select-none overflow-hidden transition-[box-shadow,transform,background-color] duration-200 ${
                  combo.isDone 
                    ? 'bg-white/52 shadow-sm opacity-90' 
                    : 'bg-white/82 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)]'
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
                  <div className={`font-bold text-[13px] leading-snug line-clamp-1 ${combo.isDone ? 'text-stone-500' : 'text-stone-900'}`}>
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
                      <span className="text-[11px] text-stone-400 font-medium">
                        包含 {combo.habit_ids.length} 项
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
              <div className="h-px flex-1 bg-stone-100" />
            <span className="text-xs text-[var(--color-ink-500)] font-semibold px-1">
                已完成 {doneCount} 项
              </span>
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
                  streak={streakMap[habit.id] ?? 0}
                  compact={compact}
                  latestCheckInId={latestCheckInMap[habit.id]}
                  style={{ animationDelay: `${i * 40}ms` }}
                />
              ))}
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div variants={sectionReveal} className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-white/72 border border-white/72 shadow-[0_12px_28px_rgb(61_52_41/0.08)] flex items-center justify-center mb-4">
            <span className="text-4xl animate-float">📋</span>
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
          <span className="text-sm">👆</span>
          <span className="text-xs font-medium">轻触卡片即可完成今日打卡</span>
        </div>
      )}

      {/* Backdate sheet */}
      {habits && (
        <BackdateSheet
          open={backdateOpen}
          onOpenChange={setBackdateOpen}
          habits={habits}
        />
      )}
    </div>
  );
}

export const Route = createFileRoute("/")({
  component: Dashboard,
  beforeLoad: ({ context }) => {
    if (context.auth.loading) return;
    if (!context.auth.user) throw redirect({ to: "/login" });
  },
});
