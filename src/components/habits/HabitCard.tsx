import { useState, useEffect, useRef } from 'react'
import { Check, Plus, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Spinner } from '@/components/ui/spinner'
import type { Habit } from '@/types'
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetTrigger,
} from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCheckIn, useDeleteCheckIn } from '@/hooks/useCheckIns'
import { toast } from '@/hooks/useToast'

interface HabitCardProps {
  habit: Habit
  todayCount: number
  style?: React.CSSProperties
  compact?: boolean
  latestCheckInId?: string
}

export function HabitCard({ habit, todayCount, style, compact = false, latestCheckInId }: HabitCardProps) {
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  const [showNote, setShowNote] = useState(false)
  const [celebrating, setCelebrating] = useState(false)
  const prevDoneRef = useRef(todayCount > 0)
  const checkIn = useCheckIn()
  const deleteCheckIn = useDeleteCheckIn()
  const isDone = todayCount > 0

  // Reset sheet state when closed
  useEffect(() => {
    if (!open) {
      setNote('')
      setShowNote(false)
    }
  }, [open])

  // Trigger celebration when first check-in of the day happens
  useEffect(() => {
    const wasZero = !prevDoneRef.current
    const isNowDone = isDone
    if (wasZero && isNowDone) {
      setCelebrating(true)
      const timer = setTimeout(() => setCelebrating(false), 600)
      prevDoneRef.current = isNowDone
      return () => clearTimeout(timer)
    }
    prevDoneRef.current = isNowDone
  }, [isDone])

  async function handleCheckIn() {
    try {
      await checkIn.mutateAsync({ habit_id: habit.id, note: note.trim() || undefined })
      setOpen(false)
      navigator.vibrate?.(15)
    } catch {
      toast.error('打卡失败，请重试')
    }
  }

  async function handleUndo() {
    if (!latestCheckInId) return
    try {
      await deleteCheckIn.mutateAsync(latestCheckInId)
      setOpen(false)
    } catch {
      toast.error('撤销失败，请重试')
    }
  }

  const sheetContent = (
    <BottomSheetContent>
      <BottomSheetHeader>
        <BottomSheetTitle>
          <span className="mr-2">{habit.icon || '📌'}</span>
          {habit.name}
        </BottomSheetTitle>
        <p className="text-sm text-stone-500">
          今日已打卡 <strong>{todayCount}</strong> 次 · 确认新增一次打卡
        </p>
      </BottomSheetHeader>

      <div className="space-y-4">
        {showNote ? (
          <div className="space-y-2">
            <Label htmlFor="note">备注</Label>
            <Textarea
              id="note"
              placeholder="记录一下这次的感受、数据或备注…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
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

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button
            className="flex-1"
            style={{ backgroundColor: habit.color }}
            onClick={handleCheckIn}
            disabled={checkIn.isPending}
          >
            {checkIn.isPending ? (
              <span className="flex items-center gap-2">
                <Spinner />
                打卡中…
              </span>
            ) : (
              <>
                <Check className="w-4 h-4" strokeWidth={2.5} />
                确认打卡
              </>
            )}
          </Button>
        </div>

        {isDone && latestCheckInId && (
          <button
            className="w-full flex items-center justify-center gap-1.5 py-1 text-xs text-stone-400 hover:text-stone-600 transition-colors disabled:opacity-50"
            onClick={handleUndo}
            disabled={deleteCheckIn.isPending}
          >
            <RotateCcw className="w-3 h-3" />
            撤销最近一次打卡
          </button>
        )}
      </div>
    </BottomSheetContent>
  )

  // ── Compact mode ──────────────────────────────────────────
  if (compact) {
    return (
      <BottomSheet open={open} onOpenChange={setOpen}>
        <BottomSheetTrigger asChild>
          <button
            className={cn(
              'group relative flex flex-col items-center gap-1.5 pt-3 pb-2.5 px-1',
              'rounded-2xl border tap-scale transition-all duration-200 w-full select-none',
              'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2',
              'bg-white shadow-[var(--shadow-card)]',
              isDone ? 'border-transparent' : 'border-stone-200',
              celebrating && 'animate-celebrate',
            )}
            style={{
              ...(isDone ? { borderColor: habit.color + '50' } : {}),
              ...style,
            }}
            aria-label={`打卡：${habit.name}`}
          >
            {/* Color accent bar */}
            <div
              className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl transition-colors duration-300"
              style={{ backgroundColor: isDone ? habit.color : '#e7e5e4' }}
            />
            {/* Icon + done badge */}
            <div className="relative">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl"
                style={{ backgroundColor: habit.color + '18' }}
              >
                {habit.icon || '📌'}
              </div>
              {isDone && (
                <div
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center animate-check-bounce"
                  style={{ backgroundColor: habit.color }}
                >
                  <Check className="w-2.5 h-2.5 text-white" strokeWidth={3.5} />
                </div>
              )}
            </div>
            {/* Name */}
            <div className="text-xs font-semibold text-stone-800 text-center line-clamp-2 w-full px-0.5 leading-snug">
              {habit.name}
            </div>
            {/* Count badge (only when > 1) */}
            {todayCount > 1 && (
              <span
                className="text-xs font-bold px-1.5 rounded-full leading-5"
                style={{ backgroundColor: habit.color + '18', color: habit.color }}
              >
                ×{todayCount}
              </span>
            )}
          </button>
        </BottomSheetTrigger>
        {sheetContent}
      </BottomSheet>
    )
  }

  // ── Normal mode ───────────────────────────────────────────
  return (
    <BottomSheet open={open} onOpenChange={setOpen}>
      <BottomSheetTrigger asChild>
        <button
          className={cn(
            'group relative flex flex-col items-start p-4 rounded-2xl tap-scale',
            'border transition-all duration-200 text-left w-full select-none',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2',
            isDone
              ? 'bg-white border-stone-200 shadow-[var(--shadow-card)]'
              : 'bg-white border-stone-200 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)]',
            celebrating && 'animate-celebrate',
          )}
          style={style}
          aria-label={`打卡：${habit.name}`}
        >
          {/* Color accent bar */}
          <div
            className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl transition-all duration-300"
            style={{ backgroundColor: isDone ? habit.color : '#e7e5e4' }}
          />

          {/* Icon + Done badge */}
          <div className="flex w-full items-start justify-between mt-1">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ backgroundColor: habit.color + '18' }}
            >
              {habit.icon || '📌'}
            </div>
            {isDone && (
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center animate-check-bounce"
                style={{ backgroundColor: habit.color }}
              >
                <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
              </div>
            )}
          </div>

          {/* Name */}
          <div className="mt-3 font-bold text-stone-900 text-sm leading-snug line-clamp-2">
            {habit.name}
          </div>

          {/* Count */}
          <div className="mt-1.5 flex items-center gap-1.5">
            {isDone ? (
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: habit.color + '18', color: habit.color }}
              >
                今日 ×{todayCount}
              </span>
            ) : (
              <span className="text-xs text-stone-400 font-medium flex items-center gap-1">
                <Plus className="w-3 h-3" strokeWidth={2.5} />
                点击打卡
              </span>
            )}
          </div>
        </button>
      </BottomSheetTrigger>
      {sheetContent}
    </BottomSheet>
  )
}
