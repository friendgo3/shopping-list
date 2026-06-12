-- 쇼핑 리스트 테이블
create table shopping_items (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

-- RLS 활성화
alter table shopping_items enable row level security;

-- 누구나 읽기/쓰기 허용 (anon key 사용)
create policy "allow all" on shopping_items
  for all using (true) with check (true);
