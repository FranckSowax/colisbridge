-- Enable RLS
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON public.company_settings
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON public.company_settings
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON public.company_settings
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Create a bucket for company assets if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-assets', 'company-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to company-assets bucket
CREATE POLICY "Public Access" ON storage.objects
    FOR ALL USING (bucket_id = 'company-assets');

-- Insert initial company settings if not exists
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
) ON CONFLICT (company_name) DO NOTHING;
