import { supabase } from '../config/supabaseClient';

export const companyService = {
  async getCompanySettings() {
    const { data, error } = await supabase
      .from('company_settings')
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },

  async uploadLogo(file) {
    try {
      // Créer un nom de fichier unique avec l'extension
      const fileExt = file.name.split('.').pop();
      const fileName = `company-logo.${fileExt}`;
      
      // Upload du fichier dans le bucket 'company-assets'
      const { data, error: uploadError } = await supabase.storage
        .from('company-assets')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Obtenir l'URL publique du logo
      const { data: { publicUrl }, error: urlError } = supabase.storage
        .from('company-assets')
        .getPublicUrl(fileName);

      if (urlError) throw urlError;

      // Mettre à jour l'URL du logo dans les paramètres de l'entreprise
      const { error: updateError } = await supabase
        .from('company_settings')
        .update({ logo_url: publicUrl })
        .eq('company_name', 'TWINSK LOGISTICS');

      if (updateError) throw updateError;

      return publicUrl;
    } catch (error) {
      console.error('Error uploading logo:', error);
      throw error;
    }
  },

  async updateCompanySettings(settings) {
    const { data, error } = await supabase
      .from('company_settings')
      .update(settings)
      .eq('company_name', 'TWINSK LOGISTICS')
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
