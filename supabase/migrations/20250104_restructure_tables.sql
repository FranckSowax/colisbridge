-- Suppression des tables existantes
DROP TABLE IF EXISTS statistics CASCADE;
DROP TABLE IF EXISTS disputes CASCADE;
DROP TABLE IF EXISTS parcels CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;

-- Création de la table parcels avec une structure propre
CREATE TABLE parcels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tracking_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Reçu',
    
    -- Informations du destinataire
    recipient_name VARCHAR(255) NOT NULL,
    recipient_phone VARCHAR(50) NOT NULL,
    recipient_email VARCHAR(255),
    
    -- Informations de livraison
    destination_country VARCHAR(100) NOT NULL,
    destination_city VARCHAR(100),
    destination_address TEXT,
    destination_postal_code VARCHAR(20),
    
    -- Informations du colis
    weight DECIMAL(10,2),
    dimensions VARCHAR(50),
    description TEXT,
    
    -- Informations financières
    total_price DECIMAL(15,2) NOT NULL DEFAULT 0,
    shipping_cost DECIMAL(15,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'EUR',
    
    -- Dates importantes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    sent_date TIMESTAMP WITH TIME ZONE,
    estimated_delivery_date TIMESTAMP WITH TIME ZONE,
    delivered_date TIMESTAMP WITH TIME ZONE,
    
    -- Relations et flags
    created_by UUID NOT NULL,
    has_dispute BOOLEAN DEFAULT FALSE,
    
    -- Contraintes
    CONSTRAINT parcels_status_check CHECK (
        status IN ('Reçu', 'En cours', 'Expédié', 'Litige', 'Terminé')
    )
);

-- Création de la table disputes
CREATE TABLE disputes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parcel_id UUID NOT NULL REFERENCES parcels(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'Ouvert',
    priority VARCHAR(10) NOT NULL DEFAULT 'Medium',
    reason VARCHAR(50) NOT NULL,
    title VARCHAR(255),
    description TEXT,
    resolution_notes TEXT,
    
    -- Dates
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_deadline TIMESTAMP WITH TIME ZONE,
    
    -- Relations
    created_by UUID NOT NULL,
    assigned_to UUID,
    
    -- Contraintes
    CONSTRAINT disputes_status_check CHECK (
        status IN ('Ouvert', 'En cours', 'Résolu', 'Fermé')
    ),
    CONSTRAINT disputes_priority_check CHECK (
        priority IN ('High', 'Medium', 'Low')
    ),
    CONSTRAINT disputes_reason_check CHECK (
        reason IN (
            'Colis perdu',
            'Colis endommagé',
            'Retard de livraison',
            'Erreur de destination',
            'Contenu manquant',
            'Problème de facturation',
            'Autre'
        )
    )
);

-- Création de la table statistics
CREATE TABLE statistics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    entry_date DATE NOT NULL,
    
    -- Métriques quotidiennes
    total_parcels INTEGER DEFAULT 0,
    total_revenue DECIMAL(15,2) DEFAULT 0,
    completed_parcels INTEGER DEFAULT 0,
    completed_revenue DECIMAL(15,2) DEFAULT 0,
    
    -- Métriques par pays
    country_stats JSONB DEFAULT '{}'::jsonb,
    
    -- Dates
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Contrainte unique
    CONSTRAINT statistics_user_date_unique UNIQUE (user_id, entry_date)
);

-- Création de la table notifications
CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Métadonnées
    reference_type VARCHAR(50),
    reference_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- États
    is_read BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    
    -- Relations
    created_for UUID NOT NULL,
    
    -- Dates
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE,
    archived_at TIMESTAMP WITH TIME ZONE
);

-- Index pour optimiser les performances
CREATE INDEX idx_parcels_tracking ON parcels(tracking_number);
CREATE INDEX idx_parcels_status ON parcels(status);
CREATE INDEX idx_parcels_created_by ON parcels(created_by);
CREATE INDEX idx_parcels_country ON parcels(destination_country);

CREATE INDEX idx_disputes_parcel ON disputes(parcel_id);
CREATE INDEX idx_disputes_status ON disputes(status);
CREATE INDEX idx_disputes_created_by ON disputes(created_by);
CREATE INDEX idx_disputes_assigned ON disputes(assigned_to);

CREATE INDEX idx_statistics_user ON statistics(user_id);
CREATE INDEX idx_statistics_date ON statistics(entry_date);

CREATE INDEX idx_notifications_user ON notifications(created_for);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_reference ON notifications(reference_type, reference_id);

