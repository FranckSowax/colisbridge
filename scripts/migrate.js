import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY // Notez qu'il faut utiliser la clé service_role pour les migrations
);

async function runMigration() {
  try {
    const sql = fs.readFileSync(
      path.join(process.cwd(), 'migrations', 'add_parcel_columns.sql'),
      'utf8'
    );

    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) throw error;
    
    console.log('Migration réussie !');
  } catch (error) {
    console.error('Erreur lors de la migration:', error);
  }
}

runMigration();
