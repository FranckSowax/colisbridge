-- Add photo_urls column to parcels table as an array of text
ALTER TABLE parcels
ADD COLUMN IF NOT EXISTS photo_urls TEXT[] DEFAULT '{}';

-- Add comment to the column
COMMENT ON COLUMN parcels.photo_urls IS 'URLs des photos du colis';

-- Create an index for array operations if needed
CREATE INDEX IF NOT EXISTS idx_parcels_photo_urls ON parcels USING GIN (photo_urls);

-- Set empty array for existing rows
UPDATE parcels 
SET photo_urls = '{}'
WHERE photo_urls IS NULL;