-- Fonction pour mettre à jour le timestamp updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER update_parcels_updated_at
    BEFORE UPDATE ON parcels
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_disputes_updated_at
    BEFORE UPDATE ON disputes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_statistics_updated_at
    BEFORE UPDATE ON statistics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Fonction pour mettre à jour les statistiques
CREATE OR REPLACE FUNCTION update_user_statistics()
RETURNS TRIGGER AS $$
DECLARE
    country_key TEXT;
    current_country_stats JSONB;
BEGIN
    country_key := NEW.destination_country;
    
    -- Calculer les statistiques pour le pays
    current_country_stats := jsonb_build_object(
        'total_parcels', 1,
        'total_revenue', COALESCE(NEW.total_price, 0)
    );

    -- Insérer ou mettre à jour les statistiques
    INSERT INTO statistics (
        user_id,
        entry_date,
        total_parcels,
        total_revenue,
        completed_parcels,
        completed_revenue,
        country_stats
    )
    VALUES (
        NEW.created_by,
        CURRENT_DATE,
        1,
        COALESCE(NEW.total_price, 0),
        CASE WHEN NEW.status = 'Terminé' THEN 1 ELSE 0 END,
        CASE WHEN NEW.status = 'Terminé' THEN COALESCE(NEW.total_price, 0) ELSE 0 END,
        jsonb_build_object(country_key, current_country_stats)
    )
    ON CONFLICT (user_id, entry_date) 
    DO UPDATE SET
        total_parcels = statistics.total_parcels + 1,
        total_revenue = statistics.total_revenue + EXCLUDED.total_revenue,
        completed_parcels = statistics.completed_parcels + EXCLUDED.completed_parcels,
        completed_revenue = statistics.completed_revenue + EXCLUDED.completed_revenue,
        country_stats = statistics.country_stats || 
            jsonb_build_object(
                country_key,
                jsonb_build_object(
                    'total_parcels', COALESCE((statistics.country_stats->country_key->>'total_parcels')::integer, 0) + 1,
                    'total_revenue', COALESCE((statistics.country_stats->country_key->>'total_revenue')::decimal, 0) + COALESCE(NEW.total_price, 0)
                )
            );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour les statistiques
CREATE TRIGGER update_statistics_on_parcel
    AFTER INSERT ON parcels
    FOR EACH ROW
    EXECUTE FUNCTION update_user_statistics();

-- Fonction pour gérer les disputes
CREATE OR REPLACE FUNCTION handle_dispute_status()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Mettre à jour le statut du colis lors de la création d'un litige
        UPDATE parcels 
        SET status = 'Litige',
            has_dispute = TRUE
        WHERE id = NEW.parcel_id;
        
        -- Définir le deadline basé sur la priorité
        NEW.resolution_deadline := CASE NEW.priority
            WHEN 'High' THEN NEW.created_at + interval '24 hours'
            WHEN 'Medium' THEN NEW.created_at + interval '72 hours'
            WHEN 'Low' THEN NEW.created_at + interval '168 hours'
        END;
        
    ELSIF TG_OP = 'UPDATE' AND NEW.status = 'Résolu' AND OLD.status != 'Résolu' THEN
        -- Mettre à jour le statut du colis lors de la résolution
        UPDATE parcels 
        SET status = 'En cours',
            has_dispute = FALSE
        WHERE id = NEW.parcel_id;
        
        NEW.resolved_at = timezone('utc'::text, now());
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour les disputes
CREATE TRIGGER handle_dispute_status
    BEFORE INSERT OR UPDATE ON disputes
    FOR EACH ROW
    EXECUTE FUNCTION handle_dispute_status();

-- Activation RLS
ALTER TABLE parcels ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour parcels
CREATE POLICY "Enable read access for authenticated users" ON parcels
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON parcels
    FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated' AND
        auth.uid() = created_by
    );

CREATE POLICY "Enable update for owners and admins" ON parcels
    FOR UPDATE
    USING (
        auth.uid() = created_by OR
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() AND 
            raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Politiques RLS pour disputes
CREATE POLICY "Enable read access for authenticated users" ON disputes
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON disputes
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for involved users" ON disputes
    FOR UPDATE
    USING (
        auth.uid() IN (created_by, assigned_to) OR
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() AND 
            raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Politiques RLS pour statistics
CREATE POLICY "Enable read access for owners" ON statistics
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Enable insert for system" ON statistics
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for system" ON statistics
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Politiques RLS pour notifications
CREATE POLICY "Enable read access for recipients" ON notifications
    FOR SELECT
    USING (created_for = auth.uid());

CREATE POLICY "Enable insert for system" ON notifications
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for recipients" ON notifications
    FOR UPDATE
    USING (created_for = auth.uid());
