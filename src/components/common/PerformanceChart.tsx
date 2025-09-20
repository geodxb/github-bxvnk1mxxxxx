import { useState, useEffect } from 'react';
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
  ChartOptions
} from 'chart.js';
import { format, parseISO } from 'date-fns';
import { useTransactions } from '../../hooks/useFirestore';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface PerformanceChartProps {
  initialPeriod?: 'daily' | 'weekly' | 'monthly';
  investorId?: string;
}

const PerformanceChart = ({ initialPeriod = 'daily', investorId }: PerformanceChartProps) => {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>(initialPeriod);
  const [chartData, setChartData] = useState<any>(null);
  const { transactions, loading } = useTransactions(investorId);
  
  useEffect(() => {
    if (transactions.length === 0) {
      setChartData(null);
      return;
    }

    // Generate performance data from real Interactive Brokers transactions
    const performanceData = generatePerformanceFromTransactions(transactions, period);
    
    if (performanceData.length === 0) {
      setChartData(null);
      return;
    }
    
    const labels = performanceData.map(item => {
      const date = parseISO(item.date);
      if (period === 'daily') {
        return format(date, 'MMM d');
      } else if (period === 'weekly') {
        return format(date, 'MMM d');
      } else {
        return format(date, 'MMM yyyy');
      }
    });
    
    const data = {
      labels,
      datasets: [
        {
          label: 'Portfolio Value',
          data: performanceData.map(item => item.value),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          tension: 0.2,
        }
      ]
    };
    
    setChartData(data);
  }, [transactions, period]);

  const generatePerformanceFromTransactions = (transactions: any[], period: string) => {
    if (transactions.length === 0) return [];

    // Sort transactions by date
    const sortedTransactions = [...transactions].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const performanceData = [];
    let runningBalance = 0;

    // Group transactions by period and calculate cumulative balance
    const groupedData: { [key: string]: number } = {};

    sortedTransactions.forEach(tx => {
      runningBalance += tx.amount;
      const date = new Date(tx.date);
      
      let key = tx.date;
      if (period === 'weekly') {
        // Group by week
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else if (period === 'monthly') {
        // Group by month
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
      }
      
      groupedData[key] = runningBalance;
    });

    // Convert to array format
    Object.entries(groupedData).forEach(([date, value]) => {
      performanceData.push({ date, value });
    });

    return performanceData;
  };
  
  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      y: {
        ticks: {
          callback: function(value) {
            return '$' + value;
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        }
      },
      x: {
        grid: {
          display: false,
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    },
    elements: {
      point: {
        radius: 2,
        hoverRadius: 4,
      }
    }
  };
  
  return (
    <div className="h-full">
      <div className="flex justify-end mb-4">
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
              period === 'daily'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setPeriod('daily')}
          >
            Daily
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium ${
              period === 'weekly'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setPeriod('weekly')}
          >
            Weekly
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
              period === 'monthly'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setPeriod('monthly')}
          >
            Monthly
          </button>
        </div>
      </div>
      <div className="h-64 md:h-72 lg:h-80">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
            Loading chart from Interactive Brokers...
          </div>
        ) : chartData ? (
          <Line options={options} data={chartData} />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-500">
            <div className="text-center">
              <p className="mb-2">No transaction data available</p>
              <p className="text-sm">Chart will appear when transactions are added</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceChart;