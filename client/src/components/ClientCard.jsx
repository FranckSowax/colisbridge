import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { UserIcon, PhoneIcon, EnvelopeIcon, CalendarIcon, InboxIcon } from '@heroicons/react/24/outline';

export default function ClientCard({ client, onViewParcels }) {
  const formatDate = (date) => {
    return format(new Date(date), 'dd MMM yyyy', { locale: fr });
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-3">
        <div className="space-y-3">
          <div className="flex items-center text-sm">
            <UserIcon className="mr-2 h-4 w-4 flex-shrink-0 text-gray-500" />
            <span className="font-medium text-gray-900">{client.name}</span>
          </div>

          {client.phone && (
            <div className="flex items-center text-sm text-gray-500">
              <PhoneIcon className="mr-2 h-4 w-4 flex-shrink-0" />
              <span>{client.phone}</span>
            </div>
          )}

          {client.email && (
            <div className="flex items-center text-sm text-gray-500">
              <EnvelopeIcon className="mr-2 h-4 w-4 flex-shrink-0" />
              <span>{client.email}</span>
            </div>
          )}

          <div className="flex items-center text-sm text-gray-500">
            <InboxIcon className="mr-2 h-4 w-4 flex-shrink-0" />
            <span>{client.parcels?.[0]?.count || 0} colis</span>
          </div>

          <div className="flex items-center text-sm text-gray-500">
            <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
            <span>Client depuis le {formatDate(client.created_at)}</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 bg-gray-50 text-right">
        <button
          onClick={() => onViewParcels(client)}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          Voir les colis
        </button>
      </div>
    </div>
  );
}
