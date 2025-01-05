-- Create invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    parcel_id UUID REFERENCES public.parcels(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'EUR',
    status TEXT DEFAULT 'created' CHECK (status IN ('created', 'paid', 'cancelled')),
    shipping_type TEXT NOT NULL,
    price_per_unit DECIMAL(10,2) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own invoices"
    ON public.invoices FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own invoices"
    ON public.invoices FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
    year TEXT;
    sequence_number INT;
BEGIN
    year := to_char(CURRENT_DATE, 'YYYY');
    
    -- Get the next sequence number for the current year
    WITH sequence AS (
        SELECT COUNT(*) + 1 as next_seq
        FROM public.invoices
        WHERE invoice_number LIKE concat(year, '-%')
    )
    SELECT next_seq INTO sequence_number FROM sequence;
    
    -- Format: YYYY-XXXXX (e.g., 2025-00001)
    NEW.invoice_number := concat(year, '-', LPAD(sequence_number::TEXT, 5, '0'));
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for invoice number generation
CREATE TRIGGER set_invoice_number
    BEFORE INSERT ON public.invoices
    FOR EACH ROW
    EXECUTE FUNCTION generate_invoice_number();

-- Add updated_at trigger
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.invoices
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
