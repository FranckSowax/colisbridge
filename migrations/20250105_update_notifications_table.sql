-- Add type and title columns to notifications table
DO $$ 
BEGIN
    -- Add type column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name = 'type'
    ) THEN
        ALTER TABLE notifications
        ADD COLUMN type TEXT NOT NULL DEFAULT 'system';
    END IF;

    -- Add title column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name = 'title'
    ) THEN
        ALTER TABLE notifications
        ADD COLUMN title TEXT;
    END IF;
END $$;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS create_notification;

-- Create function for creating notifications
CREATE OR REPLACE FUNCTION create_notification(
    p_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_user_id UUID,
    p_parcel_id UUID DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO notifications (
        type,
        title,
        message,
        user_id,
        parcel_id,
        status,
        is_read
    ) VALUES (
        p_type,
        p_title,
        p_message,
        p_user_id,
        p_parcel_id,
        'unread',
        false
    )
    RETURNING id INTO v_notification_id;

    RETURN v_notification_id;
END;
$$;
