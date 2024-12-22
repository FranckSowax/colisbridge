import { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { supabase } from '../config/supabaseClient'
import { toast } from 'react-hot-toast'
import { handleStatusChange } from '../services/webhookService'

const statuses = [
  { name: 'Reçu', value: 'recu', color: 'bg-gray-100 text-gray-800' },
  { name: 'Expédié', value: 'expedie', color: 'bg-blue-100 text-blue-800' },
  { name: 'Réceptionné', value: 'receptionne', color: 'bg-yellow-100 text-yellow-800' },
  { name: 'Terminé', value: 'termine', color: 'bg-green-100 text-green-800' },
  { name: 'Litige', value: 'litige', color: 'bg-red-100 text-red-800' },
]

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function StatusChangeMenu({ parcel, onStatusChange }) {
  const currentStatus = statuses.find(status => status.value === parcel.status) || statuses[0]

  const updateParcelStatus = async (newStatus) => {
    try {
      const { error } = await supabase
        .from('parcels')
        .update({ status: newStatus })
        .eq('id', parcel.id)

      if (error) throw error

      // Appeler le webhook pour envoyer la notification
      await handleStatusChange(parcel, newStatus)
      
      onStatusChange(newStatus)
      toast.success('Statut mis à jour avec succès')
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Erreur lors de la mise à jour du statut')
    }
  }

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className={classNames(
          currentStatus.color,
          'inline-flex items-center rounded-md px-3 py-1 text-xs font-medium ring-1 ring-inset ring-gray-200'
        )}>
          {currentStatus.name}
          <ChevronDownIcon className="-mr-1 ml-1 h-4 w-4" aria-hidden="true" />
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
        <Menu.Items className="absolute left-0 z-10 mt-2 w-40 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            {statuses.map((status) => (
              <Menu.Item key={status.value}>
                {({ active }) => (
                  <button
                    onClick={() => updateParcelStatus(status.value)}
                    className={classNames(
                      active ? 'bg-gray-100' : '',
                      'block w-full px-4 py-2 text-left text-sm',
                      status.value === currentStatus.value ? 'font-medium' : ''
                    )}
                  >
                    <span className={classNames(
                      status.color,
                      'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ring-gray-200'
                    )}>
                      {status.name}
                    </span>
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  )
}
