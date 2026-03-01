import { useState } from 'react'
import { Check, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
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
import { useCheckIn } from '@/hooks/useCheckIns'

interface HabitCardProps {
  habit: Habit
  todayCount: number
  style?: React.CSSProperties
}

export function HabitCard({ habit, todayCount, style }: HabitCardProps) {
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  const checkIn = useCheckIn()
  const isDone = todayCount > 0

  async function handleCheckIn() {
    await checkIn.mutateAsync({ habit_id: habit.id, note: note.trim() || undefined })
    setNote('')
    setOpen(false)
  }

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
              : 'bg-white border-stone-200 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)]'
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
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center animate-check-bounce',
                )}
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

      {/* Check-in Sheet */}
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
          <div className="space-y-2">
            <Label htmlFor="note">备注（可选）</Label>
            <Textarea
              id="note"
              placeholder="记录一下这次的感受、数据或备注…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
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
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
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
        </div>
      </BottomSheetContent>
    </BottomSheet>
  )
}
