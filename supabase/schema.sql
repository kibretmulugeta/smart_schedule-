-- ==============================================================================
-- SMART SCHEDULING & APPOINTMENT SYSTEM
-- PostgreSQL Schema & Supabase Configuration
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- User Roles Enum & Profiles Table extending auth.users
create type user_role as enum ('admin', 'user');

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  role user_role default 'user'::user_role not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Categories Table for Personal Schedules & Reminders
create table if not exists public.categories (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  color text default '#3B82F6',
  is_default boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Schedules & Reminders Table (Supporting Complex Dynamic Frequencies)
create type frequency_type as enum (
  'custom_minutes', 
  'hourly', 
  'half_day', 
  'daily', 
  'couple_of_days', 
  'weekly', 
  'couple_of_weeks', 
  'monthly', 
  'first_day_of_month', 
  'last_day_of_month', 
  'beginning_five_days', 
  'last_three_days', 
  'weekends', 
  'custom_multi_times_per_day'
);

create table if not exists public.schedules (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete set null,
  title text not null,
  description text,
  frequency frequency_type not null,
  interval_value int, 
  custom_rule_json jsonb, 
  start_time timestamp with time zone not null,
  end_time timestamp with time zone,
  is_completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Appointments Table
create table if not exists public.appointments (
  id uuid default uuid_generate_v4() primary key,
  creator_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Appointment Participants (Handles multi-party sharing and secondary forwarding)
create table if not exists public.appointment_participants (
  id uuid default uuid_generate_v4() primary key,
  appointment_id uuid references public.appointments(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  invited_by uuid references public.profiles(id) on delete set null,
  status text check (status in ('pending', 'accepted', 'declined')) default 'pending',
  can_reshare boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(appointment_id, user_id)
);

-- RLS Enablement
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.schedules enable row level security;
alter table public.appointments enable row level security;
alter table public.appointment_participants enable row level security;

-- Profiles Policies
create policy "Public profiles are viewable by everyone." 
  on public.profiles for select using (true);

create policy "Users can update own profile." 
  on public.profiles for update using (auth.uid() = id);

create policy "Admins can update user roles." 
  on public.profiles for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Categories Policies
create policy "Users manage own categories." 
  on public.categories for all using (auth.uid() = user_id);

-- Schedules Policies
create policy "Users manage own schedules." 
  on public.schedules for all using (auth.uid() = user_id);

-- Appointments Policies
create policy "View appointments if participant or creator." 
  on public.appointments for select using (
    auth.uid() = creator_id or 
    exists (select 1 from public.appointment_participants where appointment_id = id and user_id = auth.uid())
  );

create policy "Create appointments." 
  on public.appointments for insert with check (auth.uid() = creator_id);

create policy "Update appointments if creator." 
  on public.appointments for update using (auth.uid() = creator_id);

create policy "Delete appointments if creator." 
  on public.appointments for delete using (auth.uid() = creator_id);

-- Appointment Participants Policies
create policy "Manage participants." 
  on public.appointment_participants for all using (
    auth.uid() = user_id or 
    exists (select 1 from public.appointments where id = appointment_id and creator_id = auth.uid()) or
    exists (
      select 1 from public.appointment_participants as ap 
      where ap.appointment_id = appointment_participants.appointment_id 
        and ap.user_id = auth.uid() 
        and ap.can_reshare = true
    )
  );

-- Automatic Profile Creation Trigger on Supabase Auth Signup
create or replace function public.handle_new_user()
returns trigger as $$
declare
  assigned_role user_role;
begin
  if new.email = 'kibretmail@gmail.com' then
    assigned_role := 'admin'::user_role;
  else
    assigned_role := coalesce((new.raw_user_meta_data->>'role')::user_role, 'user'::user_role);
  end if;

  insert into public.profiles (id, email, full_name, avatar_url, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || new.id),
    assigned_role
  )
  on conflict (id) do nothing;
  
  -- Create default categories
  insert into public.categories (user_id, name, color, is_default)
  values 
    (new.id, 'Work & Meetings', '#6366F1', true),
    (new.id, 'Deep Focus', '#8B5CF6', false),
    (new.id, 'Personal & Health', '#10B981', false),
    (new.id, 'Reminders', '#F59E0B', false);

  return new;
end;
$$ language plpgsql security definer;

-- Trigger execution
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
