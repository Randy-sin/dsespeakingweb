create extension if not exists pgcrypto;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'forum_post_type'
  ) then
    create type public.forum_post_type as enum (
      'paper_discussion',
      'part_a_analysis',
      'part_b_idea',
      'mock_review',
      'exam_tips'
    );
  end if;

  if not exists (
    select 1
    from pg_type
    where typname = 'forum_post_status'
  ) then
    create type public.forum_post_status as enum (
      'draft',
      'published',
      'archived'
    );
  end if;
end
$$;

create table if not exists public.forum_tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.forum_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  paper_id uuid references public.pastpaper_papers(id) on delete set null,
  title text not null check (char_length(trim(title)) between 6 and 140),
  slug text not null unique,
  content text not null check (char_length(trim(content)) between 40 and 12000),
  excerpt text,
  focus_label text,
  post_type public.forum_post_type not null default 'paper_discussion',
  status public.forum_post_status not null default 'published',
  is_featured boolean not null default false,
  view_count integer not null default 0,
  comment_count integer not null default 0,
  like_count integer not null default 0,
  bookmark_count integer not null default 0,
  last_activity_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.forum_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.forum_posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid references public.forum_comments(id) on delete cascade,
  content text not null check (char_length(trim(content)) between 2 and 4000),
  like_count integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table if not exists public.forum_post_likes (
  post_id uuid not null references public.forum_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (post_id, user_id)
);

create table if not exists public.forum_bookmarks (
  post_id uuid not null references public.forum_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (post_id, user_id)
);

create table if not exists public.forum_post_tags (
  post_id uuid not null references public.forum_posts(id) on delete cascade,
  tag_id uuid not null references public.forum_tags(id) on delete cascade,
  primary key (post_id, tag_id)
);

create index if not exists forum_posts_status_last_activity_idx
  on public.forum_posts(status, last_activity_at desc);

create index if not exists forum_posts_paper_id_last_activity_idx
  on public.forum_posts(paper_id, last_activity_at desc);

create index if not exists forum_posts_post_type_last_activity_idx
  on public.forum_posts(post_type, last_activity_at desc);

create index if not exists forum_comments_post_id_created_at_idx
  on public.forum_comments(post_id, created_at asc);

