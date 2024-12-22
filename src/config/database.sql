-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create custom types for status and roles
create type user_role as enum ('admin', 'agent', 'client');
create type user_status as enum ('active', 'inactive');
create type parcel_status as enum (
  'received',
  'preparing',
  'in_transit',
  'in_customs',
  'out_for_delivery',
  'delivered',
  'issue',
  'dispute'
);

-- Create profiles table
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  first_name text not null,
  last_name text not null,
  phone text,
  whatsapp_number text,
  manychat_subscriber_id text,
  role user_role default 'client',
  status user_status default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create customers table
CREATE TABLE customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(255),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create parcels table
create table if not exists parcels (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade,
  customer_id UUID REFERENCES customers(id),
  tracking_number text unique not null,
  status parcel_status default 'received',
  origin_country text not null check (origin_country = 'China'),
  destination_country text not null check (destination_country in ('Gabon', 'Togo', 'Ivory Coast')),
  weight decimal not null check (weight > 0),
  length decimal check (length > 0),
  width decimal check (width > 0),
  height decimal check (height > 0),
  declared_value decimal check (declared_value >= 0),
  description text,
  photos jsonb default '[]',
  customs_declaration jsonb default '{}',
  estimated_delivery_date timestamptz,
  actual_delivery_date timestamptz,
  notes text,
  last_status_update timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create parcel status history table
create table if not exists parcel_status_history (
  id uuid default uuid_generate_v4() primary key,
  parcel_id uuid references parcels on delete cascade,
  status parcel_status not null,
  changed_by uuid references auth.users,
  location text,
  notes text,
  notification_sent boolean default false,
  created_at timestamptz default now()
);

-- Create indexes for better performance
create index if not exists idx_parcels_user_id on parcels(user_id);
create index if not exists idx_parcels_tracking_number on parcels(tracking_number);
create index if not exists idx_parcels_status on parcels(status);
create index if not exists idx_parcel_status_history_parcel_id on parcel_status_history(parcel_id);
create index if not exists idx_parcels_customer on parcels(customer_id);
create index if not exists idx_customers_phone on customers(phone);

-- Create function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger update_profiles_updated_at
  before update on profiles
  for each row
  execute function update_updated_at_column();

create trigger update_parcels_updated_at
  before update on parcels
  for each row
  execute function update_updated_at_column();

-- Create RLS (Row Level Security) policies
alter table profiles enable row level security;
alter table parcels enable row level security;
alter table parcel_status_history enable row level security;

-- Profiles policies
create policy "Profiles are viewable by users who created them"
  on profiles for select
  using ( auth.uid() = id );

create policy "Users can update their own profile"
  on profiles for update
  using ( auth.uid() = id );

-- Parcels policies
create policy "Parcels are viewable by owner"
  on parcels for select
  using ( auth.uid() = user_id );

create policy "Admins can view all parcels"
  on parcels for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

create policy "Agents can view all parcels"
  on parcels for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'agent'
    )
  );

-- Status history policies
create policy "Status history viewable by parcel owner"
  on parcel_status_history for select
  using (
    exists (
      select 1 from parcels
      where parcels.id = parcel_status_history.parcel_id
      and parcels.user_id = auth.uid()
    )
  );

create policy "Admins can view all status history"
  on parcel_status_history for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Insert policies for admins and agents
create policy "Admins can insert parcels"
  on parcels for insert
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

create policy "Agents can insert parcels"
  on parcels for insert
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'agent'
    )
  );

-- Update policies
create policy "Admins can update parcels"
  on parcels for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

create policy "Agents can update parcels"
  on parcels for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'agent'
    )
  );

-- Create a function to handle new user registration
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, first_name, last_name, role, status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', 'Nouveau'),
    coalesce(new.raw_user_meta_data->>'last_name', 'Client'),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'client'),
    'active'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new user registration
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Table des litiges
CREATE TABLE IF NOT EXISTS disputes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    parcel_id UUID REFERENCES parcels(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'open',
    type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    resolution_notes TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES auth.users(id),
    created_by UUID REFERENCES auth.users(id) NOT NULL
);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_disputes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_disputes_updated_at
    BEFORE UPDATE ON disputes
    FOR EACH ROW
    EXECUTE FUNCTION update_disputes_updated_at();

-- Policies pour la table disputes
CREATE POLICY "Enable read access for authenticated users" ON disputes
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON disputes
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for admin and agents" ON disputes
    FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT id FROM auth.users
            WHERE raw_user_meta_data->>'role' IN ('admin', 'agent')
        )
    );

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_disputes_parcel_id ON disputes(parcel_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_created_by ON disputes(created_by);
