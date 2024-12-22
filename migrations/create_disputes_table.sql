-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Disputes are viewable by authenticated users" ON public.disputes;
DROP POLICY IF EXISTS "Disputes can be inserted by authenticated users" ON public.disputes;
DROP POLICY IF EXISTS "Disputes can be updated by authenticated users" ON public.disputes;

-- Drop and recreate the disputes table
DROP TABLE IF EXISTS public.disputes;

CREATE TABLE public.disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parcel_id UUID REFERENCES public.parcels(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'resolved')) DEFAULT 'pending',
    description TEXT,
    resolution_notes TEXT,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    resolution_deadline TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(parcel_id)
);

-- Add RLS policies
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

-- Policies for disputes table
CREATE POLICY "Disputes are viewable by authenticated users" ON public.disputes
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Disputes can be inserted by authenticated users" ON public.disputes
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Disputes can be updated by authenticated users" ON public.disputes
    FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Create function to automatically create dispute when parcel status changes to 'litige'
CREATE OR REPLACE FUNCTION public.handle_parcel_dispute()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'litige' AND (OLD.status IS NULL OR OLD.status != 'litige') THEN
        INSERT INTO public.disputes (
            parcel_id,
            description,
            created_by,
            status,
            priority
        )
        VALUES (
            NEW.id,
            'Litige créé automatiquement suite au changement de statut du colis',
            NEW.created_by,
            'pending',
            'medium'
        )
        ON CONFLICT (parcel_id) 
        DO UPDATE SET
            updated_at = NOW(),
            status = 'pending'
        WHERE disputes.parcel_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for parcels table
DROP TRIGGER IF EXISTS on_parcel_dispute_trigger ON public.parcels;
CREATE TRIGGER on_parcel_dispute_trigger
    AFTER UPDATE OF status ON public.parcels
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_parcel_dispute();
