import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

export function StatCard({ title, value, change, trend, timeRange }) {
  const formattedValue = new Intl.NumberFormat().format(value);
  const isPositive = trend === 'up';
  const changeValue = Math.abs(change);

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      </div>
      <div className="mt-2 flex items-baseline">
        <p className="text-2xl font-semibold text-gray-900">{formattedValue}</p>
        <p className={`ml-2 flex items-baseline text-sm font-semibold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
          {isPositive ? (
            <ArrowUpIcon className="h-4 w-4 flex-shrink-0 self-center" aria-hidden="true" />
          ) : (
            <ArrowDownIcon className="h-4 w-4 flex-shrink-0 self-center" aria-hidden="true" />
          )}
          <span className="ml-1">{changeValue}%</span>
        </p>
      </div>
      <div className="mt-1">
        <p className="text-xs text-gray-500">{timeRange}</p>
      </div>
    </div>
  );
}
