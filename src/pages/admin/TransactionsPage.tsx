import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import { useTransactions, useInvestors } from '../../hooks/useFirestore';
import { 
  Filter,
  Download,
  Search,
  TrendingUp,
  TrendingDown,
  LogIn,
  ArrowDownRight,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
  User
} from 'lucide-react';

type FilterType = 'all' | 'Deposit' | 'Earnings' | 'Withdrawal';
type FilterStatus = 'all' | 'Completed' | 'Pending' | 'Rejected';

const TransactionsPage = () => {
  const { setGlobalLoading } = useAuth();
  const { transactions, loading, error } = useTransactions();
  const { investors } = useInvestors();
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Get investor name by ID
  const getInvestorName = (investorId: string) => {
    const investor = investors.find(inv => inv.id === investorId);
    return investor?.name || 'Unknown Investor';
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    const matchesType = filterType === 'all' || transaction.type === filterType;
    const matchesStatus = filterStatus === 'all' || transaction.status === filterStatus;
    
    const investorName = getInvestorName(transaction.investorId);
    const matchesSearch = investorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.amount.toString().includes(searchTerm) ||
      transaction.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesDate = true;
    if (dateRange.start && dateRange.end) {
      const transactionDate = new Date(transaction.date);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      matchesDate = transactionDate >= startDate && transactionDate <= endDate;
    }
    
    return matchesType && matchesStatus && matchesSearch && matchesDate;
  });

  // Calculate statistics
  const totalTransactions = filteredTransactions.length;
  const totalAmount = filteredTransactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  const totalDeposits = filteredTransactions.filter(tx => tx.type === 'Deposit').reduce((sum, tx) => sum + tx.amount, 0);
  const totalWithdrawals = Math.abs(filteredTransactions.filter(tx => tx.type === 'Withdrawal').reduce((sum, tx) => sum + tx.amount, 0));
  const totalEarnings = filteredTransactions.filter(tx => tx.type === 'Earnings').reduce((sum, tx) => sum + tx.amount, 0);

  const exportTransactions = () => {
    const csvContent = [
      ['Date', 'Investor', 'Type', 'Amount', 'Status', 'Description'],
      ...filteredTransactions.map(tx => [
        tx.date,
        getInvestorName(tx.investorId),
        tx.type,
        tx.amount.toString(),
        tx.status,
        tx.description || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const columns = [
    {
      key: 'date',
      header: 'Date',
      render: (value: string) => {
        const date = new Date(value);
        return (
          <div className="space-y-1">
            <p className="font-semibold text-gray-900">{date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}</p>
            <p className="text-xs text-gray-500 font-medium">{date.toLocaleDateString('en-US', { 
              weekday: 'short'
            })}</p>
          </div>
        );
      }
    },
    {
      key: 'investorId',
      header: 'Investor',
      render: (value: string) => {
        const investorName = getInvestorName(value);
        return (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <User size={14} className="text-gray-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{investorName}</p>
              <p className="text-xs text-gray-500 font-medium">ID: {value.slice(-8)}</p>
            </div>
          </div>
        );
      }
    },
    {
      key: 'type',
      header: 'Type',
      render: (value: string) => (
        <div className="flex items-center space-x-2">
          {value === 'Deposit' && <LogIn size={16} className="text-gray-600" />}
          {value === 'Earnings' && <TrendingUp size={16} className="text-gray-600" />}
          {value === 'Withdrawal' && <ArrowDownRight size={16} className="text-gray-600" />}
          <span className="font-semibold text-gray-900">{value}</span>
        </div>
      )
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right' as 'right',
      render: (value: number, row: any) => (
        <div className="text-right">
          <p className="font-bold text-lg text-gray-900">
            {row.type === 'Withdrawal' ? '-' : '+'}${Math.abs(value).toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 font-medium">USD</p>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (value: string) => {
        let statusClass = 'bg-gray-100 text-gray-800 border border-gray-200';
        let icon = <CheckCircle size={12} />;
        
        if (value === 'Pending') {
          statusClass = 'bg-gray-50 text-gray-700 border border-gray-200';
          icon = <Clock size={12} />;
        } else if (value === 'Rejected') {
          statusClass = 'bg-gray-50 text-gray-700 border border-gray-200';
          icon = <XCircle size={12} />;
        } else {
          statusClass = 'bg-gray-100 text-gray-800 border border-gray-200';
        }
        
        return (
          <span className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold w-fit ${statusClass}`}>
            {icon}
            <span>{value}</span>
          </span>
        );
      }
    },
    {
      key: 'description',
      header: 'Description',
      render: (value: string, row: any) => (
        <div className="max-w-xs">
          <p className="text-sm text-gray-900 font-medium truncate">
            {value || `${row.type} transaction`}
          </p>
        </div>
      )
    }
  ];

  if (error) {
    return (
      <DashboardLayout title="Transaction History">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4 font-medium">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors rounded-lg"
            >
              Retry
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Transaction History">
      {/* Refined Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 text-center">
            <div className="text-2xl font-bold text-gray-900 mb-1">{totalTransactions}</div>
            <div className="text-sm text-gray-600 font-medium">Total Transactions</div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 text-center">
            <div className="text-2xl font-bold text-gray-900 mb-1">${totalDeposits.toLocaleString()}</div>
            <div className="text-sm text-gray-600 font-medium">Total Deposits</div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 text-center">
            <div className="text-2xl font-bold text-gray-900 mb-1">${totalEarnings.toLocaleString()}</div>
            <div className="text-sm text-gray-600 font-medium">Total Earnings</div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 text-center">
            <div className="text-2xl font-bold text-gray-900 mb-1">${totalWithdrawals.toLocaleString()}</div>
            <div className="text-sm text-gray-600 font-medium">Total Withdrawals</div>
          </div>
        </div>
      </div>

      {/* Refined Filters and Controls */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Filter size={16} className="text-gray-500" />
                  <span className="text-sm text-gray-700 font-medium">Type:</span>
                </div>
                <div className="flex space-x-1">
                  {[
                    { key: 'all', label: 'All' },
                    { key: 'Deposit', label: 'Deposits' },
                    { key: 'Earnings', label: 'Earnings' },
                    { key: 'Withdrawal', label: 'Withdrawals' }
                  ].map(filter => (
                    <button
                      key={filter.key}
                      onClick={() => setFilterType(filter.key as FilterType)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        filterType === filter.key
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-gray-300 focus:border-gray-300 w-64 font-medium"
                  />
                </div>
                <button
                  onClick={exportTransactions}
                  disabled={filteredTransactions.length === 0}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download size={14} className="mr-1 inline" />
                  Export
                </button>
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700 font-medium">Status:</span>
              </div>
              <div className="flex space-x-1">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'Completed', label: 'Completed' },
                  { key: 'Pending', label: 'Pending' },
                  { key: 'Rejected', label: 'Rejected' }
                ].map(filter => (
                  <button
                    key={filter.key}
                    onClick={() => setFilterStatus(filter.key as FilterStatus)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      filterStatus === filter.key
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Refined Transactions Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            Transaction History ({filteredTransactions.length})
          </h3>
        </div>
        <div className="overflow-hidden">
          <Table 
            columns={columns} 
            data={filteredTransactions}
            isLoading={loading}
            emptyMessage="No transactions found"
          />
        </div>

        {!loading && filteredTransactions.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600 font-medium">Filtered Results</p>
                <p className="font-bold text-gray-900">{filteredTransactions.length} transactions</p>
              </div>
              <div>
                <p className="text-gray-600 font-medium">Total Volume</p>
                <p className="font-bold text-gray-900">${totalAmount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-600 font-medium">Average Transaction</p>
                <p className="font-bold text-gray-900">
                  ${filteredTransactions.length > 0 ? (totalAmount / filteredTransactions.length).toFixed(2) : '0.00'}
                </p>
              </div>
              <div>
                <p className="text-gray-600 font-medium">Date Range</p>
                <p className="font-bold text-gray-900">
                  {filteredTransactions.length > 0 ? 
                    `${Math.floor((new Date().getTime() - new Date(Math.min(...filteredTransactions.map(tx => new Date(tx.date).getTime()))).getTime()) / (1000 * 60 * 60 * 24))} days` : 
                    'N/A'
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TransactionsPage;