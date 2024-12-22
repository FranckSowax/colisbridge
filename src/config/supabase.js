const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Client pour les opérations publiques (côté client)
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Client avec les privilèges admin (côté serveur uniquement)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

module.exports = {
  supabaseClient,
  supabaseAdmin
};
