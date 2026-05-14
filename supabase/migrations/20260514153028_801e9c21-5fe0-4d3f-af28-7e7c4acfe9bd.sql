create table if not exists public.meal_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  meal_name text not null,
  meal_type text not null default 'Lunch',
  protein_g numeric(6,1) not null,
  calories integer,
  created_at timestamptz not null default now()
);
alter table public.meal_logs enable row level security;
create policy "Users can manage their own meal logs" on public.meal_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists meal_logs_user_date on public.meal_logs(user_id, date desc);

create table if not exists public.meal_presets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  meal_type text not null default 'Lunch',
  protein_g numeric(6,1) not null,
  calories integer,
  created_at timestamptz not null default now()
);
alter table public.meal_presets enable row level security;
create policy "Users can manage their own meal presets" on public.meal_presets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.nutrition_goals (
  user_id uuid primary key references auth.users(id) on delete cascade,
  daily_protein_g integer not null default 160,
  daily_calories integer,
  updated_at timestamptz not null default now()
);
alter table public.nutrition_goals enable row level security;
create policy "Users can manage their own nutrition goals" on public.nutrition_goals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);