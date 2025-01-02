import { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabase/client';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const STATUS_MAPPING = {
  'recu': 'Reçu',
  'expedie': 'Expédié',
  'termine': 'Terminé',
  'litige': 'En litige'
};

const Statistics = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    parcelsOverTime: {},
    parcelsByStatus: {},
    parcelsByCountry: {},
    revenueData: {},
    totalParcels: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    if (user?.id) {
      fetchStatistics();
    }
  }, [user]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      
      // Fetch parcels data with country information
      const { data: parcels, error: parcelsError } = await supabase
        .from('parcels')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at');

      if (parcelsError) throw parcelsError;

      // Process data for charts
      const parcelsByStatus = parcels.reduce((acc, parcel) => {
        const status = STATUS_MAPPING[parcel.status] || parcel.status || 'Inconnu';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      const parcelsByCountry = parcels.reduce((acc, parcel) => {
        const country = parcel.recipient_country || 'Inconnu';
        acc[country] = (acc[country] || 0) + 1;
        return acc;
      }, {});

      // Calculate total revenue (only from completed parcels)
      const totalRevenue = parcels
        .filter(parcel => parcel.status === 'termine')
        .reduce((acc, parcel) => acc + (parcel.price || 0), 0);

      // Group parcels by month
      const monthlyData = parcels.reduce((acc, parcel) => {
        const date = new Date(parcel.created_at);
        const month = date.toLocaleString('default', { month: 'short', year: '2-digit' });
        
        if (!acc[month]) {
          acc[month] = {
            parcels: 0,
            revenue: 0
          };
        }
        
        acc[month].parcels += 1;
        if (parcel.status === 'termine') {
          acc[month].revenue += parcel.price || 0;
        }
        
        return acc;
      }, {});

      // Sort months chronologically
      const sortedMonths = Object.keys(monthlyData).sort((a, b) => {
        const dateA = new Date(a);
        const dateB = new Date(b);
        return dateA - dateB;
      });

      const monthlyParcels = {};
      const monthlyRevenue = {};
      
      sortedMonths.forEach(month => {
        monthlyParcels[month] = monthlyData[month].parcels;
        monthlyRevenue[month] = monthlyData[month].revenue;
      });

      setStats({
        parcelsOverTime: monthlyParcels,
        parcelsByStatus,
        parcelsByCountry,
        revenueData: monthlyRevenue,
        totalParcels: parcels.length,
        totalRevenue
      });
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'XAF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  const lineChartData = {
    labels: Object.keys(stats.parcelsOverTime),
    datasets: [
      {
        label: t('statistics.parcelsOverTime'),
        data: Object.values(stats.parcelsOverTime),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
        fill: false,
      },
    ],
  };

  const pieChartData = {
    labels: Object.keys(stats.parcelsByStatus),
    datasets: [
      {
        data: Object.values(stats.parcelsByStatus),
        backgroundColor: [
          'rgba(54, 162, 235, 0.5)',  // Reçu
          'rgba(255, 206, 86, 0.5)',  // Expédié
          'rgba(75, 192, 192, 0.5)',  // Terminé
          'rgba(255, 99, 132, 0.5)',  // En litige
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const countryChartData = {
    labels: Object.keys(stats.parcelsByCountry),
    datasets: [
      {
        data: Object.values(stats.parcelsByCountry),
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)',
          'rgba(255, 159, 64, 0.5)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const barChartData = {
    labels: Object.keys(stats.revenueData),
    datasets: [
      {
        label: t('statistics.monthlyRevenue'),
        data: Object.values(stats.revenueData),
        backgroundColor: 'rgba(153, 102, 255, 0.5)',
        borderColor: 'rgb(153, 102, 255)',
        borderWidth: 1,
      },
    ],
  };

  const revenueChartOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      tooltip: {
        callbacks: {
          label: (context) => {
            return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
          }
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('statistics.title')}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Summary Cards */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">{t('statistics.totalParcels')}</h2>
          <div className="text-3xl font-bold text-indigo-600">
            {stats.totalParcels}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">{t('statistics.totalRevenue')}</h2>
          <div className="text-3xl font-bold text-green-600">
            {formatCurrency(stats.totalRevenue)}
          </div>
        </div>

        {/* Charts */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">{t('statistics.parcelsOverTime')}</h2>
          <div className="h-64">
            <Line data={lineChartData} options={chartOptions} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">{t('statistics.parcelsByStatus')}</h2>
          <div className="h-64">
            <Pie data={pieChartData} options={chartOptions} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">{t('statistics.parcelsByCountry')}</h2>
          <div className="h-64">
            <Pie data={countryChartData} options={chartOptions} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">{t('statistics.monthlyRevenue')}</h2>
          <div className="h-64">
            <Bar data={barChartData} options={revenueChartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;
