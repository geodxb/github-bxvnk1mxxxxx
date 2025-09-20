import { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { FirestoreService } from '../../services/firestoreService';
import { useAuth } from '../../contexts/AuthContext';

interface AddCreditModalProps {
  isOpen: boolean;
  onClose: () => void;
  investorId: string;
  investorName: string;
  currentBalance: number;
  onSuccess?: () => void;
}

const AddCreditModal = ({ 
  isOpen, 
  onClose, 
  investorId,
  investorName, 
  currentBalance,
  onSuccess 
}: AddCreditModalProps) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const validateAmount = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount');
      return false;
    }
    
    setError('');
    return true;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateAmount() || !user) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log(`📊 Adding credit AUM Impact: +$${parseFloat(amount).toLocaleString()} to ${investorName}`);
      
      await FirestoreService.addCreditToInvestor(
        investorId,
        parseFloat(amount),
        user.id
      );
      
      setIsLoading(false);
      setIsSuccess(true);
      
      // Note: Real-time listeners will automatically update the UI
      // onSuccess callback is kept for any additional logic needed
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
      }, 1000); // Small delay to allow Firebase to propagate changes
    } catch (error) {
      console.error('Error adding credit:', error);
      setError('Failed to add credit. Please try again.');
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
      title="ADD CREDIT"
    >
      {!isSuccess ? (
        <form onSubmit={handleSubmit}>
          <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-300">
            <p className="text-gray-700 mb-4 font-medium uppercase tracking-wide">
              ADDING CREDIT TO: <span className="font-bold">{investorName}</span>
            </p>
            <p className="text-gray-700 mb-4 font-medium uppercase tracking-wide">
              CURRENT BALANCE: <span className="font-bold">${currentBalance.toLocaleString()}</span>
            </p>
            
            <label htmlFor="amount" className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
              CREDIT AMOUNT
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
                required
              />
            </div>
            {error && (
              <p className="mt-2 text-sm text-gray-700 font-medium uppercase tracking-wide bg-gray-100 p-2 rounded border border-gray-300">{error}</p>
            )}
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
                  ADDING CREDIT...
                </div>
              ) : (
                'ADD CREDIT'
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="text-center py-8 bg-gray-50 border border-gray-300 rounded-lg">
          <div className="w-20 h-20 bg-gray-200 border border-gray-400 rounded-lg flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-gray-700" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wide">CREDIT ADDED SUCCESSFULLY</h3>
          <p className="text-gray-700 mb-6 font-medium uppercase tracking-wide">
            ${parseFloat(amount).toLocaleString()} HAS BEEN ADDED TO {investorName.toUpperCase()}'S ACCOUNT.
          </p>
          <button
            onClick={handleClose}
            className="px-6 py-3 bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors rounded-lg uppercase tracking-wide"
          >
            CLOSE
          </button>
        </div>
      )}
    </Modal>
  );
};

export default AddCreditModal;