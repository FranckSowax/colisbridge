import { useMemo } from 'react';
import { useLanguage } from '@contexts/LanguageContext';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { useParcelStats } from '@/hooks/useParcelStats';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Couleurs correspondant aux statuts dans la base de données
const statusColors = {
  receptionne: {
    bg: 'rgba(59, 130, 246, 0.2)', // Bleu
    border: 'rgb(59, 130, 246)',
    label: 'Réceptionné'
  },
  expedie: {
    bg: 'rgba(168, 85, 247, 0.2)', // Violet
    border: 'rgb(168, 85, 247)',
    label: 'Expédié'
  },
  recu: {
    bg: 'rgba(34, 197, 94, 0.2)', // Vert
    border: 'rgb(34, 197, 94)',
    label: 'Reçu'
  },
  litige: {
    bg: 'rgba(234, 179, 8, 0.2)', // Jaune
    border: 'rgb(234, 179, 8)',
    label: 'En litige'
  }
};

export function ParcelCharts() {
  const { t } = useLanguage();
  const { evolution, distribution } = useParcelStats();

  const lineChartData = {
    labels: evolution.map(item => item.date),
    datasets: [
      {
        label: t('dashboard.stats.total'),
        data: evolution.map(item => item.total),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: statusColors.receptionne.label,
        data: evolution.map(item => item.receptionne),
        borderColor: statusColors.receptionne.border,
        backgroundColor: statusColors.receptionne.bg,
        tension: 0.4,
      },
      {
        label: statusColors.expedie.label,
        data: evolution.map(item => item.expedie),
        borderColor: statusColors.expedie.border,
        backgroundColor: statusColors.expedie.bg,
        tension: 0.4,
      },
      {
        label: statusColors.recu.label,
        data: evolution.map(item => item.recu),
        borderColor: statusColors.recu.border,
        backgroundColor: statusColors.recu.bg,
        tension: 0.4,
      },
      {
        label: statusColors.litige.label,
        data: evolution.map(item => item.litige),
        borderColor: statusColors.litige.border,
        backgroundColor: statusColors.litige.bg,
        tension: 0.4,
      },
    ],
  };

  const lineChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            family: 'system-ui',
          },
        },
      },
      title: {
        display: true,
        text: t('dashboard.charts.monthly_evolution'),
        font: {
          size: 16,
          weight: 'bold',
          family: 'system-ui',
        },
        padding: {
          bottom: 30
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value} colis`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            family: 'system-ui',
          },
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          font: {
            family: 'system-ui',
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
    },
  }), [t]);

  const doughnutData = {
    labels: Object.values(statusColors).map(status => status.label),
    datasets: [
      {
        data: distribution.map(item => item.count),
        backgroundColor: Object.values(statusColors).map(color => color.bg),
        borderColor: Object.values(statusColors).map(color => color.border),
        borderWidth: 1,
      },
    ],
  };

  const doughnutOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            family: 'system-ui',
          },
        },
      },
      title: {
        display: true,
        text: t('dashboard.charts.parcel_distribution'),
        font: {
          size: 16,
          weight: 'bold',
          family: 'system-ui',
        },
        padding: {
          bottom: 30
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const item = distribution[context.dataIndex];
            return `${item.status}: ${item.count} colis (${item.percentage}%)`;
          }
        }
      }
    },
    cutout: '60%',
  }), [t]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <div className="h-[300px]">
          <Line options={lineChartOptions} data={lineChartData} />
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <div className="h-[300px]">
          <Doughnut options={doughnutOptions} data={doughnutData} />
        </div>
      </div>
    </div>
  );
}
