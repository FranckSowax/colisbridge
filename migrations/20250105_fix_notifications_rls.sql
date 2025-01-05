-- Drop existing policy if it exists
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Trigger can insert notifications" ON notifications;

-- Policy for insert (allow system/trigger to insert notifications)
CREATE POLICY "System can insert notifications"
ON notifications FOR INSERT
WITH CHECK (true);

-- Ensure the trigger function has the necessary permissions
GRANT INSERT ON notifications TO authenticated;
