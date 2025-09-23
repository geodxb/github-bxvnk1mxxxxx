import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../common/Button';
import WithdrawalProgressBar from '../common/WithdrawalProgressBar';
import { FirestoreService } from '../../services/firestoreService';
import { Investor } from '../../types/user';
import { 
  DollarSign, 
  AlertCircle, 
  CheckCircle,
  ArrowDownRight,
  Calculator,
  Building,
  Bitcoin,
  CreditCard,
  Copy,
  Clock,
  Shield,
  XCircle,
  User,
  Phone,
  MapPin,
  AlertTriangle
} from 'lucide-react';

interface WithdrawalRequestFormProps {
  currentBalance: number;
  investorName: string;
  investor: Investor;
  onSuccess?: () => void;
}

type WithdrawalMethod = 'bank' | 'crypto' | 'credit_card';
type CryptoType = 'BTC' | 'ETH' | 'XRP' | 'USDT';
type USDTNetwork = 'TRC20' | 'ERC20' | 'BEP20';

// Enhanced bank data for the 5 specified countries
const banksByCountry: Record<string, string[]> = {
  'Mexico': [
    'Santander México',
    'Banorte',
    'BBVA México',
    'Banamex (Citibanamex)',
    'HSBC México',
    'Scotiabank México',
    'Banco Azteca',
    'Inbursa',
    'Banco del Bajío',
    'Banregio',
    'Multiva',
    'Mifel',
    'Banco Ahorro Famsa',
    'Banco Coppel',
    'BanCoppel'
  ],
  'France': [
    'BNP Paribas',
    'Crédit Agricole',
    'Société Générale',
    'Crédit Mutuel',
    'BPCE (Banque Populaire)',
    'La Banque Postale',
    'Crédit du Nord',
    'HSBC France',
    'ING Direct France',
    'Boursorama Banque',
    'Monabanq',
    'Hello bank!',
    'Fortuneo Banque',
    'BforBank',
    'Revolut France'
  ],
  'Switzerland': [
    'UBS',
    'Credit Suisse',
    'Julius Baer',
    'Pictet',
    'Lombard Odier',
    'Banque Cantonale Vaudoise',
    'Zürcher Kantonalbank',
    'PostFinance',
    'Raiffeisen Switzerland',
    'Migros Bank',
    'Cler Bank',
    'Bank Coop',
    'Hypothekarbank Lenzburg',
    'Valiant Bank',
    'Clientis'
  ],
  'Saudi Arabia': [
    'Saudi National Bank (SNB)',
    'Al Rajhi Bank',
    'Riyad Bank',
    'Banque Saudi Fransi',
    'Saudi British Bank (SABB)',
    'Arab National Bank',
    'Bank AlJazira',
    'Alinma Bank',
    'Bank Albilad',
    'Saudi Investment Bank',
    'First Abu Dhabi Bank Saudi Arabia',
    'Citibank Saudi Arabia',
    'HSBC Saudi Arabia',
    'Deutsche Bank Saudi Arabia',
    'JPMorgan Chase Saudi Arabia'
  ],
  'United Arab Emirates': [
    'Emirates NBD',
    'First Abu Dhabi Bank (FAB)',
    'Abu Dhabi Commercial Bank (ADCB)',
    'Dubai Islamic Bank',
    'Mashreq Bank',
    'Commercial Bank of Dubai',
    'Union National Bank',
    'Ajman Bank',
    'Bank of Sharjah',
    'Fujairah National Bank',
    'Ras Al Khaimah National Bank',
    'HSBC UAE',
    'Citibank UAE',
    'Standard Chartered UAE',
    'ADIB (Abu Dhabi Islamic Bank)'
  ]
};

