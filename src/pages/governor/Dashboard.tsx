import { useState } from 'react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import GovernorLayout from '../../components/layout/GovernorLayout';
import AccountCreationRequests from '../../components/governor/AccountCreationRequests';
import { useInvestors, useWithdrawalRequests, useTransactions } from '../../hooks/useFirestore';
import { AccountClosureService } from '../../services/accountClosureService';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const GovernorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showAccountRequests, setShowAccountRequests] = useState(false);
  const { investors } = useInvestors();
  const { withdrawalRequests } = useWithdrawalRequests();
  const { transactions } = useTransactions();
  const [accountClosureRequests, setAccountClosureRequests] = useState<any[]>([]);
  const [isLoadingClosures, setIsLoadingClosures] = useState(true);

  // Load account closure requests
  useEffect(() => {
    const loadClosureRequests = async () => {
      try {
        // Get all closure requests from Firebase
        const closureQuery = query(
          collection(db, 'accountClosureRequests'),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(closureQuery);
        const requests = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          approvalDate: doc.data().approvalDate?.toDate() || null,
          completionDate: doc.data().completionDate?.toDate() || null,
          rejectionDate: doc.data().rejectionDate?.toDate() || null
        }));
        setAccountClosureRequests(requests);
      } catch (error) {
        console.error('Error loading closure requests:', error);
      } finally {
        setIsLoadingClosures(false);
      }
    };

    loadClosureRequests();
  }, []);
  
  // Calculate system-wide metrics
  const totalAssets = investors.reduce((sum, investor) => sum + (investor.currentBalance || 0), 0);
  const totalInvestors = investors.length;
  const activeInvestors = investors.filter(inv => !inv.accountStatus?.includes('Closed')).length;
  const restrictedInvestors = investors.filter(inv => inv.accountStatus?.includes('Restricted')).length;
  const accountsUnderDeletion = accountClosureRequests.filter(req => 
    req.status === 'Pending' || req.status === 'Approved'
  ).length;
  const pendingWithdrawals = withdrawalRequests.filter(req => req.status === 'Pending').length;
  const totalWithdrawalAmount = withdrawalRequests.reduce((sum, req) => sum + req.amount, 0);
  
  // System status indicators
  const systemMetrics = [
    {
      label: 'TOTAL AUM',
      value: `$${totalAssets.toLocaleString()}`,
      status: 'operational',
    },
    {
      label: 'ACTIVE ACCOUNTS',
      value: activeInvestors.toString(),
      status: 'operational',
    },
    {
      label: 'RESTRICTED ACCOUNTS',
      value: restrictedInvestors.toString(),
      status: restrictedInvestors > 0 ? 'warning' : 'operational',
    },
    {
      label: 'ACCOUNTS UNDER DELETION',
      value: (accountClosureRequests.filter(req => req.status === 'Pending' || req.status === 'Approved').length).toString(),
      status: accountsUnderDeletion > 0 ? 'critical' : 'operational'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'operational': return 'bg-green-50 border-green-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'critical': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <GovernorLayout title="SYSTEM OVERVIEW">
      {/* Interactive Brokers Header */}
      <div className="bg-white border border-black shadow-sm mb-6">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img 
                src="/Screenshot 2025-06-07 024813.png" 
                alt="Interactive Brokers" 
                className="h-10 w-auto object-contain"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">GOVERNOR CONTROL PANEL</h1>
                <p className="text-gray-600 uppercase tracking-wide text-sm font-medium">SYSTEM-WIDE ADMINISTRATIVE ACCESS</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700 uppercase tracking-wide">ALL SYSTEMS OPERATIONAL</span>
            </div>
          </div>
        </div>
      </div>

      {/* System Status Header */}
      <div className="bg-white border border-black shadow-sm mb-8">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wide">SYSTEM METRICS</h2>
          <p className="text-gray-600 uppercase tracking-wide text-sm font-medium">Real-time platform monitoring and control</p>
        </div>
      </div>

      {/* System Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {systemMetrics.map((metric, index) => (
          <div key={index} className={`bg-white border border-black p-6 ${getStatusBg(metric.status)}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-left">
                <p className="text-gray-600 text-sm font-medium uppercase tracking-wider mb-2">{metric.label}</p>
                <p className="text-3xl font-bold text-gray-900">{metric.value}</p>
              </div>
              <div className={`w-3 h-3 rounded-full ${
                metric.status === 'operational' ? 'bg-green-500' :
                metric.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
            </div>
          </div>
        ))}
      </div>

      {/* Raw Data Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Recent Transactions Raw Data */}
        <div className="bg-white border border-gray-300">
          <div className="px-6 py-4 border-b border-gray-300 bg-gray-50">
            <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">RECENT TRANSACTIONS [RAW DATA]</h3>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="text-left py-2 text-gray-700 font-bold uppercase">ID</th>
                    <th className="text-left py-2 text-gray-700 font-bold uppercase">TYPE</th>
                    <th className="text-right py-2 text-gray-700 font-bold uppercase">AMOUNT</th>
                    <th className="text-left py-2 text-gray-700 font-bold uppercase">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 8).map((tx) => (
                    <tr key={tx.id} className="border-b border-gray-200">
                      <td className="py-2 text-gray-900">{tx.id.slice(-8)}</td>
                      <td className="py-2 text-gray-900">{tx.type}</td>
                      <td className="py-2 text-right text-gray-900">${tx.amount.toLocaleString()}</td>
                      <td className="py-2 text-gray-900">{tx.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Pending Withdrawals Raw Data */}
        <div className="bg-white border border-black">
          <div className="px-6 py-4 border-b border-gray-300 bg-gray-50">
            <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">PENDING WITHDRAWALS [RAW DATA]</h3>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="text-left py-2 text-gray-700 font-bold uppercase">REQ_ID</th>
                    <th className="text-left py-2 text-gray-700 font-bold uppercase">INVESTOR</th>
                    <th className="text-right py-2 text-gray-700 font-bold uppercase">AMOUNT</th>
                    <th className="text-left py-2 text-gray-700 font-bold uppercase">DATE</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawalRequests.filter(req => req.status === 'Pending').slice(0, 6).map((req) => (
                    <tr key={req.id} className="border-b border-gray-200">
                      <td className="py-2 text-gray-900">{req.id.slice(-8)}</td>
                      <td className="py-2 text-gray-900">{req.investorName}</td>
                      <td className="py-2 text-right text-gray-900">${req.amount.toLocaleString()}</td>
                      <td className="py-2 text-gray-900">{req.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* System Activity Log */}
      <div className="bg-white border border-black mb-8">
        <div className="px-6 py-4 border-b border-gray-300 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">SYSTEM ACTIVITY LOG</h3>
        </div>
        <div className="p-6">
          <div className="space-y-3 max-h-64 overflow-y-auto font-mono text-xs">
            <div className="flex items-center space-x-4 py-2 border-b border-gray-200">
              <span className="text-gray-500">[{new Date().toISOString()}]</span>
              <span className="text-green-600 font-bold">SYSTEM</span>
              <span className="text-gray-900">Governor {user?.name} accessed control panel</span>
            </div>
            <div className="flex items-center space-x-4 py-2 border-b border-gray-200">
              <span className="text-gray-500">[{new Date(Date.now() - 300000).toISOString()}]</span>
              <span className="text-blue-600 font-bold">DATABASE</span>
              <span className="text-gray-900">Real-time sync active - {transactions.length} transactions loaded</span>
            </div>
            <div className="flex items-center space-x-4 py-2 border-b border-gray-200">
              <span className="text-gray-500">[{new Date(Date.now() - 600000).toISOString()}]</span>
              <span className="text-yellow-600 font-bold">WITHDRAWAL</span>
              <span className="text-gray-900">{pendingWithdrawals} pending withdrawal requests detected</span>
            </div>
            <div className="flex items-center space-x-4 py-2 border-b border-gray-200">
              <span className="text-gray-500">[{new Date(Date.now() - 900000).toISOString()}]</span>
              <span className="text-green-600 font-bold">SECURITY</span>
              <span className="text-gray-900">All security protocols active and monitoring</span>
            </div>
          </div>
        </div>
      </div>

      {/* Account Deletion Management */}
      <div className="bg-white border border-black mb-8">
        <div className="px-6 py-4 border-b border-gray-300 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">
            ACCOUNT DELETION MANAGEMENT ({accountClosureRequests.length} TOTAL)
          </h3>
        </div>
        <div className="p-6">
          {isLoadingClosures ? (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-2 border-gray-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-700 font-bold uppercase tracking-wide">LOADING DELETION REQUESTS...</p>
            </div>
          ) : accountClosureRequests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="text-left py-2 text-gray-700 font-bold uppercase">REQUEST_ID</th>
                    <th className="text-left py-2 text-gray-700 font-bold uppercase">INVESTOR</th>
                    <th className="text-right py-2 text-gray-700 font-bold uppercase">BALANCE</th>
                    <th className="text-left py-2 text-gray-700 font-bold uppercase">STATUS</th>
                    <th className="text-left py-2 text-gray-700 font-bold uppercase">STAGE</th>
                    <th className="text-left py-2 text-gray-700 font-bold uppercase">DATE</th>
                  </tr>
                </thead>
                <tbody>
                  {accountClosureRequests.slice(0, 8).map((req) => (
                    <tr key={req.id} className="border-b border-gray-200">
                      <td className="py-2 text-gray-900">{req.id.slice(-8)}</td>
                      <td className="py-2 text-gray-900">{req.investorName}</td>
                      <td className="py-2 text-right text-gray-900">${req.accountBalance?.toLocaleString() || '0'}</td>
                      <td className="py-2 text-gray-900">{req.status}</td>
                      <td className="py-2 text-gray-900">{req.stage}</td>
                      <td className="py-2 text-gray-900">{req.requestDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8 font-bold uppercase tracking-wide">NO DELETION REQUESTS</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-300 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">DATABASE ACCESS</h3>
          </div>
          <p className="text-gray-700 text-sm mb-4 uppercase tracking-wide">Direct access to all system data and records</p>
          <button 
            onClick={() => navigate('/governor/database')}
            className="w-full px-4 py-3 bg-gray-900 text-white font-bold hover:bg-gray-800 transition-colors uppercase tracking-wide"
          >
            ACCESS DATABASE
          </button>
        </div>

        <div className="bg-white border border-gray-300 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">ACCOUNT REQUESTS</h3>
          </div>
          <p className="text-gray-700 text-sm mb-4 uppercase tracking-wide">Review and approve new investor applications</p>
          <button 
            onClick={() => setShowAccountRequests(true)}
            className="w-full px-4 py-3 bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors uppercase tracking-wide"
          >
            REVIEW APPLICATIONS
          </button>
        </div>
        <div className="bg-white border border-gray-300 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">SYSTEM MONITORING</h3>
          </div>
          <p className="text-gray-700 text-sm mb-4 uppercase tracking-wide">Real-time monitoring of all platform activities</p>
          <button 
            onClick={() => navigate('/governor/system-monitoring')}
            className="w-full px-4 py-3 bg-gray-900 text-white font-bold hover:bg-gray-800 transition-colors uppercase tracking-wide"
          >
            VIEW MONITORS
          </button>
        </div>

        <div className="bg-white border border-gray-300 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">SYSTEM CONTROLS</h3>
          </div>
          <p className="text-gray-700 text-sm mb-4 uppercase tracking-wide">Advanced system configuration and controls</p>
          <button 
            onClick={() => navigate('/governor/system-controls')}
            className="w-full px-4 py-3 bg-gray-900 text-white font-bold hover:bg-gray-800 transition-colors uppercase tracking-wide"
          >
            SYSTEM CONFIG
          </button>
        </div>

        <div className="bg-white border border-gray-300 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">SUPPORT TICKETS</h3>
          </div>
          <p className="text-gray-700 text-sm mb-4 uppercase tracking-wide">Manage and respond to admin support requests</p>
          <button 
            onClick={() => navigate('/governor/support-tickets')}
            className="w-full px-4 py-3 bg-gray-900 text-white font-bold hover:bg-gray-800 transition-colors uppercase tracking-wide"
          >
            MANAGE TICKETS
          </button>
        </div>
      </div>

      {/* Account Creation Requests Modal */}
      <AccountCreationRequests
        isOpen={showAccountRequests}
        onClose={() => setShowAccountRequests(false)}
      />
    </GovernorLayout>
  );
};

export default GovernorDashboard;