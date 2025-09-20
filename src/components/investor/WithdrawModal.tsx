// src/components/investor/WithdrawModal.tsx
import { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import WithdrawalRestrictionCheck from './WithdrawalRestrictionCheck';
import { FirestoreService } from '../../services/firestoreService';
import { useAuth } from '../../contexts/AuthContext';
import { Ban, CheckCircle } from 'lucide-react';
import ProWithdrawalMethods from './ProWithdrawalMethods'; // Import the ProWithdrawalMethods component
import { Investor } from '../../types/user'; // Import Investor type

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
  onSuccess?: () => void;
  investor?: Investor; // Make investor prop optional for backward compatibility
}

const WithdrawModal = ({ isOpen, onClose, currentBalance, onSuccess, investor }: WithdrawModalProps) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Determine the actual investor context: if passed as prop, use it; otherwise, use the logged-in user
  const currentInvestorContext = investor || user;

  // Add these console.log statements for debugging
  console.log('WithdrawModal opened. currentInvestorContext:', currentInvestorContext);
  console.log('Account Type being evaluated:', currentInvestorContext?.accountType);
  console.log('Is accountType === "Pro"?', currentInvestorContext?.accountType === 'Pro');

  const validateAmount = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return 'Please enter a valid amount';
    }
    
    if (numAmount > currentBalance) {
      return 'Withdrawal amount cannot exceed your current balance';
    }
    
    if (numAmount < 100) {
      return 'Minimum withdrawal amount is $100';
    }
    return '';
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateAmount() || !currentInvestorContext) {
      return;
    }
    
    // This handleSubmit will now only be for standard (non-Pro) accounts
    await processStandardWithdrawal(parseFloat(amount));
  };

  const processStandardWithdrawal = async (withdrawalAmount: number) => {
    setIsLoading(true);
    
    try {
      await FirestoreService.addWithdrawalRequest(
        currentInvestorContext.id,
        currentInvestorContext.name,
        withdrawalAmount
      );
      
      setIsLoading(false);
      setIsSuccess(true);
      
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
      }, 1000);
    } catch (error) {
      console.error('Error submitting withdrawal request:', error);
      setError('Failed to submit withdrawal request. Please try again.');
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setAmount('');
    setError('');
    setIsSuccess(false);
    onClose();
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="REQUEST WITHDRAWAL"
    >
      <WithdrawalRestrictionCheck
        fallback={
          <div className="text-center py-8 bg-gray-50 border border-gray-300 rounded-lg">
            <div className="w-20 h-20 bg-gray-200 border border-gray-400 rounded-lg flex items-center justify-center mx-auto mb-6">
              <Ban size={40} className="text-gray-700" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wide">WITHDRAWAL ACCESS RESTRICTED</h3>
            <p className="text-gray-700 mb-6 font-medium uppercase tracking-wide">
              Your withdrawal functionality has been temporarily disabled. Please contact support for assistance.
            </p>
            <button
              onClick={handleClose}
              className="px-6 py-3 bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors rounded-lg uppercase tracking-wide"
            >
              CLOSE
            </button>
          </div>
        }
      >
        {currentInvestorContext?.accountType === 'Pro' ? (
          <>
            {/* DEBUG: PRO PATH ACTIVE */}
            <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '10px', marginBottom: '10px', border: '1px solid #c3e6cb', borderRadius: '5px', fontWeight: 'bold', textAlign: 'center' }}>
              DEBUG: PRO PATH ACTIVE (Account Type: {currentInvestorContext?.accountType})
            </div>
            <ProWithdrawalMethods
              investor={currentInvestorContext} // Pass the investor context
              currentBalance={currentBalance}
              onSuccess={onSuccess}
              onCancel={onClose} // Use onClose as onCancel for the Pro methods modal
            />
          </>
        ) : (
          <>
            {/* DEBUG: STANDARD PATH ACTIVE */}
            <div style={{ backgroundColor: '#f8d7da', color: '#721c24', padding: '10px', marginBottom: '10px', border: '1px solid #f5c6cb', borderRadius: '5px', fontWeight: 'bold', textAlign: 'center' }}>
              DEBUG: STANDARD PATH ACTIVE (Account Type: {currentInvestorContext?.accountType || 'N/A'})
            </div>
            {/* Existing standard withdrawal form for non-Pro accounts */}
            {!isSuccess ? (
              <form onSubmit={handleSubmit}>
                <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-300">
                  <p className="text-gray-700 mb-4 font-medium uppercase tracking-wide">
                    AVAILABLE BALANCE: <span className="font-bold">${currentBalance.toLocaleString()}</span>
                  </p>
                  
                  <label htmlFor="amount" className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                    WITHDRAWAL AMOUNT
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-700">$</span>
                    </div>
                    <input
                      id="amount"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-8 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-colors font-medium"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      max={currentBalance}
                      required
                    />
                  </div>
                  {error && (
                    <p className="mt-2 text-sm text-gray-700 font-medium uppercase tracking-wide bg-gray-100 p-2 rounded border border-gray-300">{error}</p>
                  )}
                </div>
                
                <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 mb-6">
                  <p className="text-gray-700 text-sm font-medium uppercase tracking-wide">
                    <strong>NOTE:</strong> WITHDRAWAL REQUESTS ARE TYPICALLY PROCESSED WITHIN 1-3 BUSINESS DAYS.
                  </p>
                </div>
                
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 px-4 py-3 bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors rounded-lg uppercase tracking-wide"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 px-4 py-3 bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        <span>REQUESTING WITHDRAWAL...</span> {/* Corrected line */}
                      </div>
                    ) : (
                      'REQUEST WITHDRAWAL'
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-8 bg-gray-50 border border-gray-300 rounded-lg">
                <div className="w-20 h-20 bg-gray-200 border border-gray-400 rounded-lg flex items-center justify-center mx-auto mb-6">
                  <CheckCircle size={40} className="text-gray-700" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wide">WITHDRAWAL REQUEST SUBMITTED</h3>
                <p className="text-gray-700 mb-6 font-medium uppercase tracking-wide">
                  YOUR WITHDRAWAL REQUEST FOR ${parseFloat(amount).toLocaleString()} HAS BEEN SUCCESSFULLY SUBMITTED.
                </p>
                <button
                  onClick={handleClose}
                  className="px-6 py-3 bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors rounded-lg uppercase tracking-wide"
                >
                  CLOSE
                </button>
              </div>
            )
          }
          </>
        )}
      </WithdrawalRestrictionCheck>
    </Modal>
  );
};

export default WithdrawModal;
