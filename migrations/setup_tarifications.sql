-- Création de la table des tarifications
CREATE TABLE IF NOT EXISTS tarifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pays TEXT NOT NULL,
    devise TEXT NOT NULL,
    prix_standard DECIMAL NOT NULL,
    prix_express DECIMAL NOT NULL,
    prix_maritime DECIMAL NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insertion des données de tarification
INSERT INTO tarifications (pays, devise, prix_standard, prix_express, prix_maritime) VALUES
('COTE_IVOIRE', 'XAF', 13000, 20000, 220000),
('DUBAI', 'USD', 20, 30, 200),
('FRANCE', 'EUR', 10, 20, 100),
('GABON', 'XAF', 13000, 20000, 240000),
('TOGO', 'XAF', 13000, 20000, 220000);

-- Politique RLS
ALTER TABLE tarifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users"
ON tarifications FOR SELECT
TO authenticated
USING (true);
