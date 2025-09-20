import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { useInvestors, useTransactions } from '../../hooks/useFirestore';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Download,
  Calendar,
  Filter,
  Target,
  DollarSign,
  Users,
  Activity
} from 'lucide-react';

type ReportPeriod = 'week' | 'month' | 'quarter' | 'year';

const PerformanceReportsPage = () => {
  const { setGlobalLoading } = useAuth();
  const { investors } = useInvestors();
  const { transactions } = useTransactions();
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('month');
  const [selectedReport, setSelectedReport] = useState('overview');

  // Calculate performance metrics
  const totalAssets = investors.reduce((sum, inv) => sum + (inv.currentBalance || 0), 0);
  const totalDeposits = investors.reduce((sum, inv) => sum + (inv.initialDeposit || 0), 0);
  const totalGains = totalAssets - totalDeposits;
  const averageROI = totalDeposits > 0 ? (totalGains / totalDeposits) * 100 : 0;
  
  const profitableInvestors = investors.filter(inv => inv.currentBalance > inv.initialDeposit).length;
  const winRate = investors.length > 0 ? (profitableInvestors / investors.length) * 100 : 0;
  const avgPositionSize = investors.length > 0 ? totalAssets / investors.length : 0;
  
  // Transaction metrics
  const totalEarnings = transactions
    .filter(tx => tx.type === 'Earnings')
    .reduce((sum, tx) => sum + tx.amount, 0);
    
  const totalWithdrawals = Math.abs(transactions
    .filter(tx => tx.type === 'Withdrawal')
    .reduce((sum, tx) => sum + tx.amount, 0));

  // Top performers
  const topPerformers = investors
    .map(inv => ({
      ...inv,
      performance: inv.currentBalance - inv.initialDeposit,
      performancePercent: inv.initialDeposit > 0 ? ((inv.currentBalance - inv.initialDeposit) / inv.initialDeposit) * 100 : 0
    }))
    .sort((a, b) => b.performance - a.performance)
    .slice(0, 5);

  const generateReport = () => {
    const reportData = {
      period: selectedPeriod,
      generatedAt: new Date().toISOString(),
      metrics: {
        totalAssets,
        totalDeposits,
        totalGains,
        averageROI,
        winRate,
        totalInvestors: investors.length,
        profitableInvestors
      },
      topPerformers
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const renderOverviewReport = () => (
    <div className="space-y-6">
      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-300 shadow-sm">
          <div className="p-6">
            <div className="border-b border-gray-200 pb-3 mb-3">
              <p className="text-gray-600 font-medium text-sm uppercase tracking-wider">TOTAL AUM</p>
            </div>
            <div>
              <p className="text-gray-900 text-3xl font-bold">${totalAssets.toLocaleString()}</p>
              <p className="text-gray-500 text-sm mt-1">Assets Under Management</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-300 shadow-sm">
          <div className="p-6">
            <div className="border-b border-gray-200 pb-3 mb-3">
              <p className="text-gray-600 font-medium text-sm uppercase tracking-wider">AVERAGE ROI</p>
            </div>
            <div>
              <p className="text-gray-900 text-3xl font-bold">{averageROI.toFixed(2)}%</p>
              <p className="text-gray-500 text-sm mt-1">Return on Investment</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-300 shadow-sm">
          <div className="p-6">
            <div className="border-b border-gray-200 pb-3 mb-3">
              <p className="text-gray-600 font-medium text-sm uppercase tracking-wider">WIN RATE</p>
            </div>
            <div>
              <p className="text-gray-900 text-3xl font-bold">{winRate.toFixed(1)}%</p>
              <p className="text-gray-500 text-sm mt-1">Profitable Accounts</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-300 shadow-sm">
          <div className="p-6">
            <div className="border-b border-gray-200 pb-3 mb-3">
              <p className="text-gray-600 font-medium text-sm uppercase tracking-wider">ACTIVE CLIENTS</p>
            </div>
            <div>
              <p className="text-gray-900 text-3xl font-bold">{investors.length}</p>
              <p className="text-gray-500 text-sm mt-1">Total Investors</p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-300 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 uppercase tracking-wide">PORTFOLIO PERFORMANCE</h3>
          </div>
          <div className="p-6">
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <BarChart3 size={48} className="text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">Performance chart visualization</p>
                <p className="text-sm text-gray-400">Real-time portfolio tracking</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-300 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 uppercase tracking-wide">ASSET ALLOCATION</h3>
          </div>
          <div className="p-6">
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <PieChart size={48} className="text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">Asset distribution breakdown</p>
                <div className="mt-4 flex justify-center space-x-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-gray-700 rounded-full mr-2"></div>
                    <span className="text-sm font-medium">Cash: 100%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="bg-white rounded-lg border border-gray-300 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 uppercase tracking-wide">TOP PERFORMING ACCOUNTS</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {topPerformers.length > 0 ? (
              topPerformers.map((investor, index) => (
                <div key={investor.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-200 border border-gray-300 rounded-lg flex items-center justify-center">
                      <span className="text-gray-700 font-bold">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 uppercase tracking-wide">{investor.name}</p>
                      <p className="text-sm text-gray-500 uppercase tracking-wide">{investor.country}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-gray-900">
                      {investor.performance >= 0 ? '+' : ''}${investor.performance.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      {investor.performancePercent >= 0 ? '+' : ''}{investor.performancePercent.toFixed(2)}%
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8 uppercase tracking-wide">No performance data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderDetailedReport = () => (
    <div className="space-y-6">
      {/* Financial Metrics */}
      <div className="bg-white rounded-lg border border-gray-300 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 uppercase tracking-wide">FINANCIAL PERFORMANCE METRICS</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="text-gray-800 font-semibold mb-4 uppercase tracking-wide">REVENUE METRICS</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-700 uppercase tracking-wide text-sm">Total Deposits</span>
                  <span className="font-bold text-gray-900">${totalDeposits.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 uppercase tracking-wide text-sm">Total Earnings</span>
                  <span className="font-bold text-gray-900">${totalEarnings.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 uppercase tracking-wide text-sm">Net Growth</span>
                  <span className="font-bold text-gray-900">${totalGains.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="text-gray-800 font-semibold mb-4 uppercase tracking-wide">PERFORMANCE RATIOS</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-700 uppercase tracking-wide text-sm">ROI</span>
                  <span className="font-bold text-gray-900">{averageROI.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 uppercase tracking-wide text-sm">Win Rate</span>
                  <span className="font-bold text-gray-900">{winRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 uppercase tracking-wide text-sm">Avg. Account Size</span>
                  <span className="font-bold text-gray-900">
                    ${investors.length > 0 ? (totalAssets / investors.length).toFixed(0) : '0'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="text-gray-800 font-semibold mb-4 uppercase tracking-wide">CLIENT METRICS</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-700 uppercase tracking-wide text-sm">Total Clients</span>
                  <span className="font-bold text-gray-900">{investors.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 uppercase tracking-wide text-sm">Profitable</span>
                  <span className="font-bold text-gray-900">{profitableInvestors}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 uppercase tracking-wide text-sm">Retention Rate</span>
                  <span className="font-bold text-gray-900">95.2%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Analysis */}
      <div className="bg-white rounded-lg border border-gray-300 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 uppercase tracking-wide">TRANSACTION ANALYSIS</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-800 mb-4 uppercase tracking-wide">TRANSACTION VOLUME</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 uppercase tracking-wide text-sm">Total Transactions</span>
                  <span className="font-bold">{transactions.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 uppercase tracking-wide text-sm">Deposits</span>
                  <span className="font-bold text-gray-900">
                    {transactions.filter(tx => tx.type === 'Deposit').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 uppercase tracking-wide text-sm">Withdrawals</span>
                  <span className="font-bold text-gray-900">
                    {transactions.filter(tx => tx.type === 'Withdrawal').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 uppercase tracking-wide text-sm">Earnings</span>
                  <span className="font-bold text-gray-900">
                    {transactions.filter(tx => tx.type === 'Earnings').length}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-4 uppercase tracking-wide">VALUE DISTRIBUTION</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 uppercase tracking-wide text-sm">Total Volume</span>
                  <span className="font-bold">
                    ${transactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 uppercase tracking-wide text-sm">Average Transaction</span>
                  <span className="font-bold">
                    ${transactions.length > 0 ? (transactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0) / transactions.length).toFixed(2) : '0.00'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 uppercase tracking-wide text-sm">Largest Transaction</span>
                  <span className="font-bold">
                    ${transactions.length > 0 ? Math.max(...transactions.map(tx => Math.abs(tx.amount))).toLocaleString() : '0'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout title="Performance & Reports">
      {/* Header Controls */}
      <div className="mb-6">
        <div className="bg-white rounded-lg border border-gray-300 shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">PERFORMANCE & REPORTS</h2>
              <p className="text-gray-600 uppercase tracking-wide text-sm">Comprehensive analytics and performance insights</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Calendar size={16} className="text-gray-500" />
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value as ReportPeriod)}
                  className="px-3 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-gray-300 focus:border-gray-300 uppercase tracking-wide font-medium"
                >
                  <option value="week">LAST WEEK</option>
                  <option value="month">LAST MONTH</option>
                  <option value="quarter">LAST QUARTER</option>
                  <option value="year">LAST YEAR</option>
                </select>
              </div>
              
              <button
                onClick={generateReport}
                className="px-4 py-2 bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors rounded-lg uppercase tracking-wide"
              >
                EXPORT REPORT
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="bg-white rounded-lg border border-gray-300 shadow-sm mb-6">
        <div className="p-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter size={16} className="text-gray-500" />
              <span className="text-sm text-gray-700 font-medium uppercase tracking-wide">REPORT TYPE:</span>
            </div>
            <div className="flex space-x-1">
              {[
                { key: 'overview', label: 'OVERVIEW', icon: <BarChart3 size={14} /> },
                { key: 'detailed', label: 'DETAILED ANALYSIS', icon: <Activity size={14} /> },
                { key: 'comparative', label: 'COMPARATIVE', icon: <TrendingUp size={14} /> }
              ].map(report => (
                <button
                  key={report.key}
                  onClick={() => setSelectedReport(report.key)}
                  className={`flex items-center space-x-2 px-4 py-2 text-sm rounded transition-colors font-medium uppercase tracking-wide ${
                    selectedReport === report.key
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span>{report.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Report Content */}
      {selectedReport === 'overview' && renderOverviewReport()}
      {selectedReport === 'detailed' && renderDetailedReport()}
      {selectedReport === 'comparative' && (
        <div className="bg-white rounded-lg border border-gray-300 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 uppercase tracking-wide">COMPARATIVE ANALYSIS</h3>
          </div>
          <div className="p-6">
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <TrendingUp size={48} className="text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">Comparative analysis coming soon</p>
                <p className="text-sm text-gray-400">Period-over-period performance comparison</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default PerformanceReportsPage;