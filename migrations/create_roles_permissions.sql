-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create roles table with RLS policies
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on roles if not already enabled
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'roles' AND policyname = 'Allow full access to authenticated users'
    ) THEN
        ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Allow full access to authenticated users" ON public.roles
            FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- Create permissions table with RLS policies
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    module VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(module, action)
);

-- Enable RLS on permissions if not already enabled
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'permissions' AND policyname = 'Allow full access to authenticated users'
    ) THEN
        ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Allow full access to authenticated users" ON public.permissions
            FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- Create role_permissions table with RLS policies
CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    PRIMARY KEY (role_id, permission_id)
);

-- Enable RLS on role_permissions if not already enabled
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'role_permissions' AND policyname = 'Allow full access to authenticated users'
    ) THEN
        ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Allow full access to authenticated users" ON public.role_permissions
            FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- Add role column to users table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'auth' 
        AND table_name = 'users' 
        AND column_name = 'role_id'
    ) THEN
        ALTER TABLE auth.users ADD COLUMN role_id UUID REFERENCES public.roles(id);
    END IF;
END $$;

-- Insert default roles
INSERT INTO public.roles (name, description) VALUES
    ('ADMINISTRATEUR', 'Accès complet à toutes les fonctionnalités'),
    ('GESTIONNAIRE', 'Gestion des colis et des clients'),
    ('AGENT', 'Opérations de base sur les colis')
ON CONFLICT (name) DO NOTHING;

-- Insert default permissions
INSERT INTO public.permissions (module, action, description) VALUES
    -- Dashboard permissions
    ('dashboard', 'view', 'Voir le tableau de bord'),
    ('dashboard', 'export', 'Exporter les données du tableau de bord'),
    
    -- Statistics permissions
    ('statistics', 'view', 'Voir les statistiques'),
    ('statistics', 'export', 'Exporter les statistiques'),
    
    -- Parcels permissions
    ('parcels', 'view', 'Voir les colis'),
    ('parcels', 'create', 'Créer des colis'),
    ('parcels', 'edit', 'Modifier les colis'),
    ('parcels', 'delete', 'Supprimer les colis'),
    
    -- Clients permissions
    ('clients', 'view', 'Voir les clients'),
    ('clients', 'create', 'Créer des clients'),
    ('clients', 'edit', 'Modifier les clients'),
    ('clients', 'delete', 'Supprimer les clients'),
    
    -- Disputes permissions
    ('disputes', 'view', 'Voir les litiges'),
    ('disputes', 'create', 'Créer des litiges'),
    ('disputes', 'edit', 'Modifier les litiges'),
    ('disputes', 'delete', 'Supprimer les litiges'),
    
    -- Settings permissions
    ('settings', 'view', 'Voir les paramètres'),
    ('settings', 'edit', 'Modifier les paramètres')
ON CONFLICT (module, action) DO NOTHING;

-- Get role IDs and insert permissions for ADMINISTRATEUR
DO $$
DECLARE
    admin_role_id UUID;
    gestionnaire_role_id UUID;
    agent_role_id UUID;
BEGIN
    -- Get role IDs
    SELECT id INTO admin_role_id FROM public.roles WHERE name = 'ADMINISTRATEUR';
    SELECT id INTO gestionnaire_role_id FROM public.roles WHERE name = 'GESTIONNAIRE';
    SELECT id INTO agent_role_id FROM public.roles WHERE name = 'AGENT';

    -- Insert all permissions for ADMINISTRATEUR
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT admin_role_id, id FROM public.permissions
    ON CONFLICT DO NOTHING;

    -- Insert specific permissions for GESTIONNAIRE
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT gestionnaire_role_id, id 
    FROM public.permissions
    WHERE module IN ('parcels', 'clients', 'disputes') 
        AND action IN ('view', 'create', 'edit')
    ON CONFLICT DO NOTHING;

    -- Insert specific permissions for AGENT
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT agent_role_id, id 
    FROM public.permissions
    WHERE module IN ('parcels', 'disputes') 
        AND action IN ('view', 'create')
    ON CONFLICT DO NOTHING;
END $$;

-- Set admin role for sowaxcom@gmail.com if not already set
DO $$
DECLARE
    admin_role_id UUID;
BEGIN
    SELECT id INTO admin_role_id FROM public.roles WHERE name = 'ADMINISTRATEUR';
    
    UPDATE auth.users 
    SET role_id = admin_role_id
    WHERE email = 'sowaxcom@gmail.com'
    AND (role_id IS NULL OR role_id != admin_role_id);
END $$;
