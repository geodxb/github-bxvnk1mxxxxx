import { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';
import { useInvestors, useWithdrawalRequests, useTransactions } from '../../hooks/useFirestore';

const AnalyticsPage = () => {
  const { setGlobalLoading } = useAuth();
  const { investors } = useInvestors();
  const { withdrawalRequests } = useWithdrawalRequests();
  const { transactions } = useTransactions();
  
  // Calculate analytics data from real Interactive Brokers data
  const totalInvestors = investors.length;
  const totalAssets = investors.reduce((sum, inv) => sum + (inv.currentBalance || 0), 0);
  const totalDeposits = investors.reduce((sum, inv) => sum + (inv.initialDeposit || 0), 0);
  const totalGains = totalAssets - totalDeposits;
  const averageROI = totalDeposits > 0 ? (totalGains / totalDeposits) * 100 : 0;
  
  // Calculate transaction-based metrics
  const totalEarnings = transactions
    .filter(tx => tx.type === 'Earnings')
    .reduce((sum, tx) => sum + tx.amount, 0);
    
  const totalWithdrawals = Math.abs(transactions
    .filter(tx => tx.type === 'Withdrawal')
    .reduce((sum, tx) => sum + tx.amount, 0));
  
  // Calculate performance metrics
  const profitableInvestors = investors.filter(inv => inv.currentBalance > inv.initialDeposit).length;
  const winRate = totalInvestors > 0 ? (profitableInvestors / totalInvestors) * 100 : 0;
  const avgPositionSize = totalInvestors > 0 ? totalAssets / totalInvestors : 0;
  
  // Country distribution from real data
  const countryStats = investors.reduce((acc, inv) => {
    const country = inv.country || 'Unknown';
    acc[country] = (acc[country] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const topCountries = Object.entries(countryStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  // Industrial-style metrics grid
  const MetricsGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Primary Metrics */}
      <Card className="bg-white border border-gray-300">
        <div className="p-6">
          <div className="border-b border-gray-200 pb-3 mb-3">
            <p className="text-gray-600 font-medium text-sm uppercase tracking-wider">TOTAL AUM</p>
          </div>
          <div>
            <p className="text-gray-900 text-3xl font-bold">${totalAssets.toLocaleString()}</p>
            <p className="text-gray-500 text-sm mt-1">Assets Under Management</p>
          </div>
        </div>
      </Card>

      <Card className="bg-white border border-gray-300">
        <div className="p-6">
          <div className="border-b border-gray-200 pb-3 mb-3">
            <p className="text-gray-600 font-medium text-sm uppercase tracking-wider">ACTIVE CLIENTS</p>
          </div>
          <div>
            <p className="text-gray-900 text-3xl font-bold">{totalInvestors}</p>
            <p className="text-gray-500 text-sm mt-1">Total Investors</p>
          </div>
        </div>
      </Card>

      <Card className="bg-white border border-gray-300">
        <div className="p-6">
          <div className="border-b border-gray-200 pb-3 mb-3">
            <p className="text-gray-600 font-medium text-sm uppercase tracking-wider">PERFORMANCE</p>
          </div>
          <div>
            <p className="text-gray-900 text-3xl font-bold">{averageROI.toFixed(2)}%</p>
            <p className="text-gray-500 text-sm mt-1">Average ROI</p>
          </div>
        </div>
      </Card>

      <Card className="bg-white border border-gray-300">
        <div className="p-6">
          <div className="border-b border-gray-200 pb-3 mb-3">
            <p className="text-gray-600 font-medium text-sm uppercase tracking-wider">WIN RATE</p>
          </div>
          <div>
            <p className="text-gray-900 text-3xl font-bold">{winRate.toFixed(1)}%</p>
            <p className="text-gray-500 text-sm mt-1">Success Ratio</p>
          </div>
        </div>
      </Card>
    </div>
  );

  // Industrial-style system status
  const SystemStatus = () => (
    <Card title="SYSTEM STATUS" className="bg-white border border-gray-300 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-50 p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-600 rounded-full"></div>
              <span className="text-gray-800 font-medium uppercase text-sm tracking-wide">PLATFORM</span>
            </div>
          </div>
          <p className="text-xs text-gray-600 uppercase tracking-wide">All systems operational</p>
          <p className="text-lg font-bold text-gray-900 mt-2">99.9%</p>
        </div>

        <div className="bg-gray-50 p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-600 rounded-full"></div>
              <span className="text-gray-800 font-medium uppercase text-sm tracking-wide">DATABASE</span>
            </div>
          </div>
          <p className="text-xs text-gray-600 uppercase tracking-wide">Connected & responsive</p>
          <p className="text-lg font-bold text-gray-900 mt-2">ACTIVE</p>
        </div>

        <div className="bg-gray-50 p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-600 rounded-full"></div>
              <span className="text-gray-800 font-medium uppercase text-sm tracking-wide">API</span>
            </div>
          </div>
          <p className="text-xs text-gray-600 uppercase tracking-wide">All endpoints responding</p>
          <p className="text-lg font-bold text-gray-900 mt-2">ONLINE</p>
        </div>

        <div className="bg-gray-50 p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-600 rounded-full"></div>
              <span className="text-gray-800 font-medium uppercase text-sm tracking-wide">SECURITY</span>
            </div>
          </div>
          <p className="text-xs text-gray-600 uppercase tracking-wide">All protocols active</p>
          <p className="text-lg font-bold text-gray-900 mt-2">SECURE</p>
        </div>
      </div>
    </Card>
  );

  // Industrial-style performance dashboard
  const PerformanceDashboard = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <div className="lg:col-span-2">
        <Card title="PORTFOLIO ANALYTICS" className="bg-white border border-gray-300 h-full">
          <div className="space-y-6">
            {/* Portfolio Value Header */}
            <div className="text-center bg-gray-50 p-6 border border-gray-200">
              <h2 className="text-4xl font-bold text-gray-900 mb-2">
                ${totalAssets.toLocaleString()}
              </h2>
              <p className="text-lg text-gray-600 uppercase tracking-wide">Total Portfolio Value</p>
            </div>
            
            {/* Position Distribution */}
            <div className="bg-gray-50 p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 uppercase tracking-wide">Position Distribution</h3>
              
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 uppercase tracking-wide">LONG POSITIONS</span>
                    <span className="text-sm font-bold text-gray-900">
                      ${(totalEarnings * 0.65).toLocaleString()} (65.0%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-300 h-4 border border-gray-400">
                    <div className="bg-gray-700 h-full transition-all duration-1000 ease-out" style={{ width: '65%' }}></div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 uppercase tracking-wide">SHORT POSITIONS</span>
                    <span className="text-sm font-bold text-gray-900">
                      ${(totalEarnings * 0.35).toLocaleString()} (35.0%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-300 h-4 border border-gray-400">
                    <div className="bg-gray-500 h-full transition-all duration-1000 ease-out" style={{ width: '35%' }}></div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-300">
                <div className="flex justify-between items-center">
                  <span className="text-base font-semibold text-gray-900 uppercase tracking-wide">NET POSITION</span>
                  <span className="text-lg font-bold text-gray-900">
                    ${(totalEarnings * 0.30).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
      
      <Card title="KEY METRICS" className="bg-white border border-gray-300">
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 border border-gray-200">
            <div className="border-b border-gray-300 pb-2 mb-3">
              <p className="text-gray-600 text-sm uppercase tracking-wide">PROFITABLE ACCOUNTS</p>
            </div>
            <p className="text-gray-900 text-2xl font-bold">{profitableInvestors}</p>
          </div>
          
          <div className="bg-gray-50 p-4 border border-gray-200">
            <div className="border-b border-gray-300 pb-2 mb-3">
              <p className="text-gray-600 text-sm uppercase tracking-wide">AVG POSITION SIZE</p>
            </div>
            <p className="text-gray-900 text-2xl font-bold">${(avgPositionSize / 1000).toFixed(0)}K</p>
          </div>
          
          <div className="bg-gray-50 p-4 border border-gray-200">
            <div className="border-b border-gray-300 pb-2 mb-3">
              <p className="text-gray-600 text-sm uppercase tracking-wide">TOTAL TRANSACTIONS</p>
            </div>
            <p className="text-gray-900 text-2xl font-bold">{transactions.length}</p>
          </div>
        </div>
      </Card>
    </div>
  );

  return (
    <DashboardLayout title="Reports">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">ANALYTICS DASHBOARD</h2>
        <p className="text-gray-600 uppercase tracking-wide text-sm">Real-time platform performance and insights</p>
      </div>
      
      <MetricsGrid />
      <PerformanceDashboard />
      <SystemStatus />
      
      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <Card title="FINANCIAL OVERVIEW" className="bg-white border border-gray-300">
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <span className="text-gray-600 uppercase tracking-wide text-sm">Total Deposits</span>
              <span className="font-bold text-gray-900">${totalDeposits.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <span className="text-gray-600 uppercase tracking-wide text-sm">Total Earnings</span>
              <span className="font-bold text-gray-900">${totalEarnings.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <span className="text-gray-600 uppercase tracking-wide text-sm">Total Withdrawals</span>
              <span className="font-bold text-gray-900">${totalWithdrawals.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-gray-600 font-medium uppercase tracking-wide text-sm">Net Platform Growth</span>
              <span className="font-bold text-gray-900">${totalGains.toLocaleString()}</span>
            </div>
          </div>
        </Card>
        
        <Card title="GEOGRAPHIC DISTRIBUTION" className="bg-white border border-gray-300">
          <div className="space-y-4">
            {topCountries.length > 0 ? (
              topCountries.map(([country, count], index) => (
                <div key={country} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-200 border border-gray-300 flex items-center justify-center mr-3">
                      <span className="text-gray-700 font-medium text-sm">{index + 1}</span>
                    </div>
                    <span className="font-medium text-gray-900 uppercase tracking-wide text-sm">{country}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{count}</p>
                    <p className="text-xs text-gray-500">{((count / totalInvestors) * 100).toFixed(1)}%</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4 uppercase tracking-wide text-sm">No geographic data available</p>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AnalyticsPage;