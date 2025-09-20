import { useState, useEffect } from 'react';
import GovernorLayout from '../../components/layout/GovernorLayout';
import { useWithdrawalRequests, useInvestors } from '../../hooks/useFirestore';
import { FirestoreService } from '../../services/firestoreService';
import { WithdrawalFlagService } from '../../services/withdrawalFlagService';
import { useWithdrawalFlags } from '../../hooks/useWithdrawalFlags';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Flag, 
  AlertTriangle, 
  Eye, 
  FileText, 
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  User
} from 'lucide-react';

const GovernorWithdrawalsPage = () => {
  const { user } = useAuth();
  const { withdrawalRequests, loading, error } = useWithdrawalRequests();
  const { investors } = useInvestors();
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showRawData, setShowRawData] = useState(false);
  const [showInspectModal, setShowInspectModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusComment, setStatusComment] = useState('');
  const [pendingFlags, setPendingFlags] = useState<any[]>([]);
  const [flagsLoading, setFlagsLoading] = useState(true);
  const [processingFlag, setProcessingFlag] = useState<string>('');
  const [selectedFlagWithdrawal, setSelectedFlagWithdrawal] = useState<any>(null);
  const [showFlagModal, setShowFlagModal] = useState(false);

  // Component to show withdrawal flag indicator
  const WithdrawalFlagIndicator = ({ withdrawalId }: { withdrawalId: string }) => {
    const { hasUrgentFlag, urgentComment } = useWithdrawalFlags(withdrawalId);
    
    if (!hasUrgentFlag) return null;
    
    return (
      <div className="flex items-center space-x-1" title={urgentComment}>
        <Flag size={12} className="text-red-600" />
        <span className="text-xs text-red-600 font-bold uppercase tracking-wide">URGENT</span>
      </div>
    );
  };
  
  // Component to show priority flag indicator with color
  const PriorityFlagIndicator = ({ withdrawalId }: { withdrawalId: string }) => {
    const { flags } = useWithdrawalFlags(withdrawalId);
    const approvedFlag = flags.find(flag => flag.status === 'approved' && flag.isActive);
    
    if (!approvedFlag) return null;
    
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
      <div className="flex items-center space-x-1 mt-1" title={approvedFlag.comment}>
        <Flag size={10} className={getPriorityColor(approvedFlag.priority)} />
        <span className={`text-xs font-bold uppercase tracking-wide ${getPriorityColor(approvedFlag.priority)}`}>
          {approvedFlag.priority}
        </span>
      </div>
    );
  };

  // Load pending flag requests
  useEffect(() => {
    loadPendingFlags();
  }, []);

  const loadPendingFlags = async () => {
    try {
      const flags = await WithdrawalFlagService.getPendingFlagRequests();
      setPendingFlags(flags);
    } catch (error) {
      console.error('Error loading pending flags:', error);
    } finally {
      setFlagsLoading(false);
    }
  };

  const handleApproveFlag = async (flagId: string, withdrawalAmount: number, investorName: string) => {
    const comment = prompt(`APPROVE PRIORITY REQUEST?\n\nWithdrawal: $${withdrawalAmount.toLocaleString()}\nInvestor: ${investorName}\n\nEnter approval comment (optional):`);
    if (comment === null) return; // User cancelled
    
    setProcessingFlag(flagId);
    try {
      await WithdrawalFlagService.approveWithdrawalFlag(flagId, user?.id || '', user?.name || 'Governor', comment || 'Approved for priority processing');
      await loadPendingFlags(); // Refresh the list
    } catch (error) {
      console.error('Error approving flag:', error);
      alert('Failed to approve priority request. Please try again.');
    } finally {
      setProcessingFlag('');
    }
  };

  const handleRejectFlag = async (flagId: string, withdrawalAmount: number, investorName: string) => {
    const comment = prompt(`REJECT PRIORITY REQUEST?\n\nWithdrawal: $${withdrawalAmount.toLocaleString()}\nInvestor: ${investorName}\n\nEnter rejection reason (required):`);
    if (!comment) return;
    
    setProcessingFlag(flagId);
    try {
      await WithdrawalFlagService.rejectWithdrawalFlag(flagId, user?.id || '', user?.name || 'Governor', comment);
      await loadPendingFlags(); // Refresh the list
    } catch (error) {
      console.error('Error rejecting flag:', error);
      alert('Failed to reject priority request. Please try again.');
    } finally {
      setProcessingFlag('');
    }
  };

  const getFlagTypeIcon = (type: string) => {
    switch (type) {
      case 'urgent': return <AlertTriangle size={16} className="text-red-600" />;
      case 'suspicious': return <Eye size={16} className="text-amber-600" />;
      case 'high_amount': return <FileText size={16} className="text-purple-600" />;
      case 'documentation_required': return <FileText size={16} className="text-blue-600" />;
      case 'compliance_review': return <Shield size={16} className="text-indigo-600" />;
      default: return <Flag size={16} className="text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-gray-600 bg-gray-100 border-gray-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const handleStatusUpdate = async (requestId: string, status: string, comment: string) => {
    setIsLoading(prev => ({ ...prev, [requestId]: true }));
    
    try {
      // Update withdrawal request with new status and comment
      await FirestoreService.updateWithdrawalRequest(requestId, status, user?.id || 'GOVERNOR', comment);
      
      // If changing to refund, also credit the investor
      if (status === 'Refunded') {
        const request = withdrawalRequests.find(req => req.id === requestId);
        if (request) {
          const investor = investors.find(inv => inv.id === request.investorId);
          if (investor) {
            const newBalance = investor.currentBalance + request.amount;
            await FirestoreService.updateInvestorBalance(request.investorId, newBalance);
            
            // Add refund transaction
            await FirestoreService.addTransaction({
              investorId: request.investorId,
              type: 'Credit',
              amount: request.amount,
              date: new Date().toISOString().split('T')[0],
              status: 'Completed',
              description: `GOVERNOR REFUND: ${comment || 'Status changed to refunded'}`
            });
          }
        }
      }
      
      setShowStatusModal(false);
      setNewStatus('');
      setStatusComment('');
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setIsLoading(prev => ({ ...prev, [requestId]: false }));
    }
  };

  const handleApprove = async (requestId: string, investorName: string) => {
    if (!confirm(`APPROVE WITHDRAWAL: ${investorName}?\n\nThis action will process the withdrawal immediately.`)) {
      return;
    }

    setIsLoading(prev => ({ ...prev, [requestId]: true }));
    
    try {
      await FirestoreService.updateWithdrawalRequest(requestId, 'Approved', user?.id || 'GOVERNOR', 'Approved by Governor');
    } catch (error) {
      console.error('Error approving withdrawal:', error);
    } finally {
      setIsLoading(prev => ({ ...prev, [requestId]: false }));
    }
  };

  const handleReject = async (requestId: string, investorName: string) => {
    const reason = prompt(`REJECT WITHDRAWAL: ${investorName}\n\nEnter rejection reason:`);
    if (!reason) return;

    setIsLoading(prev => ({ ...prev, [requestId]: true }));
    
    try {
      await FirestoreService.updateWithdrawalRequest(requestId, 'Rejected', user?.id || 'GOVERNOR', reason);
    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
    } finally {
      setIsLoading(prev => ({ ...prev, [requestId]: false }));
    }
  };

  const handleRefund = async (requestId: string, investorName: string, amount: number, investorId: string) => {
    if (!confirm(`REFUND WITHDRAWAL: ${investorName}\n\nAmount: $${amount.toLocaleString()}\n\nThis will credit the amount back to the investor's account.`)) {
      return;
    }

    setIsLoading(prev => ({ ...prev, [requestId]: true }));
    
    try {
      // Get current investor data
      const investor = investors.find(inv => inv.id === investorId);
      if (!investor) throw new Error('Investor not found');

      // Credit amount back to investor
      const newBalance = investor.currentBalance + amount;
      await FirestoreService.updateInvestorBalance(investorId, newBalance);

      // Update withdrawal request status
      await FirestoreService.updateWithdrawalRequest(requestId, 'Refunded', user?.id || 'GOVERNOR', 'Refunded by Governor');

      // Add refund transaction
      await FirestoreService.addTransaction({
        investorId,
        type: 'Credit',
        amount,
        date: new Date().toISOString().split('T')[0],
        status: 'Completed',
        description: `Governor refund for withdrawal ${requestId.slice(-8)}`
      });
    } catch (error) {
      console.error('Error processing refund:', error);
    } finally {
      setIsLoading(prev => ({ ...prev, [requestId]: false }));
    }
  };

  const handleInspect = (request: any) => {
    setSelectedRequest(request);
    setShowInspectModal(true);
  };

  const handleStatusChange = (request: any) => {
    setSelectedRequest(request);
    setNewStatus(request.status);
    setStatusComment('');
    setShowStatusModal(true);
  };

  const getInvestorDetails = (investorId: string) => {
    return investors.find(inv => inv.id === investorId);
  };

  const openResolveModal = (flag: any) => {
    const resolutionNotes = prompt(`RESOLVE FLAG: ${flag.investorName}\n\nEnter resolution notes:`);
    if (resolutionNotes) {
      // Handle flag resolution logic here
      console.log('Resolving flag:', flag.id, 'with notes:', resolutionNotes);
    }
  };
  if (error) {
    return (
      <GovernorLayout title="WITHDRAWAL CONTROL">
        <div className="bg-white border border-gray-300 p-8 text-center">
          <p className="text-red-600 font-bold uppercase tracking-wide">{error}</p>
        </div>
      </GovernorLayout>
    );
  }

  return (
    <GovernorLayout title="WITHDRAWAL CONTROL">
      {/* Control Header */}
      <div className="bg-white border border-gray-300 p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">WITHDRAWAL REQUEST CONTROL</h1>
            <p className="text-gray-600 uppercase tracking-wide text-sm font-medium">COMPLETE OVERSIGHT OF ALL WITHDRAWAL OPERATIONS</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowRawData(!showRawData)}
              className="px-4 py-2 bg-gray-900 text-white font-bold hover:bg-gray-800 transition-colors uppercase tracking-wide border border-gray-700"
            >
              {showRawData ? 'HIDE' : 'SHOW'} RAW DATA
            </button>
          </div>
        </div>
      </div>

      {/* Raw Data View */}
      {showRawData && selectedRequest && (
        <div className="bg-gray-900 text-green-400 p-6 mb-8 border border-gray-700 font-mono text-xs">
          <div className="mb-4">
            <h3 className="text-white font-bold uppercase tracking-wide">RAW WITHDRAWAL DATA - REQUEST {selectedRequest.id.slice(-8)}</h3>
          </div>
          <pre className="whitespace-pre-wrap overflow-x-auto">
{JSON.stringify({
  ...selectedRequest,
  investorData: getInvestorDetails(selectedRequest.investorId),
  bankDetails: getInvestorDetails(selectedRequest.investorId)?.bankDetails,
  systemFlags: {
    governorAccess: true,
    lastModified: new Date().toISOString(),
    accessLevel: 'FULL_CONTROL'
  }
}, null, 2)}
          </pre>
        </div>
      )}

      {/* Pending Priority Requests Section */}
      {pendingFlags.length > 0 && (
        <div className="bg-white border border-gray-300 mb-8">
          <div className="px-6 py-4 border-b border-gray-300 bg-yellow-50">
            <h3 className="text-lg font-bold text-yellow-900 uppercase tracking-wide">
              PENDING PRIORITY REQUESTS ({pendingFlags.length} AWAITING REVIEW)
            </h3>
          </div>
          
          {flagsLoading ? (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-2 border-gray-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-700 font-bold uppercase tracking-wide">LOADING PRIORITY REQUESTS...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-300 bg-gray-100">
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wide">REQUEST</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wide">WITHDRAWAL</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wide">PRIORITY TYPE</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wide">LEVEL</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wide">REASON</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wide">REQUESTED BY</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wide">GOVERNOR DECISION</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingFlags.map((flag) => {
                    // Find the withdrawal request for this flag
                    const withdrawal = withdrawalRequests.find(req => req.id === flag.withdrawalId);
                    
                    return (
                      <tr key={flag.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-bold text-gray-900 uppercase tracking-wide">#{flag.id.slice(-8)}</p>
                            <p className="text-xs text-gray-600 uppercase tracking-wide">
                              REQUESTED: {flag.requestedAt.toLocaleDateString()}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-bold text-gray-900 uppercase tracking-wide">#{flag.withdrawalId.slice(-8)}</p>
                            <p className="text-sm text-gray-700 font-medium">${withdrawal?.amount.toLocaleString() || 'Unknown'}</p>
                            <p className="text-xs text-gray-600 uppercase tracking-wide">{withdrawal?.investorName || 'Unknown Investor'}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            {getFlagTypeIcon(flag.flagType)}
                            <span className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                              {flag.flagType.replace('_', ' ')}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 text-xs font-bold border uppercase tracking-wide ${getPriorityColor(flag.priority)}`}>
                            {flag.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900 max-w-xs">{flag.comment}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-bold text-gray-900 uppercase tracking-wide">{flag.requestedByName}</p>
                            <p className="text-xs text-gray-600 uppercase tracking-wide">{flag.requestedByRole}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col space-y-1">
                            <button
                              onClick={() => handleApproveFlag(flag.id, withdrawal?.amount || 0, withdrawal?.investorName || 'Unknown')}
                              disabled={processingFlag === flag.id}
                              className="px-2 py-1 bg-green-600 text-white text-xs font-bold hover:bg-green-700 transition-colors disabled:opacity-50 uppercase tracking-wide border border-green-700"
                            >
                              {processingFlag === flag.id ? 'APPROVING...' : 'APPROVE PRIORITY'}
                            </button>
                            <button
                              onClick={() => handleRejectFlag(flag.id, withdrawal?.amount || 0, withdrawal?.investorName || 'Unknown')}
                              disabled={processingFlag === flag.id}
                              className="px-2 py-1 bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors disabled:opacity-50 uppercase tracking-wide border border-red-700"
                            >
                              {processingFlag === flag.id ? 'REJECTING...' : 'REJECT REQUEST'}
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
        </div>
      )}

      {/* Withdrawal Requests Table */}
      <div className="bg-white border border-gray-300">
        <div className="px-6 py-4 border-b border-gray-300 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">
            WITHDRAWAL REQUESTS ({withdrawalRequests.length} TOTAL)
          </h3>
        </div>
        
        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-gray-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-700 font-bold uppercase tracking-wide">LOADING WITHDRAWAL DATA...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-300 bg-gray-100">
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wide">REQUEST</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wide">INVESTOR</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 uppercase tracking-wide">AMOUNT</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wide">BANK INFO</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wide">PRIORITY</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wide">STATUS</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wide">GOVERNOR CONTROLS</th>
                </tr>
              </thead>
              <tbody>
                {withdrawalRequests.map((request) => {
                  const investor = getInvestorDetails(request.investorId);
                  const bankInfo = investor?.bankDetails || investor?.bankAccounts?.[0];

                  return (
                    <tr key={request.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-gray-900 uppercase tracking-wide">#{request.id.slice(-8)}</p>
                          <p className="text-xs text-gray-600 uppercase tracking-wide">{request.date}</p>
                          <button
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowRawData(true);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 uppercase tracking-wide border-b border-blue-600"
                          >
                            VIEW RAW DATA
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-gray-900 uppercase tracking-wide">{request.investorName}</p>
                          <p className="text-xs text-gray-600 uppercase tracking-wide">ID: {request.investorId.slice(-8)}</p>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">{investor?.country || 'UNKNOWN'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div>
                          <p className="text-lg font-bold text-gray-900">${request.amount.toLocaleString()}</p>
                          <p className="text-xs text-gray-600 uppercase tracking-wide">
                            NET: ${(request.amount * 0.85).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">
                            FEE: ${(request.amount * 0.15).toLocaleString()}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs">
                          {bankInfo ? (
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <div className="space-y-1">
                              <p className="font-bold text-gray-900 uppercase tracking-wide">{bankInfo.bankName || 'BANK NAME'}</p>
                              <p className="text-gray-600 uppercase tracking-wide">
                                ACC: ***{(bankInfo.accountNumber || '').slice(-4)}
                              </p>
                              <p className="text-gray-600 uppercase tracking-wide">
                                SWIFT: {bankInfo.swiftCode || 'N/A'}
                              </p>
                              <p className="text-gray-500 uppercase tracking-wide">
                                {bankInfo.currency || 'USD'}
                              </p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p className="text-red-600 font-bold uppercase tracking-wide">NO BANK DATA</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <PriorityFlagIndicator withdrawalId={request.id} />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="space-y-1">
                          <div className={`px-3 py-1 text-xs font-bold border uppercase tracking-wide ${
                            request.status === 'Pending' ? 'bg-yellow-50 text-yellow-800 border-yellow-200' :
                            request.status === 'Approved' ? 'bg-green-50 text-green-800 border-green-200' :
                            request.status === 'Credited' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                            request.status === 'Rejected' ? 'bg-red-50 text-red-800 border-red-200' :
                            request.status === 'Refunded' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                            'bg-gray-50 text-gray-800 border-gray-200'
                          }`}>
                            {request.status}
                          </div>
                          {request.processedAt && (
                            <p className="text-xs text-gray-500 uppercase tracking-wide">
                              {new Date(request.processedAt).toLocaleDateString()}
                            </p>
                          )}
                          {request.reason && (
                            <p className="text-xs text-gray-600 uppercase tracking-wide truncate max-w-24">
                              {request.reason}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col space-y-1">
                          {request.status === 'Pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(request.id, request.investorName)}
                                disabled={isLoading[request.id]}
                                className="px-2 py-1 bg-green-600 text-white text-xs font-bold hover:bg-green-700 transition-colors disabled:opacity-50 uppercase tracking-wide border border-green-700"
                              >
                                APPROVE
                              </button>
                              <button
                                onClick={() => handleReject(request.id, request.investorName)}
                                disabled={isLoading[request.id]}
                                className="px-2 py-1 bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors disabled:opacity-50 uppercase tracking-wide border border-red-700"
                              >
                                REJECT
                              </button>
                            </>
                          )}
                          
                          {/* Status Change Button - Available for ALL statuses */}
                          <button
                            onClick={() => handleStatusChange(request)}
                            disabled={isLoading[request.id]}
                            className="px-2 py-1 bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 transition-colors disabled:opacity-50 uppercase tracking-wide border border-gray-700"
                          >
                            CHANGE STATUS
                          </button>
                          
                          {/* Quick Refund for Credited/Approved */}
                          {(request.status === 'Credited' || request.status === 'Approved') && (
                            <button
                              onClick={() => handleRefund(request.id, request.investorName, request.amount, request.investorId)}
                              disabled={isLoading[request.id]}
                              className="px-2 py-1 bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 uppercase tracking-wide border border-blue-700"
                            >
                              REFUND
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleInspect(request)}
                            className="px-2 py-1 bg-gray-700 text-white text-xs font-bold hover:bg-gray-600 transition-colors uppercase tracking-wide border border-gray-600"
                          >
                            <Eye size={12} className="mr-1 inline" />
                            VIEW
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

        {/* Summary */}
        {!loading && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-300">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm">
              <div>
                <p className="text-gray-600 font-bold uppercase tracking-wide">TOTAL REQUESTS</p>
                <p className="font-bold text-gray-900">{withdrawalRequests.length}</p>
              </div>
              <div>
                <p className="text-gray-600 font-bold uppercase tracking-wide">PENDING</p>
                <p className="font-bold text-gray-900">
                  {withdrawalRequests.filter(req => req.status === 'Pending').length}
                </p>
              </div>
              <div>
                <p className="text-gray-600 font-bold uppercase tracking-wide">TOTAL AMOUNT</p>
                <p className="font-bold text-gray-900">
                  ${withdrawalRequests.reduce((sum, req) => sum + req.amount, 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-600 font-bold uppercase tracking-wide">APPROVAL RATE</p>
                <p className="font-bold text-gray-900">
                  {withdrawalRequests.length > 0 ? 
                    ((withdrawalRequests.filter(req => req.status === 'Approved').length / withdrawalRequests.length) * 100).toFixed(1) : 
                    '0.0'
                  }%
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Withdrawal Flag Modal */}
      {selectedFlagWithdrawal && (
        <WithdrawalFlagModal
          isOpen={showFlagModal}
          onClose={() => {
            setShowFlagModal(false);
            setSelectedFlagWithdrawal(null);
          }}
          withdrawalId={selectedFlagWithdrawal.id}
          withdrawalAmount={selectedFlagWithdrawal.amount}
          investorName={selectedFlagWithdrawal.investorName}
          onSuccess={() => {
            setShowFlagModal(false);
            setSelectedFlagWithdrawal(null);
          }}
        />
      )}

      {/* Status Change Modal */}
      {showStatusModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto" onClick={() => setShowStatusModal(false)}>
          <div className="flex min-h-screen items-start justify-center p-4 py-8">
            <div 
              className="relative w-full max-w-2xl bg-white border border-gray-300 shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-gray-300 bg-gray-50 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900 uppercase tracking-wide">
                  STATUS CONTROL - REQUEST #{selectedRequest.id.slice(-8)}
                </h3>
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="p-2 hover:bg-gray-200 transition-colors border border-gray-300"
                >
                  <span className="text-gray-500 text-lg">×</span>
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto">
                <div className="space-y-6">
                  {/* Current Status */}
                  <div className="bg-gray-50 p-4 border border-gray-300">
                    <h4 className="font-bold text-gray-900 mb-3 uppercase tracking-wide">CURRENT STATUS</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 font-bold uppercase tracking-wide">INVESTOR</p>
                        <p className="text-gray-900">{selectedRequest.investorName}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 font-bold uppercase tracking-wide">AMOUNT</p>
                        <p className="text-gray-900">${selectedRequest.amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 font-bold uppercase tracking-wide">CURRENT STATUS</p>
                        <p className="text-gray-900 font-bold">{selectedRequest.status}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 font-bold uppercase tracking-wide">REQUEST DATE</p>
                        <p className="text-gray-900">{selectedRequest.date}</p>
                      </div>
                    </div>
                  </div>

                  {/* New Status Selection */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                      NEW STATUS
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 font-bold uppercase tracking-wide"
                    >
                      <option value="Pending">PENDING</option>
                      <option value="Approved">APPROVED</option>
                      <option value="Credited">CREDITED</option>
                      <option value="Rejected">REJECTED</option>
                      <option value="Refunded">REFUNDED</option>
                      <option value="Processing">PROCESSING</option>
                      <option value="Bank Hold">BANK HOLD</option>
                      <option value="Compliance Review">COMPLIANCE REVIEW</option>
                      <option value="Cancelled">CANCELLED</option>
                    </select>
                  </div>

                  {/* Status Comment */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                      STATUS UPDATE COMMENT
                    </label>
                    <textarea
                      value={statusComment}
                      onChange={(e) => setStatusComment(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 font-medium"
                      rows={4}
                      placeholder="ENTER REASON FOR STATUS CHANGE OR UPDATE MESSAGE..."
                    />
                    <p className="text-xs text-gray-600 mt-2 uppercase tracking-wide">
                      THIS MESSAGE WILL BE VISIBLE TO ADMIN AND INVESTOR
                    </p>
                  </div>

                  {/* Warning for Refund */}
                  {newStatus === 'Refunded' && (
                    <div className="bg-yellow-50 border border-yellow-300 p-4">
                      <p className="text-yellow-800 font-bold uppercase tracking-wide">
                        WARNING: REFUND WILL CREDIT ${selectedRequest.amount.toLocaleString()} BACK TO INVESTOR ACCOUNT
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setShowStatusModal(false)}
                      className="flex-1 px-4 py-3 bg-white border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors uppercase tracking-wide"
                    >
                      CANCEL
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(selectedRequest.id, newStatus, statusComment)}
                      disabled={!statusComment.trim() || isLoading[selectedRequest.id]}
                      className="flex-1 px-4 py-3 bg-gray-900 text-white font-bold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide border border-gray-700"
                    >
                      {isLoading[selectedRequest.id] ? 'UPDATING...' : 'UPDATE STATUS'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inspect Modal */}
      {showInspectModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowInspectModal(false)}>
          <div className="flex min-h-screen items-start justify-center p-4 pt-8">
            <div 
              className="relative w-full max-w-4xl bg-white border border-gray-300 shadow-xl max-h-[85vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-gray-300 bg-gray-50 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900 uppercase tracking-wide">
                  RAW WITHDRAWAL DATA - REQUEST #{selectedRequest.id.slice(-8)}
                </h3>
                <button
                  onClick={() => setShowInspectModal(false)}
                  className="p-2 hover:bg-gray-200 transition-colors border border-gray-300"
                >
                  <span className="text-gray-500 text-lg">×</span>
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1">
                <div className="bg-gray-900 text-green-400 p-6 border border-gray-700 font-mono text-xs">
                  <pre className="whitespace-pre-wrap overflow-x-auto">
{JSON.stringify({
  withdrawalRequest: selectedRequest,
  investorData: getInvestorDetails(selectedRequest.investorId),
  bankDetails: getInvestorDetails(selectedRequest.investorId)?.bankDetails,
  bankAccounts: getInvestorDetails(selectedRequest.investorId)?.bankAccounts,
  systemFlags: {
    governorAccess: true,
    lastModified: new Date().toISOString(),
    accessLevel: 'FULL_CONTROL',
    inspectedBy: user?.name || 'GOVERNOR',
    inspectionTime: new Date().toISOString()
  },
  transferStatus: {
    bankProcessing: selectedRequest.status === 'Approved' ? 'IN_PROGRESS' : 'NOT_STARTED',
    estimatedArrival: selectedRequest.status === 'Approved' ? 
      new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() : 'PENDING_APPROVAL',
    trackingNumber: `TRK${selectedRequest.id.slice(-8)}`,
    wireReference: `WIRE${new Date().getFullYear()}${selectedRequest.id.slice(-6)}`
  }
}, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </GovernorLayout>
  );
};

export default GovernorWithdrawalsPage;