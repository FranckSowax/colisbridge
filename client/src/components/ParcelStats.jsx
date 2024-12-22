import { InboxIcon, TruckIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

const stats = [
  { name: 'Reçus', value: '0', icon: InboxIcon, change: '+0%', changeType: 'increase' },
  { name: 'Expédiés', value: '0', icon: TruckIcon, change: '+0%', changeType: 'increase' },
  { name: 'Réceptionnés', value: '0', icon: CheckCircleIcon, change: '+0%', changeType: 'increase' },
  { name: 'Terminés', value: '0', icon: XCircleIcon, change: '+0%', changeType: 'increase' },
  { name: 'Litiges', value: '0', icon: ExclamationTriangleIcon, change: '+0%', changeType: 'decrease' }
]

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function ParcelStats({ parcels }) {
  // Calculer les statistiques à partir des colis
  const calculateStats = () => {
    const counts = {
      recu: 0,
      expedie: 0,
      receptionne: 0,
      termine: 0,
      litige: 0
    }
    
    parcels.forEach(parcel => {
      if (counts[parcel.status] !== undefined) {
        counts[parcel.status]++
      }
    })

    return [
      { ...stats[0], value: counts.recu.toString() },
      { ...stats[1], value: counts.expedie.toString() },
      { ...stats[2], value: counts.receptionne.toString() },
      { ...stats[3], value: counts.termine.toString() },
      { ...stats[4], value: counts.litige.toString() }
    ]
  }

  const currentStats = calculateStats()

  return (
    <div>
      <dl className="mx-auto grid grid-cols-1 gap-px bg-gray-900/5 sm:grid-cols-2 lg:grid-cols-5">
        {currentStats.map((stat) => (
          <div
            key={stat.name}
            className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 bg-white px-4 py-10 sm:px-6 xl:px-8"
          >
            <dt className="text-sm font-medium leading-6 text-gray-500">
              <div className="flex items-center gap-x-2">
                <stat.icon className="h-5 w-5 text-gray-400" />
                {stat.name}
              </div>
            </dt>
            <dd className="w-full flex-none text-3xl font-medium leading-10 tracking-tight text-gray-900">
              {stat.value}
            </dd>
            {stat.change && (
              <dd
                className={classNames(
                  stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600',
                  'text-xs font-medium'
                )}
              >
                {stat.change}
              </dd>
            )}
          </div>
        ))}
      </dl>
    </div>
  )
}
