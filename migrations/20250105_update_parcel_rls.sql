-- Drop existing policies
DROP POLICY IF EXISTS "Users can delete their own parcels" ON parcels;

-- Create new policy allowing any authenticated user to delete parcels
CREATE POLICY "Users can delete parcels"
ON parcels FOR DELETE
TO authenticated
USING (true);

-- Ensure RLS is enabled
ALTER TABLE parcels ENABLE ROW LEVEL SECURITY;
