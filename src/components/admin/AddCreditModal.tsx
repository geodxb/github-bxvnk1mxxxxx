import { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { FirestoreService } from '../../services/firestoreService';
import { useAuth } from '../../contexts/AuthContext';
import { 
  DollarSign, 
  AlertCircle, 
  CheckCircle,
  Plus,
  Edit,
  Banknote,
  Calendar // Import Calendar icon
} from 'lucide-react';

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
  const [creditReason, setCreditReason] = useState('');
  const [creditCategory, setCreditCategory] = useState<'Credit' | 'Earnings'>('Credit'); // New state for category
  const [startDate, setStartDate] = useState(''); // New state for start date
  const [endDate, setEndDate] = useState(''); // New state for end date
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const validateForm = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount');
      return false;
    }
    
    if (!creditReason.trim()) {
      setError('Please enter a reason for the credit.');
      return false;
    }

    if (creditCategory === 'Earnings' && (!startDate || !endDate)) {
      setError('Please provide both start and end dates for earnings.');
      return false;
    }
    
    setError('');
    return true;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !user) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log(`📊 Adding ${creditCategory} AUM Impact: +$${parseFloat(amount).toLocaleString()} to ${investorName}`);
      
      await FirestoreService.addCreditToInvestor(
        investorId,
        parseFloat(amount),
        user.id,
        creditCategory, // Pass the category
        creditReason.trim(),
        creditCategory === 'Earnings' ? startDate : undefined, // Pass dates conditionally
        creditCategory === 'Earnings' ? endDate : undefined
      );
      
      setIsLoading(false);
      setIsSuccess(true);
      
      // Call onSuccess immediately, then close the modal after a brief delay
      if (onSuccess) {
        onSuccess();
      }
      setTimeout(() => {
        handleClose();
      }, 500); // Small delay to allow Firebase to propagate changes and parent to update
    } catch (error) {
      console.error('Error adding credit:', error);
      setError('Failed to add credit. Please try again.');
      setIsLoading(false);
    }
  };
  
  const handleClose = () => {
    setAmount('');
    setCreditReason('');
    setCreditCategory('Credit'); // Reset category
    setStartDate(''); // Reset dates
    setEndDate(''); // Reset dates
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
            <div className="relative mb-4">
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

            {/* New: Credit Category Selection */}
            <label htmlFor="creditCategory" className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
              CATEGORY *
            </label>
            <select
              id="creditCategory"
              value={creditCategory}
              onChange={(e) => setCreditCategory(e.target.value as 'Credit' | 'Earnings')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-colors font-medium mb-4"
              required
            >
              <option value="Credit">Credit</option>
              <option value="Earnings">Earnings</option>
            </select>

            {/* New: Date Range for Earnings */}
            {creditCategory === 'Earnings' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                    <Calendar size={16} className="inline mr-1" />
                    START DATE *
                  </label>
                  <input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                    <Calendar size={16} className="inline mr-1" />
                    END DATE *
                  </label>
                  <input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
                    required
                  />
                </div>
              </div>
            )}

            <label htmlFor="creditReason" className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
              REASON FOR {creditCategory.toUpperCase()} *
            </label>
            <textarea
              id="creditReason"
              value={creditReason}
              onChange={(e) => setCreditReason(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-colors font-medium"
              placeholder={`e.g., ${creditCategory === 'Earnings' ? 'Earnings from trading activity' : 'Bonus, Refund, etc.'}`}
              rows={3}
              required
            />

            {error && (
              <p className="mt-2 text-sm text-red-600 font-medium uppercase tracking-wide bg-red-50 p-2 rounded border border-red-300">{error}</p>
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
                `ADD ${creditCategory.toUpperCase()}`
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="text-center py-8 bg-gray-50 border border-gray-300 rounded-lg">
          <div className="w-20 h-20 bg-gray-200 border border-gray-400 rounded-lg flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-gray-700" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wide">{creditCategory.toUpperCase()} ADDED SUCCESSFULLY</h3>
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
