-- Activer RLS sur la table parcels
ALTER TABLE parcels ENABLE ROW LEVEL SECURITY;

-- Politique pour la création de colis
CREATE POLICY "Users can create their own parcels"
ON parcels FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Politique pour la lecture des colis
CREATE POLICY "Users can view their own parcels"
ON parcels FOR SELECT
TO authenticated
USING (auth.uid() = created_by);

-- Politique pour la mise à jour des colis
CREATE POLICY "Users can update their own parcels"
ON parcels FOR UPDATE
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

-- Politique pour la suppression des colis
CREATE POLICY "Users can delete their own parcels"
ON parcels FOR DELETE
TO authenticated
USING (auth.uid() = created_by);

-- Gérer les enregistrements existants avec created_by NULL
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Récupérer le premier utilisateur admin ou créer un utilisateur système
    SELECT id INTO admin_user_id FROM auth.users LIMIT 1;
    
    IF admin_user_id IS NULL THEN
        RAISE EXCEPTION 'Aucun utilisateur trouvé dans la base de données';
    END IF;
    
    -- Mettre à jour les enregistrements NULL avec l'ID de l'admin
    UPDATE parcels 
    SET created_by = admin_user_id
    WHERE created_by IS NULL;
END $$;

-- Maintenant nous pouvons ajouter la contrainte NOT NULL
ALTER TABLE parcels 
ALTER COLUMN created_by SET NOT NULL,
ADD CONSTRAINT fk_created_by
FOREIGN KEY (created_by)
REFERENCES auth.users(id)
ON DELETE CASCADE;
