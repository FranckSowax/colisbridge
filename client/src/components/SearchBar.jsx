import React, { useState } from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid';

export default function SearchBar({ onSearch, placeholder = 'Rechercher...' }) {
  const [query, setQuery] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (onSearch) {
      onSearch(query)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative flex w-full items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="block w-full rounded-md border border-gray-200 bg-gray-50 py-1.5 pl-3 pr-10 text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm sm:leading-6"
          placeholder={placeholder}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          <MagnifyingGlassIcon
            className="h-5 w-5 text-gray-400 hover:text-gray-500"
            aria-hidden="true"
          />
        </div>
      </div>
    </form>
  )
}
