import { useMemo } from 'react';
import { 
  InboxIcon, 
  TruckIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

const statuses = [
  {
    id: 'received',
    name: 'Reçus',
    icon: InboxIcon,
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    textColor: 'text-blue-700 dark:text-blue-200',
    iconColor: 'text-blue-600 dark:text-blue-300',
  },
  {
    id: 'shipped',
    name: 'Expédiés',
    icon: TruckIcon,
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    textColor: 'text-purple-700 dark:text-purple-200',
    iconColor: 'text-purple-600 dark:text-purple-300',
  },
  {
    id: 'completed',
    name: 'Terminés',
    icon: CheckCircleIcon,
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    textColor: 'text-green-700 dark:text-green-200',
    iconColor: 'text-green-600 dark:text-green-300',
  },
  {
    id: 'disputed',
    name: 'En litige',
    icon: ExclamationTriangleIcon,
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    textColor: 'text-yellow-700 dark:text-yellow-200',
    iconColor: 'text-yellow-600 dark:text-yellow-300',
  },
];

export function ParcelStats({ stats }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {statuses.map((status) => {
        const count = stats?.[status.id] || 0;
        const Icon = status.icon;

        return (
          <div
            key={status.id}
            className={`relative overflow-hidden rounded-lg ${status.bgColor} px-4 py-5 sm:p-6 shadow-sm transition-all duration-200 hover:shadow-md`}
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Icon
                  className={`h-8 w-8 ${status.iconColor}`}
                  aria-hidden="true"
                />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className={`text-sm font-medium truncate ${status.textColor}`}>
                    {status.name}
                  </dt>
                  <dd className={`mt-1 text-3xl font-semibold tracking-tight ${status.textColor}`}>
                    {count}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
