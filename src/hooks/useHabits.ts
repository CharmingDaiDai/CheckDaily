import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { toast } from '@/hooks/useToast'
import type { Habit, HabitInsert, HabitUpdate } from '@/types'

export function useHabits(includeArchived = false) {
  const userId = useAuthStore((s) => s.user?.id)

  return useQuery({
    queryKey: ['habits', userId, includeArchived],
    queryFn: async (): Promise<Habit[]> => {
      if (!userId) return []
      let q = supabase
        .from('habits')
        .select('id, user_id, name, color, icon, archived, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
      if (!includeArchived) q = q.eq('archived', false)
      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as Habit[]
    },
    enabled: !!userId,
  })
}

export function useCreateHabit() {
  const userId = useAuthStore((s) => s.user?.id)
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (payload: Omit<HabitInsert, 'user_id'>): Promise<Habit> => {
      if (!userId) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('habits')
        .insert({ ...payload, user_id: userId } as HabitInsert & { user_id: string })
        .select('id, user_id, name, color, icon, archived, created_at')
        .single()
      if (error) throw error
      return data as Habit
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['habits'] })
    },
    onError: () => {
      toast.error('创建失败，请稍后重试')
    },
  })
}

export function useUpdateHabit() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...update }: Omit<HabitUpdate, 'id'> & { id: string }): Promise<Habit> => {
      const { data, error } = await supabase
        .from('habits')
        .update(update as HabitUpdate)
        .eq('id', id)
        .select('id, user_id, name, color, icon, archived, created_at')
        .single()
      if (error) throw error
      return data as Habit
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['habits'] })
    },
    onError: () => {
      toast.error('更新失败，请稍后重试')
    },
  })
}

export function useArchiveHabit() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('habits')
        .update({ archived: true } as HabitUpdate)
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['habits'] })
      void qc.invalidateQueries({ queryKey: ['checkIns'] })
    },
    onError: () => {
      toast.error('归档失败，请稍后重试')
    },
  })
}

export function useRestoreHabit() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('habits')
        .update({ archived: false } as HabitUpdate)
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['habits'] })
    },
    onError: () => {
      toast.error('恢复失败，请稍后重试')
    },
  })
}
