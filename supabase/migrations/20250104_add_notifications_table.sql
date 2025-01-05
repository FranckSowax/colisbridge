-- Suppression de la table si elle existe
DROP TABLE IF EXISTS notifications CASCADE;

-- Création de la table notifications
CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    user_id UUID NOT NULL,
    parcel_id UUID REFERENCES parcels(id),
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    CONSTRAINT notifications_type_check CHECK (
        type IN ('parcel_created', 'parcel_updated', 'parcel_delivered', 'dispute_opened', 'dispute_resolved')
    )
);

-- Création des index
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_parcel ON notifications(parcel_id);
CREATE INDEX idx_notifications_read ON notifications(read);

-- Ajout des politiques RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Politique pour la lecture des notifications
CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

-- Politique pour la création des notifications par le système
CREATE POLICY "System can create notifications"
    ON notifications FOR INSERT
    WITH CHECK (true);

-- Politique pour la mise à jour des notifications
CREATE POLICY "Users can mark their notifications as read"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Trigger pour mettre à jour le timestamp
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notifications_timestamp
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_notifications_updated_at();

-- Fonction pour créer une notification
CREATE OR REPLACE FUNCTION create_notification(
    p_type VARCHAR,
    p_title VARCHAR,
    p_message TEXT,
    p_user_id UUID,
    p_parcel_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO notifications (
        type,
        title,
        message,
        user_id,
        parcel_id
    ) VALUES (
        p_type,
        p_title,
        p_message,
        p_user_id,
        p_parcel_id
    ) RETURNING id INTO v_notification_id;

    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