create index if not exists forum_post_tags_tag_id_idx
  on public.forum_post_tags(tag_id, post_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.sync_forum_post_meta()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_post_id uuid;
begin
  target_post_id := coalesce(new.post_id, old.post_id);

  update public.forum_posts
  set
    comment_count = (
      select count(*)
      from public.forum_comments
      where post_id = target_post_id
        and deleted_at is null
    ),
    like_count = (
      select count(*)
      from public.forum_post_likes
      where post_id = target_post_id
    ),
    bookmark_count = (
      select count(*)
      from public.forum_bookmarks
      where post_id = target_post_id
    ),
    last_activity_at = timezone('utc', now()),
    updated_at = timezone('utc', now())
  where id = target_post_id;

  return null;
end;
$$;

drop trigger if exists set_forum_tags_updated_at on public.forum_tags;
create trigger set_forum_tags_updated_at
before update on public.forum_tags
for each row
execute function public.set_updated_at();

drop trigger if exists set_forum_posts_updated_at on public.forum_posts;
create trigger set_forum_posts_updated_at
before update on public.forum_posts
for each row
execute function public.set_updated_at();

drop trigger if exists set_forum_comments_updated_at on public.forum_comments;
create trigger set_forum_comments_updated_at
before update on public.forum_comments
for each row
execute function public.set_updated_at();

drop trigger if exists forum_comments_meta_sync on public.forum_comments;
create trigger forum_comments_meta_sync
after insert or update or delete on public.forum_comments
for each row
execute function public.sync_forum_post_meta();

drop trigger if exists forum_post_likes_meta_sync on public.forum_post_likes;
create trigger forum_post_likes_meta_sync
after insert or delete on public.forum_post_likes
for each row
execute function public.sync_forum_post_meta();

drop trigger if exists forum_bookmarks_meta_sync on public.forum_bookmarks;
create trigger forum_bookmarks_meta_sync
after insert or delete on public.forum_bookmarks
for each row
execute function public.sync_forum_post_meta();

insert into public.forum_tags (slug, name, description)
values
  ('exam-week', 'Exam Week', '考前一週最值得看的重點討論與最後衝刺。'),
  ('part-a', 'Part A', '文章理解、討論點展開、立場建構。'),
  ('part-b', 'Part B', '個人回應思路、例子組織與臨場表達。'),
  ('mock-review', 'Mock Review', '練習後復盤、常見失誤與改進建議。'),
  ('exam-tips', 'Exam Tips', '考前策略、時間管理、搶答與互動技巧。'),
  ('band-5', 'Band 5+', '高分答法、自然表達和深度觀點示例。')
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  updated_at = timezone('utc', now());

alter table public.forum_tags enable row level security;
alter table public.forum_posts enable row level security;
alter table public.forum_comments enable row level security;
alter table public.forum_post_likes enable row level security;
alter table public.forum_bookmarks enable row level security;
alter table public.forum_post_tags enable row level security;

drop policy if exists "forum_tags_are_publicly_readable" on public.forum_tags;
create policy "forum_tags_are_publicly_readable"
on public.forum_tags
for select
using (true);

drop policy if exists "forum_posts_are_publicly_readable" on public.forum_posts;
create policy "forum_posts_are_publicly_readable"
on public.forum_posts
for select
using (status = 'published');

drop policy if exists "forum_posts_insert_own" on public.forum_posts;
create policy "forum_posts_insert_own"
on public.forum_posts
for insert
to authenticated
with check (auth.uid() = author_id);

drop policy if exists "forum_posts_update_own" on public.forum_posts;
create policy "forum_posts_update_own"
on public.forum_posts
for update
to authenticated
using (auth.uid() = author_id)
with check (auth.uid() = author_id);

drop policy if exists "forum_comments_are_publicly_readable" on public.forum_comments;
create policy "forum_comments_are_publicly_readable"
on public.forum_comments
for select
using (deleted_at is null);

drop policy if exists "forum_comments_insert_own" on public.forum_comments;
create policy "forum_comments_insert_own"
on public.forum_comments
for insert
to authenticated
with check (auth.uid() = author_id);

drop policy if exists "forum_comments_update_own" on public.forum_comments;
create policy "forum_comments_update_own"
on public.forum_comments
for update
to authenticated
using (auth.uid() = author_id)
with check (auth.uid() = author_id);

drop policy if exists "forum_post_likes_are_publicly_readable" on public.forum_post_likes;
create policy "forum_post_likes_are_publicly_readable"
on public.forum_post_likes
for select
using (true);

drop policy if exists "forum_post_likes_insert_own" on public.forum_post_likes;
create policy "forum_post_likes_insert_own"
on public.forum_post_likes
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "forum_post_likes_delete_own" on public.forum_post_likes;
create policy "forum_post_likes_delete_own"
on public.forum_post_likes
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "forum_bookmarks_are_privately_readable" on public.forum_bookmarks;
create policy "forum_bookmarks_are_privately_readable"
on public.forum_bookmarks
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "forum_bookmarks_insert_own" on public.forum_bookmarks;
create policy "forum_bookmarks_insert_own"
on public.forum_bookmarks
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "forum_bookmarks_delete_own" on public.forum_bookmarks;
create policy "forum_bookmarks_delete_own"
on public.forum_bookmarks
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "forum_post_tags_are_publicly_readable" on public.forum_post_tags;
create policy "forum_post_tags_are_publicly_readable"
on public.forum_post_tags
for select
using (true);

drop policy if exists "forum_post_tags_insert_for_own_post" on public.forum_post_tags;
create policy "forum_post_tags_insert_for_own_post"
on public.forum_post_tags
for insert
to authenticated
with check (
  exists (
    select 1
    from public.forum_posts
    where forum_posts.id = post_id
      and forum_posts.author_id = auth.uid()
  )
);

drop policy if exists "forum_post_tags_delete_for_own_post" on public.forum_post_tags;
create policy "forum_post_tags_delete_for_own_post"
on public.forum_post_tags
for delete
to authenticated
using (
  exists (
    select 1
    from public.forum_posts
    where forum_posts.id = post_id
      and forum_posts.author_id = auth.uid()
  )
);