// Bank form fields for each country
const bankFormFields: Record<string, any> = {
  'Mexico': {
    fields: [
      { name: 'accountHolderName', label: 'Account Holder Name', type: 'text', required: true },
      { name: 'accountNumber', label: 'Account Number (CLABE)', type: 'text', required: true, maxLength: 18 },
      { name: 'bankBranch', label: 'Bank Branch', type: 'text', required: false },
      { name: 'phoneNumber', label: 'Phone Number', type: 'tel', required: true }
    ],
    currency: 'MXN',
    getSwiftCode: (bankName: string) => {
      if (bankName.includes('BBVA')) return 'BCMRMXMMXXX';
      if (bankName.includes('Banorte')) return 'BNMXMXMM';
      if (bankName.includes('Santander')) return 'BMSXMXMM';
      return 'BNKMXXMM'; // Default for other Mexican banks
    }
  },
  'France': {
    fields: [
      { name: 'accountHolderName', label: 'Account Holder Name', type: 'text', required: true },
      { name: 'iban', label: 'IBAN', type: 'text', required: true, maxLength: 34 },
      { name: 'bic', label: 'BIC/SWIFT Code', type: 'text', required: true, maxLength: 11 },
      { name: 'address', label: 'Address', type: 'text', required: true }
    ],
    currency: 'EUR'
  },
  'Switzerland': {
    fields: [
      { name: 'accountHolderName', label: 'Account Holder Name', type: 'text', required: true },
      { name: 'iban', label: 'IBAN', type: 'text', required: true, maxLength: 21 },
      { name: 'bic', label: 'BIC/SWIFT Code', type: 'text', required: true, maxLength: 11 },
      { name: 'address', label: 'Address', type: 'text', required: true }
    ],
    currency: 'CHF'
  },
  'Saudi Arabia': {
    fields: [
      { name: 'accountHolderName', label: 'Account Holder Name', type: 'text', required: true },
      { name: 'iban', label: 'IBAN', type: 'text', required: true, maxLength: 24 },
      { name: 'swiftCode', label: 'SWIFT Code', type: 'text', required: true, maxLength: 11 },
      { name: 'phoneNumber', label: 'Phone Number', type: 'tel', required: true }
    ],
    currency: 'SAR'
  },
  'United Arab Emirates': {
    fields: [
      { name: 'accountHolderName', label: 'Account Holder Name', type: 'text', required: true },
      { name: 'iban', label: 'IBAN', type: 'text', required: true, maxLength: 23 },
      { name: 'swiftCode', label: 'SWIFT Code', type: 'text', required: true, maxLength: 11 },
      { name: 'emiratesId', label: 'Emirates ID', type: 'text', required: true },
      { name: 'phoneNumber', label: 'Phone Number', type: 'tel', required: true }
    ],
    currency: 'AED'
  }
};

