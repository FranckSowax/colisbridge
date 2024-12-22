-- Add missing columns to recipients table
ALTER TABLE recipients
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());

-- Add missing columns to parcels table
ALTER TABLE parcels
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending'
  CHECK (status IN ('pending', 'in_transit', 'delivered', 'cancelled'));

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recipients_created_by ON recipients(created_by);
CREATE INDEX IF NOT EXISTS idx_recipients_created_at ON recipients(created_at);
CREATE INDEX IF NOT EXISTS idx_parcels_status ON parcels(status);
