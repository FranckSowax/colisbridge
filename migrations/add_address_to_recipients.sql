-- Add address column to recipients table
ALTER TABLE recipients 
ADD COLUMN IF NOT EXISTS address TEXT;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own recipients" ON recipients;
DROP POLICY IF EXISTS "Users can update their own recipients" ON recipients;

-- Create new policies
CREATE POLICY "Users can view their own recipients" 
ON recipients FOR SELECT
USING (auth.uid() = created_by);

CREATE POLICY "Users can update their own recipients"
ON recipients FOR UPDATE
USING (auth.uid() = created_by);

-- Create index on address column for better performance
CREATE INDEX IF NOT EXISTS idx_recipients_address ON recipients (address);
