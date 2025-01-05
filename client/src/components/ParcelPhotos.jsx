import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { photoService } from '../services/photoService';
import { useLanguage } from '../context/LanguageContext';

export default function ParcelPhotos({ parcelId }) {
  const { t } = useLanguage();
  const { data: photos, isLoading, error } = useQuery({
    queryKey: ['parcel-photos', parcelId],
    queryFn: () => photoService.getParcelPhotos(parcelId),
    enabled: !!parcelId
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        {t('errors.loadingPhotos')}
      </div>
    );
  }

  if (!photos?.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        {t('parcels.details.noPhotos')}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4">
      {photos.map((photo) => (
        <div 
          key={photo.id} 
          className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer"
          onClick={() => window.open(photo.url, '_blank')}
        >
          <img
            src={photo.url}
            alt={t('parcels.details.photoAlt', { id: photo.id })}
            className="object-cover w-full h-full transition-transform group-hover:scale-105"
            onError={(e) => {
              e.target.src = '/placeholder-image.png'; // Image par défaut en cas d'erreur
              e.target.classList.add('error');
            }}
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity" />
        </div>
      ))}
    </div>
  );
}
