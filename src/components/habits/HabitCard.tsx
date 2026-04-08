import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, useReducedMotion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'motion/react'
import { Check, RotateCcw, MoreHorizontal, Flame } from 'lucide-react'
import { cn } from '@/lib/utils'
import { celebrate } from '@/lib/celebrate'
import { spring } from '@/lib/motion'
import type { Habit } from '@/types'
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
} from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCheckIn, useDeleteCheckIn } from '@/hooks/useCheckIns'
import { toast } from '@/hooks/useToast'

interface HabitCardProps {
  habit: Habit
  todayCount: number
  streak?: number
  style?: React.CSSProperties
  compact?: boolean
  latestCheckInId?: string
}

export function HabitCard({ habit, todayCount, streak = 0, style, compact = false, latestCheckInId }: HabitCardProps) {
  const reduceMotion = useReducedMotion()
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  const [showNote, setShowNote] = useState(false)
  const [celebrating, setCelebrating] = useState(false)
  const [isLongPressing, setIsLongPressing] = useState(false)
  const [isQuickSubmitting, setIsQuickSubmitting] = useState(false)
  const cardRef = useRef<HTMLButtonElement>(null)
  const prevDoneRef = useRef(todayCount > 0)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const didLongPress = useRef(false)
  const checkIn = useCheckIn()
  const deleteCheckIn = useDeleteCheckIn()
  const isDone = todayCount > 0

  // 3D tilt motion values
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [4, -4]), { stiffness: 300, damping: 30 })
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-4, 4]), { stiffness: 300, damping: 30 })

  // Magnetic icon follow
  const iconX = useSpring(useTransform(mouseX, [-0.5, 0.5], [-3, 3]), { stiffness: 200, damping: 20 })
  const iconY = useSpring(useTransform(mouseY, [-0.5, 0.5], [-3, 3]), { stiffness: 200, damping: 20 })

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (reduceMotion) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    mouseX.set(x)
    mouseY.set(y)
  }, [reduceMotion, mouseX, mouseY])

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0)
    mouseY.set(0)
  }, [mouseX, mouseY])

  // Reset sheet state when closed
  useEffect(() => {
    if (!open) {
      setNote('')
      setShowNote(false)
    }
  }, [open])

  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
        longPressTimer.current = null
      }
    }
  }, [])

  // Trigger celebration when first check-in of the day happens
  useEffect(() => {
    const wasZero = !prevDoneRef.current
    const isNowDone = isDone
    if (wasZero && isNowDone) {
      setCelebrating(true)
      const timer = setTimeout(() => setCelebrating(false), 800)
      prevDoneRef.current = isNowDone
      return () => clearTimeout(timer)
    }
    prevDoneRef.current = isNowDone
  }, [isDone])

  // One-tap check-in (directly on card click)
  const handleQuickCheckIn = useCallback(async () => {
    if (checkIn.isPending || isQuickSubmitting) return
    const wasFirstCheckIn = !isDone
    setIsQuickSubmitting(true)
    try {
      await checkIn.mutateAsync({ habit_id: habit.id })
      navigator.vibrate?.(wasFirstCheckIn ? [10, 30, 20] : 15)

      // Fire confetti on first check-in of the day
      if (wasFirstCheckIn && cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect()
        celebrate({
          colors: [habit.color || '#f97316', '#fbbf24', '#ffffff'],
          origin: {
            x: (rect.left + rect.width / 2) / window.innerWidth,
            y: (rect.top + rect.height / 2) / window.innerHeight,
          },
        })
      }
    } catch {
      toast.error('打卡失败，请重试')
    } finally {
      setIsQuickSubmitting(false)
    }
  }, [checkIn, habit.id, habit.color, isDone, isQuickSubmitting])

  // Check-in with note (from bottom sheet)
  async function handleCheckIn() {
    const wasFirstCheckIn = !isDone
    try {
      await checkIn.mutateAsync({ habit_id: habit.id, note: note.trim() || undefined })
      setOpen(false)
      navigator.vibrate?.(wasFirstCheckIn ? [10, 30, 20] : 15)

      if (wasFirstCheckIn) {
        celebrate({
          colors: [habit.color || '#f97316', '#fbbf24', '#ffffff'],
          origin: { x: 0.5, y: 0.6 },
        })
      }
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

  // Long-press handlers
  const onPointerDown = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return
    didLongPress.current = false
    setIsLongPressing(true)
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true
      setIsLongPressing(false)
      setOpen(true)
    }, 500)
  }, [])

  const onPointerUpOrLeave = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    setIsLongPressing(false)
  }, [])

  const handleCardClick = useCallback(() => {
    // If long-press just fired, don't also do a quick check-in
    if (didLongPress.current) {
      didLongPress.current = false
      return
    }
    handleQuickCheckIn()
  }, [handleQuickCheckIn])

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
            onClick={() => void handleCheckIn()}
            isLoading={checkIn.isPending}
            loadingText="打卡中…"
            requestGuard
          >
            <Check className="w-4 h-4" strokeWidth={2.5} />
            确认打卡
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

  // More-options trigger (opens BottomSheet)
  const moreButton = (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        'absolute top-1.5 right-1.5 z-10 w-11 h-11 rounded-xl',
        'flex items-center justify-center cursor-pointer',
        'text-stone-400 hover:text-stone-600 hover:bg-black/5 bg-white/70 backdrop-blur-[2px]',
        'transition-all duration-[var(--duration-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
        isDone ? 'opacity-70' : 'opacity-80 sm:opacity-0 sm:group-hover:opacity-100',
      )}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation()
        setIsLongPressing(false)
        setOpen(true)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          e.stopPropagation()
          setOpen(true)
        }
      }}
      aria-label="更多选项"
    >
      <MoreHorizontal className="w-4 h-4" />
    </div>
  )

  const longPressIndicator = isLongPressing ? (
    <div className="pointer-events-none absolute left-2 right-2 top-1.5 z-10 h-1.5 overflow-hidden rounded-full bg-brand-100/90">
      <motion.span
        className="block h-full origin-left rounded-full bg-brand-500"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.5, ease: 'linear' }}
      />
    </div>
  ) : null

  const quickPendingIndicator = isQuickSubmitting ? (
    <div className="pointer-events-none absolute left-2 right-2 bottom-1.5 z-10 h-1.5 overflow-hidden rounded-full bg-brand-100/85">
      <span className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-brand-500/80 animate-request-progress" />
    </div>
  ) : null

  // Ripple element shown during celebration — motion-driven
  const rippleElement = celebrating ? (
    <motion.span
      className="absolute left-1/2 top-1/2 w-16 h-16 rounded-full pointer-events-none"
      style={{ backgroundColor: habit.color + '60' }}
      initial={{ scale: 0, opacity: 0.5, x: '-50%', y: '-50%' }}
      animate={{ scale: 4, opacity: 0 }}
      transition={{ duration: 0.82, ease: [0.22, 0.61, 0.36, 1] }}
    />
  ) : null

  // Streak badge (inline, shows when streak >= 2)
  const streakBadge = streak >= 2 ? (
    <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-amber-600">
      <Flame className="w-3 h-3" strokeWidth={2.5} />
      {streak}天
    </span>
  ) : null

  // Shared 3D style for card
  const tiltStyle = reduceMotion ? undefined : {
    rotateX,
    rotateY,
    transformPerspective: 800,
  }

  // ── Compact mode ──────────────────────────────────────────
  if (compact) {
    return (
      <>
        <motion.button
          whileTap={reduceMotion ? undefined : { scale: 0.96, transition: spring.snappy }}
          whileHover={reduceMotion || isDone ? undefined : { y: -2 }}
          style={{
            ...style,
            ...tiltStyle,
          }}
          ref={cardRef}
          className={cn(
            'group relative flex flex-col items-center gap-1 pt-3 pb-2 px-1.5',
            'rounded-2xl tap-scale w-full select-none overflow-hidden',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2',
              isQuickSubmitting && 'pointer-events-none',
            isDone
              ? 'bg-white/60 shadow-sm'
              : 'bg-white shadow-[var(--shadow-card)]',
            celebrating && 'animate-celebrate',
          )}
          aria-label={`打卡：${habit.name}`}
          onClick={handleCardClick}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUpOrLeave}
          onPointerLeave={(e) => { onPointerUpOrLeave(); handleMouseLeave(); void e; }}
          onMouseMove={handleMouseMove}
        >
          {moreButton}
          {longPressIndicator}
          {quickPendingIndicator}
          {rippleElement}
          {/* Left color accent */}
          <motion.div
            className="absolute top-0 left-0 w-1 h-full rounded-l-2xl"
            animate={{ backgroundColor: isDone ? habit.color : '#e7e5e4' }}
            transition={{ duration: 0.3 }}
          />
          {/* Icon with layered background */}
          <div className="relative">
            <motion.div
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center text-xl',
                'shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)]',
              )}
              style={{
                background: `linear-gradient(135deg, ${habit.color}14, ${habit.color}22)`,
                ...(reduceMotion ? {} : { x: iconX, y: iconY }),
              }}
            >
              {habit.icon || '📌'}
            </motion.div>
            {/* Check overlay on icon */}
            <AnimatePresence>
              {isDone && (
                <motion.div
                  className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white"
                  style={{ backgroundColor: habit.color }}
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 45 }}
                  transition={spring.emphasized}
                >
                  <Check className="w-2.5 h-2.5 text-white" strokeWidth={3.5} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {/* Name */}
          <div className={cn(
            'text-[11px] font-semibold text-center line-clamp-1 w-full px-0.5 leading-snug',
            isDone ? 'text-stone-500' : 'text-stone-800',
          )}>
            {habit.name}
          </div>
          {/* Streak or count */}
          <div className="h-4 flex items-center">
            <AnimatePresence mode="wait">
              {todayCount > 1 ? (
                <motion.span
                  key="count"
                  className="text-[10px] font-bold px-1.5 rounded-full leading-4"
                  style={{ backgroundColor: habit.color + '18', color: habit.color }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={spring.snappy}
                >
                  ×{todayCount}
                </motion.span>
              ) : streak >= 2 ? (
                <motion.span
                  key="streak"
                  className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-600"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Flame className="w-2.5 h-2.5" strokeWidth={2.5} />
                  {streak}
                </motion.span>
              ) : (
                <span key="empty" className="text-[10px] text-transparent">.</span>
              )}
            </AnimatePresence>
          </div>
        </motion.button>
        <BottomSheet open={open} onOpenChange={setOpen}>
          {sheetContent}
        </BottomSheet>
      </>
    )
  }

  // ── Normal mode (2-column grid card) ─────────────────────
  return (
    <>
      <motion.button
        whileTap={reduceMotion ? undefined : { scale: 0.97, transition: spring.snappy }}
        whileHover={reduceMotion || isDone ? undefined : { y: -2, transition: spring.smooth }}
        style={{
          ...style,
          ...tiltStyle,
        }}
        ref={cardRef}
        className={cn(
          'group relative flex items-center gap-2.5 px-3 py-2.5 rounded-2xl tap-scale',
          'text-left w-full select-none overflow-hidden',
          'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2',
          isQuickSubmitting && 'pointer-events-none',
          isDone
            ? 'bg-white/60 shadow-sm'
            : 'bg-white shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-[box-shadow,transform] duration-200',
          celebrating && 'animate-celebrate',
        )}
        aria-label={`打卡：${habit.name}`}
        onClick={handleCardClick}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUpOrLeave}
        onPointerLeave={(e) => { onPointerUpOrLeave(); handleMouseLeave(); void e; }}
        onMouseMove={handleMouseMove}
      >
        {moreButton}
        {longPressIndicator}
        {quickPendingIndicator}
        {rippleElement}
        {/* Left color accent bar */}
        <motion.div
          className="absolute top-0 left-0 w-1 h-full rounded-l-2xl"
          animate={{
            backgroundColor: isDone ? habit.color : '#e7e5e4',
            opacity: isDone ? 1 : 0.6,
          }}
          transition={{ duration: 0.3 }}
        />

        {/* Icon */}
        <div className="relative shrink-0">
          <motion.div
            className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center text-lg',
              'shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)]',
            )}
            style={{
              background: `linear-gradient(135deg, ${habit.color}14, ${habit.color}22)`,
              ...(reduceMotion ? {} : { x: iconX, y: iconY }),
            }}
          >
            {habit.icon || '📌'}
          </motion.div>
          {/* Check overlay */}
          <AnimatePresence>
            {isDone && (
              <motion.div
                className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white"
                style={{ backgroundColor: habit.color }}
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 45 }}
                transition={spring.emphasized}
              >
                <Check className="w-2.5 h-2.5 text-white" strokeWidth={3.5} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className={cn(
            'font-bold text-[13px] leading-snug line-clamp-1',
            isDone ? 'text-stone-500' : 'text-stone-900',
          )}>
            {habit.name}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5">
            <AnimatePresence mode="wait">
              {isDone ? (
                <motion.span
                  key="done"
                  className="inline-flex items-center gap-0.5 text-[11px] font-semibold"
                  style={{ color: habit.color }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={spring.snappy}
                >
                  <Check className="w-3 h-3" strokeWidth={2.5} />
                  {todayCount > 1 ? `×${todayCount}` : '已完成'}
                </motion.span>
              ) : (
                <motion.span
                  key="undone"
                  className="text-[11px] text-stone-400 font-medium"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={spring.snappy}
                >
                  待打卡
                </motion.span>
              )}
            </AnimatePresence>
            {streakBadge && <span className="text-stone-200">·</span>}
            {streakBadge}
          </div>
        </div>
      </motion.button>
      <BottomSheet open={open} onOpenChange={setOpen}>
        {sheetContent}
      </BottomSheet>
    </>
  )
}
