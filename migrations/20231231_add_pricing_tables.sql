-- Create pricing tables
CREATE TABLE IF NOT EXISTS pricing_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country_code TEXT NOT NULL,
    shipping_type TEXT NOT NULL,
    price_per_kg DECIMAL(10,2),
    price_per_cbm DECIMAL(10,2),
    min_weight DECIMAL(10,2),
    max_weight DECIMAL(10,2),
    min_cbm DECIMAL(10,2),
    max_cbm DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    UNIQUE(country_code, shipping_type)
);

-- Add RLS policies if they don't exist
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    -- Check if select policy exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'pricing_rules' 
        AND policyname = 'Enable read access for authenticated users'
    ) THEN
        CREATE POLICY "Enable read access for authenticated users" ON pricing_rules
            FOR SELECT
            TO authenticated
            USING (true);
    END IF;

    -- Check if insert policy exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'pricing_rules' 
        AND policyname = 'Enable insert for authenticated admin users'
    ) THEN
        CREATE POLICY "Enable insert for authenticated admin users" ON pricing_rules
            FOR INSERT
            TO authenticated
            WITH CHECK (auth.jwt() ->> 'role' = 'admin');
    END IF;

    -- Check if update policy exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'pricing_rules' 
        AND policyname = 'Enable update for authenticated admin users'
    ) THEN
        CREATE POLICY "Enable update for authenticated admin users" ON pricing_rules
            FOR UPDATE
            TO authenticated
            USING (auth.jwt() ->> 'role' = 'admin')
            WITH CHECK (auth.jwt() ->> 'role' = 'admin');
    END IF;
END
$$;

-- Add invoice related columns to parcels table
ALTER TABLE parcels 
ADD COLUMN IF NOT EXISTS price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS invoice_number TEXT,
ADD COLUMN IF NOT EXISTS invoice_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS invoice_status TEXT DEFAULT 'pending';
