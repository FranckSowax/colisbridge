-- Add missing columns to parcels table
ALTER TABLE parcels
ADD COLUMN IF NOT EXISTS country text NOT NULL DEFAULT 'france',
ADD COLUMN IF NOT EXISTS shipping_type text NOT NULL DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS weight decimal,
ADD COLUMN IF NOT EXISTS cbm decimal,
ADD COLUMN IF NOT EXISTS photo_urls text[] DEFAULT array[]::text[],
ADD COLUMN IF NOT EXISTS special_instructions text;

-- Add check constraints
ALTER TABLE parcels
ADD CONSTRAINT valid_country CHECK (
  country IN ('france', 'gabon', 'togo', 'cote_ivoire', 'dubai')
),
ADD CONSTRAINT valid_shipping_type CHECK (
  shipping_type IN ('standard', 'express', 'maritime')
),
ADD CONSTRAINT valid_weight CHECK (
  (shipping_type IN ('standard', 'express') AND weight IS NOT NULL) OR
  (shipping_type = 'maritime' AND cbm IS NOT NULL) OR
  (shipping_type NOT IN ('standard', 'express', 'maritime'))
);
