import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn, HABIT_COLORS } from '@/lib/utils'
import type { Habit, HabitCombo } from '@/types'
import { useCreateCombo, useUpdateCombo } from '@/hooks/useCombos'
import { Check } from 'lucide-react'
import {
  COMBO_ICON_OPTIONS,
  DEFAULT_COMBO_ICON_KEY,
  HabitIcon,
  isPresetComboIcon,
} from '@/lib/habitIcons'



interface ComboFormProps {
  existing?: HabitCombo
  habits: Habit[]
  onClose: () => void
}

export function ComboForm({ existing, habits, onClose }: ComboFormProps) {
  const [name, setName] = useState(existing?.name ?? '')
  const [color, setColor] = useState(existing?.color ?? HABIT_COLORS[0])
  const [icon, setIcon] = useState(existing?.icon ?? DEFAULT_COMBO_ICON_KEY)
  const [selectedHabitIds, setSelectedHabitIds] = useState<string[]>(existing?.habit_ids ?? [])
  const usingLegacyIcon = !!existing?.icon && !isPresetComboIcon(existing.icon)

  const create = useCreateCombo()
  const update = useUpdateCombo()
  const isPending = create.isPending || update.isPending

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault()
    if (!name.trim()) return
    if (selectedHabitIds.length === 0) return

    try {
      if (existing) {
        await update.mutateAsync({ id: existing.id, name: name.trim(), color, icon, habit_ids: selectedHabitIds })
      } else {
        await create.mutateAsync({ name: name.trim(), color, icon, habit_ids: selectedHabitIds })
      }
      onClose()
    } catch {
      // errors handled by mutation
    }
  }

  function selectPreset(iconKey: string) {
    setIcon(iconKey)
  }

  function toggleHabit(id: string) {
    setSelectedHabitIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="combo-name">组合名称 <span aria-hidden="true" className="text-brand-600">*</span></Label>
        <Input
          id="combo-name"
          placeholder="例：全身燃脂、睡前放松…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={30}
          required
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label>选择组合包含的项目 <span aria-hidden="true" className="text-brand-600">*</span></Label>
        {habits.length === 0 ? (
          <div className="text-xs text-stone-500 py-2">暂无项目，请先创建单个项目</div>
        ) : (
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 custom-scrollbar">
            {habits.map(h => {
              const selected = selectedHabitIds.includes(h.id)
              return (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => toggleHabit(h.id)}
                  className={cn(
                    "flex flex-col items-start gap-1 p-2 rounded-xl border text-left transition-all tap-scale",
                    selected 
                      ? "border-brand-500 bg-brand-50 shadow-sm" 
                      : "border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50"
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="inline-flex items-center justify-center w-[18px] h-[18px]" style={{ color: h.color }}>
                      <HabitIcon icon={h.icon} className="w-[18px] h-[18px]" color={h.color} fallback="📌" />
                    </span>
                    <div className={cn(
                      "w-4 h-4 rounded-full flex items-center justify-center border",
                      selected ? "bg-brand-500 border-brand-500 text-white" : "border-stone-300"
                    )}>
                      {selected && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                  <span className="text-[13px] font-bold text-stone-900 truncate w-full mt-1">
                    {h.name}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>选择图标</Label>
        <fieldset className="space-y-2">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 max-h-52 overflow-y-auto pr-0.5 custom-scrollbar">
          {COMBO_ICON_OPTIONS.map((option) => {
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
          <p className="text-xs text-amber-600 font-medium">当前组合使用旧版 emoji 图标，保存后可切换为素材库图标。</p>
        )}
      </div>

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
            />
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
          取消
        </Button>
        <Button
          type="submit"
          className="flex-1"
          disabled={!name.trim() || selectedHabitIds.length === 0}
          style={{ backgroundColor: color }}
          isLoading={isPending}
          loadingText="保存中…"
        >
          {existing ? '保存修改' : '创建组合'}
        </Button>
      </div>
    </form>
  )
}