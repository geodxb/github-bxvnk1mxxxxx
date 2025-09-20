import { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import AddInvestorModal from '../../components/admin/AddInvestorModal';
import InvestorOnboardingFlow from '../../components/onboarding/InvestorOnboardingFlow';
import { useInvestors } from '../../hooks/useFirestore';
import { useNavigate } from 'react-router-dom';

const InvestorsListPage = () => {
  const navigate = useNavigate();
  const { investors, loading, error, refetch } = useInvestors();
  const [addInvestorModalOpen, setAddInvestorModalOpen] = useState(false);
  const [onboardingFlowOpen, setOnboardingFlowOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Enhanced filtering logic to properly handle account statuses
  const filteredInvestors = investors.filter(investor => {
    const matchesSearch = investor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      investor.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      investor.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Enhanced status filtering logic
    let matchesStatus = true;
    const accountStatus = investor.accountStatus || 'Active';
    
    if (statusFilter === 'active') {
      // Active accounts: either no status set, or status contains "Active" but not "Restricted" or "Closed"
      matchesStatus = !accountStatus || 
                    (accountStatus.toLowerCase().includes('active') && 
                     !accountStatus.toLowerCase().includes('restricted') && 
                     !accountStatus.toLowerCase().includes('closed'));
    } else if (statusFilter === 'restricted') {
      // Restricted accounts: status contains "Restricted" or "policy violation"
      matchesStatus = accountStatus.toLowerCase().includes('restricted') || 
                     accountStatus.toLowerCase().includes('policy violation');
    } else if (statusFilter === 'closed') {
      // Closed accounts: status contains "Closed"
      matchesStatus = accountStatus.toLowerCase().includes('closed');
    }
    // 'all' filter shows everything
    
    return matchesSearch && matchesStatus;
  });

  // Sort investors
  const sortedInvestors = [...filteredInvestors].sort((a, b) => {
    const aValue = a[sortField as keyof typeof a];
    const bValue = b[sortField as keyof typeof b];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    return 0;
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Calculate summary statistics with proper status categorization
  const totalAUM = investors.reduce((sum, inv) => sum + (inv.currentBalance || 0), 0);
  
  // Active investors: no status, or status contains "Active" but not "Restricted" or "Closed"
  const activeInvestors = investors.filter(inv => {
    const status = inv.accountStatus || 'Active';
    return !status || 
           (status.toLowerCase().includes('active') && 
            !status.toLowerCase().includes('restricted') && 
            !status.toLowerCase().includes('closed'));
  }).length;
  
  // Restricted investors: status contains "Restricted" or "policy violation"
  const restrictedInvestors = investors.filter(inv => {
    const status = inv.accountStatus || '';
    return status.toLowerCase().includes('restricted') || 
           status.toLowerCase().includes('policy violation');
  }).length;
  
  // Closed investors: status contains "Closed"
  const closedInvestors = investors.filter(inv => {
    const status = inv.accountStatus || '';
    return status.toLowerCase().includes('closed');
  }).length;
  
  const profitableInvestors = investors.filter(inv => inv.currentBalance > inv.initialDeposit).length;

  // Clean industrial-style columns without excessive styling
  const columns = [
    {
      key: 'name',
      header: (
        <button 
          onClick={() => handleSort('name')}
          className="text-left font-medium text-gray-700 hover:text-gray-900"
        >
          Investor Profile
        </button>
      ),
      render: (_: any, row: any) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-100 border border-gray-300 flex items-center justify-center">
            <span className="text-gray-700 font-medium text-sm">
              {row.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
            </span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <p className="font-medium text-gray-900">{row.name}</p>
              <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                row.accountType === 'Pro' 
                  ? 'bg-gray-800 text-white' 
                  : 'bg-gray-600 text-white'
              }`}>
                {row.accountType || 'Standard'}
              </span>
            </div>
            <p className="text-sm text-gray-600">{row.country}</p>
            <p className="text-xs text-gray-500">ID: {row.id.slice(-8)}</p>
          </div>
        </div>
      )
    },
    {
      key: 'currentBalance',
      header: (
        <button 
          onClick={() => handleSort('currentBalance')}
          className="text-right font-medium text-gray-700 hover:text-gray-900 w-full"
        >
          Current Balance
        </button>
      ),
      align: 'right' as 'right',
      render: (value: number) => (
        <div className="text-right">
          <p className="font-bold text-lg text-gray-900">${value?.toLocaleString() || '0'}</p>
          <p className="text-xs text-gray-500">USD</p>
        </div>
      )
    },
    {
      key: 'performance',
      header: 'Performance',
      align: 'right' as 'right',
      render: (_: any, row: any) => {
        const performance = row.currentBalance - row.initialDeposit;
        const performancePercent = row.initialDeposit > 0 ? (performance / row.initialDeposit) * 100 : 0;
        const isPositive = performance >= 0;
        
        return (
          <div className="text-right">
            <p className={`font-medium ${isPositive ? 'text-gray-900' : 'text-gray-900'}`}>
              {isPositive ? '+' : ''}${performance.toLocaleString()}
            </p>
            <p className={`text-xs ${isPositive ? 'text-gray-600' : 'text-gray-600'}`}>
              {isPositive ? '+' : ''}{performancePercent.toFixed(1)}%
            </p>
          </div>
        );
      }
    },
    {
      key: 'accountStatus',
      header: 'Status',
      render: (value: string) => {
        const status = value || 'Active';
        let statusClass = 'bg-gray-100 text-gray-800 border border-gray-200';
        
        // Determine status styling based on content
        if (status.toLowerCase().includes('restricted') || status.toLowerCase().includes('policy violation')) {
          statusClass = 'bg-gray-100 text-gray-800 border border-gray-200';
        } else if (status.toLowerCase().includes('closed')) {
          statusClass = 'bg-gray-100 text-gray-800 border border-gray-200';
        } else {
          // Active status
          statusClass = 'bg-gray-100 text-gray-800 border border-gray-200';
        }
        
        return (
          <span className={`px-3 py-1 text-xs rounded-full font-medium ${statusClass}`}>
            {status.length > 15 ? status.substring(0, 15) + '...' : status}
          </span>
        );
      }
    },
    {
      key: 'joinDate',
      header: (
        <button 
          onClick={() => handleSort('joinDate')}
          className="text-left font-medium text-gray-700 hover:text-gray-900"
        >
          Join Date
        </button>
      ),
      render: (value: string) => (
        <div>
          <p className="text-sm text-gray-900">{new Date(value).toLocaleDateString()}</p>
          <p className="text-xs text-gray-500">
            {Math.floor((new Date().getTime() - new Date(value).getTime()) / (1000 * 60 * 60 * 24))} days ago
          </p>
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center' as 'center',
      render: (_: any, row: any) => (
        <div className="flex justify-center">
          <button
            onClick={() => navigate(`/admin/investor/${row.id}`)}
            className="px-3 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors rounded-lg"
          >
            View
          </button>
        </div>
      )
    }
  ];

  if (error) {
    return (
      <DashboardLayout title="Holdings">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4 font-medium">{error}</p>
            <button
              onClick={refetch}
              className="px-4 py-2 bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors rounded-lg"
            >
              Retry Loading
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Holdings">
      {/* Clean Header */}
      <div className="mb-8">
        <div className="bg-white border border-gray-200 shadow-sm p-6 rounded-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">INVESTOR HOLDINGS</h2>
              <p className="text-gray-600 uppercase tracking-wide text-sm">Portfolio management and performance monitoring</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setOnboardingFlowOpen(true)}
                className="px-4 py-2 bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors rounded-lg uppercase tracking-wide"
              >
                New Investor Onboarding
              </button>
              <button
                onClick={() => setAddInvestorModalOpen(true)}
                className="px-4 py-2 bg-gray-600 text-white font-medium hover:bg-gray-700 transition-colors rounded-lg uppercase tracking-wide"
              >
                Quick Add (Legacy)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Clean Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6">
            <div className="border-b border-gray-300 pb-3 mb-4">
              <p className="text-gray-600 font-medium text-sm uppercase tracking-wider">TOTAL AUM</p>
            </div>
            <div>
              <p className="text-gray-900 text-2xl font-bold">${totalAUM.toLocaleString()}</p>
              <p className="text-gray-500 text-xs mt-1">Assets Under Management</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6">
            <div className="border-b border-gray-300 pb-3 mb-4">
              <p className="text-gray-600 font-medium text-sm uppercase tracking-wider">ACTIVE ACCOUNTS</p>
            </div>
            <div>
              <p className="text-gray-900 text-2xl font-bold">{activeInvestors}</p>
              <p className="text-gray-500 text-xs mt-1">Operational Status</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6">
            <div className="border-b border-gray-300 pb-3 mb-4">
              <p className="text-gray-600 font-medium text-sm uppercase tracking-wider">PROFITABLE</p>
            </div>
            <div>
              <p className="text-gray-900 text-2xl font-bold">{profitableInvestors}</p>
              <p className="text-gray-500 text-xs mt-1">Positive Performance</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6">
            <div className="border-b border-gray-300 pb-3 mb-4">
              <p className="text-gray-600 font-medium text-sm uppercase tracking-wider">RESTRICTED</p>
            </div>
            <div>
              <p className="text-gray-900 text-2xl font-bold">{restrictedInvestors}</p>
              <p className="text-gray-500 text-xs mt-1">Compliance Review</p>
            </div>
          </div>
        </div>
      </div>

      {/* Clean Filters */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-8">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-700 font-medium uppercase tracking-wide">STATUS FILTER:</span>
              </div>
              <div className="flex space-x-2">
                {[
                  { key: 'all', label: 'All', count: investors.length },
                  { key: 'active', label: 'Active', count: activeInvestors },
                  { key: 'restricted', label: 'Restricted', count: restrictedInvestors },
                  { key: 'closed', label: 'Closed', count: closedInvestors }
                ].map(filter => (
                  <button
                    key={filter.key}
                    onClick={() => setStatusFilter(filter.key)}
                    className={`px-3 py-2 text-sm font-medium border transition-colors uppercase tracking-wide rounded-lg ${
                      statusFilter === filter.key
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {filter.label} ({filter.count})
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Search investors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border border-gray-200 text-sm focus:ring-1 focus:ring-gray-300 focus:border-gray-300 w-80 uppercase tracking-wide font-medium rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Clean Investor Profiles Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 uppercase tracking-wide">
            INVESTOR PROFILES ({sortedInvestors.length} RECORDS)
          </h3>
        </div>
        
        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-700 font-medium uppercase tracking-wide">LOADING INVESTOR PROFILES FROM FIREBASE...</p>
            <p className="text-gray-500 text-sm mt-2 uppercase tracking-wide">Retrieving account data & transaction history</p>
          </div>
        ) : sortedInvestors.length === 0 ? (
          <div className="text-center py-16">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 uppercase tracking-wide">NO INVESTOR PROFILES FOUND</h3>
            <p className="text-gray-600 mb-8 uppercase tracking-wide text-sm">
              {searchTerm || statusFilter !== 'all' 
                ? 'No investors match the current filter criteria'
                : 'Get started by adding your first investor profile'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <button
                onClick={() => setOnboardingFlowOpen(true)}
                className="px-4 py-2 bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors rounded-lg"
              >
                Start Investor Onboarding
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    {columns.map((column) => (
                      <th 
                        key={column.key}
                        scope="col"
                        className={`px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wide ${
                          column.align === 'right' ? 'text-right' : 
                          column.align === 'center' ? 'text-center' : 'text-left'
                        }`}
                      >
                        {column.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedInvestors.map((row, index) => (
                    <tr 
                      key={row.id || index}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {columns.map((column) => (
                        <td 
                          key={`${row.id || index}-${column.key}`}
                          className={`px-6 py-6 text-sm text-gray-700 ${
                            column.align === 'right' ? 'text-right' : 
                            column.align === 'center' ? 'text-center' : 'text-left'
                          }`}
                        >
                          {column.render ? column.render(row[column.key as keyof typeof row], row) : row[column.key as keyof typeof row]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Clean Summary Footer */}
            <div className="p-6 bg-gray-50 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-4 border border-gray-200 rounded-lg">
                  <p className="text-gray-600 mb-2 text-xs font-medium uppercase tracking-wide">SHOWING RESULTS</p>
                  <p className="font-bold text-gray-900 text-xl">{sortedInvestors.length}</p>
                  <p className="text-gray-500 text-xs uppercase tracking-wide">Total Records</p>
                </div>
                <div className="bg-white p-4 border border-gray-200 rounded-lg">
                  <p className="text-gray-600 mb-2 text-xs font-medium uppercase tracking-wide">PORTFOLIO VALUE</p>
                  <p className="font-bold text-gray-900 text-xl">
                    ${sortedInvestors.reduce((sum, inv) => sum + inv.currentBalance, 0).toLocaleString()}
                  </p>
                  <p className="text-gray-500 text-xs uppercase tracking-wide">Combined AUM</p>
                </div>
                <div className="bg-white p-4 border border-gray-200 rounded-lg">
                  <p className="text-gray-600 mb-2 text-xs font-medium uppercase tracking-wide">AVERAGE SIZE</p>
                  <p className="font-bold text-gray-900 text-xl">
                    ${sortedInvestors.length > 0 ? Math.round(sortedInvestors.reduce((sum, inv) => sum + inv.currentBalance, 0) / sortedInvestors.length).toLocaleString() : '0'}
                  </p>
                  <p className="text-gray-500 text-xs uppercase tracking-wide">Per Account</p>
                </div>
                <div className="bg-white p-4 border border-gray-200 rounded-lg">
                  <p className="text-gray-600 mb-2 text-xs font-medium uppercase tracking-wide">SUCCESS RATE</p>
                  <p className="font-bold text-gray-900 text-xl">
                    {sortedInvestors.length > 0 ? ((sortedInvestors.filter(inv => inv.currentBalance > inv.initialDeposit).length / sortedInvestors.length) * 100).toFixed(1) : '0.0'}%
                  </p>
                  <p className="text-gray-500 text-xs uppercase tracking-wide">Profitable</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add Investor Modal */}
      <InvestorOnboardingFlow
        isOpen={onboardingFlowOpen}
        onClose={() => setOnboardingFlowOpen(false)}
        onSuccess={() => {
          setOnboardingFlowOpen(false);
          // Real-time listener will automatically update the list
        }}
      />
      
      <AddInvestorModal
        isOpen={addInvestorModalOpen}
        onClose={() => setAddInvestorModalOpen(false)}
        onSuccess={() => {
          setAddInvestorModalOpen(false);
          // Real-time listener will automatically update the list
        }}
      />
    </DashboardLayout>
  );
};

export default InvestorsListPage;