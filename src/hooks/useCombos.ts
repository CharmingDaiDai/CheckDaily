import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { HabitCombo, HabitComboInsert, HabitComboUpdate } from '@/types'
import { toast } from '@/hooks/useToast'
import { useAuthStore } from '@/store/authStore'

export function useCombos() {
  const user = useAuthStore((s) => s.user)

  return useQuery({
    queryKey: ['combos', user?.id],
    queryFn: async (): Promise<HabitCombo[]> => {
      if (!user) return []
      const { data, error } = await supabase
        .from('habit_combos')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw new Error(error.message)
      return (data as HabitCombo[]) ?? []
    },
    enabled: !!user,
  })
}

export function useCreateCombo() {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)

  return useMutation({
    mutationFn: async (payload: Omit<HabitComboInsert, 'user_id'>) => {
      if (!user) throw new Error('Not logged in')
      const { data, error } = await supabase
        .from('habit_combos')
        .insert({ ...payload, user_id: user.id })
        .select()
        .single()

      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['combos'] })
      toast.success('已创建组合')
    },
    onError: (err) => toast.error(`创建失败: ${err.message}`),
  })
}

export function useUpdateCombo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: HabitComboUpdate & { id: string }) => {
      const { id, ...updates } = payload
      const { data, error } = await supabase
        .from('habit_combos')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['combos'] })
      toast.success('组合已更新')
    },
    onError: (err) => toast.error(`更新失败: ${err.message}`),
  })
}

export function useDeleteCombo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('habit_combos').delete().eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['combos'] })
      toast.success('组合已删除')
    },
    onError: (err) => toast.error(`删除失败: ${err.message}`),
  })
}
