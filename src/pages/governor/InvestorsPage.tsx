import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GovernorLayout from '../../components/layout/GovernorLayout';
import { useInvestors } from '../../hooks/useFirestore';
import { FirestoreService } from '../../services/firestoreService';
import InvestorReviewModal from '../../components/governor/InvestorReviewModal';
import { 
  Eye, 
  Edit, 
  Ban, 
  CheckCircle,
  XCircle,
  AlertTriangle,
  Database,
  User,
  FileText,
  Shield
} from 'lucide-react';

const GovernorInvestorsPage = () => {
  const navigate = useNavigate();
  const { investors, loading, error } = useInvestors();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedInvestor, setSelectedInvestor] = useState<any>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});

  const filteredInvestors = investors.filter(investor => {
    const matchesSearch = investor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      investor.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      investor.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatus = true;
    const accountStatus = investor.accountStatus || 'Active';
    
    if (statusFilter === 'active') {
      matchesStatus = !accountStatus || 
                    (accountStatus.toLowerCase().includes('active') && 
                     !accountStatus.toLowerCase().includes('restricted') && 
                     !accountStatus.toLowerCase().includes('closed'));
    } else if (statusFilter === 'restricted') {
      matchesStatus = accountStatus.toLowerCase().includes('restricted') || 
                     accountStatus.toLowerCase().includes('policy violation');
    } else if (statusFilter === 'closed') {
      matchesStatus = accountStatus.toLowerCase().includes('closed');
    }
    
    return matchesSearch && matchesStatus;
  });

  const handleSuspendAccount = async (investorId: string, investorName: string) => {
    if (!confirm(`SUSPEND ACCOUNT: ${investorName}?\n\nThis will immediately restrict all account access.`)) {
      return;
    }

    setIsLoading(prev => ({ ...prev, [investorId]: true }));
    
    try {
      await FirestoreService.updateInvestor(investorId, {
        accountStatus: 'SUSPENDED BY GOVERNOR',
        isActive: false,
        accountFlags: {
          ...investors.find(inv => inv.id === investorId)?.accountFlags,
          governorSuspended: true,
          suspendedAt: new Date().toISOString(),
          suspendedBy: 'GOVERNOR'
        }
      });
    } catch (error) {
      console.error('Error suspending account:', error);
    } finally {
      setIsLoading(prev => ({ ...prev, [investorId]: false }));
    }
  };

  const handleReviewInvestor = (investor: any) => {
    setSelectedInvestor(investor);
    setShowReviewModal(true);
  };

  const handleReviewSuccess = () => {
    refreshInvestors();
    setShowReviewModal(false);
    setSelectedInvestor(null);
  };

  const handleActivateAccount = async (investorId: string, investorName: string) => {
    if (!confirm(`ACTIVATE ACCOUNT: ${investorName}?\n\nThis will restore full account access.`)) {
      return;
    }

    setIsLoading(prev => ({ ...prev, [investorId]: true }));
    
    try {
      await FirestoreService.updateInvestor(investorId, {
        accountStatus: 'Active',
        isActive: true,
        accountFlags: {
          ...investors.find(inv => inv.id === investorId)?.accountFlags,
          governorSuspended: false,
          activatedAt: new Date().toISOString(),
          activatedBy: 'GOVERNOR'
        }
      });
    } catch (error) {
      console.error('Error activating account:', error);
    } finally {
      setIsLoading(prev => ({ ...prev, [investorId]: false }));
    }
  };


  const refreshInvestors = () => {
    // The useInvestors hook handles real-time updates automatically
    window.location.reload();
  };
  if (error) {
    return (
      <GovernorLayout title="INVESTOR CONTROL">
        <div className="bg-white border border-gray-300 p-8 text-center">
          <p className="text-red-600 font-bold uppercase tracking-wide">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-gray-900 text-white font-bold hover:bg-gray-800 transition-colors uppercase tracking-wide"
          >
            RETRY
          </button>
        </div>
      </GovernorLayout>
    );
  }

  return (
    <GovernorLayout title="INVESTOR CONTROL">
      {/* Control Header */}
      <div className="bg-white border border-gray-300 p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">INVESTOR ACCOUNT CONTROL</h1>
            <p className="text-gray-600 uppercase tracking-wide text-sm font-medium">FULL ADMINISTRATIVE ACCESS TO ALL INVESTOR ACCOUNTS</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">{investors.length}</div>
            <div className="text-sm text-gray-600 uppercase tracking-wide">TOTAL ACCOUNTS</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-300 p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">STATUS FILTER:</span>
            <div className="flex space-x-2">
              {[
                { key: 'all', label: 'ALL' },
                { key: 'active', label: 'ACTIVE' },
                { key: 'restricted', label: 'RESTRICTED' },
                { key: 'closed', label: 'CLOSED' }
              ].map(filter => (
                <button
                  key={filter.key}
                  onClick={() => setStatusFilter(filter.key)}
                  className={`px-3 py-2 text-sm font-bold border transition-colors uppercase tracking-wide ${
                    statusFilter === filter.key
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <input
              type="text"
              placeholder="SEARCH ACCOUNTS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 text-sm focus:ring-1 focus:ring-gray-500 focus:border-gray-500 w-80 uppercase tracking-wide font-medium"
            />
          </div>
        </div>
      </div>

      {/* Investor Accounts Table */}
      <div className="bg-white border border-gray-300">
        <div className="px-6 py-4 border-b border-gray-300 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">
            INVESTOR ACCOUNTS ({filteredInvestors.length} RECORDS)
          </h3>
        </div>
        
        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-gray-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-700 font-bold uppercase tracking-wide">LOADING ACCOUNT DATA...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-300 bg-gray-100">
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wide">ACCOUNT</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wide">LOCATION</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 uppercase tracking-wide">BALANCE</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 uppercase tracking-wide">PERFORMANCE</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wide">STATUS</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wide">CONTROLS</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvestors.map((investor) => {
                  const performance = investor.currentBalance - investor.initialDeposit;
                  const performancePercent = investor.initialDeposit > 0 ? (performance / investor.initialDeposit) * 100 : 0;
                  const isPositive = performance >= 0;
                  const isSuspended = investor.accountStatus?.includes('SUSPENDED') || 
                                   investor.accountStatus?.includes('Restricted') ||
                                   investor.accountFlags?.governorSuspended;

                  return (
                    <tr key={investor.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-200 border border-gray-400 flex items-center justify-center">
                            <User size={16} className="text-gray-600" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 uppercase tracking-wide">{investor.name}</p>
                            <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">ID: {investor.id.slice(-8)}</p>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">{investor.email || 'NO EMAIL'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-bold text-gray-900 uppercase tracking-wide">{investor.country}</p>
                          <p className="text-xs text-gray-600 uppercase tracking-wide">{investor.location || 'UNSPECIFIED'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div>
                          <p className="text-lg font-bold text-gray-900">${investor.currentBalance.toLocaleString()}</p>
                          <p className="text-xs text-gray-600 uppercase tracking-wide">USD</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div>
                          <p className={`font-bold ${isPositive ? 'text-gray-900' : 'text-gray-900'}`}>
                            {isPositive ? '+' : ''}${performance.toLocaleString()}
                          </p>
                          <p className={`text-xs ${isPositive ? 'text-gray-600' : 'text-gray-600'} uppercase tracking-wide`}>
                            {isPositive ? '+' : ''}{performancePercent.toFixed(1)}%
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="space-y-1">
                          <div className={`px-3 py-1 text-xs font-bold border uppercase tracking-wide ${
                            isSuspended 
                              ? 'bg-red-50 text-red-800 border-red-200'
                              : investor.accountStatus?.includes('Active') || !investor.accountStatus
                              ? 'bg-green-50 text-green-800 border-green-200'
                              : 'bg-yellow-50 text-yellow-800 border-yellow-200'
                          }`}>
                            {isSuspended ? 'SUSPENDED' : investor.accountStatus || 'ACTIVE'}
                          </div>
                          <div className="text-xs text-gray-500 uppercase tracking-wide">
                            {investor.accountType || 'STANDARD'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col space-y-2">
                          <button
                            onClick={() => navigate(`/governor/investor/${investor.id}`)}
                            className="px-3 py-1 bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 transition-colors uppercase tracking-wide"
                          >
                            INSPECT
                          </button>
                          
                          {isSuspended ? (
                            <button
                              onClick={() => handleActivateAccount(investor.id, investor.name)}
                              disabled={isLoading[investor.id]}
                              className="px-3 py-1 bg-green-600 text-white text-xs font-bold hover:bg-green-700 transition-colors disabled:opacity-50 uppercase tracking-wide"
                            >
                              ACTIVATE
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSuspendAccount(investor.id, investor.name)}
                              disabled={isLoading[investor.id]}
                              className="px-3 py-1 bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors disabled:opacity-50 uppercase tracking-wide"
                            >
                              SUSPEND
                            </button>
                          )}
                          
                          {investor.uploadedDocuments && investor.uploadedDocuments.length > 0 && (
                            <div className="flex items-center space-x-1 text-blue-600" title={`${investor.uploadedDocuments.length} documents uploaded`}>
                              <FileText size={14} />
                              <span className="text-xs">({investor.uploadedDocuments.length})</span>
                            </div>
                          )}
                          
                          <button 
                            onClick={() => handleReviewInvestor(investor)}
                            className="px-2 py-1 bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors uppercase tracking-wide border border-blue-700"
                            title="Review investor"
                          >
                            REVIEW
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary Footer */}
        {!loading && filteredInvestors.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-300">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm">
              <div>
                <p className="text-gray-600 font-bold uppercase tracking-wide">SHOWING</p>
                <p className="font-bold text-gray-900">{filteredInvestors.length} ACCOUNTS</p>
              </div>
              <div>
                <p className="text-gray-600 font-bold uppercase tracking-wide">TOTAL AUM</p>
                <p className="font-bold text-gray-900">
                  ${filteredInvestors.reduce((sum, inv) => sum + inv.currentBalance, 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-600 font-bold uppercase tracking-wide">ACTIVE</p>
                <p className="font-bold text-gray-900">
                  {filteredInvestors.filter(inv => !inv.accountStatus?.includes('SUSPENDED') && !inv.accountStatus?.includes('Closed')).length}
                </p>
              </div>
              <div>
                <p className="text-gray-600 font-bold uppercase tracking-wide">SUSPENDED</p>
                <p className="font-bold text-gray-900">
                  {filteredInvestors.filter(inv => inv.accountStatus?.includes('SUSPENDED') || inv.accountStatus?.includes('Restricted')).length}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Investor Review Modal */}
      <InvestorReviewModal
        isOpen={showReviewModal}
        onClose={() => {
          setShowReviewModal(false);
          setSelectedInvestor(null);
        }}
        investor={selectedInvestor}
        onSuccess={handleReviewSuccess}
      />
    </GovernorLayout>
  );
};

export default GovernorInvestorsPage;