import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Button from '../common/Button';
import Modal from '../common/Modal';
import { GovernorService } from '../../services/governorService';
import { useAuth } from '../../contexts/AuthContext';
import { CryptoWalletVerificationRequest } from '../../types/governor';
import { 
  Wallet, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle,
  XCircle,
  AlertTriangle,
  QrCode,
  Network,
  Coins,
  Search,
  Filter,
  Eye,
  Clock,
  Shield
} from 'lucide-react';

const CryptoWalletVerificationPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<CryptoWalletVerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'add' | 'update' | 'delete'>('all');
  const [selectedRequest, setSelectedRequest] = useState<CryptoWalletVerificationRequest | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [rejectionReason, setRejectionReason] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadPendingRequests();
  }, []);

  const loadPendingRequests = async () => {
    try {
      setLoading(true);
      const pendingRequests = await GovernorService.getPendingCryptoWalletVerificationRequests();
      setRequests(pendingRequests);
    } catch (error) {
      console.error('Error loading crypto wallet verification requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesType = filterType === 'all' || request.requestType === filterType;
    const matchesSearch = request.investorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.newWalletData.walletAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.newWalletData.coinType.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleReviewRequest = (request: CryptoWalletVerificationRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setReviewAction(action);
    setRejectionReason('');
    setReviewComment('');
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedRequest || !user) return;

    if (reviewAction === 'reject' && !rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setIsProcessing(true);
    try {
      if (reviewAction === 'approve') {
        await GovernorService.approveCryptoWalletVerification(
          selectedRequest.id,
          user.id,
          user.name,
          reviewComment.trim() || undefined
        );
      } else {
        await GovernorService.rejectCryptoWalletVerification(
          selectedRequest.id,
          user.id,
          user.name,
          rejectionReason.trim()
        );
      }

      setShowReviewModal(false);
      setSelectedRequest(null);
      await loadPendingRequests(); // Refresh the list
    } catch (error) {
      console.error('Error processing crypto wallet verification:', error);
      alert('Failed to process request. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getRequestTypeIcon = (type: string) => {
    switch (type) {
      case 'add': return <Plus size={16} className="text-green-600" />;
      case 'update': return <Edit3 size={16} className="text-blue-600" />;
      case 'delete': return <Trash2 size={16} className="text-red-600" />;
      default: return <Wallet size={16} className="text-gray-600" />;
    }
  };

  const getRequestTypeColor = (type: string) => {
    switch (type) {
      case 'add': return 'text-green-600 bg-green-100 border-green-200';
      case 'update': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'delete': return 'text-red-600 bg-red-100 border-red-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-300 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">CRYPTO WALLET VERIFICATION</h1>
            <p className="text-gray-600 uppercase tracking-wide text-sm font-medium">REVIEW AND APPROVE CRYPTO WALLET REGISTRATION REQUESTS</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">{requests.length}</div>
            <div className="text-sm text-gray-600 uppercase tracking-wide">PENDING REQUESTS</div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { type: 'add', label: 'NEW WALLETS', count: requests.filter(r => r.requestType === 'add').length, color: 'text-green-600' },
          { type: 'update', label: 'WALLET UPDATES', count: requests.filter(r => r.requestType === 'update').length, color: 'text-blue-600' },
          { type: 'delete', label: 'DELETION REQUESTS', count: requests.filter(r => r.requestType === 'delete').length, color: 'text-red-600' }
        ].map((stat) => (
          <div key={stat.type} className="bg-white border border-gray-300 p-6">
            <div className="border-b border-gray-300 pb-3 mb-4">
              <p className="text-gray-600 font-medium text-sm uppercase tracking-wider">{stat.label}</p>
            </div>
            <div>
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.count}</p>
              <p className="text-gray-500 text-xs mt-1">Awaiting Review</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-300 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter size={16} className="text-gray-500" />
              <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">REQUEST TYPE:</span>
            </div>
            <div className="flex space-x-2">
              {[
                { key: 'all', label: 'ALL' },
                { key: 'add', label: 'NEW WALLETS' },
                { key: 'update', label: 'UPDATES' },
                { key: 'delete', label: 'DELETIONS' }
              ].map(filter => (
                <button
                  key={filter.key}
                  onClick={() => setFilterType(filter.key as any)}
                  className={`px-3 py-2 text-sm font-bold border transition-colors uppercase tracking-wide ${
                    filterType === filter.key
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="SEARCH REQUESTS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 text-sm focus:ring-1 focus:ring-gray-500 focus:border-gray-500 w-80 uppercase tracking-wide font-medium"
            />
          </div>
        </div>
      </div>

      {/* Verification Requests Table */}
      <div className="bg-white border border-gray-300">
        <div className="px-6 py-4 border-b border-gray-300 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">
            CRYPTO WALLET VERIFICATION REQUESTS ({filteredRequests.length} RECORDS)
          </h3>
        </div>
        
        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-gray-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-700 font-bold uppercase tracking-wide">LOADING VERIFICATION REQUESTS...</p>
          </div>
        ) : filteredRequests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-300 bg-gray-100">
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wide">REQUEST</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wide">INVESTOR</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wide">REQUEST TYPE</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wide">WALLET DETAILS</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wide">REQUESTED BY</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wide">GOVERNOR DECISION</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-gray-900 uppercase tracking-wide">#{request.id.slice(-8)}</p>
                        <p className="text-xs text-gray-600 uppercase tracking-wide">
                          REQUESTED: {request.requestedAt.toLocaleDateString()}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-gray-900 uppercase tracking-wide">{request.investorName}</p>
                        <p className="text-xs text-gray-600 uppercase tracking-wide">ID: {request.investorId.slice(-8)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        {getRequestTypeIcon(request.requestType)}
                        <span className={`px-3 py-1 text-xs font-bold border uppercase tracking-wide ${getRequestTypeColor(request.requestType)}`}>
                          {request.requestType.toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Coins size={14} className="text-gray-600" />
                          <span className="font-bold text-gray-900 uppercase tracking-wide">
                            {request.newWalletData.coinType} ({request.newWalletData.networkType})
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 break-all">
                          {request.newWalletData.walletAddress.slice(0, 20)}...{request.newWalletData.walletAddress.slice(-10)}
                        </p>
                        {request.newWalletData.isPrimary && (
                          <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium uppercase tracking-wide">
                            PRIMARY WALLET
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-gray-900 uppercase tracking-wide">{request.requestedByName}</p>
                        <p className="text-xs text-gray-600 uppercase tracking-wide">ADMIN</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-1">
                        <button
                          onClick={() => handleReviewRequest(request, 'approve')}
                          className="px-2 py-1 bg-green-600 text-white text-xs font-bold hover:bg-green-700 transition-colors uppercase tracking-wide border border-green-700"
                        >
                          <CheckCircle size={12} className="mr-1 inline" />
                          APPROVE
                        </button>
                        <button
                          onClick={() => handleReviewRequest(request, 'reject')}
                          className="px-2 py-1 bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors uppercase tracking-wide border border-red-700"
                        >
                          <XCircle size={12} className="mr-1 inline" />
                          REJECT
                        </button>
                        <button
                          onClick={() => {
                            // Navigate to investor profile for more details
                            navigate(`/governor/investor/${request.investorId}`);
                          }}
                          className="px-2 py-1 bg-gray-700 text-white text-xs font-bold hover:bg-gray-600 transition-colors uppercase tracking-wide border border-gray-600"
                        >
                          <Eye size={12} className="mr-1 inline" />
                          VIEW INVESTOR
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 border border-gray-300 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Wallet size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2 uppercase tracking-wide">NO PENDING REQUESTS</h3>
            <p className="text-gray-500 uppercase tracking-wide text-sm">All crypto wallet verification requests have been reviewed</p>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedRequest && (
        <Modal
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedRequest(null);
            setRejectionReason('');
            setReviewComment('');
          }}
          title={`${reviewAction.toUpperCase()} CRYPTO WALLET REQUEST`}
          size="lg"
        >
          <div className="space-y-6">
            {/* Request Information */}
            <div className="bg-gray-50 p-6 border border-gray-300">
              <h4 className="font-bold text-gray-900 mb-4 uppercase tracking-wide">REQUEST DETAILS</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 font-bold uppercase tracking-wide">INVESTOR</p>
                  <p className="text-gray-900 font-medium">{selectedRequest.investorName}</p>
                </div>
                <div>
                  <p className="text-gray-600 font-bold uppercase tracking-wide">REQUEST TYPE</p>
                  <div className="flex items-center space-x-2">
                    {getRequestTypeIcon(selectedRequest.requestType)}
                    <span className="text-gray-900 font-medium uppercase tracking-wide">
                      {selectedRequest.requestType.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-gray-600 font-bold uppercase tracking-wide">REQUESTED BY</p>
                  <p className="text-gray-900 font-medium">{selectedRequest.requestedByName}</p>
                </div>
                <div>
                  <p className="text-gray-600 font-bold uppercase tracking-wide">REQUEST DATE</p>
                  <p className="text-gray-900 font-medium">{selectedRequest.requestedAt.toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Wallet Details */}
            <div className="bg-white border border-gray-300">
              <div className="px-6 py-4 border-b border-gray-300 bg-gray-50">
                <h4 className="font-bold text-gray-900 uppercase tracking-wide">WALLET INFORMATION</h4>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-600 font-bold uppercase tracking-wide mb-1">WALLET ADDRESS</p>
                    <p className="text-gray-900 font-mono text-sm break-all bg-gray-50 p-3 border border-gray-200 rounded">
                      {selectedRequest.newWalletData.walletAddress}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-600 font-bold uppercase tracking-wide mb-1">NETWORK TYPE</p>
                      <div className="flex items-center space-x-2">
                        <Network size={16} className="text-gray-600" />
                        <p className="text-gray-900 font-medium">{selectedRequest.newWalletData.networkType}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-600 font-bold uppercase tracking-wide mb-1">COIN TYPE</p>
                      <div className="flex items-center space-x-2">
                        <Coins size={16} className="text-gray-600" />
                        <p className="text-gray-900 font-medium">{selectedRequest.newWalletData.coinType}</p>
                      </div>
                    </div>
                  </div>

                  {selectedRequest.newWalletData.isPrimary && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-blue-800 font-medium uppercase tracking-wide">
                        <Shield size={14} className="mr-1 inline" />
                        THIS WALLET WILL BE SET AS PRIMARY
                      </p>
                    </div>
                  )}

                  {selectedRequest.newWalletData.qrCodeData && (
                    <div>
                      <p className="text-gray-600 font-bold uppercase tracking-wide mb-2">QR CODE</p>
                      <div className="flex items-center space-x-4">
                        <img
                          src={selectedRequest.newWalletData.qrCodeData}
                          alt="Wallet QR Code"
                          className="w-24 h-24 border border-gray-300 rounded-lg object-cover"
                        />
                        <button
                          onClick={() => window.open(selectedRequest.newWalletData.qrCodeData, '_blank')}
                          className="px-3 py-2 bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors uppercase tracking-wide border border-blue-700"
                        >
                          <QrCode size={14} className="mr-1 inline" />
                          VIEW FULL SIZE
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Review Form */}
            <div className="bg-white border border-gray-300">
              <div className="px-6 py-4 border-b border-gray-300 bg-gray-50">
                <h4 className="font-bold text-gray-900 uppercase tracking-wide">
                  {reviewAction.toUpperCase()} WALLET REQUEST
                </h4>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {reviewAction === 'approve' ? (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                        APPROVAL COMMENT (OPTIONAL)
                      </label>
                      <textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 font-medium"
                        rows={3}
                        placeholder="ADD ANY NOTES OR CONDITIONS FOR THIS APPROVAL..."
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                        REJECTION REASON <span className="text-red-600">*</span>
                      </label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 font-medium"
                        rows={4}
                        placeholder="PROVIDE DETAILED REASON FOR REJECTING THIS WALLET REQUEST..."
                        required
                      />
                    </div>
                  )}

                  {/* Warning for deletion requests */}
                  {selectedRequest.requestType === 'delete' && reviewAction === 'approve' && (
                    <div className="bg-red-50 border border-red-300 p-4">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle size={20} className="text-red-600 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-red-800 uppercase tracking-wide">DELETION WARNING</h4>
                          <p className="text-red-700 text-sm mt-1 uppercase tracking-wide">
                            Approving this request will permanently remove the crypto wallet from the investor's account. 
                            This action cannot be undone.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-4">
                    <button
                      onClick={() => {
                        setShowReviewModal(false);
                        setSelectedRequest(null);
                        setRejectionReason('');
                        setReviewComment('');
                      }}
                      className="flex-1 px-4 py-3 bg-white border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors uppercase tracking-wide"
                    >
                      CANCEL
                    </button>
                    <button
                      onClick={handleSubmitReview}
                      disabled={isProcessing || (reviewAction === 'reject' && !rejectionReason.trim())}
                      className={`flex-1 px-4 py-3 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide border ${
                        reviewAction === 'approve'
                          ? 'bg-green-600 text-white border-green-700 hover:bg-green-700'
                          : 'bg-red-600 text-white border-red-700 hover:bg-red-700'
                      }`}
                    >
                      {isProcessing ? (
                        <div className="flex items-center justify-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          PROCESSING...
                        </div>
                      ) : (
                        `${reviewAction.toUpperCase()} REQUEST`
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CryptoWalletVerificationPanel;