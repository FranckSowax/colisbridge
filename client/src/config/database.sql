-- Enable Row Level Security
alter table auth.users enable row level security;

-- Clean up existing data and policies
drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "System can create profiles" on public.profiles;
drop policy if exists "Enable insert for authenticated users only" on public.profiles;

-- Drop policies for parcels
drop policy if exists "Admins can view all parcels" on public.parcels;
drop policy if exists "Agents can view all parcels" on public.parcels;
drop policy if exists "Admins can insert parcels" on public.parcels;
drop policy if exists "Agents can insert parcels" on public.parcels;
drop policy if exists "Admins can update parcels" on public.parcels;
drop policy if exists "Agents can update parcels" on public.parcels;

-- Drop policies for parcel_status_history
drop policy if exists "Admins can view all status history" on public.parcel_status_history;

-- Drop triggers first
drop trigger if exists handle_profiles_updated_at on public.profiles;
drop trigger if exists handle_parcels_updated_at on public.parcels;
drop trigger if exists on_auth_user_created on auth.users;

-- Drop tables with CASCADE to handle dependencies
drop table if exists public.parcels cascade;
drop table if exists public.profiles cascade;

-- Drop functions after their dependencies
drop function if exists public.handle_updated_at() cascade;
drop function if exists public.handle_new_user() cascade;

-- Create handle_updated_at function
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql security definer;

-- Create handle_new_user function
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, first_name, last_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Create profiles table
create table public.profiles (
  id uuid references auth.users primary key,
  email text not null,
  first_name text,
  last_name text,
  role text not null default 'user',
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- Drop existing type if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'parcel_status') THEN
        DROP TYPE parcel_status CASCADE;
    END IF;
END $$;

-- Create parcel status type
CREATE TYPE parcel_status AS ENUM (
    'pending',
    'recu',
    'expedie',
    'receptionne',
    'termine'
);

-- Create parcels table
create table public.parcels (
  id uuid default gen_random_uuid() primary key,
  tracking_number text not null unique,
  receiver_name text not null,
  receiver_phone text not null,
  receiver_email text not null,
  destination_country text not null,
  weight numeric not null,
  description text not null,
  special_instructions text,
  status public.parcel_status not null default 'pending',
  created_by uuid references auth.users(id) not null default auth.uid(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.parcels enable row level security;

-- Create triggers
create trigger handle_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();

create trigger handle_parcels_updated_at
  before update on public.parcels
  for each row
  execute function public.handle_updated_at();

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Create policies for profiles
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Create policies for parcels
create policy "Users can view their own parcels"
  on public.parcels
  for select
  using (auth.uid() = created_by);

create policy "Users can create their own parcels"
  on public.parcels
  for insert
  with check (auth.uid() = created_by);

create policy "Users can update their own parcels"
  on public.parcels
  for update
  using (auth.uid() = created_by);

create policy "Admins can view all parcels"
  on public.parcels for select
  using (exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  ));

create policy "Agents can view all parcels"
  on public.parcels for select
  using (exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'agent'
  ));

create policy "Admins can insert parcels"
  on public.parcels for insert
  with check (exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  ));

create policy "Agents can insert parcels"
  on public.parcels for insert
  with check (exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'agent'
  ));

create policy "Admins can update parcels"
  on public.parcels for update
  using (exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  ));

create policy "Agents can update parcels"
  on public.parcels for update
  using (exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'agent'
  ));

-- Create policies for parcel_status_history
create policy "Admins can view all status history"
  on public.parcel_status_history for select
  using (exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  ));

-- Storage policies for parcels-photos bucket
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets WHERE id = 'parcels-photos'
    ) THEN
        insert into storage.buckets (id, name)
        values ('parcels-photos', 'parcels-photos');
    END IF;
END $$;

-- Policy to allow authenticated users to upload files
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Users can upload parcel photos'
    ) THEN
        create policy "Users can upload parcel photos"
        on storage.objects for insert
        to authenticated
        with check (
            bucket_id = 'parcels-photos' AND
            auth.uid() = (
                select created_by
                from public.parcels
                where id::text = (regexp_split_to_array(storage.objects.name, '/'))[1]
            )
        );
    END IF;
END $$;

-- Policy to allow users to view their own parcel photos
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own parcel photos'
    ) THEN
        create policy "Users can view their own parcel photos"
        on storage.objects for select
        to authenticated
        using (
            bucket_id = 'parcels-photos' AND
            auth.uid() = (
                select created_by
                from public.parcels
                where id::text = (regexp_split_to_array(storage.objects.name, '/'))[1]
            )
        );
    END IF;
END $$;
