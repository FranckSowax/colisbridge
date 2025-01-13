import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export function ClientSearch({ value, onChange }) {
  return (
    <div className="w-full max-w-lg">
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="block w-full rounded-lg border-0 py-3 pl-10 pr-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6"
          placeholder="Rechercher par nom, email ou téléphone..."
        />
      </div>
    </div>
  );
}
