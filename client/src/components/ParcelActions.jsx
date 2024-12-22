import React, { Fragment, useState } from 'react'
import { Menu } from '@headlessui/react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import {
  EllipsisVerticalIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import { supabase } from '../config/supabaseClient'

const statusOptions = [
  { value: 'received', label: 'Reçu' },
  { value: 'in_transit', label: 'En transit' },
  { value: 'delivered', label: 'Livré' },
  { value: 'cancelled', label: 'Annulé' },
  { value: 'dispute', label: 'Litige' }
]

export function ParcelActions({ parcel, onUpdate }) {
  const navigate = useNavigate()
  const [isUpdating, setIsUpdating] = useState(false)

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('parcels')
        .delete()
        .eq('id', parcel.id)

      if (error) throw error

      toast.success('Colis supprimé avec succès')
      navigate('/dashboard/parcels')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Erreur lors de la suppression du colis')
    }
  }

  const updateStatus = async (newStatus) => {
    setIsUpdating(true)
    try {
      const { error } = await supabase
        .from('parcels')
        .update({ status: newStatus })
        .eq('id', parcel.id)

      if (error) throw error

      toast.success('Statut mis à jour avec succès')
      onUpdate && onUpdate()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Erreur lors de la mise à jour du statut')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="flex items-center rounded-full bg-gray-100 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-100">
          <span className="sr-only">Ouvrir les options</span>
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
                  onClick={() => navigate(`/dashboard/parcels/${parcel.id}/edit`)}
                  className={`${
                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                  } flex w-full px-4 py-2 text-sm`}
                >
                  <PencilSquareIcon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
                  Modifier
                </button>
              )}
            </Menu.Item>

            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={handleDelete}
                  className={`${
                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                  } flex w-full px-4 py-2 text-sm`}
                >
                  <TrashIcon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
                  Supprimer
                </button>
              )}
            </Menu.Item>

            <div className="py-1">
              <Menu.Item disabled={isUpdating}>
                {({ active }) => (
                  <div className="px-4 py-2">
                    <span className="text-xs font-semibold text-gray-500">Changer le statut</span>
                    <div className="mt-2 space-y-2">
                      {statusOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => updateStatus(option.value)}
                          disabled={isUpdating || parcel.status === option.value}
                          className={`${
                            active ? 'bg-gray-100' : ''
                          } ${
                            parcel.status === option.value
                              ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                              : 'text-gray-700 hover:bg-gray-50'
                          } flex w-full items-center px-2 py-1 text-sm rounded-md`}
                        >
                          {isUpdating ? (
                            <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <span className="mr-2 h-4 w-4" />
                          )}
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </Menu.Item>
            </div>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  )
}
