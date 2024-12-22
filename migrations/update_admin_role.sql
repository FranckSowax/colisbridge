-- Mettre à jour le rôle de l'utilisateur admin
UPDATE public.profiles 
SET agency_role = 'admin'
WHERE id IN (
  SELECT id 
  FROM auth.users 
  WHERE email = 'sowaxcom@gmail.com'
);

-- Vérifier que le changement a été effectué
SELECT u.id, u.email, p.agency_role
FROM auth.users u
JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'sowaxcom@gmail.com';
