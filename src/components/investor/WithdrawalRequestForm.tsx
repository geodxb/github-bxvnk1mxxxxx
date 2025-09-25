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
  ArrowRight,
  Plus,
  Info,
  Globe,
  TrendingUp,
  RefreshCw
} from 'lucide-react';

// Country to currency mapping
const countryCurrencyMap: Record<string, string[]> = {
  'Mexico': ['USD', 'MXN'],
  'France': ['USD', 'EUR'],
  'Switzerland': ['USD', 'CHF'],
  'Saudi Arabia': ['USD', 'SAR'],
  'United Arab Emirates': ['USD', 'AED'],
  'United States': ['USD']
};

interface WithdrawalRequestFormProps {
  investor: Investor;
  onSuccess?: () => void;
}

const WithdrawalRequestForm = ({ investor, onSuccess }: WithdrawalRequestFormProps) => {
  const { user } = useAuth();
  const [withdrawalType, setWithdrawalType] = useState<'bank' | 'crypto'>('bank');
  const [amount, setAmount] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [localAmount, setLocalAmount] = useState<number>(0);
  const [isLoadingRate, setIsLoadingRate] = useState(false);
  const [selectedBankAccount, setSelectedBankAccount] = useState<any>(null);
  const [selectedCryptoWallet, setSelectedCryptoWallet] = useState<CryptoWallet | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Get approved crypto wallets for Pro accounts
  const approvedCryptoWallets = investor.cryptoWallets?.filter(
    wallet => wallet.verificationStatus === 'approved'
  ) || [];

  // Get registered bank accounts
  const registeredBankAccounts = investor.bankAccounts || [];
  const primaryBankAccount = registeredBankAccounts.find(acc => acc.isPrimary) || registeredBankAccounts[0];
  const legacyBankDetails = investor.bankDetails;

  // Get available currencies for investor's country
  const availableCurrencies = countryCurrencyMap[investor.country] || ['USD'];

  // Fetch exchange rate
  const fetchExchangeRate = async (fromCurrency: string, toCurrency: string) => {
    if (fromCurrency === toCurrency) {
      return 1;
    }

    setIsLoadingRate(true);
    try {
      // Using a free exchange rate API
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
      const data = await response.json();
      
      if (data.rates && data.rates[toCurrency]) {
        return data.rates[toCurrency];
      }
      
      // Fallback rates if API fails
      const fallbackRates: Record<string, number> = {
        'MXN': 20.15, // USD to MXN
        'EUR': 0.85,  // USD to EUR
        'CHF': 0.88,  // USD to CHF
        'SAR': 3.75,  // USD to SAR
        'AED': 3.67   // USD to AED
      };
      
      return fallbackRates[toCurrency] || 1;
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      // Return fallback rates
      const fallbackRates: Record<string, number> = {
        'MXN': 20.15,
        'EUR': 0.85,
        'CHF': 0.88,
        'SAR': 3.75,
        'AED': 3.67
      };
      return fallbackRates[toCurrency] || 1;
    } finally {
      setIsLoadingRate(false);
    }
  };

  // Update exchange rate when currency changes
  useEffect(() => {
    if (selectedCurrency !== 'USD') {
      fetchExchangeRate('USD', selectedCurrency).then(rate => {
        setExchangeRate(rate);
      });
    } else {
      setExchangeRate(1);
    }
  }, [selectedCurrency]);

  // Update local amount when amount or exchange rate changes
  useEffect(() => {
    if (amount && !isNaN(parseFloat(amount))) {
      const usdAmount = parseFloat(amount);
      setLocalAmount(usdAmount * exchangeRate);
    } else {
      setLocalAmount(0);
    }
  }, [amount, exchangeRate]);

  // Set default bank account on component mount
  useEffect(() => {
    if (primaryBankAccount) {
      setSelectedBankAccount(primaryBankAccount);
    } else if (legacyBankDetails && legacyBankDetails.bankName) {
      setSelectedBankAccount(legacyBankDetails);
    }
  }, [primaryBankAccount, legacyBankDetails]);
  const validateAmount = () => {
    const numAmount = parseFloat(amount); // This is always in USD
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
    
    // Validate bank account selection for bank withdrawals
    if (withdrawalType === 'bank' && !selectedBankAccount) {
      setError('Please register a bank account first or select an existing one');
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
      const usdAmount = parseFloat(amount); // Always store in USD
      
      if (withdrawalType === 'crypto' && selectedCryptoWallet) {
        // Create crypto withdrawal request
        await FirestoreService.addCryptoWithdrawalRequest(
          investor.id,
          investor.name,
          usdAmount,
          selectedCryptoWallet
        );
      } else {
        // Create bank withdrawal request
        await FirestoreService.addWithdrawalRequest(
          investor.id,
          investor.name,
          usdAmount
        );
      }

      setIsSuccess(true);
      setAmount('');
      setSelectedCurrency('USD');
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
    setSelectedCurrency('USD');
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
                <p className="text-gray-600 text-sm uppercase tracking-wide">USD</p>
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

          {/* Currency Selection - Only for bank withdrawals */}
          {withdrawalType === 'bank' && availableCurrencies.length > 1 && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                WITHDRAWAL CURRENCY
              </label>
              <div className="grid grid-cols-2 gap-4">
                {availableCurrencies.map((currency) => (
                  <button
                    key={currency}
                    onClick={() => setSelectedCurrency(currency)}
                    className={`p-4 border-2 rounded-lg transition-all text-left ${
                      selectedCurrency === currency
                        ? 'border-gray-900 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <Globe size={20} className="text-gray-600" />
                      <span className="font-bold text-gray-900 uppercase tracking-wide">{currency}</span>
                    </div>
                    <p className="text-sm text-gray-600 uppercase tracking-wide">
                      {currency === 'USD' ? 'US Dollar' : 
                       currency === 'MXN' ? 'Mexican Peso' :
                       currency === 'EUR' ? 'Euro' :
                       currency === 'CHF' ? 'Swiss Franc' :
                       currency === 'SAR' ? 'Saudi Riyal' :
                       currency === 'AED' ? 'UAE Dirham' : currency}
                    </p>
                  </button>
                ))}
              </div>
              
              {/* Live Exchange Rate Display */}
              {selectedCurrency !== 'USD' && (
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <TrendingUp size={16} className="text-blue-600" />
                      <h4 className="font-medium text-blue-800 uppercase tracking-wide">LIVE EXCHANGE RATE</h4>
                    </div>
                    <button
                      onClick={() => fetchExchangeRate('USD', selectedCurrency)}
                      disabled={isLoadingRate}
                      className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                      title="Refresh rate"
                    >
                      <RefreshCw size={14} className={isLoadingRate ? 'animate-spin' : ''} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-blue-700 font-medium uppercase tracking-wide">EXCHANGE RATE</p>
                      <p className="font-bold text-blue-900">
                        {isLoadingRate ? (
                          <span className="flex items-center">
                            <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin mr-1"></div>
                            Loading...
                          </span>
                        ) : (
                          `1 USD = ${exchangeRate.toFixed(4)} ${selectedCurrency}`
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-blue-700 font-medium uppercase tracking-wide">LAST UPDATED</p>
                      <p className="font-bold text-blue-900">{new Date().toLocaleTimeString()}</p>
                    </div>
                  </div>
                  <p className="text-blue-700 text-xs mt-2 uppercase tracking-wide">
                    * Exchange rate is updated in real-time and may vary at the time of actual transfer
                  </p>
                </div>
              )}
            </div>
          )}
          {/* Bank Account Selection - Only for bank withdrawals */}
          {withdrawalType === 'bank' && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                SELECT BANK ACCOUNT
              </label>
              {registeredBankAccounts.length > 0 ? (
                <div className="space-y-3">
                  {registeredBankAccounts.map((account) => (
                    <button
                      key={account.id}
                      onClick={() => setSelectedBankAccount(account)}
                      className={`w-full p-4 border-2 rounded-lg transition-all text-left ${
                        selectedBankAccount?.id === account.id
                          ? 'border-gray-900 bg-gray-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Building size={20} className="text-gray-600" />
                          <div>
                            <p className="font-bold text-gray-900 uppercase tracking-wide">
                              {account.bankName}
                            </p>
                            <p className="text-sm text-gray-600">
                              {account.accountHolderName} • ***{account.accountNumber.slice(-4)}
                            </p>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">
                              {account.currency} • {account.country}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {account.isPrimary && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium uppercase tracking-wide">
                              PRIMARY
                            </span>
                          )}
                          <span className={`px-2 py-1 text-xs rounded-full font-medium uppercase tracking-wide ${
                            account.verificationStatus === 'approved' ? 'bg-green-100 text-green-800' :
                            account.verificationStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {account.verificationStatus}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : legacyBankDetails && legacyBankDetails.bankName ? (
                <div className="space-y-3">
                  <button
                    onClick={() => setSelectedBankAccount(legacyBankDetails)}
                    className={`w-full p-4 border-2 rounded-lg transition-all text-left ${
                      selectedBankAccount === legacyBankDetails
                        ? 'border-gray-900 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Building size={20} className="text-gray-600" />
                      <div>
                        <p className="font-bold text-gray-900 uppercase tracking-wide">
                          {legacyBankDetails.bankName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {legacyBankDetails.accountHolderName || investor.name}
                        </p>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">
                          {legacyBankDetails.currency || 'USD'} • LEGACY ACCOUNT
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle size={20} className="text-amber-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-800 uppercase tracking-wide">NO BANK ACCOUNT REGISTERED</h4>
                      <p className="text-amber-700 text-sm mt-1 uppercase tracking-wide">
                        You need to register a bank account before making withdrawals. Please add your bank account information in the Overview & Profile tab.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
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
                (() => {
                  // Check if there are any pending wallets
                  const pendingWallets = (investor.cryptoWallets || []).filter(
                    wallet => wallet.verificationStatus === 'pending'
                  );
                  
                  if (pendingWallets.length > 0) {
                    return (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <Clock size={20} className="text-yellow-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-yellow-800 uppercase tracking-wide">
                              CRYPTO WALLETS PENDING VERIFICATION
                            </h4>
                            <p className="text-yellow-700 text-sm mt-1 uppercase tracking-wide">
                              You have {pendingWallets.length} crypto wallet{pendingWallets.length > 1 ? 's' : ''} pending Governor approval.
                            </p>
                            <div className="mt-3 space-y-2">
                              {pendingWallets.map((wallet) => (
                                <div key={wallet.id} className="bg-white p-3 rounded border border-yellow-300">
                                  <div className="flex items-center space-x-2">
                                    <Wallet size={14} className="text-yellow-600" />
                                    <span className="font-bold text-yellow-900 text-sm uppercase tracking-wide">
                                      {wallet.coinType} ({wallet.networkType})
                                    </span>
                                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium uppercase tracking-wide">
                                      PENDING APPROVAL
                                    </span>
                                  </div>
                                  <p className="text-xs text-yellow-700 mt-1 break-all">
                                    {wallet.walletAddress}
                                  </p>
                                </div>
                              ))}
                            </div>
                            <p className="text-yellow-700 text-xs mt-3 uppercase tracking-wide">
                              Crypto withdrawals will be available once your wallet{pendingWallets.length > 1 ? 's are' : ' is'} approved by the Governor.
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <AlertTriangle size={20} className="text-amber-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-amber-800 uppercase tracking-wide">NO APPROVED CRYPTO WALLETS</h4>
                            <p className="text-amber-700 text-sm mt-1 uppercase tracking-wide">
                              You need to register and verify at least one crypto wallet before making crypto withdrawals.
                              Go to the "Crypto Wallets" tab to add your wallet addresses.
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                })()
              )}
            </div>
          )}

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
              WITHDRAWAL AMOUNT
            </label>
            
            {/* Currency Display */}
            <div className="mb-3 flex items-center space-x-2">
              <span className="text-sm text-gray-600 uppercase tracking-wide">AMOUNT IN:</span>
              <span className="px-2 py-1 bg-gray-100 text-gray-800 text-sm font-bold rounded uppercase tracking-wide">
                {selectedCurrency}
              </span>
              {selectedCurrency !== 'USD' && (
                <span className="text-xs text-gray-500 uppercase tracking-wide">
                  (CONVERTED FROM USD)
                </span>
              )}
            </div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-700">
                  {selectedCurrency === 'USD' ? '$' :
                   selectedCurrency === 'EUR' ? '€' :
                   selectedCurrency === 'CHF' ? 'CHF' :
                   selectedCurrency === 'SAR' ? 'SAR' :
                   selectedCurrency === 'AED' ? 'AED' :
                   selectedCurrency === 'MXN' ? '$' : '$'}
                </span>
              </div>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 text-lg font-medium"
                placeholder={`0.00 ${selectedCurrency}`}
                step="0.01"
                min="100"
                max={investor.currentBalance}
                required
              />
            </div>
            
            <div className="mt-2 space-y-1">
              <p className="text-xs text-gray-600 uppercase tracking-wide">
                Minimum: $100 USD • Maximum: ${investor.currentBalance.toLocaleString()} USD
              </p>
              {selectedCurrency !== 'USD' && amount && !isNaN(parseFloat(amount)) && (
                <div className="bg-gray-50 p-2 rounded border border-gray-200">
                  <p className="text-xs text-gray-700 uppercase tracking-wide">
                    <strong>USD EQUIVALENT:</strong> ${parseFloat(amount).toLocaleString()} USD
                  </p>
                  <p className="text-xs text-gray-700 uppercase tracking-wide">
                    <strong>LOCAL AMOUNT:</strong> {selectedCurrency} {localAmount.toLocaleString(undefined, { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Commission Information */}
          {amount && parseFloat(amount) > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2 uppercase tracking-wide">WITHDRAWAL BREAKDOWN</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-blue-700 font-medium uppercase tracking-wide">REQUESTED AMOUNT</p>
                  <p className="font-bold text-blue-900">
                    ${parseFloat(amount).toLocaleString()} USD
                    {selectedCurrency !== 'USD' && (
                      <span className="block text-xs">
                        ≈ {selectedCurrency} {localAmount.toLocaleString(undefined, { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 2 
                        })}
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-blue-700 font-medium uppercase tracking-wide">PLATFORM FEE (15%)</p>
                  <p className="font-bold text-blue-900">
                    ${(parseFloat(amount) * 0.15).toLocaleString()} USD
                    {selectedCurrency !== 'USD' && (
                      <span className="block text-xs">
                        ≈ {selectedCurrency} {(localAmount * 0.15).toLocaleString(undefined, { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 2 
                        })}
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-blue-700 font-medium uppercase tracking-wide">NET AMOUNT</p>
                  <p className="font-bold text-blue-900">
                    ${(parseFloat(amount) * 0.85).toLocaleString()} USD
                    {selectedCurrency !== 'USD' && (
                      <span className="block text-xs">
                        ≈ {selectedCurrency} {(localAmount * 0.85).toLocaleString(undefined, { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 2 
                        })}
                      </span>
                    )}
                  </p>
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
              disabled={!amount || parseFloat(amount) <= 0 || (withdrawalType === 'crypto' && !selectedCryptoWallet) || (withdrawalType === 'bank' && !selectedBankAccount)}
              className="px-6 py-3 bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide"
            >
              <ArrowRight size={16} className="mr-2 inline" />
              REQUEST WITHDRAWAL
            </button>
          </div>
        </div>
      </Card>

      {/* Bank Account Registration Notice */}
      {withdrawalType === 'bank' && registeredBankAccounts.length === 0 && (!legacyBankDetails || !legacyBankDetails.bankName) && (
        <Card title="BANK ACCOUNT REQUIRED">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building size={32} className="text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2 uppercase tracking-wide">
              REGISTER BANK ACCOUNT
            </h3>
            <p className="text-gray-500 mb-6 uppercase tracking-wide text-sm">
              To make bank withdrawals, you need to register your bank account information first.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Info size={20} className="text-blue-600 mt-0.5" />
                <div className="text-left">
                  <h4 className="font-medium text-blue-800 uppercase tracking-wide">HOW TO ADD BANK ACCOUNT</h4>
                  <p className="text-blue-700 text-sm mt-1 uppercase tracking-wide">
                    1. Go to the "Overview & Profile" tab<br/>
                    2. Scroll down to "Registered Bank Accounts" section<br/>
                    3. Click "Add Bank Account" and fill in your details<br/>
                    4. Return here to submit withdrawal requests
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
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
              {withdrawalType === 'bank' && selectedCurrency !== 'USD' && (
                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium uppercase tracking-wide">CURRENCY</span>
                  <span className="font-bold text-gray-900">{selectedCurrency}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium uppercase tracking-wide">REQUESTED AMOUNT</span>
                <span className="font-bold text-gray-900">
                  ${parseFloat(amount).toLocaleString()} USD
                  {selectedCurrency !== 'USD' && (
                    <span className="block text-xs">
                      ≈ {selectedCurrency} {localAmount.toLocaleString(undefined, { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}
                    </span>
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium uppercase tracking-wide">PLATFORM FEE</span>
                <span className="font-bold text-gray-900">
                  ${(parseFloat(amount) * 0.15).toLocaleString()} USD
                  {selectedCurrency !== 'USD' && (
                    <span className="block text-xs">
                      ≈ {selectedCurrency} {(localAmount * 0.15).toLocaleString(undefined, { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}
                    </span>
                  )}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-300 pt-2">
                <span className="text-gray-700 font-bold uppercase tracking-wide">NET AMOUNT</span>
                <span className="font-bold text-gray-900">
                  ${(parseFloat(amount) * 0.85).toLocaleString()} USD
                  {selectedCurrency !== 'USD' && (
                    <span className="block text-xs">
                      ≈ {selectedCurrency} {(localAmount * 0.85).toLocaleString(undefined, { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}
                    </span>
                  )}
                </span>
              </div>
              {withdrawalType === 'bank' && selectedBankAccount && (
                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium uppercase tracking-wide">DESTINATION BANK</span>
                  <span className="font-bold text-gray-900">
                    {selectedBankAccount.bankName || 'Bank Account'}
                  </span>
                </div>
              )}
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

          {/* Exchange Rate Notice */}
          {selectedCurrency !== 'USD' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Globe size={20} className="text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800 uppercase tracking-wide">CURRENCY CONVERSION</h4>
                  <p className="text-yellow-700 text-sm mt-1 uppercase tracking-wide">
                    Your withdrawal will be processed in USD and converted to {selectedCurrency} at the current exchange rate. 
                    The final amount may vary slightly due to exchange rate fluctuations.
                  </p>
                  <p className="text-yellow-700 text-xs mt-2 uppercase tracking-wide">
                    Current rate: 1 USD = {exchangeRate.toFixed(4)} {selectedCurrency}
                  </p>
                </div>
              </div>
            </div>
          )}
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