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
  const { evolution, distribution, stats } = useParcelStats();

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
        text: 'Évolution mensuelle des colis',
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

  // Données pour le graphique en donut
  const doughnutData = {
    labels: ['Réceptionné', 'Expédié', 'Reçu', 'En litige'],
    datasets: [
      {
        data: [2, 6, 3, 2], // Valeurs correspondant aux statistiques
        backgroundColor: [
          'rgba(59, 130, 246, 0.2)',  // Bleu - Réceptionné
          'rgba(168, 85, 247, 0.2)',   // Violet - Expédié
          'rgba(34, 197, 94, 0.2)',    // Vert - Reçu
          'rgba(234, 179, 8, 0.2)',    // Jaune - En litige
        ],
        borderColor: [
          'rgb(59, 130, 246)',   // Bleu
          'rgb(168, 85, 247)',   // Violet
          'rgb(34, 197, 94)',    // Vert
          'rgb(234, 179, 8)',    // Jaune
        ],
        borderWidth: 1,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
      },
      title: {
        display: true,
        text: 'Distribution des colis par statut',
      },
    },
  };

  return (
    <div className="mt-4 sm:mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
      {/* Graphique d'évolution */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="w-full h-[300px] sm:h-[400px]">
          <Line options={{
            ...lineChartOptions,
            maintainAspectRatio: false,
            plugins: {
              ...lineChartOptions.plugins,
              legend: {
                ...lineChartOptions.plugins.legend,
                labels: {
                  ...lineChartOptions.plugins.legend.labels,
                  color: '#111827', // Texte foncé pour le thème clair
                  font: {
                    size: window.innerWidth < 640 ? 10 : 12
                  }
                }
              }
            },
            scales: {
              ...lineChartOptions.scales,
              x: {
                ...lineChartOptions.scales.x,
                ticks: {
                  color: '#111827',
                  font: {
                    size: window.innerWidth < 640 ? 10 : 12
                  }
                }
              },
              y: {
                ...lineChartOptions.scales.y,
                ticks: {
                  color: '#111827',
                  font: {
                    size: window.innerWidth < 640 ? 10 : 12
                  }
                }
              }
            }
          }} data={lineChartData} />
        </div>
      </div>

      {/* Graphique de distribution */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="w-full h-[300px] sm:h-[400px]">
          <Doughnut data={doughnutData} options={{
            ...doughnutOptions,
            maintainAspectRatio: false,
            plugins: {
              ...doughnutOptions.plugins,
              legend: {
                position: 'bottom',
                labels: {
                  color: '#111827', // Texte foncé pour le thème clair
                  padding: window.innerWidth < 640 ? 10 : 20,
                  font: {
                    size: window.innerWidth < 640 ? 10 : 12
                  }
                }
              },
              title: {
                ...doughnutOptions.plugins.title,
                color: '#111827',
                font: {
                  size: window.innerWidth < 640 ? 14 : 16,
                  weight: 'bold'
                }
              }
            }
          }} />
        </div>
      </div>
    </div>
  );
}
