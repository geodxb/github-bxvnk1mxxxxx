import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import WalletOverview from '../../components/investor/WalletOverview';
import PerformanceChart from '../../components/common/PerformanceChart';
import TransactionsTable from '../../components/investor/TransactionsTable';
import WithdrawModal from '../../components/investor/WithdrawModal';
import AlertBanner from '../../components/investor/AlertBanner';
import WithdrawalProgressBar from '../../components/common/WithdrawalProgressBar';
import ProofOfFundsForm from '../../components/investor/ProofOfFundsForm';
import InvestorProfileManagement from '../../components/investor/InvestorProfileManagement';
import InvestorWithdrawalHistory from '../../components/investor/InvestorWithdrawalHistory';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import WithdrawalRestrictionCheck from '../../components/investor/WithdrawalRestrictionCheck';
import { useAuth } from '../../contexts/AuthContext';
import { useInvestor, useTransactions, useInvestorWithdrawalRequests, useWithdrawalRequests } from '../../hooks/useFirestore';
import { DollarSign, TrendingUp, Clock, User, FileText, ArrowDownRight, Ban } from 'lucide-react';

type TabType = 'performance' | 'transactions' | 'withdrawals' | 'profile' | 'withdrawal-history';

const InvestorDashboard = () => {
  const { user, setGlobalLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('performance');
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const [proofOfFundsModalOpen, setProofOfFundsModalOpen] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);
  
  // Get investor data and transactions from Firebase
  const { investor: investorData, loading: investorLoading, lastUpdate } = useInvestor(user?.id || '');
  const { transactions } = useTransactions(user?.id);
  const { withdrawalRequests: investorWithdrawalRequests } = useInvestorWithdrawalRequests(user?.id || '');
  
  // Force re-render when investor data changes
  useEffect(() => {
    if (investorData) {
      console.log('🔄 Investor data updated:', {
        name: investorData.name,
        accountStatus: investorData.accountStatus,
        policyViolation: investorData.accountFlags?.policyViolation,
        withdrawalDisabled: investorData.accountFlags?.withdrawalDisabled,
        updatedAt: investorData.updatedAt,
        lastUpdate: lastUpdate
      });
      
      setLastUpdateTime(Date.now());
      // Clear dismissed alerts when data changes to show new alerts
      setDismissedAlerts([]);
    }
  }, [
    lastUpdate,
    investorData?.accountStatus, 
    investorData?.accountFlags?.policyViolation,
    investorData?.accountFlags?.withdrawalDisabled,
    investorData?.accountFlags?.pendingKyc,
    investorData?.currentBalance,
    investorData?.updatedAt?.getTime()
  ]);

  // Get active withdrawal requests (pending or approved)
  const activeWithdrawals = investorWithdrawalRequests.filter(
    req => req.status === 'Pending' || req.status === 'Approved'
  );
  
  // Use fallback data if Firebase data is not available
  const currentInvestor = investorData || {
    id: user?.id || '',
    name: user?.name || '',
    email: user?.email || '',
    country: 'Unknown',
    joinDate: new Date().toISOString().split('T')[0],
    initialDeposit: 0,
    currentBalance: 0,
    profilePic: user?.profilePic || '',
    role: 'investor' as const,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    // Account flags from Firebase
    accountFlags: investorData?.accountFlags || {},
    accountStatus: investorData?.accountStatus || 'Active'
  };
  
  // Calculate performance metrics
  const totalEarnings = transactions
    .filter(tx => tx.type === 'Earnings')
    .reduce((sum, tx) => sum + tx.amount, 0);
    
  const totalDeposits = transactions
    .filter(tx => tx.type === 'Deposit')
    .reduce((sum, tx) => sum + tx.amount, 0);
    
  const totalWithdrawals = Math.abs(transactions
    .filter(tx => tx.type === 'Withdrawal')
    .reduce((sum, tx) => sum + tx.amount, 0));

  // Determine which alerts to show based on Firebase flags and account status
  const getActiveAlerts = () => {
    const alerts = [];
    
    console.log('🔄 Checking alerts for investor:', currentInvestor.name);
    console.log('🔄 Account Status:', currentInvestor.accountStatus);
    console.log('🔄 Policy Violation Flag:', currentInvestor.accountFlags?.policyViolation);
    console.log('🔄 Account Flags:', currentInvestor.accountFlags);
    console.log('🔄 Last Update Time:', lastUpdateTime);
    
    // Check for policy violation
    if (currentInvestor.accountFlags?.policyViolation || 
        currentInvestor.accountStatus?.includes('policy violation') ||
        currentInvestor.accountStatus?.includes('Restricted')) {
      console.log('🚨 Policy violation alert triggered');
      alerts.push({
        type: 'policy-violation' as const,
        id: 'policy-violation',
        message: currentInvestor.accountFlags?.policyViolationMessage || 
                'Your account has been restricted due to a policy violation. Withdrawals are temporarily disabled.'
      });
    }
    
    // Check for pending KYC
    if (currentInvestor.accountFlags?.pendingKyc || 
        currentInvestor.accountStatus?.includes('KYC')) {
      console.log('🚨 KYC alert triggered');
      alerts.push({
        type: 'pending-kyc' as const,
        id: 'pending-kyc',
        message: currentInvestor.accountFlags?.kycMessage || 
                'Please complete your KYC verification to continue using all account features.'
      });
    }
    
    // Check for withdrawal disabled
    if (currentInvestor.accountFlags?.withdrawalDisabled || 
        currentInvestor.accountStatus?.includes('withdrawal')) {
      console.log('🚨 Withdrawal disabled alert triggered');
      alerts.push({
        type: 'withdrawal-disabled' as const,
        id: 'withdrawal-disabled',
        message: currentInvestor.accountFlags?.withdrawalMessage || 
                'Withdrawal functionality is temporarily disabled. Please contact support for assistance.'
      });
    }
    
    console.log('🔄 Active alerts:', alerts.length);
    
    // Filter out dismissed alerts
    return alerts.filter(alert => !dismissedAlerts.includes(alert.id));
  };

  const handleDismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => [...prev, alertId]);
  };

  const handleOpenProofOfFunds = (withdrawal: any) => {
    setSelectedWithdrawal(withdrawal);
    setProofOfFundsModalOpen(true);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'performance':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="text-center">
                <h3 className="text-gray-500 mb-2">Total Earnings</h3>
                <p className="text-2xl font-bold text-green-600">
                  ${totalEarnings.toLocaleString()}
                </p>
              </Card>
              <Card className="text-center">
                <h3 className="text-gray-500 mb-2">Total Deposits</h3>
                <p className="text-2xl font-bold text-blue-600">
                  ${totalDeposits.toLocaleString()}
                </p>
              </Card>
              <Card className="text-center">
                <h3 className="text-gray-500 mb-2">ROI</h3>
                <p className="text-2xl font-bold text-indigo-600">
                  {totalDeposits > 0 ? ((totalEarnings / totalDeposits) * 100).toFixed(2) : '0.00'}%
                </p>
              </Card>
            </div>
            <Card title="Performance Chart">
              <PerformanceChart investorId={currentInvestor.id} />
            </Card>
          </div>
        );
        
      case 'transactions':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="text-center">
                <h3 className="text-gray-500 mb-2">Total Transactions</h3>
                <p className="text-2xl font-bold text-gray-800">
                  {transactions.length}
                </p>
              </Card>
              <Card className="text-center">
                <h3 className="text-gray-500 mb-2">Largest Transaction</h3>
                <p className="text-2xl font-bold text-blue-600">
                  ${transactions.length > 0 ? Math.max(...transactions.map(t => Math.abs(t.amount))).toLocaleString() : '0'}
                </p>
              </Card>
              <Card className="text-center">
                <h3 className="text-gray-500 mb-2">Average Transaction</h3>
                <p className="text-2xl font-bold text-indigo-600">
                  ${transactions.length > 0 ? (transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) / transactions.length).toFixed(2) : '0.00'}
                </p>
              </Card>
            </div>
            <TransactionsTable transactions={transactions} />
          </div>
        );
        
      case 'profile':
        return (
          <div className="space-y-6">
            <InvestorProfileManagement
              investor={currentInvestor}
              onUpdate={() => {
                // Real-time listeners will handle updates automatically
                setLastUpdateTime(Date.now());
              }}
            />
          </div>
        );
        
      case 'withdrawals':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="text-center">
                <h3 className="text-gray-500 mb-2">Available Balance</h3>
                <p className="text-2xl font-bold text-green-600">
                  ${currentInvestor.currentBalance.toLocaleString()}
                </p>
              </Card>
              <Card className="text-center">
                <h3 className="text-gray-500 mb-2">Total Withdrawn</h3>
                <p className="text-2xl font-bold text-blue-600">
                  ${totalWithdrawals.toLocaleString()}
                </p>
              </Card>
              <Card className="text-center">
                <WithdrawalRestrictionCheck
                  fallback={
                    <Button
                      variant="outline"
                      fullWidth
                      disabled
                    >
                      <Ban size={18} className="mr-2" />
                      Withdrawals Restricted
                    </Button>
                  }
                >
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={() => setWithdrawModalOpen(true)}
                  >
                    <DollarSign size={18} className="mr-2" />
                    Request Withdrawal
                  </Button>
                </WithdrawalRestrictionCheck>
              </Card>
            </div>
          </div>
        );
        
      case 'withdrawal-history':
        return (
          <InvestorWithdrawalHistory
            investorId={currentInvestor.id}
            investorName={currentInvestor.name}
            investor={currentInvestor}
            onOpenProofOfFunds={handleOpenProofOfFunds}
          />
        );
    }
  };

  const activeAlerts = getActiveAlerts();

  // Show loading state while investor data is loading
  if (investorLoading && !investorData) {
    return (
      <DashboardLayout title="Investor Dashboard">
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your account data...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Investor Dashboard">
      <div className="mb-6">
        <h2 className="text-xl font-medium text-gray-800">Welcome back, {user?.name || 'Investor'}</h2>
        <p className="text-gray-600">Here's an overview of your trading account</p>
      </div>
      
      {/* Alert Banners */}
      {activeAlerts.map((alert) => (
        <AlertBanner
          key={alert.id}
          type={alert.type}
          message={alert.message}
          onDismiss={() => handleDismissAlert(alert.id)}
        />
      ))}
      
      <div className="mb-6">
        <WalletOverview
          initialDeposit={currentInvestor.initialDeposit}
          currentBalance={currentInvestor.currentBalance}
        />
      </div>
      
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-4">
          <button
            onClick={() => setActiveTab('performance')}
            className={`py-4 px-2 flex items-center ${
              activeTab === 'performance'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <TrendingUp size={18} className="mr-2" />
            Performance
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`py-4 px-2 flex items-center ${
              activeTab === 'transactions'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Clock size={18} className="mr-2" />
            Transactions
          </button>
          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`py-4 px-2 flex items-center ${
              activeTab === 'withdrawals'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <DollarSign size={18} className="mr-2" />
            Request Withdrawal
          </button>
          <button
            onClick={() => setActiveTab('withdrawal-history')}
            className={`py-4 px-2 flex items-center ${
              activeTab === 'withdrawal-history'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <ArrowDownRight size={18} className="mr-2" />
            Withdrawal History
            {activeWithdrawals.length > 0 && (
              <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                {activeWithdrawals.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-4 px-2 flex items-center ${
              activeTab === 'profile'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText size={18} className="mr-2" />
            Profile & Contract
          </button>
        </nav>
      </div>
      
      {renderTabContent()}
      
      <WithdrawModal
        isOpen={withdrawModalOpen}
        onClose={() => setWithdrawModalOpen(false)}
        currentBalance={currentInvestor.currentBalance}
        onSuccess={() => {
          // Real-time listeners will automatically update
        }}
      />
      
      <ProofOfFundsForm
        isOpen={proofOfFundsModalOpen}
        onClose={() => {
          setProofOfFundsModalOpen(false);
          setSelectedWithdrawal(null);
        }}
        investor={currentInvestor}
        withdrawal={selectedWithdrawal}
      />
    </DashboardLayout>
  );
};

export default InvestorDashboard;