const WithdrawalRequestForm = ({ 
  currentBalance, 
  investorName,
  investor,
  onSuccess 
}: WithdrawalRequestFormProps) => {
  // Form state
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<WithdrawalMethod>('bank');
  const [selectedBank, setSelectedBank] = useState('');
  const [bankFormData, setBankFormData] = useState<Record<string, string>>({});
  const [showBankForm, setShowBankForm] = useState(false);
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedWithdrawalId, setSubmittedWithdrawalId] = useState<string>('');
  const [submittedAmount, setSubmittedAmount] = useState<number>(0);

  // Enhanced country normalization function
  const normalizeCountryName = (rawCountry: string | undefined): string => {
    if (!rawCountry) return 'Unknown';
    
    const country = rawCountry.trim();
    
    // Direct exact matches first (case sensitive)
    if (banksByCountry[country]) {
      return country;
    }
    
    // Case insensitive exact matches
    const exactMatch = Object.keys(banksByCountry).find(
      key => key.toLowerCase() === country.toLowerCase()
    );
    if (exactMatch) {
      return exactMatch;
    }
    
    // Comprehensive mapping for all variations
    const countryMappings: Record<string, string> = {
      'mexico': 'Mexico', 'méxico': 'Mexico', 'mexican': 'Mexico', 'mx': 'Mexico', 'mex': 'Mexico',
      'france': 'France', 'french': 'France', 'fr': 'France', 'francia': 'France',
      'switzerland': 'Switzerland', 'swiss': 'Switzerland', 'ch': 'Switzerland', 'suisse': 'Switzerland',
      'saudi arabia': 'Saudi Arabia', 'saudi': 'Saudi Arabia', 'ksa': 'Saudi Arabia', 'sa': 'Saudi Arabia',
      'united arab emirates': 'United Arab Emirates', 'uae': 'United Arab Emirates', 'emirates': 'United Arab Emirates', 'dubai': 'United Arab Emirates'
    };
    
    const lowerCountry = country.toLowerCase();
    if (countryMappings[lowerCountry]) {
      return countryMappings[lowerCountry];
    }
    
    return country;
  };
  
  // Get investor country and account status
  const investorCountry = normalizeCountryName(investor?.country);
  const accountStatus = investor?.accountStatus || 'Active';
  
  // Get available banks and form fields for the investor's country
  const availableBanks = banksByCountry[investorCountry] || [];
  const countryBankFields = bankFormFields[investorCountry];

  // Enhanced account restriction checking
  const isAccountClosed = accountStatus.toLowerCase().includes('closed') || 
                         accountStatus.toLowerCase().includes('deletion');
  const isPolicyViolation = accountStatus.toLowerCase().includes('policy violation') ||
                           accountStatus.toLowerCase().includes('restricted');
  const isPermanentlyClosed = accountStatus.toLowerCase().includes('permanently closed') ||
                             accountStatus.toLowerCase().includes('permanent');

  // Validation functions
  const getAmountValidationError = () => {
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

  const getBankFormValidationError = () => {
    // If using registered bank account, no additional validation needed
    if (selectedBank === 'registered') {
      return '';
    }
    
    if (!selectedBank) {
      return 'Please select a bank';
    }
    
    if (countryBankFields) {
      for (const field of countryBankFields.fields) {
        if (field.required && !bankFormData[field.name]?.trim()) {
          return `Please enter ${field.label}`;
        }
      }
    }
    
    return '';
  };

  const handleBankFormChange = (fieldName: string, value: string) => {
    setBankFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleSubmit = async () => {
    if (!investor) return;
    
    // Validation
    const amountError = getAmountValidationError();
    const bankError = method === 'bank' ? getBankFormValidationError() : '';
    
    if (amountError) {
      setError(amountError);
      return;
    }
    
    if (bankError) {
      setError(bankError);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const withdrawalAmount = parseFloat(amount);
      const commissionAmount = withdrawalAmount * 0.15;
      const newBalance = currentBalance - withdrawalAmount;
      
      console.log(`📊 Withdrawal AUM Impact: -$${withdrawalAmount.toLocaleString()} (Reducing total AUM)`);
      console.log(`📊 New investor balance: $${newBalance.toLocaleString()}`);
      
      // Generate a unique withdrawal ID for tracking
      const withdrawalId = `withdrawal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Update investor balance
      await FirestoreService.updateInvestorBalance(investor.id, newBalance);
      
      // Add withdrawal request
      await FirestoreService.addWithdrawalRequest(
        investor.id,
        investorName,
        withdrawalAmount,
        withdrawalId
      );
      
      // Determine status based on account restrictions
      let transactionStatus = 'Pending';
      let description = `Withdrawal via ${method}`;
      
      if (isPolicyViolation) {
        transactionStatus = 'Pending Review';
        description += ' - Manual review required due to policy violation';
      }
      
      // Add withdrawal transaction
      await FirestoreService.addTransaction({
        investorId: investor.id,
        id: withdrawalId,
        type: 'Withdrawal',
        amount: -withdrawalAmount,
        date: new Date().toISOString().split('T')[0],
        status: transactionStatus,
        description: description
      });
      
      // Add commission record
      await FirestoreService.addCommission({
        investorId: investor.id,
        investorName: investorName,
        withdrawalAmount: withdrawalAmount,
        commissionRate: 15,
        commissionAmount: commissionAmount,
        date: new Date().toISOString().split('T')[0],
        status: 'Earned'
      });
      
      console.log(`💰 Commission earned: $${commissionAmount.toLocaleString()} (15% of withdrawal)`);
      setIsLoading(false);
      setIsSuccess(true);
      setSubmittedWithdrawalId(withdrawalId);
      setSubmittedAmount(withdrawalAmount);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error submitting withdrawal request:', error);
      setError('Failed to submit withdrawal request. Please try again.');
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setAmount('');
    setSelectedBank('');
    setBankFormData({});
    setShowBankForm(false);
    setError('');
    setIsSuccess(false);
    setSubmittedWithdrawalId('');
    setSubmittedAmount(0);
  };

  // Calculate preview
  const previewAmount = parseFloat(amount) || 0;
  const commissionPreview = previewAmount * 0.15;
  const netAmount = previewAmount - commissionPreview;

  // Account status messages - Enhanced for different violation types
  if (isPermanentlyClosed) {
    return (
      <div className="bg-white border border-red-300 rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-red-200 bg-red-50">
          <h3 className="text-lg font-semibold text-red-900">Account Permanently Closed</h3>
        </div>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <XCircle size={24} className="text-red-600 mt-0.5" />
              <div>
                <h3 className="text-red-800 font-semibold mb-2">Withdrawals Not Available</h3>
                <p className="text-red-700 text-sm mb-3">
                  This account has been permanently closed due to policy violations. No withdrawals can be processed.
                </p>
                <p className="text-red-700 text-sm">
                  Only account closure procedures are available. Please contact support for assistance with account closure.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isAccountClosed) {
    return (
      <div className="bg-white border border-amber-300 rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-amber-200 bg-amber-50">
          <h3 className="text-lg font-semibold text-amber-900">Account Closure in Progress</h3>
        </div>
        <div className="p-6">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle size={24} className="text-amber-600 mt-0.5" />
              <div>
                <h3 className="text-amber-800 font-semibold mb-2">Withdrawal Not Available</h3>
                <p className="text-amber-700 text-sm">
                  This account is scheduled for closure. Withdrawals will be processed using the same method 
                  used for your initial deposit or transferred to the bank information provided during registration.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="space-y-6">
        {/* Success Message */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 uppercase tracking-wide">
              Withdrawal Request Submitted
            </h3>
          </div>
          <div className="p-6">
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4 border border-gray-200">
                <CheckCircle size={32} className="text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2 uppercase tracking-wide">
                Withdrawal Request Submitted Successfully
              </h3>
              <p className="text-gray-600 mb-6 uppercase tracking-wide text-sm">
                Your withdrawal request for ${submittedAmount.toLocaleString()} has been submitted for approval and is now pending review.
              </p>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 uppercase tracking-wide">Amount Requested</p>
                    <p className="font-bold text-gray-900">${submittedAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 uppercase tracking-wide">Commission (15%)</p>
                    <p className="font-bold text-gray-900">-${(submittedAmount * 0.15).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 uppercase tracking-wide">Net Amount</p>
                    <p className="font-bold text-gray-900">${(submittedAmount * 0.85).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 uppercase tracking-wide">Status</p>
                    <p className="font-bold text-gray-900">PENDING APPROVAL</p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors rounded-lg uppercase tracking-wide"
              >
                Submit Another Request
              </button>
            </div>
          </div>
        </div>
        
        {/* Progress Tracking */}
        <WithdrawalProgressBar
          withdrawalId={submittedWithdrawalId}
          submissionDate={new Date().toISOString().split('T')[0]}
          currentStatus="Pending"
          amount={submittedAmount}
          investorName={investorName}
          withdrawalRequest={null}
        />
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <ArrowDownRight size={20} className="mr-2" />
            Request Withdrawal
          </h3>
          <div className="text-sm text-gray-600 font-medium">
            Available: <span className="font-semibold">${currentBalance.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Policy Violation Warning */}
        {isPolicyViolation && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle size={20} className="text-red-600 mt-0.5" />
              <div>
                <h4 className="text-red-800 font-semibold">Manual Review Required</h4>
                <p className="text-red-700 text-sm mt-1">
                  Due to policy violations on your account, all withdrawal requests require manual review. 
                  Processing may take additional time and approval is not guaranteed.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Withdrawal Amount (USD)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign size={16} className="text-gray-400" />
              </div>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                placeholder="0.00"
                step="0.01"
                min="100"
                max={currentBalance}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Minimum withdrawal: $100</p>
          </div>

          {/* Quick Amount Buttons */}
          <div className="flex flex-wrap gap-2">
            {[1000, 5000, 10000, 25000].filter(quickAmount => quickAmount <= currentBalance).map((quickAmount) => (
              <button
                key={quickAmount}
                type="button"
                onClick={() => setAmount(quickAmount.toString())}
                className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors border border-gray-200"
              >
                ${quickAmount.toLocaleString()}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setAmount(currentBalance.toString())}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors border border-gray-200"
            >
              Max: ${currentBalance.toLocaleString()}
            </button>
          </div>

          {/* Commission Preview */}
          {previewAmount > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-800 mb-3">Transaction Preview</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Withdrawal Amount:</span>
                  <span className="font-medium">${previewAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Platform Commission (15%):</span>
                  <span className="font-medium text-red-600">-${commissionPreview.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">New Balance:</span>
                  <span className="font-medium text-blue-600">${(currentBalance - previewAmount).toLocaleString()}</span>
                </div>
                <div className="border-t border-gray-300 pt-2 flex justify-between">
                  <span className="font-semibold text-gray-800">Net Amount to Receive:</span>
                  <span className="font-bold text-green-600">${netAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Bank Selection and Form */}
          {previewAmount >= 100 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-800">Bank Information</h4>
                <span className="text-sm text-gray-600">Country: {investorCountry}</span>
              </div>
              
              {availableBanks.length > 0 ? (
                <div className="space-y-4">
                  {/* Registered Bank Account Option */}
                  {investor.bankDetails && investor.bankDetails.bankName && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-3 uppercase tracking-wide">
                        Select Bank Account
                      </label>
                      
                      {/* Registered Bank Account */}
                      <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all mb-3 ${
                        selectedBank === 'registered'
                          ? 'border-gray-900 bg-gray-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <label className="flex items-start space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            name="bankSelection"
                            value="registered"
                            checked={selectedBank === 'registered'}
                            onChange={(e) => {
                              setSelectedBank('registered');
                              setShowBankForm(false);
                            }}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Building size={18} className="text-gray-600" />
                              <span className="font-semibold text-gray-900">Registered Bank Account</span>
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium">
                                Verified
                              </span>
                            </div>
                            <div className="space-y-1 text-sm">
                              <p className="font-medium text-gray-800">{investor.bankDetails.bankName}</p>
                              {investor.bankDetails.accountHolderName && (
                                <p className="text-gray-600">Holder: {investor.bankDetails.accountHolderName}</p>
                              )}
                              {investor.bankDetails.accountNumber && (
                                <p className="text-gray-600">Account: ***{investor.bankDetails.accountNumber.slice(-4)}</p>
                              )}
                              {investor.bankDetails.currency && (
                                <p className="text-gray-600">Currency: {investor.bankDetails.currency}</p>
                              )}
                            </div>
                          </div>
                        </label>
                      </div>
                      
                      {/* Add New Bank Account Option */}
                      <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        selectedBank !== 'registered' && selectedBank !== ''
                          ? 'border-gray-900 bg-gray-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <label className="flex items-start space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            name="bankSelection"
                            value="new"
                            checked={selectedBank !== 'registered' && selectedBank !== ''}
                            onChange={(e) => {
                              setSelectedBank('');
                              setShowBankForm(false);
                            }}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Building size={18} className="text-gray-600" />
                              <span className="font-semibold text-gray-900">Use Different Bank Account</span>
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium">
                                Requires Verification
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              Select a different bank from the list below
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>
                  )}
                  
                  {/* Bank Selection */}
                  {(!investor.bankDetails?.bankName || selectedBank !== 'registered') && (
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {investor.bankDetails?.bankName ? 'Select Different Bank' : 'Select Bank'}
                    </label>
                    <select
                      value={selectedBank}
                      onChange={(e) => {
                        setSelectedBank(e.target.value);
                        setShowBankForm(!!e.target.value);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Choose your bank...</option>
                      {/* Show registered bank accounts from investor.bankAccounts */}
                      {investor.bankAccounts && investor.bankAccounts.length > 0 && (
                        <optgroup label="Your Registered Accounts">
                          {investor.bankAccounts
                            .filter((account: any) => account.verificationStatus === 'approved')
                            .map((account: any, index: number) => (
                            <option key={`registered-${index}`} value={`registered-${account.id}`}>
                              {account.bankName} - ***{account.accountNumber.slice(-4)}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      <optgroup label="Add New Bank">
                      {availableBanks.map((bank, index) => (
                        <option key={index} value={bank}>{bank}</option>
                      ))}
                      </optgroup>
                    </select>
                    </div>
                  )}

                  {/* Bank Form */}
                  {showBankForm && selectedBank && selectedBank !== 'registered' && countryBankFields && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h5 className="font-medium text-gray-800 mb-4">
                        Bank Account Details for {selectedBank}
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {countryBankFields.fields.map((field: any) => (
                          <div key={field.name} className={field.name === 'address' ? 'md:col-span-2' : ''}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {field.label} {field.required && <span className="text-red-500">*</span>}
                            </label>
                            <div className="relative">
                              {field.name === 'accountHolderName' && (
                                <User size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                              )}
                              {field.name === 'phoneNumber' && (
                                <Phone size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                              )}
                              {field.name === 'address' && (
                                <MapPin size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                              )}
                              <input
                                type={field.type}
                                value={bankFormData[field.name] || ''}
                                onChange={(e) => handleBankFormChange(field.name, e.target.value)}
                                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                  ['accountHolderName', 'phoneNumber', 'address'].includes(field.name) ? 'pl-9' : ''
                                }`}
                                placeholder={field.label}
                                maxLength={field.maxLength}
                                required={field.required}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200">
                        <p className="text-gray-800 text-sm">
                          <strong>Currency:</strong> Funds will be converted to {countryBankFields.currency} at current exchange rates.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle size={20} className="text-gray-600 mt-0.5" />
                    <div>
                      <h4 className="text-gray-800 font-semibold">Bank Transfer Not Available</h4>
                      <p className="text-gray-700 text-sm mt-1">
                        Bank withdrawals are not currently available for "{investorCountry}". 
                        Please contact support for alternative withdrawal methods.
                      </p>
                      <p className="text-gray-700 text-xs mt-2">
                        Supported countries: {Object.keys(banksByCountry).join(', ')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Processing Information */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-800 mb-2">Processing Information</h4>
            <ul className="text-gray-700 text-sm space-y-1">
              <li>• {isPolicyViolation ? 'Manual review required - Processing time: 5-10 business days' : 'Request will be submitted for approval - Processing time: 1-3 business days'}</li>
              <li>• Once approved, funds will be transferred to your selected bank account</li>
              <li>• A 15% platform commission will be deducted</li>
              <li>• Your account balance will be updated immediately</li>
              {selectedBank && <li>• Selected bank: {selectedBank}</li>}
            </ul>
          </div>
        </div>

        {error && (
          <div className="bg-gray-50 border border-gray-200 text-gray-700 px-4 py-3 rounded-lg flex items-center mt-4">
            <AlertCircle size={16} className="mr-2 text-gray-600" />
            {error}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end mt-6">
          <button
            onClick={handleSubmit}
            disabled={
              isLoading || 
              !amount || 
              parseFloat(amount) < 100 || 
              parseFloat(amount) > currentBalance ||
              (availableBanks.length > 0 && (!selectedBank || getBankFormValidationError()))
            }
            className="w-full px-6 py-3 bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Processing...' : 
             !selectedBank && availableBanks.length > 0 ? 'Select Bank to Continue' :
             getBankFormValidationError() ? 'Complete Bank Details' :
             isPolicyViolation ? 'Submit for Manual Review' :
             'Submit for Approval'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WithdrawalRequestForm;