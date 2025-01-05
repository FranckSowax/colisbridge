-- Création de la table clients
CREATE TABLE clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Informations personnelles
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    company_name VARCHAR(255),
    
    -- Adresse
    address TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    
    -- Informations commerciales
    default_currency VARCHAR(3) DEFAULT 'EUR',
    preferred_shipping_method VARCHAR(50),
    payment_terms VARCHAR(100),
    
    -- Métriques
    total_parcels INTEGER DEFAULT 0,
    total_spent DECIMAL(15,2) DEFAULT 0,
    last_order_date TIMESTAMP WITH TIME ZONE,
    
    -- Relations
    created_by UUID NOT NULL,
    
    -- Métadonnées
    notes TEXT,
    tags TEXT[],
    custom_fields JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index pour la table clients
CREATE INDEX idx_clients_name ON clients(full_name);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_company ON clients(company_name);
CREATE INDEX idx_clients_created_by ON clients(created_by);

-- Ajout de la référence client dans la table parcels
ALTER TABLE parcels
ADD COLUMN client_id UUID REFERENCES clients(id),
ADD COLUMN client_reference VARCHAR(100);

-- Index pour la référence client dans parcels
CREATE INDEX idx_parcels_client ON parcels(client_id);

-- Fonction pour mettre à jour les métriques client
CREATE OR REPLACE FUNCTION update_client_metrics()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.client_id IS NOT NULL THEN
        UPDATE clients
        SET total_parcels = total_parcels + 1,
            total_spent = total_spent + COALESCE(NEW.total_price, 0),
            last_order_date = NEW.created_at
        WHERE id = NEW.client_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour les métriques client
CREATE TRIGGER update_client_metrics
    AFTER INSERT ON parcels
    FOR EACH ROW
    EXECUTE FUNCTION update_client_metrics();

-- Activation RLS pour la table clients
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour clients
CREATE POLICY "Enable read access for authenticated users" ON clients
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON clients
    FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated' AND
        auth.uid() = created_by
    );

CREATE POLICY "Enable update for owners and admins" ON clients
    FOR UPDATE
    USING (
        auth.uid() = created_by OR
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() AND 
            raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Fonction pour rechercher des clients
CREATE OR REPLACE FUNCTION search_clients(search_term TEXT)
RETURNS SETOF clients AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM clients
    WHERE 
        full_name ILIKE '%' || search_term || '%' OR
        email ILIKE '%' || search_term || '%' OR
        company_name ILIKE '%' || search_term || '%' OR
        phone ILIKE '%' || search_term || '%'
    ORDER BY 
        CASE 
            WHEN full_name ILIKE search_term || '%' THEN 0
            WHEN full_name ILIKE '%' || search_term || '%' THEN 1
            WHEN company_name ILIKE search_term || '%' THEN 2
            ELSE 3
        END,
        full_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mise à jour de la fonction de notification pour inclure les clients
CREATE OR REPLACE FUNCTION create_client_notification()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notifications (
        type,
        title,
        message,
        reference_type,
        reference_id,
        created_for,
        metadata
    )
    VALUES (
        'new_client',
        'Nouveau client créé',
        'Un nouveau client a été créé : ' || NEW.full_name,
        'client',
        NEW.id,
        NEW.created_by,
        jsonb_build_object(
            'client_id', NEW.id,
            'client_name', NEW.full_name,
            'company_name', NEW.company_name
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour les notifications de nouveau client
CREATE TRIGGER create_client_notification
    AFTER INSERT ON clients
    FOR EACH ROW
    EXECUTE FUNCTION create_client_notification();
