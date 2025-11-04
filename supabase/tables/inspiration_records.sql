-- 灵感记录表 - 存储用户自由输入的经历记录
create table if not exists public.inspiration_records (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  chapter text not null,
  category text not null,
  content text not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint inspiration_records_pkey primary key (id),
  constraint inspiration_records_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade
);

-- 创建索引以提高查询性能
create index if not exists idx_inspiration_records_user_id on public.inspiration_records(user_id);
create index if not exists idx_inspiration_records_category on public.inspiration_records(category);
create index if not exists idx_inspiration_records_created_at on public.inspiration_records(created_at desc);

-- 启用行级安全策略（RLS）
alter table public.inspiration_records enable row level security;

-- 创建策略：用户只能查看和修改自己的记录
create policy "Users can view their own inspiration records" 
  on public.inspiration_records
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own inspiration records" 
  on public.inspiration_records
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own inspiration records" 
  on public.inspiration_records
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own inspiration records" 
  on public.inspiration_records
  for delete
  using (auth.uid() = user_id);
