import { useState } from 'react';
import Card from '../common/Card';
import WithdrawalProgressBar from '../common/WithdrawalProgressBar';
import TransactionsTable from './TransactionsTable';
import { useInvestorWithdrawalRequests } from '../../hooks/useFirestore';
import { useWithdrawalFlags } from '../../hooks/useWithdrawalFlags';
import { Investor } from '../../types/user';
import { ArrowDownRight, Clock, CheckCircle, XCircle, Filter, Flag } from 'lucide-react';

interface InvestorWithdrawalHistoryProps {
  investorId: string;
  investorName: string;
  investor: Investor;
  onOpenProofOfFunds?: (withdrawal: any) => void;
}

type FilterStatus = 'all' | 'pending' | 'approved' | 'credited' | 'rejected';

const InvestorWithdrawalHistory = ({ 
  investorId, 
  investorName, 
  investor,
  onOpenProofOfFunds 
}: InvestorWithdrawalHistoryProps) => {
  const { withdrawalRequests, loading, error } = useInvestorWithdrawalRequests(investorId);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  // Component to show priority flag indicator
  const PriorityFlagIndicator = ({ withdrawalId }: { withdrawalId: string }) => {
    const { flags } = useWithdrawalFlags(withdrawalId);
    const approvedFlag = flags.find(flag => flag.status === 'approved' && flag.isActive);
    
    if (!approvedFlag) return (
      <span className="text-xs text-gray-500 uppercase tracking-wide">STANDARD</span>
    );
    
    const getPriorityColor = (priority: string) => {
      switch (priority) {
        case 'urgent': return 'text-red-600';
        case 'high': return 'text-orange-600';
        case 'medium': return 'text-yellow-600';
        case 'low': return 'text-gray-600';
        default: return 'text-gray-600';
      }
    };
    
    return (
      <div className="flex items-center space-x-1" title={approvedFlag.comment}>
        <Flag size={10} className={getPriorityColor(approvedFlag.priority)} />
        <span className={`text-xs font-bold uppercase tracking-wide ${getPriorityColor(approvedFlag.priority)}`}>
          {approvedFlag.priority.toUpperCase()}
        </span>
      </div>
    );
  };


  // Filter withdrawal requests
  const filteredRequests = withdrawalRequests.filter(request => {
    if (filterStatus === 'all') return true;
    return request.status.toLowerCase() === filterStatus;
  });

  // Get active withdrawal requests (pending or approved)
  const activeWithdrawals = withdrawalRequests.filter(
    req => req.status === 'Pending' || req.status === 'Approved'
  );

  // Calculate statistics
  const totalWithdrawn = withdrawalRequests
    .filter(req => req.status === 'Credited')
    .reduce((sum, req) => sum + req.amount, 0);
  
  const pendingAmount = withdrawalRequests
    .filter(req => req.status === 'Pending' || req.status === 'Approved')
    .reduce((sum, req) => sum + req.amount, 0);

  if (error) {
    return (
      <Card title="Withdrawal History">
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors rounded-lg"
          >
            Retry
          </button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Real-time Account Status */}
      <Card title="ACCOUNT STATUS">
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-gray-600 text-sm font-medium uppercase tracking-wide mb-2">CURRENT STATUS</p>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  investor.accountStatus?.includes('Active') || !investor.accountStatus
                    ? 'bg-green-500'
                    : investor.accountStatus?.includes('Restricted')
                    ? 'bg-amber-500'
                    : 'bg-red-500'
                }`}></div>
                <span className="font-bold text-gray-900 uppercase tracking-wide">
                  {investor.accountStatus || 'Active'}
                </span>
              </div>
            </div>
            <div>
              <p className="text-gray-600 text-sm font-medium uppercase tracking-wide mb-2">WITHDRAWAL ACCESS</p>
              <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                investor.accountFlags?.withdrawalDisabled || investor.accountStatus?.includes('Restricted')
                  ? 'bg-red-100 text-red-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {investor.accountFlags?.withdrawalDisabled || investor.accountStatus?.includes('Restricted')
                  ? 'DISABLED'
                  : 'ENABLED'
                }
              </span>
            </div>
            <div>
              <p className="text-gray-600 text-sm font-medium uppercase tracking-wide mb-2">LAST UPDATE</p>
              <p className="font-medium text-gray-900">
                {investor.updatedAt ? new Date(investor.updatedAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Active Withdrawal Requests */}
      {activeWithdrawals.length > 0 && (
        <Card title={`ACTIVE WITHDRAWAL REQUESTS (${activeWithdrawals.length})`}>
          <div className="space-y-4">
            {activeWithdrawals.map((withdrawal) => (
              <WithdrawalProgressBar
                key={withdrawal.id}
                withdrawalId={withdrawal.id}
                submissionDate={withdrawal.date}
                currentStatus={withdrawal.status as any}
                approvalDate={withdrawal.approvalDate ? withdrawal.approvalDate.toISOString().split('T')[0] : null}
                creditDate={withdrawal.status === 'Credited' ? withdrawal.processedAt?.toISOString().split('T')[0] : null}
                rejectionDate={withdrawal.status === 'Rejected' ? withdrawal.processedAt?.toISOString().split('T')[0] : null}
                amount={withdrawal.amount}
                investorName={withdrawal.investorName}
                rejectionReason={withdrawal.reason}
                withdrawalRequest={withdrawal}
              />
            ))}
          </div>
        </Card>
      )}

      {/* Withdrawal Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <div className="text-2xl font-bold text-gray-900 mb-1">{withdrawalRequests.length}</div>
          <div className="text-sm text-gray-600 font-medium">Total Requests</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-gray-900 mb-1">${totalWithdrawn.toLocaleString()}</div>
          <div className="text-sm text-gray-600 font-medium">Total Withdrawn</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-gray-900 mb-1">${pendingAmount.toLocaleString()}</div>
          <div className="text-sm text-gray-600 font-medium">Pending Amount</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {withdrawalRequests.filter(req => req.status === 'Pending').length}
          </div>
          <div className="text-sm text-gray-600 font-medium">Pending Requests</div>
        </Card>
      </div>

      {/* Filter Controls */}
      <Card>
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex items-center space-x-2">
            <Filter size={16} className="text-gray-500" />
            <span className="text-sm text-gray-700 font-medium">Filter by Status:</span>
          </div>
          <div className="flex space-x-1">
            {[
              { key: 'all', label: 'All', count: withdrawalRequests.length },
              { key: 'pending', label: 'Pending', count: withdrawalRequests.filter(r => r.status === 'Pending').length },
              { key: 'approved', label: 'Approved', count: withdrawalRequests.filter(r => r.status === 'Approved').length },
              { key: 'credited', label: 'Credited', count: withdrawalRequests.filter(r => r.status === 'Credited').length },
              { key: 'rejected', label: 'Rejected', count: withdrawalRequests.filter(r => r.status === 'Rejected').length }
            ].map(filter => (
              <button
                key={filter.key}
                onClick={() => setFilterStatus(filter.key as FilterStatus)}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  filterStatus === filter.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.label} ({filter.count})
              </button>
            ))}
          </div>
        </div>

        {/* Withdrawal History List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading withdrawal history...</p>
            </div>
          ) : filteredRequests.length > 0 ? (
            filteredRequests.map((withdrawal) => (
              <div key={withdrawal.id} className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-bold text-xl text-gray-900">${withdrawal.amount.toLocaleString()}</p>
                    <p className="text-sm text-gray-600 font-medium">Request #{withdrawal.id.slice(-8)}</p>
                    <PriorityFlagIndicator withdrawalId={withdrawal.id} />
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 text-sm rounded-full font-medium ${
                      withdrawal.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      withdrawal.status === 'Approved' ? 'bg-green-100 text-green-800' :
                      withdrawal.status === 'Credited' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {withdrawal.status}
                    </span>
                    <p className="text-xs text-gray-500 mt-1 font-medium">{withdrawal.date}</p>
                  </div>
                </div>
                
                {/* Show detailed progress for all withdrawals */}
                <WithdrawalProgressBar
                  withdrawalId={withdrawal.id}
                  submissionDate={withdrawal.date}
                  currentStatus={withdrawal.status as any}
                  approvalDate={withdrawal.approvalDate ? withdrawal.approvalDate.toISOString().split('T')[0] : null}
                  creditDate={withdrawal.status === 'Credited' ? withdrawal.processedAt?.toISOString().split('T')[0] : null}
                  rejectionDate={withdrawal.status === 'Rejected' ? withdrawal.processedAt?.toISOString().split('T')[0] : null}
                  amount={withdrawal.amount}
                  investorName={withdrawal.investorName}
                  rejectionReason={withdrawal.reason}
                  withdrawalRequest={withdrawal}
                />
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ArrowDownRight size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">No Withdrawal History</h3>
              <p className="text-gray-500">
                {filterStatus === 'all' 
                  ? 'You haven\'t made any withdrawal requests yet.'
                  : `No ${filterStatus} withdrawal requests found.`
                }
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default InvestorWithdrawalHistory;