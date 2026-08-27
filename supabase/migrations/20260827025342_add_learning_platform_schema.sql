create table if not exists public.learner_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  exam_year integer not null check (exam_year between 2024 and 2100),
  target_level integer not null check (target_level between 1 and 5),
  gd_confidence integer not null check (gd_confidence between 1 and 5),
  ir_confidence integer not null check (ir_confidence between 1 and 5),
  weak_areas text[] not null default '{}',
  weekly_minutes integer not null check (weekly_minutes between 15 and 600),
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint learner_profiles_weak_areas_valid check (
    weak_areas <@ array['ideas', 'structure', 'interaction', 'language', 'delivery', 'timing']::text[]
  )
);

create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_slug text not null check (char_length(lesson_slug) between 2 and 100),
  completed_at timestamptz not null default timezone('utc', now()),
  practice_minutes integer not null default 0 check (practice_minutes between 0 and 1440),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, lesson_slug)
);

create table if not exists public.practice_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (mode in ('group-discussion', 'individual-response')),
  lesson_slug text,
  paper_id uuid references public.pastpaper_papers(id) on delete set null,
  task_text text not null check (char_length(task_text) between 2 and 5000),
  status text not null default 'draft' check (status in ('draft', 'recorded', 'transcribed', 'analyzed', 'failed')),
  duration_seconds integer check (duration_seconds between 0 and 3600),
  recording_path text,
  transcript text,
  feedback jsonb,
  failure_reason text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.practice_turns (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.practice_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  sequence_number integer not null check (sequence_number between 1 and 100),
  speaker text not null check (speaker in ('learner', 'ai')),
  transcript text not null check (char_length(transcript) between 1 and 5000),
  evidence_feedback jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  unique (session_id, sequence_number)
);

create index if not exists lesson_progress_user_completed_idx
  on public.lesson_progress(user_id, completed_at desc);
create index if not exists practice_sessions_user_created_idx
  on public.practice_sessions(user_id, created_at desc);
create index if not exists practice_turns_user_session_idx
  on public.practice_turns(user_id, session_id, sequence_number);

drop trigger if exists set_learner_profiles_updated_at on public.learner_profiles;
create trigger set_learner_profiles_updated_at
before update on public.learner_profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_lesson_progress_updated_at on public.lesson_progress;
create trigger set_lesson_progress_updated_at
before update on public.lesson_progress
for each row execute function public.set_updated_at();

drop trigger if exists set_practice_sessions_updated_at on public.practice_sessions;
create trigger set_practice_sessions_updated_at
before update on public.practice_sessions
for each row execute function public.set_updated_at();

alter table public.learner_profiles enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.practice_sessions enable row level security;
alter table public.practice_turns enable row level security;

revoke all on table public.learner_profiles, public.lesson_progress, public.practice_sessions, public.practice_turns from anon, authenticated;
grant select, insert, update, delete on table public.learner_profiles, public.lesson_progress, public.practice_sessions, public.practice_turns to authenticated;

create policy "learner_profiles_select_own" on public.learner_profiles
for select to authenticated using ((select auth.uid()) = user_id);
create policy "learner_profiles_insert_own" on public.learner_profiles
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "learner_profiles_update_own" on public.learner_profiles
for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "learner_profiles_delete_own" on public.learner_profiles
for delete to authenticated using ((select auth.uid()) = user_id);

create policy "lesson_progress_select_own" on public.lesson_progress
for select to authenticated using ((select auth.uid()) = user_id);
create policy "lesson_progress_insert_own" on public.lesson_progress
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "lesson_progress_update_own" on public.lesson_progress
for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "lesson_progress_delete_own" on public.lesson_progress
for delete to authenticated using ((select auth.uid()) = user_id);

create policy "practice_sessions_select_own" on public.practice_sessions
for select to authenticated using ((select auth.uid()) = user_id);
create policy "practice_sessions_insert_own" on public.practice_sessions
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "practice_sessions_update_own" on public.practice_sessions
for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "practice_sessions_delete_own" on public.practice_sessions
for delete to authenticated using ((select auth.uid()) = user_id);

create policy "practice_turns_select_own" on public.practice_turns
for select to authenticated using ((select auth.uid()) = user_id);
create policy "practice_turns_insert_own" on public.practice_turns
for insert to authenticated with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.practice_sessions
    where practice_sessions.id = session_id
      and practice_sessions.user_id = (select auth.uid())
  )
);
create policy "practice_turns_update_own" on public.practice_turns
for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "practice_turns_delete_own" on public.practice_turns
for delete to authenticated using ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'speaking-recordings',
  'speaking-recordings',
  false,
  15728640,
  array['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/wav']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "speaking_recordings_select_own" on storage.objects
for select to authenticated using (
  bucket_id = 'speaking-recordings'
  and owner_id = (select auth.uid()::text)
);
create policy "speaking_recordings_insert_own_folder" on storage.objects
for insert to authenticated with check (
  bucket_id = 'speaking-recordings'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
create policy "speaking_recordings_update_own" on storage.objects
for update to authenticated using (
  bucket_id = 'speaking-recordings'
  and owner_id = (select auth.uid()::text)
) with check (
  bucket_id = 'speaking-recordings'
  and owner_id = (select auth.uid()::text)
);
create policy "speaking_recordings_delete_own" on storage.objects
for delete to authenticated using (
  bucket_id = 'speaking-recordings'
  and owner_id = (select auth.uid()::text)
);
