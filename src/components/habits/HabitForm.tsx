import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn, HABIT_COLORS, HABIT_ICONS } from '@/lib/utils'
import type { Habit } from '@/types'
import { useCreateHabit, useUpdateHabit } from '@/hooks/useHabits'

interface HabitFormProps {
  existing?: Habit
  onClose: () => void
}

export function HabitForm({ existing, onClose }: HabitFormProps) {
  const [name, setName] = useState(existing?.name ?? '')
  const [color, setColor] = useState(existing?.color ?? HABIT_COLORS[0])
  const [icon, setIcon] = useState(existing?.icon ?? '🏃')

  const create = useCreateHabit()
  const update = useUpdateHabit()
  const isPending = create.isPending || update.isPending

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    if (existing) {
      await update.mutateAsync({ id: existing.id, name: name.trim(), color, icon })
    } else {
      await create.mutateAsync({ name: name.trim(), color, icon })
    }
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="habit-name">项目名称</Label>
        <Input
          id="habit-name"
          placeholder="例：晨跑、俯卧撑、冥想…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={30}
          required
          autoFocus
        />
      </div>

      {/* Icon picker */}
      <div className="space-y-2">
        <Label>选择图标</Label>
        <div className="grid grid-cols-8 gap-2">
          {HABIT_ICONS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setIcon(e)}
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center text-xl',
                'border-2 transition-all duration-150 tap-scale',
                icon === e
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-transparent bg-stone-100 hover:bg-stone-200'
              )}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Color picker */}
      <div className="space-y-2">
        <Label>选择颜色</Label>
        <div className="flex flex-wrap gap-2.5">
          {HABIT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={cn(
                'w-8 h-8 rounded-full transition-all duration-150 tap-scale',
                'ring-offset-2 ring-offset-white',
                color === c ? 'ring-2 ring-stone-700 scale-110' : 'hover:scale-105'
              )}
              style={{ backgroundColor: c }}
              aria-label={c}
            />
          ))}
        </div>
      </div>

      {/* Preview */}
      <div
        className="flex items-center gap-3 p-3 rounded-xl border-2"
        style={{ borderColor: color + '60', backgroundColor: color + '0e' }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
          style={{ backgroundColor: color + '25' }}
        >
          {icon}
        </div>
        <span className="font-bold text-stone-900 text-sm">{name || '项目名称预览'}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
          取消
        </Button>
        <Button type="submit" className="flex-1" disabled={!name.trim() || isPending}
          style={{ backgroundColor: color }}>
          {isPending ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              保存中…
            </span>
          ) : (
            existing ? '保存修改' : '创建项目'
          )}
        </Button>
      </div>
    </form>
  )
}
