-- Enable RLS
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Add profile fields to auth.users
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS agency_role TEXT;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS agency_location TEXT;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS join_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create a view for user profiles
CREATE OR REPLACE VIEW public.profiles AS
SELECT 
    id,
    email,
    full_name,
    phone,
    agency_role,
    agency_location,
    join_date,
    avatar_url,
    updated_at
FROM auth.users;

-- Set up RLS policy for profiles
CREATE POLICY "Users can view own profile"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Enable RLS on the profiles view
ALTER VIEW public.profiles ENABLE ROW LEVEL SECURITY;
