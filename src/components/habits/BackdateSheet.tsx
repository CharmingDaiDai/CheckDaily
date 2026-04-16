import { useState, useMemo, useEffect, useRef } from 'react'
import { Check } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import type { Habit } from '@/types'
import { ModalOverlay } from '@/components/ui/modal-overlay'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCheckIn, useCheckIns } from '@/hooks/useCheckIns'
import { toast } from '@/hooks/useToast'
import { HabitIcon } from '@/lib/habitIcons'

const MAX_PER_DAY = 3

interface BackdateSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  habits: Habit[]
}

export function BackdateSheet({ open, onOpenChange, habits }: BackdateSheetProps) {
  // Generate last 3 days (excluding today)
  const backdateDays = useMemo(() => {
    return [-1, -2, -3].map((offset) => {
      const d = new Date()
      d.setDate(d.getDate() + offset)
      return formatDate(d)
    })
  }, [])

  const [selectedDate, setSelectedDate] = useState(backdateDays[0])
  const [selectedHabits, setSelectedHabits] = useState<Set<string>>(new Set())
  const [note, setNote] = useState('')
  const [showNote, setShowNote] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const quotaToastAtRef = useRef(0)

  const checkIn = useCheckIn()

  // Fetch check-ins for the 3-day range
  const {
    data: recentCheckIns,
    isLoading: recentLoading,
    isFetching: recentFetching,
    error: recentError,
    refetch: refetchRecent,
  } = useCheckIns({
    startDate: backdateDays[2], // earliest
    endDate: backdateDays[0],   // most recent
  })

  // Reset state when sheet closes or date changes
  useEffect(() => {
    if (!open) {
      setSelectedDate(backdateDays[0])
      setSelectedHabits(new Set())
      setNote('')
      setShowNote(false)
    }
  }, [open, backdateDays])

  useEffect(() => {
    setSelectedHabits(new Set())
  }, [selectedDate])

  // Already checked-in habit ids for the selected date (any check-in, not just backdates)
  const checkedHabitIds = useMemo(() => {
    return new Set(
      (recentCheckIns ?? [])
        .filter((ci) => formatDate(ci.checked_at) === selectedDate)
        .map((ci) => ci.habit_id)
    )
  }, [recentCheckIns, selectedDate])

  // Count of backdated check-ins for the selected date
  const backdateCount = useMemo(() => {
    return (recentCheckIns ?? []).filter(
      (ci) =>
        formatDate(ci.checked_at) === selectedDate &&
        formatDate(ci.created_at) !== formatDate(ci.checked_at)
    ).length
  }, [recentCheckIns, selectedDate])

  const remaining = MAX_PER_DAY - backdateCount
  const canSelectMore = remaining - selectedHabits.size > 0
  const remainingSlots = Math.max(remaining - selectedHabits.size, 0)

  // Available habits: not archived, not already checked-in for selected date
  const availableHabits = useMemo(() => {
    return habits.filter((h) => !h.archived && !checkedHabitIds.has(h.id))
  }, [habits, checkedHabitIds])

  function toggleHabit(habitId: string) {
    setSelectedHabits((prev) => {
      const next = new Set(prev)
      if (next.has(habitId)) {
        next.delete(habitId)
      } else if (canSelectMore || prev.has(habitId)) {
        next.add(habitId)
      } else {
        const now = Date.now()
        if (now - quotaToastAtRef.current > 1200) {
          quotaToastAtRef.current = now
          toast.warning(`该日最多补卡 ${MAX_PER_DAY} 项，请先取消一项`, { duration: 2200 })
        }
      }
      return next
    })
  }

  async function handleSubmit() {
    if (selectedHabits.size === 0) return
    setSubmitting(true)
    try {
      await Promise.all(
        [...selectedHabits].map(habitId =>
          checkIn.mutateAsync({
            habit_id: habitId,
            checked_at: `${selectedDate}T12:00:00.000Z`,
            note: note.trim() || undefined,
          })
        )
      )
      toast.success(`${selectedDate} 已补卡 ${selectedHabits.size} 项`, { duration: 3600 })
      onOpenChange(false)
    } catch {
      toast.error('补卡失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  // Format helpers
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  function formatShortDate(dateStr: string) {
    const d = new Date(dateStr + 'T00:00:00')
    return {
      month: d.getMonth() + 1,
      day: d.getDate(),
      weekday: weekdays[d.getDay()],
    }
  }

  return (
    <ModalOverlay open={open} onOpenChange={onOpenChange} title="补卡 📆">
        <div className="space-y-4 pt-1">
          <p className="text-sm text-stone-500 font-medium mb-4 -mt-2">补录最近3天遗漏的打卡记录。</p>
          
          {recentError && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/70 px-3.5 py-3">
              <div className="text-sm font-semibold text-rose-700">补卡记录同步失败</div>
              <div className="mt-0.5 text-xs text-rose-600">请重试后再选择补卡项目。</div>
              <Button
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={() => void refetchRecent()}
              >
                重试
              </Button>
            </div>
          )}

          {recentFetching && !recentLoading && !recentError && (
            <div className="rounded-xl border border-brand-100 bg-brand-50/70 px-3 py-2 text-xs font-medium text-brand-700">
              正在同步最近 3 天补卡记录…
            </div>
          )}

          {/* Date selector */}
          <div className="space-y-2">
            <Label className="text-xs text-stone-500 font-semibold">选择日期</Label>
            <div className="flex gap-2">
              {backdateDays.map((date) => {
                const { month, day, weekday } = formatShortDate(date)
                const isSelected = date === selectedDate
                const dayBackdateCount = (recentCheckIns ?? []).filter(
                  (ci) =>
                    formatDate(ci.checked_at) === date &&
                    formatDate(ci.created_at) !== formatDate(ci.checked_at)
                ).length
                const dayRemaining = MAX_PER_DAY - dayBackdateCount
                return (
                  <button
                    key={date}
                    aria-label={`${month}月${day}日 周${weekday}${dayRemaining <= 0 ? ' 已满' : ''}`}
                    className={cn(
                      'flex-1 flex flex-col items-center gap-0.5 py-2.5 px-2 rounded-xl border-2 transition-all',
                      isSelected
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-stone-200 bg-white hover:border-stone-300',
                      dayRemaining <= 0 && !isSelected && 'opacity-50',
                    )}
                    onClick={() => setSelectedDate(date)}
                  >
                    <span
                      className={cn(
                        'text-sm font-bold',
                        isSelected ? 'text-brand-600' : 'text-stone-800',
                      )}
                    >
                      {month}/{day}
                    </span>
                    <span
                      className={cn(
                        'text-xs',
                        isSelected ? 'text-brand-500' : 'text-stone-400',
                      )}
                    >
                      {'周' + weekday}
                    </span>
                    {dayRemaining < MAX_PER_DAY && (
                      <span className="text-[10px] text-stone-400">
                        {dayRemaining <= 0 ? '已满' : `剩${dayRemaining}项`}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Habit selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-stone-500 font-semibold">选择项目</Label>
              <span className="text-xs text-stone-400">
                {remaining <= 0 ? (
                  <span className="text-amber-500">该日补卡已满</span>
                ) : (
                  `还可补 ${remainingSlots} 项`
                )}
              </span>
            </div>

            {recentError ? (
              <div className="flex flex-col items-center py-5 text-rose-500 gap-1.5">
                <span className="text-sm font-semibold">无法读取当日可补卡项目</span>
                <button
                  type="button"
                  className="text-xs font-medium text-rose-600 underline underline-offset-2"
                  onClick={() => void refetchRecent()}
                >
                  点击重试
                </button>
              </div>
            ) : availableHabits.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-stone-400 gap-1.5">
                <span className="text-2xl">🎉</span>
                <span className="text-xs font-medium">该日所有项目都已打卡</span>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                {availableHabits.map((habit) => {
                  const isSelected = selectedHabits.has(habit.id)
                  const disabled = !isSelected && !canSelectMore
                  return (
                    <button
                      key={habit.id}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left',
                        isSelected
                          ? 'border-brand-500 bg-brand-50'
                          : disabled
                            ? 'border-stone-100 bg-stone-50 opacity-40 cursor-not-allowed'
                            : 'border-stone-200 bg-white hover:border-stone-300',
                      )}
                      onClick={() => !disabled && toggleHabit(habit.id)}
                      disabled={disabled}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
                        style={{ backgroundColor: habit.color + '18' }}
                      >
                        <HabitIcon icon={habit.icon} className="w-4 h-4" color={habit.color} fallback="📌" />
                      </div>
                      <span className="flex-1 text-sm font-semibold text-stone-800 truncate">
                        {habit.name}
                      </span>
                      <div
                        className={cn(
                          'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0',
                          isSelected
                            ? 'border-brand-500 bg-brand-500'
                            : 'border-stone-300 bg-white',
                        )}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Note */}
          {showNote ? (
            <div className="space-y-2">
              <Label htmlFor="backdate-note">备注</Label>
              <Textarea
                id="backdate-note"
                placeholder="记录补卡原因或备注…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                autoFocus
              />
            </div>
          ) : (
            <button
              type="button"
              className="text-xs text-stone-400 hover:text-brand-500 transition-colors font-medium"
              onClick={() => setShowNote(true)}
            >
              + 添加备注
            </button>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={selectedHabits.size === 0 || submitting || !!recentError}
              isLoading={submitting}
              loadingText="补卡中…"
              requestGuard
            >
              {`确认补卡${selectedHabits.size > 0 ? ` (${selectedHabits.size})` : ''}`}
            </Button>
          </div>

          {/* Info hint */}
          <p className="text-[11px] text-stone-300 text-center">
            补卡记录会标注"补"标签 · 每日最多补 {MAX_PER_DAY} 项
          </p>
        </div>
    </ModalOverlay>
  )
}
