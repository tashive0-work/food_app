create table if not exists feedback (
  id bigserial primary key,
  anon_id text,
  type text not null check (type in ('bug','info_error','suggestion','recommend','other')),
  content text not null,
  food_name text,
  contact_email text,
  device_type text,
  status text default 'pending' check (status in ('pending','in_progress','done')),
  created_at timestamptz default now()
);

alter table feedback enable row level security;

-- 익명 사용자는 등록만 가능, 조회 불가
create policy "anon_insert_only" on feedback
  for insert to anon with check (true);
