import { createClient } from '@supabase/supabase-js'
import { SUPABASE_CONFIG } from './supabaseConfig'

if (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey) {
  throw new Error('Les variables d\'environnement Supabase sont manquantes')
}

console.log('Initialisation du client Supabase...')

export const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'colisbridge-auth',
    storage: typeof window !== 'undefined' ? window.localStorage : null,
    debug: true // Active les logs de débogage pour l'authentification
  }
})

// Vérification de la connexion
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Événement d\'authentification:', event)
  console.log('Session active:', session ? 'Oui' : 'Non')
})
