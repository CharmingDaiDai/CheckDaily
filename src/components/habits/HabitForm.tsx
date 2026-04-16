import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn, HABIT_COLORS } from '@/lib/utils'
import type { Habit } from '@/types'
import { useCreateHabit, useUpdateHabit } from '@/hooks/useHabits'
import {
  DEFAULT_HABIT_ICON_KEY,
  HABIT_ICON_OPTIONS,
  HabitIcon,
  isPresetHabitIcon,
} from '@/lib/habitIcons'

const COLOR_NAMES: Record<string, string> = {
  '#f97316': '橙色', '#ef4444': '红色', '#ec4899': '粉色', '#a855f7': '紫色',
  '#6366f1': '靛蓝', '#3b82f6': '蓝色', '#06b6d4': '青色', '#14b8a6': '绿松石',
  '#22c55e': '绿色', '#84cc16': '黄绿', '#eab308': '黄色', '#f59e0b': '琥珀',
}

interface HabitFormProps {
  existing?: Habit
  onClose: () => void
}

export function HabitForm({ existing, onClose }: HabitFormProps) {
  const [name, setName] = useState(existing?.name ?? '')
  const [color, setColor] = useState(existing?.color ?? HABIT_COLORS[0])
  const [icon, setIcon] = useState(existing?.icon ?? DEFAULT_HABIT_ICON_KEY)
  const usingLegacyIcon = !!existing?.icon && !isPresetHabitIcon(existing.icon)

  const create = useCreateHabit()
  const update = useUpdateHabit()
  const isPending = create.isPending || update.isPending

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault()
    if (!name.trim()) return
    try {
      if (existing) {
        await update.mutateAsync({ id: existing.id, name: name.trim(), color, icon })
      } else {
        await create.mutateAsync({ name: name.trim(), color, icon })
      }
      onClose()
    } catch {
      // toast.error is handled by the mutation's onError
    }
  }

  function selectPreset(iconKey: string) {
    setIcon(iconKey)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="habit-name">项目名称 <span aria-hidden="true" className="text-brand-600">*</span></Label>
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
        <fieldset className="space-y-2">
          <legend className="sr-only">图标选择器</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 max-h-52 overflow-y-auto pr-0.5 custom-scrollbar">
          {HABIT_ICON_OPTIONS.map((option) => {
            const selected = icon === option.key
            const tone = option.tone
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => selectPreset(option.key)}
                className={cn(
                  'flex items-center gap-2.5 p-2 rounded-xl border transition-all duration-150 tap-scale text-left',
                  selected
                    ? 'shadow-sm'
                    : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50'
                )}
                style={selected ? { borderColor: tone + '88', backgroundColor: tone + '14' } : undefined}
                aria-label={`选择图标 ${option.label}`}
              >
                <span
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: tone + (selected ? '26' : '14'), color: tone }}
                >
                  <HabitIcon icon={option.key} className="w-5 h-5" color={tone} strokeWidth={2.3} />
                </span>
                <span className="text-[12px] font-semibold text-stone-700 truncate">{option.label}</span>
              </button>
            )
          })}
          </div>
        </fieldset>
        {usingLegacyIcon && (
          <p className="text-xs text-amber-600 font-medium">当前项目使用旧版 emoji 图标，保存后可切换为素材库图标。</p>
        )}
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
              aria-label={COLOR_NAMES[c] ?? c}
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
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: color + '25' }}
        >
          <HabitIcon icon={icon} className="w-5 h-5" color={color} fallback="📌" />
        </div>
        <span className="font-bold text-stone-900 text-sm">{name || '项目名称预览'}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
          取消
        </Button>
        <Button
          type="submit"
          className="flex-1"
          disabled={!name.trim()}
          style={{ backgroundColor: color }}
          isLoading={isPending}
          loadingText="保存中…"
        >
          {existing ? '保存修改' : '创建项目'}
        </Button>
      </div>
    </form>
  )
}
