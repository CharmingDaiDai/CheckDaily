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
      q = q.limit(10000)
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

export function useCheckIn() {
  const userId = useAuthStore((s) => s.user?.id)
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (payload: Omit<CheckInInsert, 'user_id'> & { note?: string }): Promise<CheckIn> => {
      if (!userId) throw new Error('Not authenticated')
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
    },
    onError: () => {
      toast.error('打卡失败，请稍后重试')
    },
  })
}

export function useDeleteCheckIn() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('check_ins').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['checkIns'] })
    },
    onError: () => {
      toast.error('删除失败，请稍后重试')
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
      q = q.limit(10000)
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
