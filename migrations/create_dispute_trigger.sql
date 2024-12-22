-- Create function to handle dispute creation
CREATE OR REPLACE FUNCTION create_dispute_on_parcel_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Si le nouveau statut est 'litige' et l'ancien statut ne l'était pas
    IF NEW.status = 'litige' AND (OLD.status IS NULL OR OLD.status != 'litige') THEN
        -- Créer un nouveau litige
        INSERT INTO disputes (
            parcel_id,
            recipient_id,
            created_by,
            status,
            reason,
            description,
            priority,
            resolution_deadline
        ) VALUES (
            NEW.id,                                    -- parcel_id
            NEW.recipient_id,                          -- recipient_id
            NEW.created_by,                            -- created_by
            'pending',                                 -- status initial du litige
            'Litige signalé sur le colis',            -- reason par défaut
            'Litige créé automatiquement suite au changement de statut du colis', -- description
            'normal',                                  -- priority par défaut
            TIMEZONE('utc'::text, NOW()) + INTERVAL '7 days' -- deadline par défaut (7 jours)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS create_dispute_trigger ON parcels;

-- Create the trigger
CREATE TRIGGER create_dispute_trigger
    AFTER UPDATE OF status ON parcels
    FOR EACH ROW
    EXECUTE FUNCTION create_dispute_on_parcel_status_change();

-- Add comment to explain the trigger
COMMENT ON TRIGGER create_dispute_trigger ON parcels IS 'Crée automatiquement un litige lorsque le statut d''un colis est changé en ''litige''';

-- Create disputes for existing parcels with 'litige' status that don't have a dispute
INSERT INTO disputes (
    parcel_id,
    recipient_id,
    created_by,
    status,
    reason,
    description,
    priority,
    resolution_deadline
)
SELECT 
    p.id,
    p.recipient_id,
    p.created_by,
    'pending',
    'Litige signalé sur le colis',
    'Litige créé automatiquement suite au statut litige du colis',
    'normal',
    TIMEZONE('utc'::text, NOW()) + INTERVAL '7 days'
FROM parcels p
LEFT JOIN disputes d ON d.parcel_id = p.id
WHERE p.status = 'litige' 
AND d.id IS NULL;
