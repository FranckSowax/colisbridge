import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { EllipsisVerticalIcon } from '@heroicons/react/20/solid';
import {
  ExclamationTriangleIcon,
  CalendarIcon,
  ChatBubbleLeftIcon,
  DocumentTextIcon,
  UserIcon
} from '@heroicons/react/24/outline';

const disputeStatuses = {
  ouvert: { name: 'Ouvert', color: 'bg-yellow-100 text-yellow-800' },
  en_cours: { name: 'En cours', color: 'bg-blue-100 text-blue-800' },
  resolu: { name: 'Résolu', color: 'bg-green-100 text-green-800' },
  ferme: { name: 'Fermé', color: 'bg-gray-100 text-gray-800' }
};

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function DisputeCard({ dispute, onStatusChange, onViewDetails }) {
  const formatDate = (date) => {
    if (!date) return '-';
    try {
      return format(new Date(date), 'dd MMM yyyy', { locale: fr });
    } catch (error) {
      console.error('Erreur de formatage de date:', error);
      return '-';
    }
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* En-tête de la carte */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
            <span className={classNames(
              'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium',
              disputeStatuses[dispute.status]?.color || 'bg-gray-100 text-gray-800'
            )}>
              {disputeStatuses[dispute.status]?.name || dispute.status}
            </span>
          </div>
          <Menu as="div" className="relative">
            <Menu.Button className="-m-2.5 block p-2.5 text-gray-500 hover:text-gray-900">
              <span className="sr-only">Options</span>
              <EllipsisVerticalIcon className="h-5 w-5" aria-hidden="true" />
            </Menu.Button>
            <Transition
              as={Fragment}
              show={true}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-10 mt-2 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                {Object.entries(disputeStatuses).map(([status, { name }]) => (
                  <Menu.Item key={status}>
                    {({ active }) => (
                      <button
                        onClick={() => onStatusChange(dispute.id, status)}
                        className={classNames(
                          active ? 'bg-gray-50' : '',
                          'block px-3 py-1 text-sm leading-6 text-gray-900 w-full text-left'
                        )}
                      >
                        {name}
                      </button>
                    )}
                  </Menu.Item>
                ))}
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => onViewDetails(dispute)}
                      className={classNames(
                        active ? 'bg-gray-50' : '',
                        'block px-3 py-1 text-sm leading-6 text-gray-900 w-full text-left'
                      )}
                    >
                      Voir détails
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>

      {/* Corps de la carte */}
      <div className="px-4 py-3 space-y-3">
        <div className="flex items-center text-sm text-gray-500">
          <DocumentTextIcon className="mr-2 h-4 w-4 flex-shrink-0" />
          <span className="font-medium">{dispute.title}</span>
        </div>

        <div className="flex items-center text-sm text-gray-500">
          <UserIcon className="mr-2 h-4 w-4 flex-shrink-0" />
          <span>{dispute.client_name}</span>
        </div>

        <div className="flex items-center text-sm text-gray-500">
          <ChatBubbleLeftIcon className="mr-2 h-4 w-4 flex-shrink-0" />
          <span className="line-clamp-2">{dispute.description}</span>
        </div>

        <div className="flex items-center text-sm text-gray-500">
          <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
          <span>Créé le {formatDate(dispute.created_at)}</span>
        </div>

        {dispute.resolved_at && (
          <div className="flex items-center text-sm text-gray-500">
            <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
            <span>Résolu le {formatDate(dispute.resolved_at)}</span>
          </div>
        )}
      </div>

      {/* Bouton voir détails */}
      <div className="px-4 py-3 bg-gray-50 text-right">
        <button
          onClick={() => onViewDetails(dispute)}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          Voir les détails
        </button>
      </div>
    </div>
  );
}
