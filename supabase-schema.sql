-- ================================================
-- 打卡 App · Supabase Database Setup SQL
-- 在 Supabase 控制台 → SQL Editor 中执行此脚本
-- ================================================

-- ── 1. HABITS 表 ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.habits (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  color       text NOT NULL DEFAULT '#f97316',
  icon        text NOT NULL DEFAULT '🏃',
  archived    boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Index for user queries
CREATE INDEX IF NOT EXISTS habits_user_id_idx ON public.habits (user_id);

-- ── 2. CHECK_INS 表 ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.check_ins (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  habit_id    uuid NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checked_at  timestamptz NOT NULL DEFAULT now(),
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Indexes for frequent queries
CREATE INDEX IF NOT EXISTS check_ins_user_id_idx      ON public.check_ins (user_id);
CREATE INDEX IF NOT EXISTS check_ins_habit_id_idx     ON public.check_ins (habit_id);
CREATE INDEX IF NOT EXISTS check_ins_checked_at_idx   ON public.check_ins (checked_at DESC);
CREATE INDEX IF NOT EXISTS check_ins_user_date_idx    ON public.check_ins (user_id, checked_at DESC);

-- ── 3. ROW LEVEL SECURITY ───────────────────────
ALTER TABLE public.habits    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

-- ── habits RLS policies ──
CREATE POLICY "habits: users can read own"   ON public.habits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "habits: users can insert own" ON public.habits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "habits: users can update own" ON public.habits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "habits: users can delete own" ON public.habits FOR DELETE USING (auth.uid() = user_id);

-- ── check_ins RLS policies ──
CREATE POLICY "check_ins: users can read own"   ON public.check_ins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "check_ins: users can insert own" ON public.check_ins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "check_ins: users can update own" ON public.check_ins FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "check_ins: users can delete own" ON public.check_ins FOR DELETE USING (auth.uid() = user_id);

-- ================================================
-- OPTIONAL: Insert sample data for testing
-- Replace 'your-user-id' with your actual auth.users id
-- ================================================
-- DO $$
-- DECLARE
--   uid uuid := 'your-user-id-here';
--   h1 uuid; h2 uuid; h3 uuid;
-- BEGIN
--   INSERT INTO habits (user_id, name, color, icon) VALUES (uid, '晨跑', '#22c55e', '🏃') RETURNING id INTO h1;
--   INSERT INTO habits (user_id, name, color, icon) VALUES (uid, '俯卧撑', '#3b82f6', '💪') RETURNING id INTO h2;
--   INSERT INTO habits (user_id, name, color, icon) VALUES (uid, '冥想', '#a855f7', '🧘') RETURNING id INTO h3;
--   
--   -- Last 7 days check-ins
--   FOR i IN 0..6 LOOP
--     INSERT INTO check_ins (habit_id, user_id, checked_at) VALUES (h1, uid, now() - (i || ' days')::interval);
--     IF i < 5 THEN
--       INSERT INTO check_ins (habit_id, user_id, checked_at) VALUES (h2, uid, now() - (i || ' days')::interval);
--     END IF;
--     IF i < 3 THEN
--       INSERT INTO check_ins (habit_id, user_id, checked_at) VALUES (h3, uid, now() - (i || ' days')::interval);
--     END IF;
--   END LOOP;
-- END $$;
