import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { toast } from '@/hooks/useToast'
import type { HabitInsert, CheckInInsert } from '@/types'

/** Shape written by the export button on the profile page. */
type ExportHabit = {
  id: string
  name: string
  color?: string
  icon?: string
  archived?: boolean
  created_at?: string
}

type ExportCheckIn = {
  habit_id: string
  checked_at: string
  note?: string | null
  created_at?: string
}

export type ExportPayload = {
  exportedAt?: string
  habits: ExportHabit[]
  checkIns: ExportCheckIn[]
}

export type ImportSummary = {
  habitsCreated: number
  habitsReused: number
  checkInsCreated: number
  checkInsSkipped: number
}

const INSERT_CHUNK = 500

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

/**
 * Validates arbitrary JSON against the export shape.
 * Throws with a user-facing message instead of silently importing garbage.
 */
export function parseExportPayload(raw: unknown): ExportPayload {
  const root = asRecord(raw)
  if (!root) throw new Error('文件内容不是有效的 JSON 对象')

  const habitsRaw = root.habits
  const checkInsRaw = root.checkIns ?? root.check_ins
  if (!Array.isArray(habitsRaw)) throw new Error('文件里缺少 habits 列表')
  if (!Array.isArray(checkInsRaw)) throw new Error('文件里缺少 checkIns 列表')

  const habits: ExportHabit[] = []
  for (const item of habitsRaw) {
    const row = asRecord(item)
    if (!row) continue
    const name = typeof row.name === 'string' ? row.name.trim() : ''
    const id = typeof row.id === 'string' ? row.id : ''
    if (!name || !id) continue
    habits.push({
      id,
      name,
      color: typeof row.color === 'string' ? row.color : undefined,
      icon: typeof row.icon === 'string' ? row.icon : undefined,
      archived: typeof row.archived === 'boolean' ? row.archived : false,
      created_at: typeof row.created_at === 'string' ? row.created_at : undefined,
    })
  }

  if (habits.length === 0) throw new Error('文件里没有可导入的习惯')

  const checkIns: ExportCheckIn[] = []
  for (const item of checkInsRaw) {
    const row = asRecord(item)
    if (!row) continue
    const habitId = typeof row.habit_id === 'string' ? row.habit_id : ''
    const checkedAt = typeof row.checked_at === 'string' ? row.checked_at : ''
    if (!habitId || !checkedAt) continue
    checkIns.push({
      habit_id: habitId,
      checked_at: checkedAt,
      note: typeof row.note === 'string' ? row.note : null,
      created_at: typeof row.created_at === 'string' ? row.created_at : undefined,
    })
  }

  return { exportedAt: typeof root.exportedAt === 'string' ? root.exportedAt : undefined, habits, checkIns }
}

export function useImportData() {
  const userId = useAuthStore((s) => s.user?.id)
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (payload: ExportPayload): Promise<ImportSummary> => {
      if (!userId) throw new Error('请先登录再导入数据')

      // Reuse an existing habit when the name already matches, so re-importing
      // the same file twice does not multiply the list.
      const { data: existing, error: existingError } = await supabase
        .from('habits')
        .select('id, name')
        .eq('user_id', userId)
      if (existingError) throw existingError

      const byName = new Map<string, string>()
      for (const row of existing ?? []) byName.set(row.name.trim(), row.id)

      const idMap = new Map<string, string>()
      let habitsCreated = 0
      let habitsReused = 0

      for (const habit of payload.habits) {
        const reusedId = byName.get(habit.name)
        if (reusedId) {
          idMap.set(habit.id, reusedId)
          habitsReused += 1
          continue
        }

        const insert: HabitInsert = {
          user_id: userId,
          name: habit.name,
          color: habit.color ?? '#f97316',
          icon: habit.icon ?? '🏃',
          archived: habit.archived ?? false,
        }
        if (habit.created_at) insert.created_at = habit.created_at

        const { data: created, error } = await supabase
          .from('habits')
          .insert(insert as HabitInsert & { user_id: string })
          .select('id')
          .single()
        if (error) throw error

        idMap.set(habit.id, created.id)
        byName.set(habit.name, created.id)
        habitsCreated += 1
      }

      // Check-ins whose habit did not survive the mapping are dropped.
      const mapped = payload.checkIns.flatMap<CheckInInsert>((ci) => {
        const habitId = idMap.get(ci.habit_id)
        if (!habitId) return []
        const row: CheckInInsert = {
          habit_id: habitId,
          user_id: userId,
          checked_at: ci.checked_at,
          note: ci.note ?? null,
        }
        if (ci.created_at) row.created_at = ci.created_at
        return [row]
      })
      const checkInsSkipped = payload.checkIns.length - mapped.length

      let checkInsCreated = 0
      for (let i = 0; i < mapped.length; i += INSERT_CHUNK) {
        const chunk = mapped.slice(i, i + INSERT_CHUNK)
        const { error } = await supabase
          .from('check_ins')
          .insert(chunk as Array<CheckInInsert & { user_id: string }>)
        if (error) throw error
        checkInsCreated += chunk.length
      }

      return { habitsCreated, habitsReused, checkInsCreated, checkInsSkipped }
    },
    onSuccess: (summary) => {
      void qc.invalidateQueries({ queryKey: ['habits'] })
      void qc.invalidateQueries({ queryKey: ['checkIns'] })
      void qc.invalidateQueries({ queryKey: ['streakCheckIns'] })
      void qc.invalidateQueries({ queryKey: ['yearCounts'] })

      const reused = summary.habitsReused > 0 ? `，复用同名 ${summary.habitsReused} 个` : ''
      toast.success(
        `导入完成：新建 ${summary.habitsCreated} 个项目${reused}，${summary.checkInsCreated} 条打卡`,
        { duration: 6000 },
      )
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : '导入失败，请检查文件格式')
    },
  })
}
