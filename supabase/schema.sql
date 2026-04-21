-- SIMPLYDONE SHELF ANALYZER SCHEMA

-- 1. Tables

-- Users Table (Extended from Auth)
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  name text not null,
  role text not null check (role in ('merchandiser', 'manager')),
  phone text,
  created_at timestamp with time zone default now()
);

-- Outlets Table
create table public.outlets (
  id uuid primary key default gen_random_uuid(),
  outlet_id text unique not null,
  name text not null,
  location text,
  region text,
  status text default 'active' check (status in ('active', 'inactive')),
  created_at timestamp with time zone default now()
);

-- Visits Table
create table public.visits (
  id uuid primary key default gen_random_uuid(),
  outlet_id uuid references public.outlets(id) not null,
  user_id uuid references public.users(id) not null,
  visit_date date not null,
  visit_time time not null,
  created_at timestamp with time zone default now()
);

-- Photos Table
create table public.photos (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid references public.visits(id) on delete cascade not null,
  photo_url text not null,
  analysis_status text default 'pending' check (analysis_status in ('pending', 'analyzing', 'complete', 'failed')),
  analysis_result jsonb,
  confidence_score integer check (confidence_score >= 0 and confidence_score <= 100),
  uploaded_at timestamp with time zone default now(),
  analyzed_at timestamp with time zone
);

-- Products Table
create table public.products (
  id uuid primary key default gen_random_uuid(),
  brand text not null,
  sku text,
  name text not null,
  pack_size text,
  image_url text,
  created_at timestamp with time zone default now()
);

-- Notifications Table
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  message text not null,
  type text not null check (type in ('info', 'warning', 'urgent')),
  read boolean default false,
  created_at timestamp with time zone default now()
);

-- 2. Enable Realtime
alter publication supabase_realtime add table public.photos;
alter publication supabase_realtime add table public.notifications;

-- 3. Row Level Security (RLS)

-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.outlets enable row level security;
alter table public.visits enable row level security;
alter table public.photos enable row level security;
alter table public.products enable row level security;
alter table public.notifications enable row level security;

-- USERS Policies
create policy "Users can view their own record" on public.users for select using (auth.uid() = id);
create policy "Users can update their own record" on public.users for update using (auth.uid() = id);

-- OUTLETS Policies
create policy "All authenticated users can view outlets" on public.outlets for select using (true);
create policy "Managers can manage outlets" on public.outlets for all using (
  exists (select 1 from public.users where id = auth.uid() and role = 'manager')
);

-- VISITS Policies
create policy "Merchandisers can view their own visits" on public.visits for select using (
  auth.uid() = user_id or exists (select 1 from public.users where id = auth.uid() and role = 'manager')
);
create policy "Merchandisers can create visits" on public.visits for insert with check (auth.uid() = user_id);
create policy "Managers can delete visits" on public.visits for delete using (
  exists (select 1 from public.users where id = auth.uid() and role = 'manager')
);

-- PHOTOS Policies
create policy "Users can view photos from their own visits" on public.photos for select using (
  exists (select 1 from public.visits where id = public.photos.visit_id and (user_id = auth.uid() or exists (select 1 from public.users where id = auth.uid() and role = 'manager')))
);
create policy "Merchandisers can insert photos" on public.photos for insert with check (
  exists (select 1 from public.visits where id = public.photos.visit_id and user_id = auth.uid())
);
create policy "Managers can delete photos" on public.photos for delete using (
  exists (select 1 from public.users where id = auth.uid() and role = 'manager')
);

-- PRODUCTS Policies
create policy "All authenticated users can view products" on public.products for select using (true);

-- NOTIFICATIONS Policies
create policy "Users can view their own notifications" on public.notifications for select using (auth.uid() = user_id);
create policy "Users can update their own notifications" on public.notifications for update using (auth.uid() = user_id);
