import { useState } from 'react';
import { motion } from 'framer-motion';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { FirestoreService } from '../../services/firestoreService';
import { AccountClosureService } from '../../services/accountClosureService';
import { useAuth } from '../../contexts/AuthContext';
import { Investor } from '../../types/user';
import { 
  AlertTriangle, 
  CheckCircle, 
  DollarSign, 
  Calendar,
  Shield,
  XCircle,
  FileText,
  User
} from 'lucide-react';

interface DeleteInvestorModalProps {
  isOpen: boolean;
  onClose: () => void;
  investor: Investor;
  onSuccess?: () => void;
}

const DeleteInvestorModal = ({ 
  isOpen, 
  onClose, 
  investor,
  onSuccess 
}: DeleteInvestorModalProps) => {
  const { user } = useAuth();
  const [confirmationText, setConfirmationText] = useState('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const requiredText = `DELETE ${investor.name.toUpperCase()}`;
  const isConfirmationValid = confirmationText === requiredText && reason.trim().length > 0;
  
  const handleDelete = async () => {
    if (!isConfirmationValid || !user) {
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Create account closure request
      await AccountClosureService.createClosureRequest(
        investor.id, 
        investor.name,
        reason.trim(), 
        user.id,
        investor.currentBalance
      );
      
      setIsSuccess(true);
      
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 3000);
      }
    } catch (error) {
      console.error('Error deleting investor:', error);
      setError('Failed to process deletion request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleClose = () => {
    if (!isLoading) {
      setConfirmationText('');
      setReason('');
      setError('');
      setIsSuccess(false);
      onClose();
    }
  };
  
  if (isSuccess) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="ACCOUNT CLOSURE SUBMITTED"
        size="lg"
      >
        <div className="text-center py-8">
          <div className="w-20 h-20 bg-gray-100 border border-gray-300 rounded-lg flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-gray-700" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4 uppercase tracking-wide">
            ACCOUNT CLOSURE REQUEST SUBMITTED
          </h3>
          <p className="text-gray-700 mb-6 text-lg uppercase tracking-wide">
            The account closure request has been submitted for review. The account cannot be operated during this period.
          </p>
          
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-300 mb-6">
            <h4 className="font-bold text-gray-900 mb-4 uppercase tracking-wide">CLOSURE REQUEST SUMMARY</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600 uppercase tracking-wide font-medium">INVESTOR NAME</p>
                <p className="font-bold text-gray-900">{investor.name}</p>
              </div>
              <div>
                <p className="text-gray-600 uppercase tracking-wide font-medium">ACCOUNT BALANCE</p>
                <p className="font-bold text-gray-900">${investor.currentBalance.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-600 uppercase tracking-wide font-medium">STATUS</p>
                <p className="font-bold text-gray-900">UNDER REVIEW</p>
              </div>
              <div>
                <p className="text-gray-600 uppercase tracking-wide font-medium">RESTRICTION PERIOD</p>
                <p className="font-bold text-gray-900">90 DAYS AFTER APPROVAL</p>
              </div>
            </div>
          </div>
          
          {investor.currentBalance > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-300 mb-6">
              <div className="flex items-start space-x-3">
                <DollarSign size={20} className="text-gray-700 mt-0.5" />
                <div className="text-left">
                  <h4 className="font-bold text-gray-900 uppercase tracking-wide">FUND TRANSFER PROCESS</h4>
                  <p className="text-gray-700 text-sm mt-1 uppercase tracking-wide">
                    The remaining balance of ${investor.currentBalance.toLocaleString()} will be transferred 
                    to the registered bank account within 60-90 days after closure completion.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <button
            onClick={handleClose}
            className="px-6 py-3 bg-gray-900 text-white font-bold hover:bg-gray-800 transition-colors rounded-lg uppercase tracking-wide"
          >
            CLOSE
          </button>
        </div>
      </Modal>
    );
  }
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="ACCOUNT CLOSURE REQUEST"
      size="lg"
    >
      <div className="space-y-6">
        {/* Industrial Warning Header */}
        <div className="bg-gray-50 border border-gray-300 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <div className="w-12 h-12 bg-gray-200 border border-gray-400 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={24} className="text-gray-700" />
            </div>
            <div>
              <h3 className="text-gray-900 font-bold text-lg uppercase tracking-wide">ACCOUNT CLOSURE REQUEST</h3>
              <p className="text-gray-700 text-sm mt-2 uppercase tracking-wide">
                This will initiate the account closure process. Once approved, the account cannot be operated and will be permanently closed after 90 days.
              </p>
            </div>
          </div>
        </div>

        {/* Industrial Investor Information */}
        <div className="bg-white border border-gray-300 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h4 className="font-bold text-gray-900 uppercase tracking-wide">ACCOUNT TO BE CLOSED</h4>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div>
                <p className="text-gray-600 font-medium uppercase tracking-wide mb-1">NAME</p>
                <p className="font-bold text-gray-900">{investor.name}</p>
              </div>
              <div>
                <p className="text-gray-600 font-medium uppercase tracking-wide mb-1">EMAIL</p>
                <p className="font-bold text-gray-900">{investor.email || 'N/A'}</p>
                <p className="font-bold text-gray-900">{investor.country}</p>
              </div>
              <div>
                <p className="text-gray-600 font-medium uppercase tracking-wide mb-1">CURRENT BALANCE</p>
                <p className="font-bold text-gray-900">${investor.currentBalance.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Industrial Balance Warning */}
        {investor.currentBalance > 0 && (
          <div className="bg-white border border-gray-300 rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-2">
                <DollarSign size={20} className="text-gray-700" />
                <h4 className="font-bold text-gray-900 uppercase tracking-wide">FUND TRANSFER REQUIRED</h4>
              </div>
            </div>
            <div className="p-6">
              <div className="bg-gray-50 p-4 border border-gray-200 rounded-lg">
                <p className="text-gray-800 text-sm font-medium uppercase tracking-wide mb-3">
                  This account has a balance of ${investor.currentBalance.toLocaleString()}. 
                  Funds will be transferred to the registered bank account.
                </p>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-gray-600 uppercase tracking-wide">TRANSFER METHOD</p>
                    <p className="font-bold text-gray-900">Bank Transfer</p>
                  </div>
                  <div>
                    <p className="text-gray-600 uppercase tracking-wide">PROCESSING TIME</p>
                    <p className="font-bold text-gray-900">60-90 Days Maximum</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Industrial Consequences Section */}
        <div className="bg-white border border-gray-300 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h4 className="font-bold text-gray-900 uppercase tracking-wide">CLOSURE CONSEQUENCES</h4>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="w-8 h-8 bg-gray-200 border border-gray-300 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText size={16} className="text-gray-700" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 uppercase tracking-wide text-sm">ACCOUNT REVIEW</p>
                  <p className="text-gray-700 text-sm uppercase tracking-wide">Account will be reviewed for closure approval</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="w-8 h-8 bg-gray-200 border border-gray-300 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar size={16} className="text-gray-700" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 uppercase tracking-wide text-sm">90-DAY COUNTDOWN</p>
                  <p className="text-gray-700 text-sm uppercase tracking-wide">If approved, 90-day countdown period will begin</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="w-8 h-8 bg-gray-200 border border-gray-300 rounded-lg flex items-center justify-center flex-shrink-0">
                  <XCircle size={16} className="text-gray-700" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 uppercase tracking-wide text-sm">PERMANENT CLOSURE</p>
                  <p className="text-gray-700 text-sm uppercase tracking-wide">Account will be permanently closed after countdown</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="w-8 h-8 bg-gray-200 border border-gray-300 rounded-lg flex items-center justify-center flex-shrink-0">
                  <DollarSign size={16} className="text-gray-700" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 uppercase tracking-wide text-sm">FUND TRANSFER</p>
                  <p className="text-gray-700 text-sm uppercase tracking-wide">Funds will be transferred to registered bank account</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Industrial Confirmation Input */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
            TYPE <span className="font-mono bg-gray-200 px-3 py-1 rounded border border-gray-300">{requiredText}</span> TO CONFIRM CLOSURE REQUEST
          </label>
          <input
            type="text"
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-mono font-bold"
            placeholder={`Type "${requiredText}" here`}
            disabled={isLoading}
          />
        </div>

        {/* Industrial Deletion Reason */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
            CLOSURE REASON <span className="text-red-600">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
            rows={4}
            placeholder="PROVIDE DETAILED EXPLANATION FOR ACCOUNT CLOSURE REQUEST (E.G., POLICY VIOLATIONS, FRAUDULENT ACTIVITY, INVESTOR REQUEST, ETC.)"
            disabled={isLoading}
            required
          />
          <p className="text-xs text-gray-600 mt-2 uppercase tracking-wide font-medium">
            THIS REASON WILL BE RECORDED FOR COMPLIANCE AND AUDIT PURPOSES AND CANNOT BE CHANGED ONCE SUBMITTED.
          </p>
        </div>

        {error && (
          <div className="bg-gray-50 border border-gray-300 text-gray-800 px-6 py-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle size={16} className="text-gray-700" />
              <span className="font-medium uppercase tracking-wide">{error}</span>
            </div>
          </div>
        )}

        {/* Industrial Action Buttons */}
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1 px-6 py-3 bg-white border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors rounded-lg uppercase tracking-wide"
          >
            CANCEL
          </button>
          <button
            onClick={handleDelete}
            disabled={!isConfirmationValid || !reason.trim() || isLoading}
            className="flex-1 px-6 py-3 bg-gray-900 text-white font-bold hover:bg-gray-800 transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                SUBMITTING REQUEST...
              </div>
            ) : (
              'SUBMIT CLOSURE REQUEST'
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteInvestorModal;