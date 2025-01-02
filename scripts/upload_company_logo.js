require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Créer le client Supabase avec les variables d'environnement
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadCompanyLogo() {
  try {
    console.log('Downloading logo from Imgur...');
    // Télécharger le logo depuis Imgur
    const response = await fetch('https://i.imgur.com/ZU2ZGQk.png');
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const fileName = 'twinsk-logo.png';
    
    console.log('Uploading to Supabase Storage...');
    // Upload le fichier dans le bucket 'company-assets'
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('company-assets')
      .upload(fileName, buffer, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    console.log('Getting public URL...');
    // Obtenir l'URL publique
    const { data: { publicUrl }, error: urlError } = supabase.storage
      .from('company-assets')
      .getPublicUrl(fileName);

    if (urlError) {
      console.error('URL error:', urlError);
      throw urlError;
    }

    console.log('Updating company settings...');
    // Mettre à jour l'URL du logo dans company_settings
    const { error: updateError } = await supabase
      .from('company_settings')
      .update({ logo_url: publicUrl })
      .eq('company_name', 'TWINSK LOGISTICS');

    if (updateError) {
      console.error('Update error:', updateError);
      throw updateError;
    }

    console.log('Logo uploaded successfully:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('Error uploading logo:', error);
    throw error;
  }
}

uploadCompanyLogo();
