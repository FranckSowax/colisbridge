import React, { useState } from 'react';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { useLanguage } from '@contexts/LanguageContext';

const PhotoUpload = ({ photos, onChange, maxPhotos = 5 }) => {
  const { t, loading: langLoading } = useLanguage();
  const [dragActive, setDragActive] = useState(false);

  // Fallback pendant le chargement des traductions
  if (langLoading) {
    return (
      <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files) => {
    const newFiles = Array.from(files);
    if (photos.length + newFiles.length > maxPhotos) {
      alert(t('parcels.form.errors.photoLimit', { max: maxPhotos }));
      return;
    }
    onChange([...photos, ...newFiles]);
  };

  const removePhoto = (index) => {
    const newPhotos = [...photos];
    newPhotos.splice(index, 1);
    onChange(newPhotos);
  };

  return (
    <div className="mt-2 flex flex-col gap-4">
      <div
        className={`flex justify-center rounded-lg border border-dashed px-6 py-10 ${
          dragActive
            ? 'border-indigo-600 bg-indigo-50'
            : 'border-gray-900/25'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="text-center">
          <PhotoIcon
            className="mx-auto h-12 w-12 text-gray-300"
            aria-hidden="true"
          />
          <div className="mt-4 flex text-sm leading-6 text-gray-600">
            <label
              htmlFor="file-upload"
              className="relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500"
            >
              <span>{t('parcels.form.upload.button')}</span>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                className="sr-only"
                accept="image/*"
                multiple
                onChange={handleChange}
              />
            </label>
            <p className="pl-1">{t('parcels.form.upload.dragndrop')}</p>
          </div>
          <p className="text-xs leading-5 text-gray-600">
            {t('parcels.form.upload.formats')}
          </p>
        </div>
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((photo, index) => (
            <div
              key={index}
              className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100"
            >
              <img
                src={URL.createObjectURL(photo)}
                alt={`Photo ${index + 1}`}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PhotoUpload;
