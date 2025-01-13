import { createClient } from '@supabase/supabase-js';

// ATTENTION: Ces clés sont publiques et peuvent être exposées côté client
// Ne stockez jamais de clés secrètes ici
export const SUPABASE_CONFIG = {
  url: 'https://ayxltzvmpqxtyfvfotxd.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5eGx0enZtcHF4dHlmdmZvdHhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0Nzk5NjcsImV4cCI6MjA1MDA1NTk2N30.--5nlZFj4yKdBg_X0ked23vvFMsvWdKQ2dNbpJlnq0s'
};

// Création et export de l'instance Supabase
export const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
