-- Create cart_items table
create table public.cart_items (
    id uuid primary key default gen_random_uuid(),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    user_id uuid references auth.users(id) not null,
    product_ean text not null,
    quantity integer not null,
    product_data jsonb not null,
    unique(user_id, product_ean)
);

-- Add RLS policies
alter table public.cart_items enable row level security;

-- Policies for cart_items
create policy "Users can view their own cart items"
on public.cart_items for select
using (auth.uid() = user_id);

create policy "Users can insert their own cart items"
on public.cart_items for insert
with check (auth.uid() = user_id);

create policy "Users can update their own cart items"
on public.cart_items for update
using (auth.uid() = user_id);

create policy "Users can delete their own cart items"
on public.cart_items for delete
using (auth.uid() = user_id);

