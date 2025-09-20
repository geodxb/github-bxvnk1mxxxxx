import { useState } from 'react';
import { motion } from 'framer-motion';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { FirestoreService } from '../../services/firestoreService';
import { useAuth } from '../../contexts/AuthContext';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  DollarSign,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Eye,
  Download,
  Calendar,
  Shield
} from 'lucide-react';

interface InvestorReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  investor: any;
  onSuccess?: () => void;
}

const InvestorReviewModal = ({ isOpen, onClose, investor, onSuccess }: InvestorReviewModalProps) => {
  const { user } = useAuth();
  const [decision, setDecision] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!investor) return null;

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) {
      return <FileText size={16} className="text-red-600" />;
    } else if (fileType.includes('image')) {
      return <FileText size={16} className="text-blue-600" />;
    }
    return <FileText size={16} className="text-gray-600" />;
  };

  const handleSubmit = async () => {
    if (!decision || !user) {
      setError('Please select a decision');
      return;
    }

    if (decision === 'reject' && !rejectionReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const updatedData = {
        accountStatus: decision === 'approve' ? 'Active' : 'Rejected',
        reviewedBy: user.id,
        reviewedAt: new Date(),
        rejectionReason: decision === 'reject' ? rejectionReason : null,
        updatedAt: new Date()
      };

      await FirestoreService.updateInvestor(investor.id, updatedData);

      console.log(`🏛️ Governor ${decision === 'approve' ? 'approved' : 'rejected'} investor: ${investor.name}`);
      
      setIsSuccess(true);
      
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (error) {
      console.error('Error updating investor status:', error);
      setError('Failed to update investor status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setDecision(null);
    setRejectionReason('');
    setError('');
    setIsSuccess(false);
    onClose();
  };

  if (isSuccess) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="REVIEW COMPLETED">
        <div className="text-center py-8">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
            decision === 'approve' ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {decision === 'approve' ? (
              <CheckCircle size={40} className="text-green-600" />
            ) : (
              <XCircle size={40} className="text-red-600" />
            )}
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wide">
            INVESTOR {decision === 'approve' ? 'APPROVED' : 'REJECTED'}
          </h3>
          <p className="text-gray-700 mb-6 font-medium uppercase tracking-wide">
            {investor.name}'s account has been {decision === 'approve' ? 'approved and activated' : 'rejected'}.
          </p>
          <button
            onClick={handleClose}
            className="px-6 py-3 bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors rounded-lg uppercase tracking-wide"
          >
            CLOSE
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="INVESTOR REVIEW" size="xl">
      <div className="space-y-6">
        {/* Investor Information */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h4 className="font-medium text-gray-800 mb-4 uppercase tracking-wide flex items-center">
            <User size={16} className="mr-2" />
            INVESTOR INFORMATION
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 uppercase tracking-wide">
                FULL NAME
              </label>
              <p className="text-gray-900 font-medium">{investor.name}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 uppercase tracking-wide">
                EMAIL ADDRESS
              </label>
              <p className="text-gray-900 font-medium">{investor.email || 'Not provided'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 uppercase tracking-wide">
                PHONE NUMBER
              </label>
              <p className="text-gray-900 font-medium">{investor.phone || 'Not provided'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 uppercase tracking-wide">
                COUNTRY
              </label>
              <p className="text-gray-900 font-medium">{investor.country}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 uppercase tracking-wide">
                LOCATION
              </label>
              <p className="text-gray-900 font-medium">{investor.location || 'Not provided'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 uppercase tracking-wide">
                ACCOUNT TYPE
              </label>
              <p className="text-gray-900 font-medium">{investor.accountType}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 uppercase tracking-wide">
                JOIN DATE
              </label>
              <p className="text-gray-900 font-medium flex items-center">
                <Calendar size={14} className="mr-1" />
                {investor.joinDate}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 uppercase tracking-wide">
                CURRENT STATUS
              </label>
              <p className={`font-medium flex items-center ${
                investor.accountStatus === 'Active' ? 'text-green-600' : 
                investor.accountStatus === 'Rejected' ? 'text-red-600' : 'text-yellow-600'
              }`}>
                <Shield size={14} className="mr-1" />
                {investor.accountStatus}
              </p>
            </div>
          </div>
        </div>

        {/* Financial Information */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h4 className="font-medium text-gray-800 mb-4 uppercase tracking-wide flex items-center">
            <DollarSign size={16} className="mr-2" />
            FINANCIAL INFORMATION
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 uppercase tracking-wide">
                INITIAL DEPOSIT
              </label>
              <p className="text-gray-900 font-medium text-lg">
                ${investor.initialDeposit?.toLocaleString() || '0'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 uppercase tracking-wide">
                CURRENT BALANCE
              </label>
              <p className="text-gray-900 font-medium text-lg">
                ${investor.currentBalance?.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </div>

        {/* Uploaded Documents */}
        {investor.uploadedDocuments && investor.uploadedDocuments.length > 0 && (
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-800 mb-4 uppercase tracking-wide flex items-center">
              <FileText size={16} className="mr-2" />
              VERIFICATION DOCUMENTS ({investor.uploadedDocuments.length})
            </h4>
            <div className="space-y-3">
              {investor.uploadedDocuments.map((doc: any) => (
                <div key={doc.id} className="flex items-center justify-between bg-white p-4 rounded border border-gray-300">
                  <div className="flex items-center space-x-3">
                    {getFileIcon(doc.type)}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                      <p className="text-xs text-gray-500">
                        {(doc.size / 1024 / 1024).toFixed(2)} MB • 
                        Uploaded: {new Date(doc.uploadedAt.seconds * 1000).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => window.open(doc.url, '_blank')}
                      className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors flex items-center space-x-1 uppercase tracking-wide"
                    >
                      <Eye size={12} />
                      <span>VIEW</span>
                    </button>
                    <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = doc.url;
                        link.download = doc.name;
                        link.click();
                      }}
                      className="px-3 py-1 bg-gray-600 text-white text-xs font-medium rounded hover:bg-gray-700 transition-colors flex items-center space-x-1 uppercase tracking-wide"
                    >
                      <Download size={12} />
                      <span>DOWNLOAD</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <Shield size={16} className="text-blue-600 mt-0.5" />
                <div>
                  <h5 className="font-medium text-blue-800 uppercase tracking-wide">DOCUMENT VERIFICATION</h5>
                  <p className="text-blue-700 text-sm mt-1 uppercase tracking-wide">
                    Please review all uploaded documents carefully. Verify identity documents, 
                    proof of deposit, and any other submitted verification materials before making your decision.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Decision Section */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h4 className="font-medium text-gray-800 mb-4 uppercase tracking-wide">
            GOVERNOR DECISION
          </h4>
          
          <div className="space-y-4">
            <div className="flex space-x-4">
              <button
                onClick={() => setDecision('approve')}
                className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                  decision === 'approve'
                    ? 'border-green-500 bg-green-50 text-green-800'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-green-300'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle size={20} />
                  <span className="font-medium uppercase tracking-wide">APPROVE INVESTOR</span>
                </div>
              </button>

              <button
                onClick={() => setDecision('reject')}
                className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                  decision === 'reject'
                    ? 'border-red-500 bg-red-50 text-red-800'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-red-300'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <XCircle size={20} />
                  <span className="font-medium uppercase tracking-wide">REJECT INVESTOR</span>
                </div>
              </button>
            </div>

            {decision === 'reject' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                  REJECTION REASON *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
                  rows={3}
                  placeholder="Please provide a detailed reason for rejection..."
                  required
                />
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle size={16} />
              <span className="font-medium uppercase tracking-wide">{error}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors rounded-lg uppercase tracking-wide"
          >
            CANCEL
          </button>
          <button
            onClick={handleSubmit}
            disabled={!decision || isLoading}
            className="flex-1 px-4 py-3 bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                PROCESSING...
              </div>
            ) : (
              `${decision === 'approve' ? 'APPROVE' : 'REJECT'} INVESTOR`
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default InvestorReviewModal;