import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { formatDate, today } from '@/lib/utils'
import { toast } from '@/hooks/useToast'
import type { CheckIn, CheckInInsert } from '@/types'

function toUtcStartOfLocalDay(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d, 0, 0, 0, 0).toISOString()
}

function toUtcEndOfLocalDay(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d, 23, 59, 59, 999).toISOString()
}

async function assertOwnedHabitIds(userId: string, habitIds: string[]) {
  const uniqueHabitIds = [...new Set(habitIds)]
  if (uniqueHabitIds.length === 0) return

  const { data, error } = await supabase
    .from('habits')
    .select('id')
    .eq('user_id', userId)
    .in('id', uniqueHabitIds)

  if (error) throw error

  const ownedIds = new Set((data ?? []).map((row) => row.id))
  const missingIds = uniqueHabitIds.filter((id) => !ownedIds.has(id))

  if (missingIds.length > 0) {
    throw new Error('包含无权限的打卡项目')
  }
}

export function useCheckIns(opts?: { habitId?: string; startDate?: string; endDate?: string }) {
  const userId = useAuthStore((s) => s.user?.id)
  const { habitId, startDate, endDate } = opts ?? {}

  return useQuery({
    queryKey: ['checkIns', userId, habitId, startDate, endDate],
    queryFn: async (): Promise<CheckIn[]> => {
      if (!userId) return []
      let q = supabase
        .from('check_ins')
        .select('id, habit_id, user_id, checked_at, note, created_at')
        .eq('user_id', userId)
        .order('checked_at', { ascending: false })
      if (habitId) q = q.eq('habit_id', habitId)
      if (startDate) q = q.gte('checked_at', toUtcStartOfLocalDay(startDate))
      if (endDate) q = q.lte('checked_at', toUtcEndOfLocalDay(endDate))
      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as CheckIn[]
    },
    enabled: !!userId,
  })
}

export function useTodayCheckIns() {
  const todayStr = today()
  return useCheckIns({ startDate: todayStr, endDate: todayStr })
}

/**
 * Fetches check-ins page by page until every habit's current streak is fully
 * contained in what was fetched. Keeps long streaks correct without a fixed window.
 */
export function useStreakCheckIns() {
  const userId = useAuthStore((s) => s.user?.id)

  return useQuery({
    queryKey: ['streakCheckIns', userId],
    queryFn: async (): Promise<Array<{ id: string; habit_id: string; checked_at: string }>> => {
      if (!userId) return []
      const pageSize = 1000
      const rows: Array<{ id: string; habit_id: string; checked_at: string }> = []

      for (let page = 0; page < 50; page += 1) {
        const { data, error } = await supabase
          .from('check_ins')
          .select('id, habit_id, checked_at')
          .eq('user_id', userId)
          .order('checked_at', { ascending: false })
          .range(page * pageSize, page * pageSize + pageSize - 1)
        if (error) throw error

        const batch = data ?? []
        rows.push(...batch)
        if (batch.length < pageSize) break
        if (!hasOpenStreak(rows)) break
      }

      return rows
    },
    enabled: !!userId,
  })
}

function previousDay(dateStr: string) {
  const d = new Date(Number(dateStr.slice(0, 4)), Number(dateStr.slice(5, 7)) - 1, Number(dateStr.slice(8, 10)))
  d.setDate(d.getDate() - 1)
  return formatDate(d)
}

/** True when some habit's current streak may still extend past the oldest fetched date. */
function hasOpenStreak(rows: Array<{ habit_id: string; checked_at: string }>) {
  const byHabit = new Map<string, Set<string>>()
  for (const row of rows) {
    const date = formatDate(row.checked_at)
    const set = byHabit.get(row.habit_id)
    if (set) set.add(date)
    else byHabit.set(row.habit_id, new Set([date]))
  }

  const todayStr = today()
  const yesterday = previousDay(todayStr)

  for (const dates of byHabit.values()) {
    // computeStreak starts at today when it is checked, otherwise at yesterday.
    const start = dates.has(todayStr) ? todayStr : yesterday
    if (!dates.has(start)) continue

    const boundary = [...dates].sort()[0]
    let cursor = start
    let oldest = start
    while (dates.has(cursor)) {
      oldest = cursor
      cursor = previousDay(cursor)
    }

    // Chain runs off the edge of the fetched window — earlier days might continue it.
    if (oldest === boundary) {
      // A streak of just "today" is already complete: yesterday is missing, so
      // nothing earlier can extend it.
      if (!(start === todayStr && oldest === todayStr)) return true
    }
  }

  return false
}

