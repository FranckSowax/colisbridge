-- Add country column to parcels table
ALTER TABLE parcels
ADD COLUMN IF NOT EXISTS country text NOT NULL DEFAULT 'france';

-- Add check constraint for valid countries
ALTER TABLE parcels
ADD CONSTRAINT valid_country CHECK (
  country IN ('france', 'gabon', 'togo', 'cote_ivoire', 'dubai')
);
