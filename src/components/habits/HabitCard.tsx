import { useCallback, useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { Check, Flame, LoaderCircle, MoreHorizontal, Plus, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Habit } from '@/types'
import { ModalOverlay } from '@/components/ui/modal-overlay'
import { Textarea } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCheckIn, useDeleteCheckIn } from '@/hooks/useCheckIns'
import { HabitIcon, getHabitIconLabel } from '@/lib/habitIcons'

interface HabitCardProps {
  habit: Habit
  todayCount: number
  streak?: number
  style?: CSSProperties
  compact?: boolean
  latestCheckInId?: string
  onCheckInSuccess?: (habitId: string, previousCount: number) => void
}

type PendingAction = 'quick' | 'confirm' | 'undo'

const CHECK_IN_REPEAT_WINDOW_MS = 350
const pressFeedback = 'touch-manipulation active:opacity-70 active:duration-0'
const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2'
const sheetButtonClass = cn('inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] px-3 text-sm font-semibold disabled:opacity-60', pressFeedback, focusRing)

function preventRepeatingActivation(event: KeyboardEvent<HTMLButtonElement>) {
  if (event.repeat && (event.key === 'Enter' || event.key === ' ')) event.preventDefault()
}

export function HabitCard({ habit, todayCount, streak = 0, style, compact = false, latestCheckInId, onCheckInSuccess }: HabitCardProps) {
  const noteId = useId()
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  const [showNote, setShowNote] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const inFlight = useRef(false)
  const moreButtonRef = useRef<HTMLButtonElement>(null)
  const checkButtonRef = useRef<HTMLButtonElement>(null)
  const quickFocus = useRef<{ count: number; succeeded: boolean } | null>(null)
  const restoreFocus = useRef(false)
  const lastCheckInAt = useRef(-Infinity)
  const checkIn = useCheckIn()
  const deleteCheckIn = useDeleteCheckIn()
  const isDone = todayCount > 0
  const isPending = pendingAction !== null || checkIn.isPending || deleteCheckIn.isPending
  const isQuickPending = pendingAction === 'quick'
  const isConfirmPending = pendingAction === 'confirm'
  const isUndoPending = pendingAction === 'undo'
  const hasStreak = streak >= 2
  const canUndo = isDone && Boolean(latestCheckInId)
  const focusSheet = useCallback((element: HTMLDivElement | null) => {
    element?.focus()
  }, [])

  useEffect(() => {
    if (open || isPending || !restoreFocus.current) return
    restoreFocus.current = false
    moreButtonRef.current?.focus()
  }, [open, isPending])

  useEffect(() => {
    if (isPending || !quickFocus.current) return
    // Disabling or reordering a native button can drop focus to the body.
    // Restore only when the user has not moved focus to another control.
    if (document.activeElement === document.body || document.activeElement === checkButtonRef.current) {
      checkButtonRef.current?.focus({ preventScroll: true })
    }
    if (!quickFocus.current.succeeded || todayCount > quickFocus.current.count) quickFocus.current = null
  }, [isPending, todayCount])

  function changeSheet(nextOpen: boolean) {
    if (inFlight.current) return
    if (nextOpen) {
      restoreFocus.current = true
      setNote('')
      setShowNote(false)
    }
    setOpen(nextOpen)
  }

  async function runAction(action: PendingAction) {
    if (inFlight.current || isPending) return
    if (action === 'undo' && !latestCheckInId) return
    if (action !== 'undo' && Date.now() - lastCheckInAt.current < CHECK_IN_REPEAT_WINDOW_MS) return

    if (action === 'quick') {
      quickFocus.current = document.activeElement === checkButtonRef.current
        ? { count: todayCount, succeeded: false } : null
    }
    // Block a second activation before React renders the disabled controls.
    inFlight.current = true
    setPendingAction(action)
    try {
      if (action === 'undo') {
        if (latestCheckInId) await deleteCheckIn.mutateAsync(latestCheckInId)
      } else {
        await checkIn.mutateAsync({ habit_id: habit.id, note: action === 'confirm' ? note.trim() || undefined : undefined })
        lastCheckInAt.current = Date.now()
        if (quickFocus.current) quickFocus.current.succeeded = true
        onCheckInSuccess?.(habit.id, todayCount)
        // The state/count change also gives static feedback when motion is reduced.
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) navigator.vibrate?.(15)
      }
      if (action !== 'quick') setOpen(false)
    } catch {
      // The mutation hook reports the error. Keep the sheet and note available for retry.
    } finally {
      inFlight.current = false
      setPendingAction(null)
    }
  }

  return (
    <>
      <article
        style={style}
        aria-busy={isPending}
        className={cn('habit-row', isDone && 'habit-row-done', compact && 'habit-row-compact')}
      >
        <div className="habit-icon shrink-0" style={{ '--habit-color': habit.color } as CSSProperties} aria-hidden="true">
          <HabitIcon icon={habit.icon} className={compact ? 'size-5' : 'size-[22px]'} color={habit.color} fallback="📌" />
        </div>

        <div className={cn('min-w-0', compact ? 'w-full text-center' : 'flex-1')}>
          <div className={cn(
            'font-semibold leading-snug break-words text-[var(--color-ink-950)]',
            compact ? 'line-clamp-1 text-xs' : 'line-clamp-2 text-[15px] sm:text-base',
          )} title={habit.name}>
            {habit.name}
          </div>
          <div className={cn(
            'mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 font-medium leading-snug tabular-nums',
            compact ? 'justify-center text-[11px]' : 'text-xs',
          )}>
            <span aria-live="polite" aria-atomic="true" className={cn(isDone ? 'text-brand-700' : 'text-[var(--color-ink-600)]')}>
              {isQuickPending ? '打卡中…' : todayCount > 1 ? `×${todayCount}` : isDone ? '已完成' : '待打卡'}
            </span>
            {hasStreak ? (
              <span className="inline-flex items-center gap-0.5 whitespace-nowrap font-semibold text-brand-700">
                <Flame className="size-3" aria-hidden="true" />
                <span className="sr-only">连续打卡</span>{streak}天
              </span>
            ) : null}
          </div>
        </div>

        <div className={cn('flex shrink-0 items-center', compact ? 'justify-center gap-0.5' : 'gap-1')}>
          <button
            type="button"
            ref={checkButtonRef}
            className={cn('habit-check-button inline-grid min-h-11 min-w-11 place-items-center disabled:opacity-60', isDone && 'habit-check-button-done', pressFeedback, focusRing)}
            onClick={() => void runAction('quick')}
            onKeyDown={preventRepeatingActivation}
            aria-label={`${isDone ? '再次打卡' : '打卡'}：${habit.name}`}
            aria-busy={isQuickPending}
            disabled={isPending}
          >
            {isQuickPending ? <LoaderCircle className="size-5 motion-safe:animate-spin" aria-hidden="true" />
              : isDone ? <Plus className="size-5" aria-hidden="true" />
              : <Check className="size-5" aria-hidden="true" />}
          </button>
          <button
            type="button"
            className={cn('habit-more-button inline-grid min-h-11 min-w-11 place-items-center disabled:opacity-60', pressFeedback, focusRing)}
            ref={moreButtonRef}
            onClick={() => changeSheet(true)}
            aria-label={`更多选项：${habit.name}`}
            aria-haspopup="dialog"
            disabled={isPending}
          >
            <MoreHorizontal className="size-5" aria-hidden="true" />
          </button>
        </div>
      </article>

      <ModalOverlay open={open} onOpenChange={changeSheet} title={`${getHabitIconLabel(habit.icon)} ${habit.name}`}>
        <div
          ref={focusSheet}
          tabIndex={-1}
          className="space-y-4"
          role="dialog"
          aria-label={`打卡选项：${habit.name}`}
          aria-busy={isPending}
          onKeyDown={(event) => {
            if (event.key === 'Escape') changeSheet(false)
          }}
        >
          <p className="text-sm font-medium text-[var(--color-ink-600)]">
            今日已打卡 <strong className="tabular-nums text-[var(--color-ink-950)]">{todayCount}</strong> 次
          </p>

          {showNote ? (
            <div className="space-y-2">
              <Label htmlFor={noteId}>备注</Label>
              <Textarea
                id={noteId}
                placeholder="记录一下这次的感受或数据…"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={3}
                autoFocus
                disabled={isPending}
              />
            </div>
          ) : (
            <button
              type="button"
              className={cn(sheetButtonClass, 'px-0 text-brand-700 hover:text-brand-600')}
              onClick={() => setShowNote(true)}
              disabled={isPending}
            >
              <Plus className="size-4" aria-hidden="true" />
              添加备注
            </button>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              className={cn(sheetButtonClass, 'flex-1 border border-[var(--color-line-soft)] bg-white text-[var(--color-ink-800)] hover:bg-brand-50')}
              onClick={() => changeSheet(false)}
              disabled={isPending}
            >
              取消
            </button>
            <button
              type="button"
              className={cn(sheetButtonClass, 'flex-1 bg-brand-700 text-white hover:bg-brand-600')}
              onClick={() => void runAction('confirm')}
              onKeyDown={preventRepeatingActivation}
              aria-busy={isConfirmPending}
              disabled={isPending}
            >
              <Check className="size-4" aria-hidden="true" />
              {isConfirmPending ? '打卡中…' : '确认打卡'}
            </button>
          </div>

          {canUndo ? (
            <button
              type="button"
              className={cn(sheetButtonClass, 'w-full text-xs text-[var(--color-ink-600)] hover:text-[var(--color-ink-950)]')}
              onClick={() => void runAction('undo')}
              onKeyDown={preventRepeatingActivation}
              aria-busy={isUndoPending}
              disabled={isPending}
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              {isUndoPending ? '撤销中…' : '撤销最近一次打卡'}
            </button>
          ) : null}
        </div>
      </ModalOverlay>
    </>
  )
}