export function useCheckIn() {
  const userId = useAuthStore((s) => s.user?.id)
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (payload: Omit<CheckInInsert, 'user_id'> & { note?: string }): Promise<CheckIn> => {
      if (!userId) throw new Error('Not authenticated')
      await assertOwnedHabitIds(userId, [payload.habit_id])
      const { data, error } = await supabase
        .from('check_ins')
        .insert({
          habit_id: payload.habit_id,
          user_id: userId,
          checked_at: payload.checked_at ?? new Date().toISOString(),
          note: payload.note ?? null,
        } as CheckInInsert & { user_id: string })
        .select('id, habit_id, user_id, checked_at, note, created_at')
        .single()
      if (error) throw error
      return data as CheckIn
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['checkIns'] })
      void qc.invalidateQueries({ queryKey: ['streakCheckIns'] })
      void qc.invalidateQueries({ queryKey: ['yearCounts'] })
    },
    onError: () => {
      toast.error('打卡失败，请稍后重试')
    },
  })
}

export function useUpdateCheckIn() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, note }: { id: string; note: string | null }): Promise<CheckIn> => {
      const { data, error } = await supabase
        .from('check_ins')
        .update({ note })
        .eq('id', id)
        .select('id, habit_id, user_id, checked_at, note, created_at')
        .single()
      if (error) throw error
      return data as CheckIn
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['checkIns'] })
    },
    onError: () => {
      toast.error('备注保存失败，请稍后重试')
    },
  })
}

export function useDeleteCheckIn() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string | string[]) => {
      let q = supabase.from('check_ins').delete()
      if (Array.isArray(id)) {
        if (id.length === 0) return
        q = q.in('id', id)
      } else {
        q = q.eq('id', id)
      }
      const { error } = await q
      if (error) throw error
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['checkIns'] })
      void qc.invalidateQueries({ queryKey: ['streakCheckIns'] })
      void qc.invalidateQueries({ queryKey: ['yearCounts'] })
    },
    onError: () => {
      toast.error('撤销失败，请稍后重试')
    },
  })
}

/** Returns { [date: string]: number } map for a year range */
export function useYearlyCheckInCounts(habitId?: string, year?: number) {
  const userId = useAuthStore((s) => s.user?.id)
  const resolvedYear = year ?? new Date().getFullYear()

  return useQuery({
    queryKey: ['yearCounts', userId, habitId, resolvedYear],
    queryFn: async () => {
      if (!userId) return {} as Record<string, number>
      let q = supabase
        .from('check_ins')
        .select('checked_at')
        .eq('user_id', userId)
        .gte('checked_at', toUtcStartOfLocalDay(`${resolvedYear}-01-01`))
        .lte('checked_at', toUtcEndOfLocalDay(`${resolvedYear}-12-31`))
      if (habitId) q = q.eq('habit_id', habitId)
      const { data, error } = await q
      if (error) throw error
      const counts: Record<string, number> = {}
      for (const row of (data ?? []) as Array<{ checked_at: string }>) {
        const d = formatDate(row.checked_at)
        counts[d] = (counts[d] ?? 0) + 1
      }
      return counts
    },
    enabled: !!userId,
  })
}

export function useCheckInCombo() {
  const qc = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id)

  return useMutation({
    mutationFn: async (params: { habitIds: string[], checkedAt?: string }): Promise<CheckIn[]> => {
      if (!userId) throw new Error('Not logged in')
      if (!params.habitIds.length) return []
      await assertOwnedHabitIds(userId, params.habitIds)

      const payloads = params.habitIds.map(hId => ({
        habit_id: hId,
        user_id: userId,
        checked_at: params.checkedAt || new Date().toISOString()
      }))

      const { data, error } = await supabase
        .from('check_ins')
        .insert(payloads)
        .select()

      if (error) throw new Error(error.message)
      return data as CheckIn[]
    },
    onSuccess: () => {
      // Invalidate all variations of checkIns
      void qc.invalidateQueries({ queryKey: ['checkIns'] })
      void qc.invalidateQueries({ queryKey: ['streakCheckIns'] })
      void qc.invalidateQueries({ queryKey: ['yearCounts'] })
    },
    onError: (err) => toast.error(`组合打卡失败: ${err.message}`),
  })
}
