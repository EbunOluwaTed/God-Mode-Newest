-- ============================================================
-- GodMode Dashboard — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  username      text UNIQUE NOT NULL,
  display_name  text NOT NULL,
  pin           text NOT NULL,
  categories    text[] DEFAULT ARRAY['Work','Academics','Personal'],
  created_at    timestamptz DEFAULT now()
);

-- TASKS TABLE
CREATE TABLE IF NOT EXISTS public.tasks (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title       text NOT NULL,
  sub         text DEFAULT '',
  area        text DEFAULT 'Personal',
  status      text DEFAULT 'wait' CHECK (status IN ('fire','prog','wait','done')),
  due         date,
  created_at  timestamptz DEFAULT now()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS tasks_user_id_idx ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS tasks_due_idx ON public.tasks(due);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON public.tasks(status);

-- ROW LEVEL SECURITY
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read/write users (PIN-based auth, no JWT)
DROP POLICY IF EXISTS "users_open" ON public.users;
CREATE POLICY "users_open" ON public.users
  FOR ALL USING (true) WITH CHECK (true);

-- Allow anyone to read/write tasks (user_id checked in app)
DROP POLICY IF EXISTS "tasks_open" ON public.tasks;
CREATE POLICY "tasks_open" ON public.tasks
  FOR ALL USING (true) WITH CHECK (true);
