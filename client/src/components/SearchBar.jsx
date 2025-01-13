import React from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline/index.js';

const SearchBar = ({ value = '', onChange, placeholder }) => {
  const handleChange = (event) => {
    if (typeof onChange === 'function') {
      onChange(event.target.value);
    }
  };

  return (
    <div className="w-full">
      <div className="relative mt-2">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>
        <input
          type="text"
          value={value}
          onChange={handleChange}
          className="block w-full rounded-full bg-white py-3.5 pl-11 pr-4 text-gray-900 ring-1 ring-inset ring-gray-100 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-gray-200 sm:text-sm sm:leading-6 shadow-sm"
          placeholder={placeholder || "Rechercher..."}
        />
      </div>
    </div>
  );
};

export default SearchBar;
