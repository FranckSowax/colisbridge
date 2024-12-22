-- Vérifier si les tables existent
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'roles'
) as roles_exists,
EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'permissions'
) as permissions_exists,
EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'role_permissions'
) as role_permissions_exists;

-- Vérifier les politiques RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('roles', 'permissions', 'role_permissions');

-- Vérifier le contenu des tables
SELECT 'roles' as table_name, count(*) as count FROM roles
UNION ALL
SELECT 'permissions', count(*) FROM permissions
UNION ALL
SELECT 'role_permissions', count(*) FROM role_permissions;
