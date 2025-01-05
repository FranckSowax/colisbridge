-- Drop existing table if it exists
DROP TABLE IF EXISTS notifications CASCADE;

-- Create notifications table
CREATE TABLE notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    parcel_id UUID REFERENCES parcels(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    status VARCHAR(50) NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add RLS policies for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;

-- Policy for select (read)
CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id);

-- Policy for update (mark as read)
CREATE POLICY "Users can update their own notifications"
ON notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Function to create notification on parcel status change
CREATE OR REPLACE FUNCTION create_status_change_notification()
RETURNS TRIGGER AS $$
DECLARE
    status_message TEXT;
    parcel_number TEXT;
BEGIN
    -- Get the parcel tracking number
    SELECT tracking_number INTO parcel_number
    FROM parcels
    WHERE id = NEW.id;

    -- Define message based on status
    CASE NEW.status
        WHEN 'recu' THEN
            status_message := 'Votre colis ' || parcel_number || ' a été reçu dans notre entrepôt';
        WHEN 'expedie' THEN
            status_message := 'Votre colis ' || parcel_number || ' a été expédié';
        WHEN 'receptionne' THEN
            status_message := 'Votre colis ' || parcel_number || ' a été réceptionné';
        WHEN 'termine' THEN
            status_message := 'Votre colis ' || parcel_number || ' a été livré avec succès';
        WHEN 'litige' THEN
            status_message := 'Un litige a été ouvert pour votre colis ' || parcel_number;
        ELSE
            status_message := 'Le statut de votre colis ' || parcel_number || ' a été mis à jour';
    END CASE;

    -- Insert notification
    INSERT INTO notifications (user_id, parcel_id, message, status)
    VALUES (
        NEW.created_by,
        NEW.id,
        status_message,
        NEW.status
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for parcel status changes
DROP TRIGGER IF EXISTS on_parcel_status_change ON parcels;
CREATE TRIGGER on_parcel_status_change
    AFTER UPDATE OF status ON parcels
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION create_status_change_notification();

-- Drop existing indexes if they exist
DROP INDEX IF EXISTS idx_notifications_user_id;
DROP INDEX IF EXISTS idx_notifications_created_at;
DROP INDEX IF EXISTS idx_notifications_is_read;

-- Create indexes for better query performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
