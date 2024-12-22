-- Ajouter les permissions pour les statistiques à l'administrateur
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    r.id as role_id,
    p.id as permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'ADMINISTRATEUR'
AND p.module = 'statistics'
ON CONFLICT DO NOTHING;

-- Ajouter la permission de vue des statistiques au gestionnaire
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    r.id as role_id,
    p.id as permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'GESTIONNAIRE'
AND p.module = 'statistics'
AND p.action = 'view'
ON CONFLICT DO NOTHING;

-- L'agent n'aura pas accès aux statistiques par défaut
