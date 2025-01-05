import { supabase } from '../config/supabaseClient';

export const photoService = {
  async uploadParcelPhoto(file, parcelId) {
    try {
      // Générer un nom de fichier unique
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${parcelId}/${fileName}`;

      // Télécharger le fichier dans le bucket storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('parcel-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Obtenir l'URL publique du fichier
      const { data: { publicUrl } } = supabase.storage
        .from('parcel-photos')
        .getPublicUrl(filePath);

      // Enregistrer les informations de la photo dans la base de données
      const { data: photo, error: dbError } = await supabase
        .from('parcel_photos')
        .insert([
          {
            parcel_id: parcelId,
            file_name: fileName,
            file_path: filePath,
            url: publicUrl
          }
        ])
        .select()
        .single();

      if (dbError) throw dbError;

      return photo;
    } catch (error) {
      console.error('Error uploading photo:', error);
      throw error;
    }
  },

  async deleteParcelPhoto(photoId) {
    try {
      // Récupérer les informations de la photo
      const { data: photo, error: fetchError } = await supabase
        .from('parcel_photos')
        .select('file_path')
        .eq('id', photoId)
        .single();

      if (fetchError) throw fetchError;

      // Supprimer le fichier du storage
      const { error: storageError } = await supabase.storage
        .from('parcel-photos')
        .remove([photo.file_path]);

      if (storageError) throw storageError;

      // Supprimer l'entrée de la base de données
      const { error: dbError } = await supabase
        .from('parcel_photos')
        .delete()
        .eq('id', photoId);

      if (dbError) throw dbError;
    } catch (error) {
      console.error('Error deleting photo:', error);
      throw error;
    }
  },

  async getParcelPhotos(parcelId) {
    const { data, error } = await supabase
      .from('parcel_photos')
      .select('*')
      .eq('parcel_id', parcelId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
};
