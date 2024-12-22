-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.shipping_rates CASCADE;
DROP TABLE IF EXISTS public.destination_countries CASCADE;

-- Create destination countries table
CREATE TABLE public.destination_countries (
    id SERIAL PRIMARY KEY,
    country_code TEXT NOT NULL,
    country_name TEXT NOT NULL,
    currency TEXT NOT NULL,
    currency_symbol TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(country_code)
);

-- Create shipping rates table
CREATE TABLE public.shipping_rates (
    id SERIAL PRIMARY KEY,
    country_id INTEGER REFERENCES public.destination_countries(id) ON DELETE CASCADE,
    shipping_type TEXT NOT NULL CHECK (shipping_type IN ('standard', 'express', 'maritime')),
    price_per_kg DECIMAL(10,2) NOT NULL,
    price_per_cbm DECIMAL(10,2) NOT NULL,
    min_weight DECIMAL(10,2) DEFAULT 0.5,
    estimated_days TEXT NOT NULL, -- Délai estimé de livraison
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(country_id, shipping_type)
);

-- Enable RLS
ALTER TABLE public.shipping_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destination_countries ENABLE ROW LEVEL SECURITY;

-- Create policies for shipping_rates
CREATE POLICY "Shipping rates are viewable by everyone"
    ON public.shipping_rates FOR SELECT
    USING (true);

CREATE POLICY "Only authenticated users can insert shipping rates"
    ON public.shipping_rates FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Only authenticated users can update shipping rates"
    ON public.shipping_rates FOR UPDATE
    TO authenticated
    USING (true);

-- Create policies for destination_countries
CREATE POLICY "Destination countries are viewable by everyone"
    ON public.destination_countries FOR SELECT
    USING (true);

CREATE POLICY "Only authenticated users can insert destination countries"
    ON public.destination_countries FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Only authenticated users can update destination countries"
    ON public.destination_countries FOR UPDATE
    TO authenticated
    USING (true);

-- Insert destination countries with their respective currencies
INSERT INTO public.destination_countries (country_code, country_name, currency, currency_symbol) VALUES
('GA', 'Gabon', 'XAF', 'FCFA'),
('TG', 'Togo', 'XAF', 'FCFA'),
('CI', 'Côte d''Ivoire', 'XAF', 'FCFA'),
('FR', 'France', 'EUR', '€'),
('AE', 'Dubai', 'USD', '$')
ON CONFLICT (country_code) DO NOTHING;

-- Insert standard shipping rates
INSERT INTO public.shipping_rates (country_id, shipping_type, price_per_kg, price_per_cbm, estimated_days)
SELECT 
    id,
    'standard',
    CASE 
        WHEN currency = 'XAF' THEN 5000.00  -- 5000 FCFA/kg pour les pays africains
        WHEN currency = 'EUR' THEN 15.00    -- 15 EUR/kg pour la France
        WHEN currency = 'USD' THEN 20.00    -- 20 USD/kg pour Dubai
    END as price_per_kg,
    CASE 
        WHEN currency = 'XAF' THEN 100000.00  -- 100000 FCFA/m³ pour les pays africains
        WHEN currency = 'EUR' THEN 150.00     -- 150 EUR/m³ pour la France
        WHEN currency = 'USD' THEN 200.00     -- 200 USD/m³ pour Dubai
    END as price_per_cbm,
    CASE 
        WHEN currency = 'XAF' THEN '5-7 jours'  -- Délai pour les pays africains
        WHEN currency = 'EUR' THEN '3-5 jours'  -- Délai pour la France
        WHEN currency = 'USD' THEN '4-6 jours'  -- Délai pour Dubai
    END as estimated_days
FROM public.destination_countries
ON CONFLICT (country_id, shipping_type) DO NOTHING;

-- Insert express shipping rates
INSERT INTO public.shipping_rates (country_id, shipping_type, price_per_kg, price_per_cbm, estimated_days)
SELECT 
    id,
    'express',
    CASE 
        WHEN currency = 'XAF' THEN 7500.00   -- 7500 FCFA/kg pour les pays africains
        WHEN currency = 'EUR' THEN 22.50     -- 22.50 EUR/kg pour la France
        WHEN currency = 'USD' THEN 30.00     -- 30 USD/kg pour Dubai
    END as price_per_kg,
    CASE 
        WHEN currency = 'XAF' THEN 150000.00  -- 150000 FCFA/m³ pour les pays africains
        WHEN currency = 'EUR' THEN 225.00     -- 225 EUR/m³ pour la France
        WHEN currency = 'USD' THEN 300.00     -- 300 USD/m³ pour Dubai
    END as price_per_cbm,
    CASE 
        WHEN currency = 'XAF' THEN '2-3 jours'  -- Délai pour les pays africains
        WHEN currency = 'EUR' THEN '1-2 jours'  -- Délai pour la France
        WHEN currency = 'USD' THEN '2-3 jours'  -- Délai pour Dubai
    END as estimated_days
FROM public.destination_countries
ON CONFLICT (country_id, shipping_type) DO NOTHING;

-- Insert maritime shipping rates (moins cher mais plus lent)
INSERT INTO public.shipping_rates (country_id, shipping_type, price_per_kg, price_per_cbm, estimated_days)
SELECT 
    id,
    'maritime',
    CASE 
        WHEN currency = 'XAF' THEN 3000.00   -- 3000 FCFA/kg pour les pays africains
        WHEN currency = 'EUR' THEN 8.00      -- 8 EUR/kg pour la France
        WHEN currency = 'USD' THEN 10.00     -- 10 USD/kg pour Dubai
    END as price_per_kg,
    CASE 
        WHEN currency = 'XAF' THEN 60000.00   -- 60000 FCFA/m³ pour les pays africains
        WHEN currency = 'EUR' THEN 100.00     -- 100 EUR/m³ pour la France
        WHEN currency = 'USD' THEN 120.00     -- 120 USD/m³ pour Dubai
    END as price_per_cbm,
    CASE 
        WHEN currency = 'XAF' THEN '30-45 jours'  -- Délai pour les pays africains
        WHEN currency = 'EUR' THEN '20-30 jours'  -- Délai pour la France
        WHEN currency = 'USD' THEN '25-35 jours'  -- Délai pour Dubai
    END as estimated_days
FROM public.destination_countries
ON CONFLICT (country_id, shipping_type) DO NOTHING;
