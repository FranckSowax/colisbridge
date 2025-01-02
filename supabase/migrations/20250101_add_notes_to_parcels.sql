-- Add notes column to parcels table
ALTER TABLE public.parcels
ADD COLUMN IF NOT EXISTS notes TEXT;
