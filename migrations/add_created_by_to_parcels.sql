-- Add created_by and created_at columns to parcels table
ALTER TABLE parcels
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());

-- Add status column with correct values
ALTER TABLE parcels
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'recu'
  CHECK (status IN ('recu', 'expedie', 'receptionne', 'termine', 'litige'));

-- Add shipping_date column
ALTER TABLE parcels
ADD COLUMN IF NOT EXISTS shipping_date TIMESTAMP WITH TIME ZONE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_parcels_created_by ON parcels(created_by);
CREATE INDEX IF NOT EXISTS idx_parcels_created_at ON parcels(created_at);
CREATE INDEX IF NOT EXISTS idx_parcels_status ON parcels(status);

-- Enable RLS if not already enabled
ALTER TABLE parcels ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
    DROP POLICY IF EXISTS select_parcels ON parcels;
    DROP POLICY IF EXISTS insert_parcels ON parcels;
    DROP POLICY IF EXISTS update_parcels ON parcels;
    DROP POLICY IF EXISTS delete_parcels ON parcels;
END $$;

-- Create new policies
CREATE POLICY select_parcels ON parcels
    FOR SELECT
    USING (auth.uid() = created_by);

CREATE POLICY insert_parcels ON parcels
    FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY update_parcels ON parcels
    FOR UPDATE
    USING (auth.uid() = created_by);

CREATE POLICY delete_parcels ON parcels
    FOR DELETE
    USING (auth.uid() = created_by);

-- Update existing rows to set created_by to the first admin user
UPDATE parcels
SET created_by = (
    SELECT id 
    FROM auth.users 
    WHERE email = 'sftb2k20@gmail.com' 
    LIMIT 1
)
WHERE created_by IS NULL;
