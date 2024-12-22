-- Supprimer les anciennes permissions de devis
DELETE FROM role_permissions
WHERE permission_id IN (
    SELECT id FROM permissions WHERE module = 'quotes'
);

DELETE FROM permissions WHERE module = 'quotes';

-- Ajouter les permissions pour les clients à l'administrateur
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    r.id as role_id,
    p.id as permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'ADMINISTRATEUR'
AND p.module = 'clients'
ON CONFLICT DO NOTHING;

-- Ajouter les permissions pour les clients au gestionnaire (view, create, edit)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    r.id as role_id,
    p.id as permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'GESTIONNAIRE'
AND p.module = 'clients'
AND p.action IN ('view', 'create', 'edit')
ON CONFLICT DO NOTHING;

-- Ajouter la permission de vue des clients à l'agent
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    r.id as role_id,
    p.id as permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'AGENT'
AND p.module = 'clients'
AND p.action = 'view'
ON CONFLICT DO NOTHING;
