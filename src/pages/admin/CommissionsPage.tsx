import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import CommissionWithdrawalModal from '../../components/admin/CommissionWithdrawalModal';
import { useCommissions } from '../../hooks/useCommissions';
import { 
  Filter,
  Download,
  User,
  ArrowUpRight,
  ArrowDownRight,
  Building,
  Banknote
} from 'lucide-react';

type FilterPeriod = 'all' | 'today' | 'week' | 'month' | 'year';

const CommissionsPage = () => {
  const { setGlobalLoading } = useAuth();
  const { commissions, totalCommissions, loading, error } = useCommissions();
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [withdrawalModalOpen, setWithdrawalModalOpen] = useState(false);

  // Filter commissions based on period
  const filteredCommissions = commissions.filter(commission => {
    const commissionDate = new Date(commission.date);
    const now = new Date();
    
    let matchesPeriod = true;
    
    switch (filterPeriod) {
      case 'today':
        matchesPeriod = commissionDate.toDateString() === now.toDateString();
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesPeriod = commissionDate >= weekAgo;
        break;
      case 'month':
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        matchesPeriod = commissionDate >= monthAgo;
        break;
      case 'year':
        const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        matchesPeriod = commissionDate >= yearAgo;
        break;
      default:
        matchesPeriod = true;
    }
    
    const matchesSearch = commission.investorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      commission.withdrawalAmount.toString().includes(searchTerm) ||
      commission.commissionAmount.toString().includes(searchTerm);
    
    return matchesPeriod && matchesSearch;
  });

  // Calculate filtered totals
  const filteredTotal = filteredCommissions.reduce((sum, commission) => sum + commission.commissionAmount, 0);
  const filteredWithdrawalTotal = filteredCommissions.reduce((sum, commission) => sum + commission.withdrawalAmount, 0);

  // Calculate period statistics
  const todayCommissions = commissions.filter(c => 
    new Date(c.date).toDateString() === new Date().toDateString()
  ).reduce((sum, c) => sum + c.commissionAmount, 0);

  const thisMonthCommissions = commissions.filter(c => {
    const date = new Date(c.date);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).reduce((sum, c) => sum + c.commissionAmount, 0);

  const averageCommission = commissions.length > 0 ? totalCommissions / commissions.length : 0;

  const columns = [
    {
      key: 'investorName',
      header: 'Investor',
      render: (value: string, row: any) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <User size={14} className="text-gray-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{value}</p>
            <p className="text-xs text-gray-500">ID: {row.investorId.slice(-8)}</p>
          </div>
        </div>
      )
    },
    {
      key: 'withdrawalAmount',
      header: 'Withdrawal',
      align: 'right' as 'right',
      render: (value: number, row: any) => (
        <div className="text-right space-y-1">
          <div className="flex items-center justify-end space-x-1">
            <ArrowDownRight size={12} className="text-gray-500" />
            <p className="font-medium text-gray-900">${value.toLocaleString()}</p>
          </div>
          <p className="text-xs text-gray-500">{row.date}</p>
        </div>
      )
    },
    {
      key: 'commissionRate',
      header: 'Rate',
      align: 'center' as 'center',
      render: (value: number) => (
        <div className="text-center">
          <span className="text-sm font-medium text-gray-900">{value}%</span>
        </div>
      )
    },
    {
      key: 'commissionAmount',
      header: 'Commission',
      align: 'right' as 'right',
      render: (value: number, row: any) => (
        <div className="text-right space-y-1">
          <div className="flex items-center justify-end space-x-1">
            <ArrowUpRight size={12} className="text-green-600" />
            <p className="font-semibold text-gray-900">${value.toLocaleString()}</p>
          </div>
          <p className="text-xs text-gray-500">
            {((value / row.withdrawalAmount) * 100).toFixed(1)}% of withdrawal
          </p>
        </div>
      )
    },
    {
      key: 'date',
      header: 'Date',
      render: (value: string, row: any) => {
        const date = new Date(value);
        const createdAt = row.createdAt ? new Date(row.createdAt) : date;
        return (
          <div className="space-y-1">
            <p className="text-sm text-gray-900">{date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}</p>
            <p className="text-xs text-gray-500">{createdAt.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>
        );
      }
    },
    {
      key: 'status',
      header: 'Status',
      render: (value: string) => (
        <span className="text-sm text-gray-900 font-medium">{value}</span>
      )
    },
    {
      key: 'bankDetails',
      header: 'Deposited To',
      align: 'center' as 'center',
      render: (_: any, row: any) => (
        <div className="bg-gray-50 p-3 rounded border border-gray-200 max-w-xs">
          <div className="flex items-center justify-center mb-2">
            <Building size={14} className="text-gray-600" />
          </div>
          <div className="space-y-1 text-xs">
            <div>
              <p className="text-gray-600">ADCB Bank</p>
              <p className="text-gray-900 font-medium">13*********0001</p>
            </div>
            <div className="pt-1 border-t border-gray-200">
              <p className="text-gray-900 font-medium text-center">
                ${row.commissionAmount.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )
    }
  ];

  const exportCommissions = () => {
    const csvContent = [
      ['Date', 'Investor Name', 'Investor ID', 'Withdrawal Amount', 'Commission Rate', 'Commission Amount', 'Status'],
      ...filteredCommissions.map(commission => [
        commission.date,
        commission.investorName,
        commission.investorId,
        commission.withdrawalAmount.toString(),
        `${commission.commissionRate}%`,
        commission.commissionAmount.toString(),
        commission.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `commissions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <DashboardLayout title="Commission Tracking">
        <Card title="Error">
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Commission Tracking">
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-white border border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-semibold text-gray-900 mb-1">${totalCommissions.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Commissions</div>
          </div>
        </Card>

        <Card className="bg-white border border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-semibold text-gray-900 mb-1">${todayCommissions.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Today's Earnings</div>
          </div>
        </Card>

        <Card className="bg-white border border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-semibold text-gray-900 mb-1">${thisMonthCommissions.toLocaleString()}</div>
            <div className="text-sm text-gray-600">This Month</div>
          </div>
        </Card>

        <Card className="bg-white border border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-semibold text-gray-900 mb-1">${averageCommission.toFixed(0)}</div>
            <div className="text-sm text-gray-600">Average Commission</div>
          </div>
        </Card>
      </div>

      {/* Controls */}
      <Card className="mb-6 bg-white border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter size={16} className="text-gray-500" />
              <span className="text-sm text-gray-700">Period:</span>
            </div>
            <div className="flex space-x-1">
              {[
                { key: 'all', label: 'All Time' },
                { key: 'today', label: 'Today' },
                { key: 'week', label: 'Week' },
                { key: 'month', label: 'Month' },
                { key: 'year', label: 'Year' }
              ].map(filter => (
                <button
                  key={filter.key}
                  onClick={() => setFilterPeriod(filter.key as FilterPeriod)}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    filterPeriod === filter.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="text"
              placeholder="Search by investor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-48"
            />
            <button
              onClick={exportCommissions}
              disabled={filteredCommissions.length === 0}
              className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Export
            </button>
            <button
              onClick={() => setWithdrawalModalOpen(true)}
              disabled={totalCommissions < 100}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Withdraw
            </button>
          </div>
        </div>

        {/* Filter Summary */}
        {filterPeriod !== 'all' && (
          <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Filtered Results</p>
                <p className="text-gray-900 font-medium">{filteredCommissions.length} commission{filteredCommissions.length !== 1 ? 's' : ''}</p>
              </div>
              <div>
                <p className="text-gray-600">Total Commissions</p>
                <p className="text-gray-900 font-semibold">${filteredTotal.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-600">Total Withdrawals</p>
                <p className="text-gray-900 font-semibold">${filteredWithdrawalTotal.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Commission History Table */}
      <Card title={`Commission History (${filteredCommissions.length})`} className="bg-white border border-gray-200">
        {filteredCommissions.length === 0 && !loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Commission Records</h3>
            <p className="text-gray-600 mb-6">
              Commission records will appear here when investors make withdrawals.
              Each withdrawal generates a 15% commission automatically.
            </p>
            <div className="bg-gray-50 p-4 rounded border border-gray-200 max-w-md mx-auto">
              <p className="text-gray-700 text-sm">
                <strong>How it works:</strong> When an investor withdrawal is approved, 
                a 15% commission is automatically calculated and recorded here.
              </p>
            </div>
          </div>
        ) : (
          <>
            <Table 
              columns={columns} 
              data={filteredCommissions}
              isLoading={loading}
              emptyMessage="No commission records found"
            />

            {!loading && filteredCommissions.length > 0 && (
              <div className="mt-4 p-4 bg-gray-50 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Commission Records</p>
                    <p className="font-medium text-gray-900">{filteredCommissions.length}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Total Withdrawals</p>
                    <p className="font-medium text-gray-900">${filteredWithdrawalTotal.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Total Commissions</p>
                    <p className="font-medium text-gray-900">${filteredTotal.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Commission Rate</p>
                    <p className="font-medium text-gray-900">15%</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Bank Account Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card title="Commission Summary" className="bg-white border border-gray-200">
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Commission Rate</span>
              <span className="font-medium text-gray-900">15%</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Total Transactions</span>
              <span className="font-medium text-gray-900">{commissions.length}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Average per Transaction</span>
              <span className="font-medium text-gray-900">${averageCommission.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600 font-medium">Total Earned</span>
              <span className="font-semibold text-gray-900">${totalCommissions.toLocaleString()}</span>
            </div>
          </div>
        </Card>

        <Card title="Deposit Account" className="bg-white border border-gray-200">
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-gray-900 font-medium">ADCB Bank</h3>
                  <p className="text-gray-600 text-sm">Commission deposit account</p>
                </div>
                <Building className="text-gray-600" size={20} />
              </div>
              
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-gray-600">Account Number</p>
                  <p className="text-gray-900 font-medium">13*********0001</p>
                </div>
                <div>
                  <p className="text-gray-600">IBAN</p>
                  <p className="text-gray-900 font-medium">AE68003001*********0001</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600">Available for Withdrawal</p>
                  <p className="text-gray-900 text-xl font-semibold">${totalCommissions.toLocaleString()}</p>
                </div>
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 text-lg">$</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Commission Withdrawal Modal */}
      <CommissionWithdrawalModal
        isOpen={withdrawalModalOpen}
        onClose={() => setWithdrawalModalOpen(false)}
        totalCommissions={totalCommissions}
        onSuccess={() => {
          setWithdrawalModalOpen(false);
        }}
      />
    </DashboardLayout>
  );
};

export default CommissionsPage;