-- Désactiver RLS temporairement pour pouvoir modifier les politiques
ALTER TABLE public.parcels DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing storage policies first
DO $$ 
BEGIN
    -- Drop all policies from storage.objects
    DROP POLICY IF EXISTS "Authenticated users can access storage" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users can upload photos" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users can read photos" ON storage.objects;
    DROP POLICY IF EXISTS "Public access to avatars" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users can view parcels photos" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users can upload parcels photos" ON storage.objects;
END $$;

-- Drop existing table policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.parcels;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.parcels;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.parcels;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Enable RLS
ALTER TABLE public.parcels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Parcels policies
CREATE POLICY "Enable read access for authenticated users"
    ON public.parcels FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert access for authenticated users"
    ON public.parcels FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Enable update access for authenticated users"
    ON public.parcels FOR UPDATE
    TO authenticated
    USING (auth.uid() = created_by);

-- Profiles policies
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- Customers policies
CREATE POLICY "Enable read access for authenticated users"
    ON public.customers FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert access for authenticated users"
    ON public.customers FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Enable update access for authenticated users"
    ON public.customers FOR UPDATE
    TO authenticated
    USING (auth.uid() = created_by);

-- Storage policies
CREATE POLICY "Allow authenticated users to select all storage objects"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to insert storage objects"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update own storage objects"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Allow authenticated users to delete own storage objects"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies pour les photos de colis
CREATE POLICY "Les utilisateurs authentifiés peuvent voir les photos des colis"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'parcels-photos');

CREATE POLICY "Les utilisateurs authentifiés peuvent téléverser des photos de colis"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'parcels-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Function to automatically set created_by on parcels
CREATE OR REPLACE FUNCTION set_created_by()
RETURNS TRIGGER AS $$
BEGIN
    NEW.created_by := auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to set created_by on parcels
DROP TRIGGER IF EXISTS set_created_by_trigger ON public.parcels;
CREATE TRIGGER set_created_by_trigger
    BEFORE INSERT ON public.parcels
    FOR EACH ROW
    EXECUTE FUNCTION set_created_by();
