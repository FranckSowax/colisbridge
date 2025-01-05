-- Suppression de l'ancienne table si elle existe
DROP TABLE IF EXISTS statistics CASCADE;

-- Création de la table statistics
CREATE TABLE statistics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    entry_date DATE NOT NULL,
    total_revenue DECIMAL(15,2) DEFAULT 0,
    completed_revenue DECIMAL(15,2) DEFAULT 0,
    total_parcels INTEGER DEFAULT 0,
    month_revenue DECIMAL(15,2) DEFAULT 0,
    country_stats JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Création d'un index unique pour user_id et entry_date
CREATE UNIQUE INDEX idx_statistics_user_date ON statistics(user_id, entry_date);

-- Index pour améliorer les performances des requêtes
CREATE INDEX idx_statistics_user ON statistics(user_id);
CREATE INDEX idx_statistics_date ON statistics(entry_date);

-- Fonction pour mettre à jour le timestamp updated_at
CREATE OR REPLACE FUNCTION update_statistics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour automatiquement updated_at
CREATE TRIGGER set_statistics_updated_at
    BEFORE UPDATE ON statistics
    FOR EACH ROW
    EXECUTE FUNCTION update_statistics_updated_at();

-- Activation de la sécurité niveau ligne
ALTER TABLE statistics ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour statistics
CREATE POLICY "Enable read access for owners" ON statistics
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for owners" ON statistics
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for owners" ON statistics
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Fonction pour mettre à jour les statistiques lors des changements de colis
CREATE OR REPLACE FUNCTION update_statistics()
RETURNS TRIGGER AS $$
DECLARE
    month_key TEXT;
    country_key TEXT;
    current_month_revenue DECIMAL;
    current_country_stats JSONB;
    new_month_revenue JSONB;
BEGIN
    month_key := to_char(CURRENT_DATE, 'YYYY-MM');
    country_key := NEW.destination_country;
    
    -- Calcul du nouveau revenu mensuel
    current_month_revenue := COALESCE((
        SELECT (statistics.month_revenue)::text::decimal
        FROM statistics 
        WHERE user_id = NEW.created_by 
        AND entry_date = CURRENT_DATE
    ), 0) + COALESCE(NEW.total_price, 0);

    -- Construction du nouveau revenu mensuel en JSONB
    new_month_revenue := jsonb_build_object(month_key, current_month_revenue::text);

    -- Calcul des nouvelles statistiques par pays
    current_country_stats := jsonb_build_object(
        'parcels', COALESCE((
            SELECT ((country_stats->country_key)->>'parcels')::int 
            FROM statistics 
            WHERE user_id = NEW.created_by 
            AND entry_date = CURRENT_DATE
        ), 0) + 1,
        'revenue', (COALESCE((
            SELECT ((country_stats->country_key)->>'revenue')::decimal
            FROM statistics 
            WHERE user_id = NEW.created_by 
            AND entry_date = CURRENT_DATE
        ), 0) + COALESCE(NEW.total_price, 0))::text,
        'completed_revenue', (CASE 
            WHEN NEW.status = 'Terminé' THEN COALESCE((
                SELECT ((country_stats->country_key)->>'completed_revenue')::decimal
                FROM statistics 
                WHERE user_id = NEW.created_by 
                AND entry_date = CURRENT_DATE
            ), 0) + COALESCE(NEW.total_price, 0)
            ELSE COALESCE((
                SELECT ((country_stats->country_key)->>'completed_revenue')::decimal
                FROM statistics 
                WHERE user_id = NEW.created_by 
                AND entry_date = CURRENT_DATE
            ), 0)
        END)::text
    );

    -- Insertion ou mise à jour des statistiques
    INSERT INTO statistics (
        user_id,
        entry_date,
        total_revenue,
        completed_revenue,
        total_parcels,
        month_revenue,
        country_stats
    )
    VALUES (
        NEW.created_by,
        CURRENT_DATE,
        COALESCE(NEW.total_price, 0),
        CASE WHEN NEW.status = 'Terminé' THEN COALESCE(NEW.total_price, 0) ELSE 0 END,
        1,
        new_month_revenue,
        jsonb_build_object(country_key, current_country_stats)
    )
    ON CONFLICT (user_id, entry_date) DO UPDATE SET
        total_revenue = statistics.total_revenue + COALESCE(NEW.total_price, 0),
        completed_revenue = CASE 
            WHEN NEW.status = 'Terminé' THEN statistics.completed_revenue + COALESCE(NEW.total_price, 0)
            ELSE statistics.completed_revenue
        END,
        total_parcels = statistics.total_parcels + 1,
        month_revenue = jsonb_set(
            COALESCE(statistics.month_revenue, '{}'::jsonb),
            array[month_key],
            to_jsonb(current_month_revenue::text)
        ),
        country_stats = jsonb_set(
            COALESCE(statistics.country_stats, '{}'::jsonb),
            array[country_key],
            current_country_stats
        ),
        updated_at = timezone('utc'::text, now());

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour les nouveaux colis
DROP TRIGGER IF EXISTS update_statistics_on_new_parcel ON parcels;
CREATE TRIGGER update_statistics_on_new_parcel
    AFTER INSERT ON parcels
    FOR EACH ROW
    EXECUTE FUNCTION update_statistics();
