import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CryptoExchangeService } from '../../services/cryptoExchangeService';
import { CryptoWithdrawal, CreditCardWithdrawal } from '../../types/withdrawal';
import { FirestoreService } from '../../services/firestoreService';
import { Investor } from '../../types/user';
import { useAuth } from '../../contexts/AuthContext';
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

interface ProWithdrawalMethodsProps {
  investor: Investor;
  currentBalance: number;
  onSuccess: () => void;
  onCancel: () => void;
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
      if (bankName.includes('Banorte')) return 'BNMXMM';
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

// Enhanced country normalization function - MOVED OUTSIDE COMPONENT
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


const ProWithdrawalMethods = ({ investor, currentBalance, onSuccess, onCancel }: ProWithdrawalMethodsProps) => {
  // Add this console.log to confirm the component is being rendered
  console.log('ProWithdrawalMethods component is rendering.');

  const { user } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState<WithdrawalMethod>('bank');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Common amount state for all methods
  const [amount, setAmount] = useState('');

  // Crypto withdrawal state
  const [selectedExchange, setSelectedExchange] = useState('');
  const [selectedCrypto, setSelectedCrypto] = useState<'BTC' | 'ETH' | 'USDT' | 'SOL'>('BTC');
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [cryptoPrices, setCryptoPrices] = useState<Record<string, number>>({});
  const [cryptoAmount, setCryptoAmount] = useState(0);

  // Credit card withdrawal state
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolderName, setCardHolderName] = useState(investor.name);
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');

  // Get available exchanges for investor's country
  const investorCountry = normalizeCountryName(investor?.country);
  const availableExchanges = CryptoExchangeService.getExchangesForCountry(investorCountry);
  const selectedExchangeData = availableExchanges.find(ex => ex.id === selectedExchange);
  const supportedCryptos = selectedExchangeData?.supportedCryptos || [];
  const availableNetworks = CryptoExchangeService.getNetworksForCrypto(selectedCrypto);

  // Load crypto prices (but not display them)
  useEffect(() => {
    const loadPrices = async () => {
      try {
        const prices = await CryptoExchangeService.getCryptoPrices();
        setCryptoPrices(prices);
        
        if (prices[selectedCrypto] && parseFloat(amount) > 0) {
          const cryptoAmt = await CryptoExchangeService.calculateCryptoAmount(parseFloat(amount), selectedCrypto);
          setCryptoAmount(cryptoAmt);
        }
      } catch (error) {
        console.error('Error loading crypto prices:', error);
      }
    };

    loadPrices();
  }, [amount, selectedCrypto]);

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const handleCardNumberChange = (value: string) => {
    const formatted = formatCardNumber(value);
    if (formatted.replace(/\s/g, '').length <= 16) {
      setCardNumber(formatted);
    }
  };

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

  const validateBankForm = () => {
    // If using registered bank account, no additional validation needed
    if (investor.bankAccounts && investor.bankAccounts.length > 0) {
      return ''; // Assuming a primary account is already set and valid
    }

    // If no registered bank accounts, require new bank details
    const countryBankFields = bankFormFields[investorCountry];
    if (!countryBankFields) {
      return 'Bank transfer is not available for your country.';
    }

    // Basic validation for new bank details (if applicable)
    // This part would typically be handled by a separate "Add Bank Account" flow
    // For simplicity, we'll just check if a country is selected.
    if (!investorCountry) {
      return 'Please select a country for bank transfer.';
    }
    return '';
  };

  const validateCryptoForm = () => {
    if (!selectedExchange) {
      return 'Please select a crypto exchange';
    }
    if (!selectedCrypto) {
      return 'Please select a cryptocurrency';
    }
    if (availableNetworks.length > 1 && !selectedNetwork) {
      return 'Please select a network';
    }
    if (!walletAddress) {
      return 'Please enter wallet address';
    }
    if (!CryptoExchangeService.validateWalletAddress(walletAddress, selectedCrypto, selectedNetwork)) {
      return 'Invalid wallet address format';
    }
    return '';
  };

  const validateCreditCardForm = () => {
    if (!cardNumber || cardNumber.replace(/\s/g, '').length < 13) {
      return 'Please enter a valid card number';
    }
    if (!cardHolderName.trim()) {
      return 'Please enter card holder name';
    }
    if (!expiryMonth || !expiryYear) {
      return 'Please enter expiry date';
    }
    if (!cvv || cvv.length < 3) {
      return 'Please enter CVV';
    }
    if (cardHolderName.toLowerCase() !== investor.name.toLowerCase()) {
      return 'Card holder name must match your registered name';
    }
    return '';
  };

