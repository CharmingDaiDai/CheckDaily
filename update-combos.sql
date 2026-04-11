-- ================================================
-- 打卡 App · Supabase Database Setup SQL for Combos
-- 在 Supabase 控制台 → SQL Editor 中执行此脚本
-- ================================================

CREATE TABLE IF NOT EXISTS public.habit_combos (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  color       text NOT NULL DEFAULT '#f97316',
  icon        text NOT NULL DEFAULT '🚀',
  habit_ids   uuid[] NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Index for user queries
CREATE INDEX IF NOT EXISTS habit_combos_user_id_idx ON public.habit_combos (user_id);

-- ── ROW LEVEL SECURITY ───────────────────────
ALTER TABLE public.habit_combos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "habit_combos: users can read own"   ON public.habit_combos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "habit_combos: users can insert own" ON public.habit_combos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "habit_combos: users can update own" ON public.habit_combos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "habit_combos: users can delete own" ON public.habit_combos FOR DELETE USING (auth.uid() = user_id);
