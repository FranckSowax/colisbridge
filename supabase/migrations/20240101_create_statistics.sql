-- Create statistics table
CREATE TABLE IF NOT EXISTS public.statistics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    total_revenue DECIMAL(15, 2) DEFAULT 0,
    completed_revenue DECIMAL(15, 2) DEFAULT 0,
    total_parcels INTEGER DEFAULT 0,
    month_revenue JSONB DEFAULT '{}',
    country_stats JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Add RLS policies
ALTER TABLE public.statistics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own statistics" ON public.statistics;
DROP POLICY IF EXISTS "Users can insert their own statistics" ON public.statistics;
DROP POLICY IF EXISTS "Users can update their own statistics" ON public.statistics;
DROP POLICY IF EXISTS "Users can delete their own statistics" ON public.statistics;

-- Policy for viewing statistics
CREATE POLICY "Users can view their own statistics"
    ON public.statistics FOR SELECT
    USING (auth.uid() = user_id);

-- Policy for inserting statistics
CREATE POLICY "Users can insert their own statistics"
    ON public.statistics FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy for updating statistics
CREATE POLICY "Users can update their own statistics"
    ON public.statistics FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy for deleting statistics
CREATE POLICY "Users can delete their own statistics"
    ON public.statistics FOR DELETE
    USING (auth.uid() = user_id);

-- Function to update statistics when a parcel status changes
CREATE OR REPLACE FUNCTION public.update_statistics()
RETURNS TRIGGER AS $$
DECLARE
    month_key TEXT;
    country_key TEXT;
BEGIN
    -- Get the month key in the format 'YYYY-MM'
    month_key := to_char(NEW.created_at, 'YYYY-MM');
    country_key := NEW.destination_country;

    -- If this is a status change to 'Terminé'
    IF (TG_OP = 'UPDATE' AND NEW.status = 'Terminé' AND OLD.status != 'Terminé') THEN
        -- Update or create statistics record for the user
        INSERT INTO public.statistics (user_id, total_revenue, completed_revenue, total_parcels)
        VALUES (NEW.created_by, NEW.price, CASE WHEN NEW.status = 'Terminé' THEN NEW.price ELSE 0 END, 1)
        ON CONFLICT (user_id) DO UPDATE SET
            total_revenue = statistics.total_revenue + NEW.price,
            completed_revenue = statistics.completed_revenue + NEW.price,
            total_parcels = statistics.total_parcels + 1,
            month_revenue = jsonb_set(
                COALESCE(statistics.month_revenue, '{}'::jsonb),
                array[month_key],
                COALESCE(statistics.month_revenue->month_key, '0')::jsonb + NEW.price::text::jsonb
            ),
            country_stats = jsonb_set(
                COALESCE(statistics.country_stats, '{}'::jsonb),
                array[country_key],
                jsonb_build_object(
                    'parcels', COALESCE((statistics.country_stats->country_key->>'parcels')::int, 0) + 1,
                    'revenue', COALESCE((statistics.country_stats->country_key->>'revenue')::decimal, 0) + NEW.price,
                    'completed_revenue', COALESCE((statistics.country_stats->country_key->>'completed_revenue')::decimal, 0) + NEW.price
                )
            ),
            updated_at = timezone('utc'::text, now());
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on parcels table
DROP TRIGGER IF EXISTS update_statistics_trigger ON public.parcels;
CREATE TRIGGER update_statistics_trigger
    AFTER UPDATE ON public.parcels
    FOR EACH ROW
    EXECUTE FUNCTION public.update_statistics();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_statistics_user_id ON public.statistics(user_id);
CREATE INDEX IF NOT EXISTS idx_statistics_updated_at ON public.statistics(updated_at);
