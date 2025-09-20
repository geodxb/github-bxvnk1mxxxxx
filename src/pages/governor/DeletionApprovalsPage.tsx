import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import GovernorLayout from '../../components/layout/GovernorLayout';
import { AccountClosureService } from '../../services/accountClosureService';
import { useInvestors } from '../../hooks/useFirestore';
import { collection, query, orderBy, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const GovernorDeletionApprovalsPage = () => {
  const { user } = useAuth();
  const { investors } = useInvestors();
  const [deletionRequests, setDeletionRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingRequest, setProcessingRequest] = useState<string>('');

  // Load deletion requests
  useEffect(() => {
    loadDeletionRequests();
  }, []);

  const loadDeletionRequests = async () => {
    try {
      setIsLoading(true);
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
      setDeletionRequests(requests);
    } catch (error) {
      console.error('Error loading deletion requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveRequest = async (requestId: string, investorName: string) => {
    if (!user) return;
    
    if (!confirm(`APPROVE DELETION REQUEST: ${investorName}?\n\nThis will start the 90-day countdown for permanent account closure.`)) {
      return;
    }

    setProcessingRequest(requestId);
    try {
      await AccountClosureService.approveClosureRequest(requestId, user.id);
      await loadDeletionRequests(); // Refresh the list
    } catch (error) {
      console.error('Error approving deletion request:', error);
      alert('Failed to approve deletion request. Please try again.');
    } finally {
      setProcessingRequest('');
    }
  };

  const handleRejectRequest = async (requestId: string, investorName: string) => {
    if (!user) return;
    
    const reason = prompt(`REJECT DELETION REQUEST: ${investorName}\n\nEnter rejection reason:`);
    if (!reason) return;

    setProcessingRequest(requestId);
    try {
      await AccountClosureService.rejectClosureRequest(requestId, user.id, reason);
      await loadDeletionRequests(); // Refresh the list
    } catch (error) {
      console.error('Error rejecting deletion request:', error);
      alert('Failed to reject deletion request. Please try again.');
    } finally {
      setProcessingRequest('');
    }
  };

  const handleCompleteRequest = async (requestId: string, investorName: string) => {
    if (!user) return;
    
    if (!confirm(`COMPLETE DELETION: ${investorName}?\n\nThis will permanently close the account and transfer funds.`)) {
      return;
    }

    setProcessingRequest(requestId);
    try {
      await AccountClosureService.completeClosureRequest(requestId);
      await loadDeletionRequests(); // Refresh the list
    } catch (error) {
      console.error('Error completing deletion request:', error);
      alert('Failed to complete deletion request. Please try again.');
    } finally {
      setProcessingRequest('');
    }
  };

  const pendingRequests = deletionRequests.filter(req => req.status === 'Pending');
  const approvedRequests = deletionRequests.filter(req => req.status === 'Approved');
  const completedRequests = deletionRequests.filter(req => req.status === 'Completed');
  const rejectedRequests = deletionRequests.filter(req => req.status === 'Rejected');

  return (
    <GovernorLayout title="DELETION APPROVALS">
      {/* Header */}
      <div className="bg-white border border-gray-300 p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img 
              src="/Screenshot 2025-06-07 024813.png" 
              alt="Interactive Brokers" 
              className="h-10 w-auto object-contain"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">ACCOUNT DELETION APPROVALS</h1>
              <p className="text-gray-600 uppercase tracking-wide text-sm font-medium">SUPREME CONTROL OVER ACCOUNT CLOSURE REQUESTS</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">{pendingRequests.length}</div>
            <div className="text-sm text-gray-600 uppercase tracking-wide">PENDING APPROVALS</div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white border border-gray-300 p-6">
          <div className="border-b border-gray-300 pb-3 mb-4">
            <p className="text-gray-600 font-medium text-sm uppercase tracking-wider">PENDING REQUESTS</p>
          </div>
          <div>
            <p className="text-gray-900 text-3xl font-bold">{pendingRequests.length}</p>
            <p className="text-gray-500 text-xs mt-1">Awaiting Governor Approval</p>
          </div>
        </div>

        <div className="bg-white border border-gray-300 p-6 bg-red-50 border-red-200">
          <div className="border-b border-red-300 pb-3 mb-4">
            <p className="text-red-600 font-medium text-sm uppercase tracking-wider">APPROVED DELETIONS</p>
          </div>
          <div>
            <p className="text-red-900 text-3xl font-bold">{approvedRequests.length}</p>
            <p className="text-red-600 text-xs mt-1">90-Day Countdown Active</p>
          </div>
        </div>

        <div className="bg-white border border-gray-300 p-6">
          <div className="border-b border-gray-300 pb-3 mb-4">
            <p className="text-gray-600 font-medium text-sm uppercase tracking-wider">COMPLETED</p>
          </div>
          <div>
            <p className="text-gray-900 text-3xl font-bold">{completedRequests.length}</p>
            <p className="text-gray-500 text-xs mt-1">Permanently Closed</p>
          </div>
        </div>

        <div className="bg-white border border-gray-300 p-6">
          <div className="border-b border-gray-300 pb-3 mb-4">
            <p className="text-gray-600 font-medium text-sm uppercase tracking-wider">REJECTED</p>
          </div>
          <div>
            <p className="text-gray-900 text-3xl font-bold">{rejectedRequests.length}</p>
            <p className="text-gray-500 text-xs mt-1">Requests Denied</p>
          </div>
        </div>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="bg-white border border-gray-300 mb-8">
          <div className="px-6 py-4 border-b border-gray-300 bg-yellow-50">
            <h3 className="text-lg font-bold text-yellow-900 uppercase tracking-wide">
              PENDING DELETION REQUESTS ({pendingRequests.length} AWAITING APPROVAL)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-300 bg-gray-100">
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wide">REQUEST</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wide">INVESTOR</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 uppercase tracking-wide">BALANCE</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wide">REASON</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wide">GOVERNOR DECISION</th>
                </tr>
              </thead>
              <tbody>
                {pendingRequests.map((request) => (
                  <tr key={request.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-gray-900 uppercase tracking-wide">#{request.id.slice(-8)}</p>
                        <p className="text-xs text-gray-600 uppercase tracking-wide">{request.requestDate}</p>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">
                          REQUESTED BY: {request.requestedBy}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-gray-900 uppercase tracking-wide">{request.investorName}</p>
                        <p className="text-xs text-gray-600 uppercase tracking-wide">ID: {request.investorId.slice(-8)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div>
                        <p className="text-lg font-bold text-gray-900">${request.accountBalance?.toLocaleString() || '0'}</p>
                        <p className="text-xs text-gray-600 uppercase tracking-wide">USD</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900 max-w-xs">{request.reason}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApproveRequest(request.id, request.investorName)}
                          disabled={processingRequest === request.id}
                          className="px-3 py-2 bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50 uppercase tracking-wide border border-red-700"
                        >
                          {processingRequest === request.id ? 'APPROVING...' : 'APPROVE DELETION'}
                        </button>
                        <button
                          onClick={() => handleRejectRequest(request.id, request.investorName)}
                          disabled={processingRequest === request.id}
                          className="px-3 py-2 bg-green-600 text-white text-sm font-bold hover:bg-green-700 transition-colors disabled:opacity-50 uppercase tracking-wide border border-green-700"
                        >
                          {processingRequest === request.id ? 'REJECTING...' : 'REJECT REQUEST'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Approved Requests (90-Day Countdown) */}
      {approvedRequests.length > 0 && (
        <div className="bg-white border border-gray-300 mb-8">
          <div className="px-6 py-4 border-b border-gray-300 bg-red-50">
            <h3 className="text-lg font-bold text-red-900 uppercase tracking-wide">
              APPROVED DELETIONS - 90 DAY COUNTDOWN ({approvedRequests.length} ACTIVE)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-300 bg-gray-100">
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wide">REQUEST</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wide">INVESTOR</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 uppercase tracking-wide">BALANCE</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wide">DAYS REMAINING</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wide">COMPLETION DATE</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wide">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {approvedRequests.map((request) => {
                  const daysRemaining = request.approvalDate ? 
                    AccountClosureService.calculateDaysRemaining(request.approvalDate) : 0;
                  const isOverdue = request.approvalDate ? 
                    AccountClosureService.isClosureOverdue(request.approvalDate) : false;

                  return (
                    <tr key={request.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-gray-900 uppercase tracking-wide">#{request.id.slice(-8)}</p>
                          <p className="text-xs text-gray-600 uppercase tracking-wide">
                            APPROVED: {request.approvalDate?.toLocaleDateString()}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-gray-900 uppercase tracking-wide">{request.investorName}</p>
                          <p className="text-xs text-gray-600 uppercase tracking-wide">ID: {request.investorId.slice(-8)}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div>
                          <p className="text-lg font-bold text-gray-900">${request.accountBalance?.toLocaleString() || '0'}</p>
                          <p className="text-xs text-gray-600 uppercase tracking-wide">TO BE TRANSFERRED</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div>
                          <p className={`text-2xl font-bold ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                            {isOverdue ? 'OVERDUE' : daysRemaining}
                          </p>
                          <p className="text-xs text-gray-600 uppercase tracking-wide">
                            {isOverdue ? 'READY FOR COMPLETION' : 'DAYS LEFT'}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <p className="text-sm font-bold text-gray-900">
                          {request.approvalDate ? 
                            new Date(new Date(request.approvalDate).getTime() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString() :
                            'N/A'
                          }
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col space-y-2">
                          {isOverdue && (
                            <button
                              onClick={() => handleCompleteRequest(request.id, request.investorName)}
                              disabled={processingRequest === request.id}
                              className="px-3 py-2 bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition-colors disabled:opacity-50 uppercase tracking-wide border border-gray-700"
                            >
                              {processingRequest === request.id ? 'COMPLETING...' : 'COMPLETE DELETION'}
                            </button>
                          )}
                          <button
                            onClick={() => {
                              const investor = investors.find(inv => inv.id === request.investorId);
                              if (investor) {
                                window.open(`/governor/investor/${investor.id}`, '_blank');
                              }
                            }}
                            className="px-3 py-2 bg-gray-700 text-white text-sm font-bold hover:bg-gray-600 transition-colors uppercase tracking-wide border border-gray-600"
                          >
                            VIEW ACCOUNT
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* All Requests History */}
      <div className="bg-white border border-gray-300">
        <div className="px-6 py-4 border-b border-gray-300 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">
            ALL DELETION REQUESTS ({deletionRequests.length} TOTAL)
          </h3>
        </div>
        
        {isLoading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-gray-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-700 font-bold uppercase tracking-wide">LOADING DELETION REQUESTS...</p>
          </div>
        ) : deletionRequests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-300 bg-gray-100">
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wide">REQUEST</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wide">INVESTOR</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 uppercase tracking-wide">BALANCE</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wide">STATUS</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wide">STAGE</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wide">REASON</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wide">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {deletionRequests.map((request) => (
                  <tr key={request.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-gray-900 uppercase tracking-wide">#{request.id.slice(-8)}</p>
                        <p className="text-xs text-gray-600 uppercase tracking-wide">{request.requestDate}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-gray-900 uppercase tracking-wide">{request.investorName}</p>
                        <p className="text-xs text-gray-600 uppercase tracking-wide">ID: {request.investorId.slice(-8)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div>
                        <p className="text-lg font-bold text-gray-900">${request.accountBalance?.toLocaleString() || '0'}</p>
                        <p className="text-xs text-gray-600 uppercase tracking-wide">USD</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 text-xs font-bold border uppercase tracking-wide ${
                        request.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                        request.status === 'Approved' ? 'bg-red-100 text-red-800 border-red-200' :
                        request.status === 'Completed' ? 'bg-gray-100 text-gray-800 border-gray-200' :
                        'bg-green-100 text-green-800 border-green-200'
                      }`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                        {request.stage}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900 max-w-xs truncate">{request.reason}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-1">
                        {request.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => handleApproveRequest(request.id, request.investorName)}
                              disabled={processingRequest === request.id}
                              className="px-2 py-1 bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors disabled:opacity-50 uppercase tracking-wide border border-red-700"
                            >
                              APPROVE
                            </button>
                            <button
                              onClick={() => handleRejectRequest(request.id, request.investorName)}
                              disabled={processingRequest === request.id}
                              className="px-2 py-1 bg-green-600 text-white text-xs font-bold hover:bg-green-700 transition-colors disabled:opacity-50 uppercase tracking-wide border border-green-700"
                            >
                              REJECT
                            </button>
                          </>
                        )}
                        {request.status === 'Approved' && request.approvalDate && 
                         AccountClosureService.isClosureOverdue(request.approvalDate) && (
                          <button
                            onClick={() => handleCompleteRequest(request.id, request.investorName)}
                            disabled={processingRequest === request.id}
                            className="px-2 py-1 bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 transition-colors disabled:opacity-50 uppercase tracking-wide border border-gray-700"
                          >
                            COMPLETE
                          </button>
                        )}
                        <button
                          onClick={() => {
                            const investor = investors.find(inv => inv.id === request.investorId);
                            if (investor) {
                              window.open(`/governor/investor/${investor.id}`, '_blank');
                            }
                          }}
                          className="px-2 py-1 bg-gray-700 text-white text-xs font-bold hover:bg-gray-600 transition-colors uppercase tracking-wide border border-gray-600"
                        >
                          INSPECT
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-lg font-bold text-gray-900 mb-2 uppercase tracking-wide">NO DELETION REQUESTS</h3>
            <p className="text-gray-500 uppercase tracking-wide text-sm">No account deletion requests have been submitted</p>
          </div>
        )}
      </div>
    </GovernorLayout>
  );
};

export default GovernorDeletionApprovalsPage;