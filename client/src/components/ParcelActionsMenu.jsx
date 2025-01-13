import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { EllipsisVerticalIcon } from '@heroicons/react/20/solid';
import { 
  PencilSquareIcon, 
  TrashIcon, 
  DocumentTextIcon,
  EyeIcon 
} from '@heroicons/react/24/outline/index.js';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function ParcelActionsMenu({ onEdit, onDelete, onViewInvoice, onViewDetails }) {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="flex items-center text-gray-400 hover:text-gray-600">
          <span className="sr-only">Options</span>
          <EllipsisVerticalIcon className="h-5 w-5" aria-hidden="true" />
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={onViewDetails}
                  className={classNames(
                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                    'flex w-full px-4 py-2 text-sm items-center'
                  )}
                >
                  <EyeIcon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
                  Voir les détails
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={onEdit}
                  className={classNames(
                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                    'flex w-full px-4 py-2 text-sm items-center'
                  )}
                >
                  <PencilSquareIcon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
                  Modifier
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={onDelete}
                  className={classNames(
                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                    'flex w-full px-4 py-2 text-sm items-center'
                  )}
                >
                  <TrashIcon className="mr-3 h-5 w-5 text-red-400" aria-hidden="true" />
                  Supprimer
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={onViewInvoice}
                  className={classNames(
                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                    'flex w-full px-4 py-2 text-sm items-center'
                  )}
                >
                  <DocumentTextIcon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
                  Voir la facture
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
