import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Card from '../common/Card';
import Button from '../common/Button';
import Modal from '../common/Modal';
import { FirestoreService } from '../../services/firestoreService';
import { useAuth } from '../../contexts/AuthContext';
import { Investor, CryptoWallet } from '../../types/user';
import { 
  DollarSign, 
  Building, 
  Wallet, 
  AlertTriangle, 
  CheckCircle,
  CreditCard,
  Coins,
  Network,
  QrCode,
  Eye,
  ArrowRight
} from 'lucide-react';

interface WithdrawalRequestFormProps {
  investor: Investor;
  onSuccess?: () => void;
}

const WithdrawalRequestForm = ({ investor, onSuccess }: WithdrawalRequestFormProps) => {
  const { user } = useAuth();
  const [withdrawalType, setWithdrawalType] = useState<'bank' | 'crypto'>('bank');
  const [amount, setAmount] = useState('');
  const [selectedCryptoWallet, setSelectedCryptoWallet] = useState<CryptoWallet | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Get approved crypto wallets for Pro accounts
  const approvedCryptoWallets = investor.cryptoWallets?.filter(
    wallet => wallet.verificationStatus === 'approved'
  ) || [];

  const validateAmount = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount');
      return false;
    }
    
    if (numAmount > investor.currentBalance) {
      setError('Withdrawal amount cannot exceed current balance');
      return false;
    }
    
    if (numAmount < 100) {
      setError('Minimum withdrawal amount is $100');
      return false;
    }
    
    setError('');
    return true;
  };

  const handleSubmit = async () => {
    if (!validateAmount() || !user) return;

    // Additional validation for crypto withdrawals
    if (withdrawalType === 'crypto') {
      if (investor.accountType !== 'Pro') {
        setError('Cryptocurrency withdrawals are only available for Pro accounts');
        return;
      }
      if (!selectedCryptoWallet) {
        setError('Please select a crypto wallet for withdrawal');
        return;
      }
    }

    setShowConfirmModal(true);
  };

  const handleConfirmWithdrawal = async () => {
    setIsLoading(true);
    setError('');

    try {
      if (withdrawalType === 'crypto' && selectedCryptoWallet) {
        // Create crypto withdrawal request
        await FirestoreService.addCryptoWithdrawalRequest(
          investor.id,
          investor.name,
          parseFloat(amount),
          selectedCryptoWallet
        );
      } else {
        // Create bank withdrawal request
        await FirestoreService.addWithdrawalRequest(
          investor.id,
          investor.name,
          parseFloat(amount)
        );
      }

      setIsSuccess(true);
      setAmount('');
      setSelectedCryptoWallet(null);
      setShowConfirmModal(false);

      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (error) {
      console.error('Error submitting withdrawal request:', error);
      setError('Failed to submit withdrawal request. Please try again.');
      setShowConfirmModal(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setAmount('');
    setError('');
    setIsSuccess(false);
    setSelectedCryptoWallet(null);
    setWithdrawalType('bank');
    setShowConfirmModal(false);
  };

  if (isSuccess) {
    return (
      <Card title="WITHDRAWAL REQUEST SUBMITTED">
        <div className="text-center py-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wide">
            WITHDRAWAL REQUEST SUBMITTED
          </h3>
          <p className="text-gray-700 mb-6 font-medium uppercase tracking-wide">
            Your {withdrawalType} withdrawal request for ${parseFloat(amount).toLocaleString()} has been submitted for review.
          </p>
          <button
            onClick={handleClose}
            className="px-6 py-3 bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors rounded-lg uppercase tracking-wide"
          >
            CLOSE
          </button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card title="SUBMIT WITHDRAWAL REQUEST">
        <div className="space-y-6">
          {/* Account Balance Display */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-900 font-bold text-lg mb-1 uppercase tracking-wide">AVAILABLE BALANCE</h3>
                <p className="text-gray-900 text-2xl font-bold">
                  ${investor.currentBalance.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-gray-200 border border-gray-400 rounded-lg flex items-center justify-center">
                <DollarSign className="text-gray-700" size={24} />
              </div>
            </div>
          </div>

          {/* Withdrawal Type Selection */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
              WITHDRAWAL METHOD
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Bank Transfer Option */}
              <button
                onClick={() => setWithdrawalType('bank')}
                className={`p-4 border-2 rounded-lg transition-all text-left ${
                  withdrawalType === 'bank'
                    ? 'border-gray-900 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <Building size={20} className="text-gray-600" />
                  <span className="font-bold text-gray-900 uppercase tracking-wide">BANK TRANSFER</span>
                </div>
                <p className="text-sm text-gray-600 uppercase tracking-wide">
                  Transfer to registered bank account
                </p>
              </button>

              {/* Crypto Transfer Option - Pro Only */}
              <button
                onClick={() => {
                  if (investor.accountType === 'Pro') {
                    setWithdrawalType('crypto');
                  }
                }}
                disabled={investor.accountType !== 'Pro'}
                className={`p-4 border-2 rounded-lg transition-all text-left ${
                  withdrawalType === 'crypto'
                    ? 'border-gray-900 bg-gray-50'
                    : investor.accountType !== 'Pro'
                    ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <Wallet size={20} className="text-gray-600" />
                  <span className="font-bold text-gray-900 uppercase tracking-wide">CRYPTOCURRENCY</span>
                  {investor.accountType !== 'Pro' && (
                    <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full font-medium uppercase tracking-wide">
                      PRO ONLY
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 uppercase tracking-wide">
                  {investor.accountType === 'Pro' 
                    ? 'Transfer to registered crypto wallet'
                    : 'Upgrade to Pro account to access crypto withdrawals'
                  }
                </p>
              </button>
            </div>
          </div>

          {/* Crypto Wallet Selection - Only for Pro accounts */}
          {withdrawalType === 'crypto' && investor.accountType === 'Pro' && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                SELECT CRYPTO WALLET
              </label>
              {approvedCryptoWallets.length > 0 ? (
                <div className="space-y-3">
                  {approvedCryptoWallets.map((wallet) => (
                    <button
                      key={wallet.id}
                      onClick={() => setSelectedCryptoWallet(wallet)}
                      className={`w-full p-4 border-2 rounded-lg transition-all text-left ${
                        selectedCryptoWallet?.id === wallet.id
                          ? 'border-gray-900 bg-gray-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Coins size={20} className="text-gray-600" />
                          <div>
                            <p className="font-bold text-gray-900 uppercase tracking-wide">
                              {wallet.coinType} ({wallet.networkType})
                            </p>
                            <p className="text-sm text-gray-600 break-all">
                              {wallet.walletAddress.slice(0, 20)}...{wallet.walletAddress.slice(-10)}
                            </p>
                          </div>
                        </div>
                        {wallet.isPrimary && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium uppercase tracking-wide">
                            PRIMARY
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle size={20} className="text-amber-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-800 uppercase tracking-wide">NO APPROVED CRYPTO WALLETS</h4>
                      <p className="text-amber-700 text-sm mt-1 uppercase tracking-wide">
                        You need to register and verify at least one crypto wallet before making crypto withdrawals.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
              WITHDRAWAL AMOUNT (USD)
            </label>
            <div className="relative">
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
                max={investor.currentBalance}
                required
              />
            </div>
            <p className="text-xs text-gray-600 mt-1 uppercase tracking-wide">
              Minimum: $100 • Maximum: ${investor.currentBalance.toLocaleString()}
            </p>
          </div>

          {/* Commission Information */}
          {amount && parseFloat(amount) > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2 uppercase tracking-wide">WITHDRAWAL BREAKDOWN</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-blue-700 font-medium uppercase tracking-wide">REQUESTED AMOUNT</p>
                  <p className="font-bold text-blue-900">${parseFloat(amount).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-blue-700 font-medium uppercase tracking-wide">PLATFORM FEE (15%)</p>
                  <p className="font-bold text-blue-900">${(parseFloat(amount) * 0.15).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-blue-700 font-medium uppercase tracking-wide">NET AMOUNT</p>
                  <p className="font-bold text-blue-900">${(parseFloat(amount) * 0.85).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-blue-700 font-medium uppercase tracking-wide">PROCESSING TIME</p>
                  <p className="font-bold text-blue-900">1-3 BUSINESS DAYS</p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertTriangle size={16} />
                <span className="font-medium uppercase tracking-wide">{error}</span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={!amount || parseFloat(amount) <= 0 || (withdrawalType === 'crypto' && !selectedCryptoWallet)}
              className="px-6 py-3 bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide"
            >
              <ArrowRight size={16} className="mr-2 inline" />
              REQUEST WITHDRAWAL
            </button>
          </div>
        </div>
      </Card>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="CONFIRM WITHDRAWAL REQUEST"
        size="md"
      >
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-800 mb-3 uppercase tracking-wide">WITHDRAWAL DETAILS</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium uppercase tracking-wide">INVESTOR</span>
                <span className="font-bold text-gray-900">{investor.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium uppercase tracking-wide">WITHDRAWAL TYPE</span>
                <span className="font-bold text-gray-900">{withdrawalType.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium uppercase tracking-wide">REQUESTED AMOUNT</span>
                <span className="font-bold text-gray-900">${parseFloat(amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium uppercase tracking-wide">PLATFORM FEE</span>
                <span className="font-bold text-gray-900">${(parseFloat(amount) * 0.15).toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t border-gray-300 pt-2">
                <span className="text-gray-700 font-bold uppercase tracking-wide">NET AMOUNT</span>
                <span className="font-bold text-gray-900">${(parseFloat(amount) * 0.85).toLocaleString()}</span>
              </div>
              {withdrawalType === 'crypto' && selectedCryptoWallet && (
                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium uppercase tracking-wide">DESTINATION WALLET</span>
                  <span className="font-bold text-gray-900">
                    {selectedCryptoWallet.coinType} ({selectedCryptoWallet.networkType})
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle size={20} className="text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800 uppercase tracking-wide">IMPORTANT NOTICE</h4>
                <p className="text-blue-700 text-sm mt-1 uppercase tracking-wide">
                  This withdrawal request will be submitted for review. Processing typically takes 1-3 business days.
                  {withdrawalType === 'crypto' && ' Crypto withdrawals require additional verification.'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex space-x-4">
            <Button
              variant="outline"
              onClick={() => setShowConfirmModal(false)}
              disabled={isLoading}
              className="flex-1"
            >
              CANCEL
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmWithdrawal}
              isLoading={isLoading}
              disabled={isLoading}
              className="flex-1"
            >
              CONFIRM WITHDRAWAL
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default WithdrawalRequestForm;