-- Create statistics table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.statistics (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    total_completed_parcels INTEGER DEFAULT 0,
    total_revenue DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies for statistics
ALTER TABLE public.statistics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own statistics"
    ON public.statistics FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own statistics"
    ON public.statistics FOR UPDATE
    USING (auth.uid() = user_id);

-- Create the update_statistics function
CREATE OR REPLACE FUNCTION public.update_statistics(
    user_id UUID,
    parcel_amount DECIMAL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Insert or update the statistics record
    INSERT INTO public.statistics (user_id, total_completed_parcels, total_revenue)
    VALUES (
        user_id,
        1,
        parcel_amount
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
        total_completed_parcels = statistics.total_completed_parcels + 1,
        total_revenue = statistics.total_revenue + parcel_amount,
        updated_at = timezone('utc'::text, now());
END;
$$;
