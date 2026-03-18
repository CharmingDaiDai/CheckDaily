import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn, HABIT_COLORS, HABIT_ICONS } from '@/lib/utils'
import { Spinner } from '@/components/ui/spinner'
import type { Habit } from '@/types'
import { useCreateHabit, useUpdateHabit } from '@/hooks/useHabits'

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
  const [icon, setIcon] = useState(existing?.icon ?? '🏃')
  // custom input: pre-fill only if existing icon is not in presets
  const [customIcon, setCustomIcon] = useState(
    existing?.icon && !HABIT_ICONS.includes(existing.icon) ? existing.icon : ''
  )

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

  function selectPreset(emoji: string) {
    setIcon(emoji)
    setCustomIcon('')
  }

  function handleCustomChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setCustomIcon(val)
    if (val.trim()) setIcon(val.trim())
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
          <div className="grid grid-cols-8 gap-1.5 max-h-44 overflow-y-auto pr-0.5">
          {HABIT_ICONS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => selectPreset(e)}
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center text-xl',
                'border-2 transition-all duration-150 tap-scale',
                icon === e && !customIcon
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-transparent bg-stone-100 hover:bg-stone-200'
              )}
              aria-label={`选择图标 ${e}`}
            >
              {e}
            </button>
          ))}
          </div>
        </fieldset>

        {/* Custom emoji input */}
        <div className="flex items-center gap-2 pt-1">
          <span className="text-xs text-stone-500 font-medium shrink-0 w-16">自定义：</span>
          <div className="relative flex-1">
            <Input
              placeholder="粘贴或输入任意 Emoji"
              value={customIcon}
              onChange={handleCustomChange}
              className="text-base pr-10"
              maxLength={8}
              aria-label="自定义图标"
            />
            {customIcon && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xl pointer-events-none">
                {customIcon.trim()}
              </span>
            )}
          </div>
        </div>
        <div className="text-xs text-[var(--color-ink-500)] font-medium" aria-live="polite">
          自定义图标长度：{customIcon.length}/8
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
              <Spinner />
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
