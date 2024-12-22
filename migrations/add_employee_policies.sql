-- Enable RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Politique pour la création d'employés
CREATE POLICY "Allow admins to create employees"
ON public.employees FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.agency_role = 'admin'
  )
);

-- Politique pour la lecture des employés
CREATE POLICY "Allow admins to view employees"
ON public.employees FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.agency_role = 'admin'
  )
);

-- Politique pour la mise à jour des employés
CREATE POLICY "Allow admins to update employees"
ON public.employees FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.agency_role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.agency_role = 'admin'
  )
);

-- Politique pour la suppression des employés
CREATE POLICY "Allow admins to delete employees"
ON public.employees FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.agency_role = 'admin'
  )
);
