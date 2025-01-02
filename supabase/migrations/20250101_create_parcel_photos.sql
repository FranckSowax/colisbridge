-- Create parcel_photos table
CREATE TABLE IF NOT EXISTS public.parcel_photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parcel_id UUID NOT NULL REFERENCES public.parcels(id) ON DELETE CASCADE,
    photo_path TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add RLS policies
ALTER TABLE public.parcel_photos ENABLE ROW LEVEL SECURITY;

-- Policy for select (read)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'parcel_photos' 
        AND policyname = 'Users can view their own parcel photos'
    ) THEN
        CREATE POLICY "Users can view their own parcel photos" ON public.parcel_photos
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM public.parcels
                    WHERE parcels.id = parcel_photos.parcel_id
                    AND parcels.created_by = auth.uid()
                )
            );
    END IF;
END
$$;

-- Policy for insert
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'parcel_photos' 
        AND policyname = 'Users can insert their own parcel photos'
    ) THEN
        CREATE POLICY "Users can insert their own parcel photos" ON public.parcel_photos
            FOR INSERT WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.parcels
                    WHERE parcels.id = parcel_photos.parcel_id
                    AND parcels.created_by = auth.uid()
                )
            );
    END IF;
END
$$;

-- Policy for delete
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'parcel_photos' 
        AND policyname = 'Users can delete their own parcel photos'
    ) THEN
        CREATE POLICY "Users can delete their own parcel photos" ON public.parcel_photos
            FOR DELETE USING (
                EXISTS (
                    SELECT 1 FROM public.parcels
                    WHERE parcels.id = parcel_photos.parcel_id
                    AND parcels.created_by = auth.uid()
                )
            );
    END IF;
END
$$;

-- Create storage bucket for parcel photos if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('parcel-photos', 'parcel-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies with existence checks
DO $$
BEGIN
    -- Check and create "Public Access" policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage'
        AND policyname = 'Public Access'
    ) THEN
        CREATE POLICY "Public Access"
        ON storage.objects FOR SELECT
        USING ( bucket_id = 'parcel-photos' );
    END IF;

    -- Check and create "Authenticated users can upload photos" policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage'
        AND policyname = 'Authenticated users can upload photos'
    ) THEN
        CREATE POLICY "Authenticated users can upload photos"
        ON storage.objects FOR INSERT
        WITH CHECK (
            bucket_id = 'parcel-photos'
            AND auth.role() = 'authenticated'
        );
    END IF;

    -- Check and create "Users can delete their own photos" policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage'
        AND policyname = 'Users can delete their own photos'
    ) THEN
        CREATE POLICY "Users can delete their own photos"
        ON storage.objects FOR DELETE
        USING (
            bucket_id = 'parcel-photos'
            AND auth.uid() = owner
        );
    END IF;
END
$$;
