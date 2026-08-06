create table if not exists trend_items (
  id bigserial primary key,
  name text not null,
  kind text,
  description text,
  image_url text,
  rise_pct numeric,
  sources text[],
  spice int, fill int, warm int, ease int, comfort int, light int,
  matched_food_name text,
  rank int default 0,
  active boolean default true,
  created_at timestamptz default now()
);

alter table trend_items enable row level security;

create policy "anon_select_active" on trend_items
  for select to anon using (active = true);

insert into trend_items
  (name, kind, description, rise_pct, sources, spice, fill, warm, ease, comfort, light, matched_food_name, rank)
values
  ('두바이 초콜릿','디저트','바삭한 카다이프와 피스타치오 크림',184,'{naver,youtube}',0,1,0,4,3,1,null,1),
  ('냉모밀','일식','더울수록 생각나는 시원한 한 그릇',142,'{naver,youtube}',0,2,0,3,2,4,'메밀소바',2),
  ('요거트 아이스크림','디저트','토핑 골라 담는 재미',312,'{youtube}',0,1,0,4,3,3,null,3),
  ('평양냉면','한식','슴슴한 육수의 매력',97,'{naver}',0,2,0,2,2,3,null,4),
  ('마라탕후루','분식','맵고 달콤한 조합',-61,'{naver}',4,3,3,2,2,1,null,5);
