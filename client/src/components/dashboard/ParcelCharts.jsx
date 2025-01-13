import { useMemo } from 'react';
import { useLanguage } from '@contexts/LanguageContext';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const chartColors = {
  received: 'rgb(99, 102, 241)',
  processing: 'rgb(59, 130, 246)',
  shipped: 'rgb(139, 92, 246)',
  completed: 'rgb(34, 197, 94)',
  disputed: 'rgb(234, 179, 8)',
};

export function ParcelCharts({ monthlyData }) {
  const { t } = useLanguage();

  const lineChartOptions = useMemo(() => ({
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: t('dashboard.charts.monthly_evolution'),
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      },
    },
  }), [t]);

  const lineChartData = useMemo(() => ({
    labels: monthlyData?.labels || [],
    datasets: Object.entries(monthlyData?.datasets || {}).map(([key, data]) => ({
      label: t(`dashboard.stats.${key}`),
      data: data || [],
      borderColor: chartColors[key],
      backgroundColor: `${chartColors[key]}20`,
      tension: 0.4,
      fill: true,
    })),
  }), [monthlyData, t]);

  if (!monthlyData?.labels?.length) {
    return (
      <div className="mt-8 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500 dark:text-gray-400">
            {t('dashboard.no_data')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
      <Line options={lineChartOptions} data={lineChartData} />
    </div>
  );
}
