-- Create the company_settings table
CREATE TABLE IF NOT EXISTS public.company_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name TEXT NOT NULL,
    address_line1 TEXT,
    address_line2 TEXT,
    address_line3 TEXT,
    city TEXT,
    country TEXT,
    email TEXT,
    phone TEXT,
    logo_url TEXT,
    website TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create an update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_company_settings_updated_at
    BEFORE UPDATE ON public.company_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default company settings
INSERT INTO public.company_settings (
    company_name,
    address_line1,
    address_line2,
    address_line3,
    city,
    country,
    email,
    phone,
    website
) VALUES (
    'TWINSK LOGISTICS',
    '506, Tongyue Building',
    'No.7, Tongya East Street Xicha Road',
    'Baiyun District',
    'Guangzhou',
    'China',
    'Logistics@twinskcompanyltd.com',
    '+8613928824921',
    'www.twinskcompanyltd.com'
);
