-- =============================================
-- 오늘 뭐 먹지 (Food Mood) Phase 2 마이그레이션 SQL
-- 1) 소셜 로그인 프로필 (profiles)
-- 2) 계정간 찜 동기화 (user_favorites)
-- 3) DB 기반 음식 데이터 (foods)
-- =============================================

-- 1. Profiles 테이블 (Supabase Auth 연동)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  nickname text,
  avatar_url text,
  provider text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile" on public.profiles
  for select to authenticated using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update to authenticated using (auth.uid() = id);

-- 2. 계정 동기화 찜 테이블 (user_favorites)
create table if not exists public.user_favorites (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  food_id integer not null,
  food_name text not null,
  created_at timestamptz default now(),
  unique(user_id, food_id)
);

alter table public.user_favorites enable row level security;

create policy "Users can view own favorites" on public.user_favorites
  for select to authenticated using (auth.uid() = user_id);

create policy "Users can insert own favorites" on public.user_favorites
  for insert to authenticated with check (auth.uid() = user_id);

create policy "Users can delete own favorites" on public.user_favorites
  for delete to authenticated using (auth.uid() = user_id);

-- 3. 동적 메뉴 DB (foods 테이블)
create table if not exists public.foods (
  id serial primary key,
  name text not null unique,
  kind text not null,
  spice int check (spice between 0 and 4),
  fill int check (fill between 0 and 4),
  warm int check (warm between 0 and 4),
  ease int check (ease between 0 and 4),
  comfort int check (comfort between 0 and 4),
  light int check (light between 0 and 4),
  themes text[],
  image_url text,
  active boolean default true,
  created_at timestamptz default now()
);

alter table public.foods enable row level security;

create policy "Allow public read active foods" on public.foods
  for select to anon, authenticated using (active = true);
