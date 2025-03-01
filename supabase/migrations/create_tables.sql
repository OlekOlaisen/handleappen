-- Create meals table
create table public.meals (
    id uuid primary key default gen_random_uuid(),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    name text not null,
    user_id uuid references auth.users(id)
);

-- Create meal_items table
create table public.meal_items (
    meal_id uuid references public.meals(id) on delete cascade,
    product_ean text not null,
    quantity integer not null,
    product_data jsonb not null,
    primary key (meal_id, product_ean)
);

-- Create week_plans table
create table public.week_plans (
    id uuid primary key default gen_random_uuid(),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    start_date date not null,
    user_id uuid references auth.users(id)
);

-- Create week_plan_days table
create table public.week_plan_days (
    plan_id uuid references public.week_plans(id) on delete cascade,
    day text not null,
    meal_ids uuid[] not null default '{}',
    primary key (plan_id, day)
);

-- Add RLS policies
alter table public.meals enable row level security;
alter table public.meal_items enable row level security;
alter table public.week_plans enable row level security;
alter table public.week_plan_days enable row level security;

-- Policies for meals
create policy "Public read access"
on public.meals for select
using (true);

create policy "Users can insert their own meals"
on public.meals for insert
with check (auth.uid() = user_id);

create policy "Users can update their own meals"
on public.meals for update
using (auth.uid() = user_id);

create policy "Users can delete their own meals"
on public.meals for delete
using (auth.uid() = user_id);

-- Policies for meal_items
create policy "Public read access"
on public.meal_items for select
using (true);

create policy "Users can insert meal items for their meals"
on public.meal_items for insert
with check (
    exists (
        select 1
        from public.meals
        where id = meal_items.meal_id
        and user_id = auth.uid()
    )
);

create policy "Users can update meal items for their meals"
on public.meal_items for update
using (
    exists (
        select 1
        from public.meals
        where id = meal_items.meal_id
        and user_id = auth.uid()
    )
);

create policy "Users can delete meal items for their meals"
on public.meal_items for delete
using (
    exists (
        select 1
        from public.meals
        where id = meal_items.meal_id
        and user_id = auth.uid()
    )
);

-- Policies for week_plans
create policy "Public read access"
on public.week_plans for select
using (true);

create policy "Users can insert their own week plans"
on public.week_plans for insert
with check (auth.uid() = user_id);

create policy "Users can update their own week plans"
on public.week_plans for update
using (auth.uid() = user_id);

create policy "Users can delete their own week plans"
on public.week_plans for delete
using (auth.uid() = user_id);

-- Policies for week_plan_days
create policy "Public read access"
on public.week_plan_days for select
using (true);

create policy "Users can insert week plan days for their plans"
on public.week_plan_days for insert
with check (
    exists (
        select 1
        from public.week_plans
        where id = week_plan_days.plan_id
        and user_id = auth.uid()
    )
);

create policy "Users can update week plan days for their plans"
on public.week_plan_days for update
using (
    exists (
        select 1
        from public.week_plans
        where id = week_plan_days.plan_id
        and user_id = auth.uid()
    )
);

create policy "Users can delete week plan days for their plans"
on public.week_plan_days for delete
using (
    exists (
        select 1
        from public.week_plans
        where id = week_plan_days.plan_id
        and user_id = auth.uid()
    )
);

