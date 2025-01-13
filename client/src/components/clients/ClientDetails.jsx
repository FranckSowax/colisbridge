import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  EnvelopeIcon,
  PhoneIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { getCountryWithFlag } from '@/utils/countryFlags';

export function ClientDetails({ client }) {
  if (!client) return null;

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Détails du client</h3>
      </div>
      <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
        <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500 flex items-center">
              <UserIcon className="h-5 w-5 mr-2" />
              Nom
            </dt>
            <dd className="mt-1 text-sm text-gray-900">{client.name}</dd>
          </div>
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500 flex items-center">
              <EnvelopeIcon className="h-5 w-5 mr-2" />
              Email
            </dt>
            <dd className="mt-1 text-sm text-gray-900">{client.email}</dd>
          </div>
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500 flex items-center">
              <PhoneIcon className="h-5 w-5 mr-2" />
              Téléphone
            </dt>
            <dd className="mt-1 text-sm text-gray-900">{client.phone}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm font-medium text-gray-500">Historique des colis</dt>
            <dd className="mt-1 text-sm text-gray-900">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        N° de suivi
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Statut
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Date d'envoi
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Pays
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {client.parcels.map((parcel) => (
                      <tr key={parcel.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {parcel.tracking_number}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            parcel.status === 'recu'
                              ? 'bg-blue-100 text-blue-800'
                              : parcel.status === 'expedie'
                              ? 'bg-yellow-100 text-yellow-800'
                              : parcel.status === 'receptionne'
                              ? 'bg-green-100 text-green-800'
                              : parcel.status === 'termine'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {parcel.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {format(new Date(parcel.created_at), 'dd MMM yyyy', { locale: fr })}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {getCountryWithFlag(parcel.country)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
