import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import {
  PlusIcon,
  QrCodeIcon,
  DocumentDuplicateIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

const actions = [
  {
    name: 'Scanner QR',
    icon: QrCodeIcon,
    onClick: () => {
      // Implémenter la fonction de scan QR
      console.log('Scan QR');
    },
  },
  {
    name: 'Copier réf.',
    icon: DocumentDuplicateIcon,
    onClick: () => {
      // Implémenter la copie de référence
      console.log('Copier référence');
    },
  },
  {
    name: 'Actualiser',
    icon: ArrowPathIcon,
    onClick: () => {
      window.location.reload();
    },
  },
];

export default function QuickActions({ onNewParcel }) {
  return (
    <div className="fixed right-4 bottom-20 sm:hidden z-50">
      <Menu as="div" className="relative">
        <Menu.Button className="flex items-center justify-center w-14 h-14 rounded-full bg-primary-600 text-white shadow-lg hover:bg-primary-700 focus:outline-none">
          <PlusIcon className="h-6 w-6" aria-hidden="true" />
        </Menu.Button>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute right-0 bottom-16 w-48 mb-2 origin-bottom-right bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="py-1">
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={onNewParcel}
                    className={`${
                      active ? 'bg-gray-100' : ''
                    } flex items-center w-full px-4 py-2 text-sm text-gray-700`}
                  >
                    <PlusIcon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
                    Nouveau colis
                  </button>
                )}
              </Menu.Item>
              
              {actions.map((action) => (
                <Menu.Item key={action.name}>
                  {({ active }) => (
                    <button
                      onClick={action.onClick}
                      className={`${
                        active ? 'bg-gray-100' : ''
                      } flex items-center w-full px-4 py-2 text-sm text-gray-700`}
                    >
                      <action.icon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
                      {action.name}
                    </button>
                  )}
                </Menu.Item>
              ))}
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  );
}
