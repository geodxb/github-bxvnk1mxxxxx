import { useState } from 'react';
import { motion } from 'framer-motion';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { FirestoreService } from '../../services/firestoreService';
import { useAuth } from '../../contexts/AuthContext';
import { 
  DollarSign, 
  Building, 
  CreditCard, 
  AlertCircle, 
  CheckCircle,
  Plus,
  Edit,
  Banknote
} from 'lucide-react';

interface CommissionWithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalCommissions: number;
  onSuccess?: () => void;
}

const CommissionWithdrawalModal = ({ 
  isOpen, 
  onClose, 
  totalCommissions,
  onSuccess 
}: CommissionWithdrawalModalProps) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('primary');
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Primary ADCB account details
  const primaryAccount = {
    id: 'primary',
    bankName: 'ADCB (Abu Dhabi Commercial Bank)',
    accountNumber: '13*********0001',
    iban: 'AE68003001*********0001',
    accountHolder: 'Cristian Rolando Dorao',
    currency: 'AED',
    isVerified: true
  };

  const validateAmount = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount');
      return false;
    }
    
    if (numAmount > totalCommissions) {
      setError('Withdrawal amount cannot exceed available commission balance');
      return false;
    }
    
    if (numAmount < 100) {
      setError('Minimum withdrawal amount is $100');
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
      // Create commission withdrawal request
      await FirestoreService.addCommissionWithdrawalRequest({
        adminId: user.id,
        adminName: user.name,
        amount: parseFloat(amount),
        accountDetails: selectedAccount === 'primary' ? primaryAccount : null,
        requestDate: new Date().toISOString().split('T')[0],
        status: 'Pending'
      });
      
      setIsLoading(false);
      setIsSuccess(true);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error submitting commission withdrawal request:', error);
      setError('Failed to submit withdrawal request. Please try again.');
      setIsLoading(false);
    }
  };
  
  const handleClose = () => {
    setAmount('');
    setError('');
    setIsSuccess(false);
    setSelectedAccount('primary');
    setShowAddAccount(false);
    onClose();
  };

  const quickAmounts = [1000, 5000, 10000, 25000, 50000];
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="WITHDRAW COMMISSION EARNINGS"
      size="lg"
    >
      {!isSuccess ? (
        <div className="space-y-6">
          {/* Commission Summary */}
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-300">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-900 font-bold text-lg mb-2 uppercase tracking-wide">AVAILABLE COMMISSION BALANCE</h3>
                <p className="text-gray-900 text-3xl font-bold mb-2">
                  ${totalCommissions.toLocaleString()}
                </p>
                <p className="text-gray-700 text-sm font-medium uppercase tracking-wide">
                  TOTAL EARNED FROM 15% COMMISSION ON INVESTOR WITHDRAWALS
                </p>
              </div>
              <div className="w-16 h-16 bg-gray-200 border border-gray-400 rounded-lg flex items-center justify-center">
                <DollarSign className="text-gray-700" size={32} />
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Withdrawal Amount */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                WITHDRAWAL AMOUNT (USD)
              </label>
              <div className="relative mb-3">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-700">$</span>
                </div>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 text-lg font-medium"
                  placeholder="0.00"
                  step="0.01"
                  min="100"
                  max={totalCommissions}
                  required
                />
              </div>
              
              {/* Quick Amount Buttons */}
              <div className="flex flex-wrap gap-2">
                {quickAmounts.filter(amount => amount <= totalCommissions).map((quickAmount) => (
                  <button
                    key={quickAmount}
                    type="button"
                    onClick={() => setAmount(quickAmount.toString())}
                    className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors border border-gray-300 font-medium uppercase tracking-wide"
                  >
                    ${quickAmount.toLocaleString()}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setAmount(totalCommissions.toString())}
                  className="px-3 py-2 text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors border border-gray-400 font-medium uppercase tracking-wide"
                >
                  MAX: ${totalCommissions.toLocaleString()}
                </button>
              </div>
              
              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
            </div>

            {/* Bank Account Selection */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                WITHDRAWAL DESTINATION
              </label>
              
              {/* Primary ADCB Account */}
              <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                selectedAccount === 'primary' 
                  ? 'border-gray-900 bg-gray-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="account"
                    value="primary"
                    checked={selectedAccount === 'primary'}
                    onChange={(e) => setSelectedAccount(e.target.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Building size={20} className="text-gray-700" />
                      <span className="font-bold text-gray-900 uppercase tracking-wide">PRIMARY ACCOUNT</span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded font-medium uppercase tracking-wide">
                        VERIFIED
                      </span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p className="font-bold text-gray-900">{primaryAccount.bankName}</p>
                      <p className="text-gray-700 font-medium">ACCOUNT: {primaryAccount.accountNumber}</p>
                      <p className="text-gray-700 font-medium">IBAN: {primaryAccount.iban}</p>
                      <p className="text-gray-700 font-medium">HOLDER: {primaryAccount.accountHolder}</p>
                    </div>
                  </div>
                </label>
              </div>

              {/* Add New Account Option */}
              <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all mt-3 ${
                selectedAccount === 'new' 
                  ? 'border-gray-900 bg-gray-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="account"
                    value="new"
                    checked={selectedAccount === 'new'}
                    onChange={(e) => setSelectedAccount(e.target.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Plus size={20} className="text-gray-700" />
                      <span className="font-bold text-gray-900 uppercase tracking-wide">ADD NEW BANK ACCOUNT</span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded font-medium uppercase tracking-wide">
                        REQUIRES APPROVAL
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 font-medium uppercase tracking-wide">
                      SUBMIT A REQUEST TO ADD A NEW PAYOUT METHOD. THIS REQUIRES VERIFICATION AND APPROVAL.
                    </p>
                  </div>
                </label>
              </div>

              {selectedAccount === 'new' && (
                <div className="mt-4 p-4 bg-gray-50 border border-gray-300 rounded-lg">
                  <div className="flex items-start space-x-4">
                    <AlertCircle size={20} className="text-gray-700 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2 uppercase tracking-wide">BANK ACCOUNT CHANGE REQUEST</h4>
                      <p className="text-gray-700 text-sm mb-3 font-medium uppercase tracking-wide">
                        TO ADD A NEW BANK ACCOUNT FOR COMMISSION WITHDRAWALS, YOU'LL NEED TO SUBMIT A REQUEST 
                        WITH THE FOLLOWING INFORMATION:
                      </p>
                      <ul className="text-gray-700 text-sm space-y-1 list-disc list-inside font-medium">
                        <li className="uppercase tracking-wide">BANK NAME AND BRANCH DETAILS</li>
                        <li className="uppercase tracking-wide">ACCOUNT NUMBER AND IBAN</li>
                        <li className="uppercase tracking-wide">ACCOUNT HOLDER VERIFICATION DOCUMENTS</li>
                        <li className="uppercase tracking-wide">REASON FOR ACCOUNT CHANGE</li>
                      </ul>
                      <p className="text-gray-700 text-sm mt-3 font-medium uppercase tracking-wide">
                        THIS PROCESS TYPICALLY TAKES 3-5 BUSINESS DAYS FOR VERIFICATION.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Processing Information */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-bold text-gray-900 mb-3 flex items-center uppercase tracking-wide">
                <CreditCard size={18} className="mr-2" />
                PROCESSING INFORMATION
              </h4>
              <div className="text-sm text-gray-700 space-y-1 font-medium">
                <p className="uppercase tracking-wide">• COMMISSION WITHDRAWALS ARE PROCESSED WITHIN 1-3 BUSINESS DAYS</p>
                <p className="uppercase tracking-wide">• MINIMUM WITHDRAWAL AMOUNT: $100</p>
                <p className="uppercase tracking-wide">• NO PROCESSING FEES FOR PRIMARY ACCOUNT WITHDRAWALS</p>
                <p className="uppercase tracking-wide">• FUNDS WILL BE CONVERTED TO AED AT CURRENT EXCHANGE RATE</p>
              </div>
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
                disabled={isLoading || selectedAccount === 'new'}
                className="flex-1 px-4 py-3 bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    PROCESSING...
                  </div>
                ) : selectedAccount === 'new' ? 'SUBMIT ACCOUNT REQUEST' : 'REQUEST WITHDRAWAL'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 border border-gray-300 rounded-lg">
          <div className="w-20 h-20 bg-gray-200 border border-gray-400 rounded-lg flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-gray-700" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4 uppercase tracking-wide">WITHDRAWAL REQUEST SUBMITTED</h3>
          <p className="text-gray-700 mb-6 text-lg font-medium uppercase tracking-wide">
            YOUR COMMISSION WITHDRAWAL REQUEST FOR ${parseFloat(amount).toLocaleString()} HAS BEEN SUCCESSFULLY SUBMITTED.
          </p>
          
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-300 mb-6">
            <h4 className="font-bold text-gray-900 mb-4 uppercase tracking-wide">REQUEST DETAILS</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600 font-medium uppercase tracking-wide">AMOUNT</p>
                <p className="font-bold text-gray-900">${parseFloat(amount).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-600 font-medium uppercase tracking-wide">DESTINATION</p>
                <p className="font-bold text-gray-900">ADCB ACCOUNT</p>
              </div>
              <div>
                <p className="text-gray-600 font-medium uppercase tracking-wide">PROCESSING TIME</p>
                <p className="font-bold text-gray-900">1-3 BUSINESS DAYS</p>
              </div>
              <div>
                <p className="text-gray-600 font-medium uppercase tracking-wide">STATUS</p>
                <p className="font-bold text-gray-900">PENDING REVIEW</p>
              </div>
            </div>
          </div>
          
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

export default CommissionWithdrawalModal;