  const handleSubmit = async () => {
    setError('');

    const amountError = getAmountValidationError();
    if (amountError) {
      setError(amountError);
      return;
    }

    let methodSpecificError = '';
    if (selectedMethod === 'bank') {
      methodSpecificError = validateBankForm();
    } else if (selectedMethod === 'crypto') {
      methodSpecificError = validateCryptoForm();
    } else if (selectedMethod === 'credit_card') {
      methodSpecificError = validateCreditCardForm();
    }

    if (methodSpecificError) {
      setError(methodSpecificError);
      return;
    }

    setIsLoading(true);

    try {
      const withdrawalAmount = parseFloat(amount);
      const commissionAmount = withdrawalAmount * 0.15;
      const newBalance = currentBalance - withdrawalAmount;

      let description = `Withdrawal via ${selectedMethod}`;
      let withdrawalDetails: any = {};

      if (selectedMethod === 'crypto') {
        const verificationHash = CryptoExchangeService.generateVerificationHash();
        const cryptoData: CryptoWithdrawal = {
          exchange: selectedExchange,
          cryptocurrency: selectedCrypto,
          network: selectedNetwork || availableNetworks[0],
          walletAddress: walletAddress,
          amount: withdrawalAmount,
          exchangeRate: cryptoPrices[selectedCrypto] || 1,
          cryptoAmount: cryptoAmount,
          verificationHash: verificationHash
        };
        withdrawalDetails = { cryptoDetails: cryptoData };
        description = `Crypto withdrawal to ${selectedCrypto} wallet via ${selectedExchangeData?.name}`;
      } else if (selectedMethod === 'credit_card') {
        const processingFee = withdrawalAmount * 0.035; // 3.5% processing fee
        const cardData: CreditCardWithdrawal = {
          cardNumber: cardNumber.replace(/\s/g, ''),
          cardHolderName: cardHolderName,
          expiryMonth: expiryMonth,
          expiryYear: expiryYear,
          cvv: cvv,
          amount: withdrawalAmount,
          processingFee: processingFee,
          estimatedArrival: '3-5 business days'
        };
        withdrawalDetails = { creditCardDetails: cardData };
        description = `Credit card withdrawal to card ending in ${cardNumber.slice(-4)}`;
      } else if (selectedMethod === 'bank') {
        // For bank, use existing registered bank details if available
        if (investor.bankAccounts && investor.bankAccounts.length > 0) {
          withdrawalDetails = { bankDetails: investor.bankAccounts.find(acc => acc.isPrimary) || investor.bankAccounts[0] };
          description = `Bank transfer to ${withdrawalDetails.bankDetails.bankName}`;
        } else {
          // Fallback if no registered bank account (should be handled by validation)
          description = `Bank transfer (new details)`;
        }
      }

      // Update investor balance
      await FirestoreService.updateInvestorBalance(investor.id, newBalance);

      // Add withdrawal request
      const withdrawalId = `withdrawal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await FirestoreService.addWithdrawalRequest(
        investor.id,
        investor.name,
        withdrawalAmount,
        withdrawalId
      );

      // Add transaction record
      await FirestoreService.addTransaction({
        investorId: investor.id,
        id: withdrawalId,
        type: 'Withdrawal',
        amount: -withdrawalAmount,
        date: new Date().toISOString().split('T')[0],
        status: 'Pending',
        description: description,
        ...withdrawalDetails // Include method-specific details
      });

      // Add commission record
      await FirestoreService.addCommission({
        investorId: investor.id,
        investorName: investor.name,
        withdrawalAmount: withdrawalAmount,
        commissionRate: 15,
        commissionAmount: commissionAmount,
        date: new Date().toISOString().split('T')[0],
        status: 'Earned'
      });

      onSuccess();
    } catch (error) {
      console.error('Error submitting withdrawal:', error);
      setError('Failed to submit withdrawal request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate preview
  const previewAmount = parseFloat(amount) || 0;
  const commissionPreview = previewAmount * 0.15;
  const netAmount = previewAmount - commissionPreview;

  const renderBankForm = () => (
    <div className="space-y-6">
      {/* Amount Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Withdrawal Amount (USD)
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-700">$</span>
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

      {/* Bank Account Information */}
      {investor.bankAccounts && investor.bankAccounts.length > 0 ? (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h4 className="font-medium text-gray-800 mb-3">Your Registered Bank Account</h4>
          <div className="space-y-2 text-sm">
            {investor.bankAccounts.filter(acc => acc.isPrimary).map(account => (
              <div key={account.id}>
                <p className="font-medium">{account.bankName}</p>
                <p className="text-gray-600">Account Holder: {account.accountHolderName}</p>
                <p className="text-gray-600">Account Number: ***{account.accountNumber.slice(-4)}</p>
                <p className="text-gray-600">Currency: {account.currency}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-800 mb-2">No Registered Bank Account</h4>
          <p className="text-sm text-yellow-800">
            Please register a bank account in your profile to use bank transfers.
          </p>
        </div>
      )}

      {/* Processing Information */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h4 className="font-medium text-gray-800 mb-2">Processing Information</h4>
        <ul className="text-gray-700 text-sm space-y-1">
          <li>• Withdrawal requests are typically processed within 1-3 business days.</li>
          <li>• Once approved, funds will be transferred to your registered bank account.</li>
          <li>• A 15% platform commission will be deducted.</li>
          <li>• Your account balance will be updated immediately.</li>
        </ul>
      </div>
    </div>
  );

  const renderCryptoForm = () => (
    <div className="space-y-6">
      {/* Amount Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Withdrawal Amount (USD)
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-700">$</span>
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

      {/* Exchange Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
          SELECT CRYPTO EXCHANGE
        </label>
        <select
          value={selectedExchange}
          onChange={(e) => setSelectedExchange(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
          required
        >
          <option value="">Choose exchange...</option>
          {availableExchanges.map((exchange) => (
            <option key={exchange.id} value={exchange.id}>
              {exchange.name}
            </option>
          ))}
        </select>
        {availableExchanges.length === 0 && (
          <p className="text-sm text-red-600 mt-1 uppercase tracking-wide">
            No crypto exchanges available for {investorCountry}
          </p>
        )}
      </div>

      {/* Cryptocurrency Selection */}
      {selectedExchange && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
            SELECT CRYPTOCURRENCY
          </label>
          <select
            value={selectedCrypto}
            onChange={(e) => setSelectedCrypto(e.target.value as 'BTC' | 'ETH' | 'USDT' | 'SOL')}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
            required
          >
            {supportedCryptos.map((crypto) => (
              <option key={crypto} value={crypto}>
                {crypto}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Network Selection */}
      {selectedCrypto && availableNetworks.length > 1 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
            SELECT NETWORK
          </label>
          <select
            value={selectedNetwork}
            onChange={(e) => setSelectedNetwork(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
            required
          >
            <option value="">Choose network...</option>
            {availableNetworks.map((network) => (
              <option key={network} value={network}>
                {network}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Wallet Address */}
      {selectedCrypto && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
            WALLET ADDRESS
          </label>
          <input
            type="text"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder={`Enter your ${selectedCrypto} wallet address`}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
            required
          />
        </div>
      )}

      {/* Conversion Summary */}
      {selectedCrypto && parseFloat(amount) > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2 uppercase tracking-wide">CONVERSION SUMMARY</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>USD Amount:</span>
              <span className="font-medium">${parseFloat(amount).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>You'll receive:</span>
              <span>{(cryptoAmount - (selectedExchangeData?.fees[selectedCrypto] || 0)).toFixed(8)} {selectedCrypto}</span>
            </div>
          </div>
        </div>
      )}

      {/* Processing Info */}
      {selectedExchangeData && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2 uppercase tracking-wide">PROCESSING INFORMATION</h4>
          <p className="text-sm text-blue-800">
            Processing time: {selectedExchangeData.processingTime}
          </p>
          <p className="text-sm text-blue-800 mt-1">
            A verification hash will be generated for blockchain verification once the transaction is submitted.
          </p>
        </div>
      )}
    </div>
  );

  const renderCreditCardForm = () => (
    <div className="space-y-6">
      {/* Amount Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Withdrawal Amount (USD)
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-700">$</span>
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

      {/* Important Notice */}
      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
        <h4 className="font-medium text-yellow-900 mb-2 uppercase tracking-wide">IMPORTANT NOTICE</h4>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• Credit card withdrawals are processed within 3-5 business days</li>
          <li>• A processing fee of 3.5% will be deducted from your withdrawal</li>
          <li>• Card holder name must match your registered account name</li>
          <li>• Only cards in your name are accepted for security purposes</li>
          <li>• Additional verification may be required for large amounts</li>
        </ul>
      </div>

      {/* Card Number */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
          CARD NUMBER
        </label>
        <input
          type="text"
          value={cardNumber}
          onChange={(e) => handleCardNumberChange(e.target.value)}
          placeholder="1234 5678 9012 3456"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
          maxLength={19}
          required
        />
      </div>

      {/* Card Holder Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
          CARD HOLDER NAME
        </label>
        <input
          type="text"
          value={cardHolderName}
          onChange={(e) => setCardHolderName(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
          required
        />
        <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">
          Must match your registered account name
        </p>
      </div>

      {/* Expiry Date and CVV */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
            MONTH
          </label>
          <select
            value={expiryMonth}
            onChange={(e) => setExpiryMonth(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
            required
          >
            <option value="">MM</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
              <option key={month} value={month.toString().padStart(2, '0')}>
                {month.toString().padStart(2, '0')}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
            YEAR
          </label>
          <select
            value={expiryYear}
            onChange={(e) => setExpiryYear(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
            required
          >
            <option value="">YYYY</option>
            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(year => (
              <option key={year} value={year.toString()}>
                {year}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
            CVV
          </label>
          <input
            type="text"
            value={cvv}
            onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="123"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
            maxLength={4}
            required
          />
        </div>
      </div>

      {/* Fee Summary */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2 uppercase tracking-wide">FEE SUMMARY</h4>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Withdrawal Amount:</span>
            <span className="font-medium">${amount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Processing Fee (3.5%):</span>
            <span className="font-medium">${(parseFloat(amount) * 0.035).toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t pt-1 font-medium">
            <span>Total Deducted:</span>
            <span>${(parseFloat(amount) + parseFloat(amount) * 0.035).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-green-600">
            <span>Amount to Card:</span>
            <span className="font-medium">${parseFloat(amount).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Processing Timeline */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2 uppercase tracking-wide">PROCESSING TIMELINE</h4>
        <div className="space-y-2 text-sm text-blue-800">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
            <span>Request submitted - Immediate</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
            <span>Verification & processing - 1-2 business days</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-blue-300 rounded-full mr-3"></div>
            <span>Funds available on card - 3-5 business days</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      {/* Temporary visual indicator */}
      <div className="bg-green-100 border border-green-400 text-green-800 p-2 mb-4 text-center font-bold uppercase">
        PRO WITHDRAWAL METHODS LOADED
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wide">
          PRO WITHDRAWAL METHODS
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 text-2xl"
        >
          ×
        </button>
      </div>

      {/* Method Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3 uppercase tracking-wide">
          SELECT WITHDRAWAL METHOD
        </label>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setSelectedMethod('bank')}
            className={`p-3 border rounded-lg text-center font-medium uppercase tracking-wide transition-colors ${
              selectedMethod === 'bank'
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-300 text-gray-700 hover:border-gray-400'
            }`}
          >
            BANK TRANSFER
          </button>
          <button
            onClick={() => setSelectedMethod('crypto')}
            className={`p-3 border rounded-lg text-center font-medium uppercase tracking-wide transition-colors ${
              selectedMethod === 'crypto'
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-300 text-gray-700 hover:border-gray-400'
            }`}
          >
            CRYPTOCURRENCY
          </button>
          <button
            onClick={() => setSelectedMethod('credit_card')}
            className={`p-3 border rounded-lg text-center font-medium uppercase tracking-wide transition-colors ${
              selectedMethod === 'credit_card'
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-300 text-gray-700 hover:border-gray-400'
            }`}
          >
            CREDIT CARD
          </button>
        </div>
      </div>

      {/* Method-specific forms */}
      {selectedMethod === 'bank' && renderBankForm()}
      {selectedMethod === 'crypto' && renderCryptoForm()}
      {selectedMethod === 'credit_card' && renderCreditCardForm()}

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm font-medium uppercase tracking-wide">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
        <button
          onClick={onCancel}
          className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors uppercase tracking-wide"
        >
          CANCEL
        </button>
        <button
          onClick={handleSubmit}
          disabled={isLoading || parseFloat(amount) <= 0 || parseFloat(amount) > currentBalance}
          className="px-6 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 uppercase tracking-wide"
        >
          {isLoading ? 'PROCESSING...' : 'SUBMIT WITHDRAWAL'}
        </button>
      </div>
    </div>
  );
};

export default ProWithdrawalMethods;
