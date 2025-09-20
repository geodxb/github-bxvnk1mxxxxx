import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { useAuth } from '../../contexts/AuthContext';
import { FirestoreService } from '../../services/firestoreService';
import { AccountCreationRequest } from '../../types/user';
import { User, Mail, Phone, MapPin, Building, CreditCard, FileText, Upload, CheckCircle, ArrowRight, ArrowLeft, AlertTriangle, Eye, Download, Shield, Globe, DollarSign, X, Camera, Car as IdCard, Scroll, Check } from 'lucide-react';

// Comprehensive country list
const countries = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan',
  'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia',
  'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon', 'Canada',
  'Cape Verde', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Croatia',
  'Cuba', 'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador',
  'Equatorial Guinea', 'Eritrea', 'Estonia', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon', 'Gambia', 'Georgia',
  'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras',
  'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Jamaica',
  'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon',
  'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives',
  'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia',
  'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua',
  'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau', 'Panama', 'Papua New Guinea',
  'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis',
  'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone',
  'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka',
  'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste',
  'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates',
  'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
];

// Country-specific banking requirements
const bankingRequirements: Record<string, any> = {
  'Argentina': {
    fields: [
      { name: 'accountHolderName', label: 'Account Holder Name', type: 'text', required: true },
      { name: 'cbu', label: 'CBU (Clave Bancaria Uniforme)', type: 'text', required: true, maxLength: 22, pattern: /^\d{22}$/ },
      { name: 'alias', label: 'ALIAS', type: 'text', required: true, maxLength: 20 },
      { name: 'swiftCode', label: 'SWIFT Code', type: 'text', required: true, maxLength: 11 },
      { name: 'bankName', label: 'Bank Name', type: 'text', required: true }
    ],
    currency: 'ARS'
  },
  'Mexico': {
    fields: [
      { name: 'accountHolderName', label: 'Account Holder Name', type: 'text', required: true },
      { name: 'clabe', label: 'CUENTA CLABE', type: 'text', required: true, maxLength: 18, pattern: /^\d{18}$/ },
      { name: 'swiftCode', label: 'SWIFT Code', type: 'text', required: true, maxLength: 11 },
      { name: 'bankName', label: 'Bank Name', type: 'text', required: true },
      { name: 'bankBranch', label: 'Bank Branch', type: 'text', required: false }
    ],
    currency: 'MXN'
  },
  'United Arab Emirates': {
    fields: [
      { name: 'accountHolderName', label: 'Account Holder Name', type: 'text', required: true },
      { name: 'iban', label: 'IBAN', type: 'text', required: true, maxLength: 23 },
      { name: 'swiftCode', label: 'SWIFT Code', type: 'text', required: true, maxLength: 11 },
      { name: 'bankName', label: 'Bank Name', type: 'text', required: true },
      { name: 'emiratesId', label: 'Emirates ID', type: 'text', required: true },
      { name: 'phoneNumber', label: 'Phone Number', type: 'tel', required: true }
    ],
    currency: 'AED'
  },
  'France': {
    fields: [
      { name: 'accountHolderName', label: 'Account Holder Name', type: 'text', required: true },
      { name: 'iban', label: 'IBAN', type: 'text', required: true, maxLength: 34 },
      { name: 'bic', label: 'BIC/SWIFT Code', type: 'text', required: true, maxLength: 11 },
      { name: 'bankName', label: 'Bank Name', type: 'text', required: true },
      { name: 'address', label: 'Address', type: 'text', required: true }
    ],
    currency: 'EUR'
  },
  'Switzerland': {
    fields: [
      { name: 'accountHolderName', label: 'Account Holder Name', type: 'text', required: true },
      { name: 'iban', label: 'IBAN', type: 'text', required: true, maxLength: 21 },
      { name: 'bic', label: 'BIC/SWIFT Code', type: 'text', required: true, maxLength: 11 },
      { name: 'bankName', label: 'Bank Name', type: 'text', required: true },
      { name: 'address', label: 'Address', type: 'text', required: true }
    ],
    currency: 'CHF'
  },
  'Saudi Arabia': {
    fields: [
      { name: 'accountHolderName', label: 'Account Holder Name', type: 'text', required: true },
      { name: 'iban', label: 'IBAN', type: 'text', required: true, maxLength: 24 },
      { name: 'swiftCode', label: 'SWIFT Code', type: 'text', required: true, maxLength: 11 },
      { name: 'bankName', label: 'Bank Name', type: 'text', required: true },
      { name: 'phoneNumber', label: 'Phone Number', type: 'tel', required: true }
    ],
    currency: 'SAR'
  }
};

// ADCB Bank Account Details (ending in 001)
const adcbBankDetails = {
  accountHolderName: 'Cristian Rolando Dorao',
  bankName: 'Abu Dhabi Commercial Bank (ADCB)',
  bankAddress: 'ADCB Building, Al Nasr Street, Abu Dhabi, United Arab Emirates',
  accountNumber: '13567890123456001',
  iban: 'AE680030013567890123456001',
  swiftCode: 'ADCBAEAAXXX',
  routingCode: 'ADCB030',
  branchCode: '001',
  currency: 'AED',
  country: 'United Arab Emirates',
  additionalInstructions: 'For international transfers, please include the full IBAN and SWIFT code. Reference: Interactive Brokers Investment Account'
};

interface InvestorOnboardingFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const InvestorOnboardingFlow = ({ isOpen, onClose, onSuccess }: InvestorOnboardingFlowProps) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    country: '',
    city: '',
    initialDeposit: '',
    accountType: 'Standard' as 'Standard' | 'Pro',
    bankDetails: {} as Record<string, string>
  });
  
  const [identityDocument, setIdentityDocument] = useState<{
    type: 'id_card' | 'passport';
    file: File | null;
    base64Data: string;
  }>({
    type: 'id_card',
    file: null,
    base64Data: ''
  });
  
  const [proofOfDeposit, setProofOfDeposit] = useState<{
    file: File | null;
    base64Data: string;
  }>({
    file: null,
    base64Data: ''
  });
  
  const [agreementScrolled, setAgreementScrolled] = useState(false);
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  
  const agreementRef = useRef<HTMLDivElement>(null);
  const totalSteps = 6;

  // Convert file to base64
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle identity document upload
  const handleIdentityUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload only JPG, PNG, or PDF files');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const base64Data = await convertToBase64(file);
      setIdentityDocument({
        type: identityDocument.type,
        file,
        base64Data
      });
    } catch (error) {
      console.error('Error converting file:', error);
      setError('Failed to process file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle proof of deposit upload
  const handleProofOfDepositUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload only JPG, PNG, or PDF files');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const base64Data = await convertToBase64(file);
      setProofOfDeposit({
        file,
        base64Data
      });
    } catch (error) {
      console.error('Error converting file:', error);
      setError('Failed to process file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle agreement scroll detection
  const handleAgreementScroll = () => {
    if (agreementRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = agreementRef.current;
      const scrolledToBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px tolerance
      setAgreementScrolled(scrolledToBottom);
    }
  };

  // Generate agreement content with investor data
  const generateAgreementContent = () => {
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
INVESTMENT AND OPERATION AGREEMENT

This Investment and Operation Agreement ("Agreement") is entered into on the date of signature by and between:

TRADER INFORMATION:
Trader: Cristian Rolando Dorao, residing at Le Park II, Villa No. 9, Jumeirah Village Circle, Dubai, hereinafter referred to as the "Trader".

INVESTOR INFORMATION:
Name: ${formData.fullName}
Email: ${formData.email}
Phone: ${formData.phone}
Country: ${formData.country}
City: ${formData.city}
Account Type: ${formData.accountType}
Initial Deposit: $${parseFloat(formData.initialDeposit || '0').toLocaleString()} USD

CONSIDERATIONS

The Trader operates a portfolio using the capital provided by the Investor to trade in the Forex and cryptocurrency markets.
The Trader uses InteractiveBrokers, a highly regulated trading platform, to execute trades.
The Investor agrees to provide the funds and comply with the terms and conditions set forth in this document.
By virtue of the following clauses and mutual agreements, the parties agree as follows:

1. DEFINITIONS

1.1 Minimum Investment: USD 1,000 or its equivalent in local currency.
1.2 Trading Instruments:
    • Forex: Gold/USD (XAUUSD) and major currency pairs.
    • Cryptocurrencies: Bitcoin (BTC), Ethereum (ETH), and other major cryptocurrencies.
1.3 Trading Strategy: The Trader employs fundamental analysis, trend analysis, and liquidity swaps to identify trading opportunities.

2. INVESTMENT PERIOD

2.1 Cryptocurrency Trading: Operated for 30 calendar days.
2.2 Forex Trading: Operated for 20 business days.
2.3 The Investor may request withdrawals in accordance with Section 5.

3. OBLIGATIONS OF THE INVESTOR

3.1 The Investor must provide valid documentation and undergo thorough verification to comply with anti-fraud and anti-money laundering regulations.
3.2 The Investor agrees to transfer a minimum of USD 1,000 or its equivalent to the Trader's account for trading purposes.
3.3 The Trader guarantees that the initial investment amount will remain safe during the term of the contract. If the Trader, by error or misconduct, executes orders without due caution or proper analysis resulting in losses, the Investor shall have the right to revoke the contract. In the event of revocation, the Trader must return the full initial investment amount to the Investor without deduction of losses.

4. TRADER'S COMPENSATION

4.1 The Trader is entitled to 15% of the net profits generated through trading, as regulated by InteractiveBrokers.
4.2 No additional fees or charges shall be applied to the Investor by the Trader.
4.3 Any request by the Trader for an additional percentage must be documented and immediately reported to InteractiveBrokers support.

5. WITHDRAWALS

5.1 Monthly Withdrawals: The Investor may withdraw profits monthly while maintaining the minimum deposit of USD 1,000.
5.2 Full Balance Withdrawal:
    • The Investor must follow the account closure process, which may take up to 60 calendar days.
    • After account closure, the Investor may not open a new account for 90 days.
5.3 Withdrawals must be made to a bank account matching the name and address provided at registration.
5.4 Any change in citizenship or address of the Investor must be immediately reported to the Trader and to InteractiveBrokers.

6. TERM AND TERMINATION

6.1 This Agreement has no fixed term and shall remain in effect until terminated by mutual agreement or as follows:
    • By the Investor: Through written notice and completion of the withdrawal process.
    • By the Trader: Through written notice, subject to fulfilling his obligations under this Agreement.

7. REGULATORY COMPLIANCE

7.1 This Agreement is governed by the laws of the UAE.
7.2 Both parties agree to comply with applicable laws, including anti-money laundering and fraud regulations.

8. REPRESENTATIONS AND WARRANTIES

8.1 Investor's Representations:
    • The Investor possesses the necessary funds and understands the risks associated with Forex and cryptocurrency trading.
    • The Investor acknowledges that profits are not guaranteed.
8.2 Trader's Representations:
    • The Trader will execute trades professionally and diligently.
    • The Trader will not request compensation beyond the agreed profit percentage.

9. INDEMNIFICATION AND LIABILITY

9.1 The Trader shall not be liable for losses arising from market fluctuations or unforeseen economic events.
9.2 The Investor agrees to indemnify the Trader against any claim, liability, or damage arising from the Investor's breach of this Agreement.

10. DISPUTE RESOLUTION

10.1 Any dispute arising from this Agreement shall be resolved amicably.
10.2 If unresolved, the dispute shall be submitted to arbitration under UAE law.
10.3 The parties expressly and irrevocably agree to submit to the jurisdiction of the competent courts of the United Arab Emirates, city of Dubai, UAE, expressly waiving any other jurisdiction that may correspond to them due to their present or future domicile or the location of their assets.

11. EXECUTION AND VALIDATION

11.1 This Agreement enters into force once signed by both parties and validated by InteractiveBrokers.

NOTICE: Withdrawal processing times are subject to various factors such as currency type, Investor's country, and banking institutions. Times are relative and subject to modification by the broker.

SIGNATURES

Trader:
Name: Cristian Rolando Dorao
Signature: ______________________
Date: ${currentDate}

Investor:
Name: ${formData.fullName}
Signature: ______________________
Date: ${currentDate}

This agreement was generated on ${currentDate} for ${formData.fullName} (Country: ${formData.country})
    `.trim();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBankInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      bankDetails: {
        ...prev.bankDetails,
        [name]: value
      }
    }));
  };

  const validateStep = () => {
    setError('');
    switch (currentStep) {
      case 1: // Personal Information
        if (!formData.fullName.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.country.trim() || !formData.city.trim()) {
          setError('All personal information fields are required.');
          return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          setError('Please enter a valid email address.');
          return false;
        }
        break;
      case 2: // Bank Account Details
        const countryBankReqs = bankingRequirements[formData.country];
        if (!countryBankReqs) {
          setError('Banking requirements not available for selected country.');
          return false;
        }
        for (const field of countryBankReqs.fields) {
          if (field.required && !formData.bankDetails[field.name]?.trim()) {
            setError(`${field.label} is required.`);
            return false;
          }
          if (field.pattern && formData.bankDetails[field.name] && !field.pattern.test(formData.bankDetails[field.name])) {
            setError(`Invalid format for ${field.label}.`);
            return false;
          }
        }
        break;
      case 3: // Identity Verification
        if (!identityDocument.base64Data) {
          setError('Please upload your identity document.');
          return false;
        }
        break;
      case 4: // Proof of Deposit
        if (!proofOfDeposit.base64Data) {
          setError('Please upload proof of deposit.');
          return false;
        }
        break;
      case 5: // Agreement
        if (!agreementScrolled) {
          setError('Please scroll to the end of the agreement to continue.');
          return false;
        }
        if (!agreementAccepted) {
          setError('You must agree to the terms and conditions to continue.');
          return false;
        }
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep() || !user) return;

    setIsLoading(true);
    setError('');

    try {
      const requestData: Omit<AccountCreationRequest, 'id' | 'createdAt' | 'updatedAt'> = {
        applicantName: formData.fullName,
        applicantEmail: formData.email,
        applicantPhone: formData.phone,
        applicantCountry: formData.country,
        applicantCity: formData.city,
        requestedBy: user.id,
        requestedByName: user.name,
        requestedAt: new Date(),
        status: 'pending',
        initialDeposit: parseFloat(formData.initialDeposit),
        accountType: formData.accountType,
        bankDetails: {
          ...formData.bankDetails,
          currency: bankingRequirements[formData.country]?.currency || 'USD',
          country: formData.country
        },
        identityDocument: {
          type: identityDocument.type,
          fileName: identityDocument.file?.name || 'identity_document',
          fileType: identityDocument.file?.type || 'image/jpeg',
          fileSize: identityDocument.file?.size || 0,
          base64Data: identityDocument.base64Data,
          uploadedAt: new Date()
        },
        proofOfDeposit: {
          fileName: proofOfDeposit.file?.name || 'proof_of_deposit',
          fileType: proofOfDeposit.file?.type || 'image/jpeg',
          fileSize: proofOfDeposit.file?.size || 0,
          base64Data: proofOfDeposit.base64Data,
          uploadedAt: new Date()
        },
        agreementAccepted: true,
        agreementAcceptedAt: new Date()
      };

      await FirestoreService.addAccountCreationRequest(requestData);
      
      setIsSuccess(true);
      
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 3000);
      }
    } catch (err) {
      console.error('Error submitting onboarding:', err);
      setError('Failed to submit application. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      fullName: '', email: '', phone: '', country: '', city: '',
      initialDeposit: '', accountType: 'Standard', bankDetails: {}
    });
    setIdentityDocument({ type: 'id_card', file: null, base64Data: '' });
    setProofOfDeposit({ file: null, base64Data: '' });
    setCurrentStep(1);
    setError('');
    setIsSuccess(false);
    setAgreementScrolled(false);
    setAgreementAccepted(false);
    onClose();
  };

  const currentCountryBankingReqs = bankingRequirements[formData.country];

  if (isSuccess) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="APPLICATION SUBMITTED">
        <div className="text-center py-12">
          <div className="mb-8">
            <img 
              src="/Screenshot 2025-06-07 024813.png" 
              alt="Interactive Brokers" 
              className="h-16 w-auto object-contain mx-auto"
              style={{ opacity: 0.4 }}
            />
          </div>
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4 uppercase tracking-wide">
            APPLICATION SUBMITTED SUCCESSFULLY
          </h3>
          <p className="text-gray-700 mb-8 font-medium text-lg uppercase tracking-wide">
            Your application has been sent to management for review and may take up to 48 hours to complete
          </p>
          <button
            onClick={handleClose}
            className="px-8 py-3 bg-gray-900 text-white font-bold hover:bg-gray-800 transition-colors rounded-lg uppercase tracking-wide"
          >
            CLOSE
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="INVESTOR ONBOARDING" size="lg">
      <div className="space-y-6">
        {/* Progress Indicator */}
        <div className="flex justify-between mb-8">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div key={index} className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white border-2 ${
                currentStep > index ? 'bg-gray-900 border-gray-900' : 
                currentStep === index + 1 ? 'bg-gray-600 border-gray-600' : 'bg-gray-300 border-gray-300'
              }`}>
                {currentStep > index ? <CheckCircle size={16} /> : index + 1}
              </div>
              <span className="text-xs mt-2 text-gray-600 font-medium uppercase tracking-wide">
                {index === 0 && 'Personal'}
                {index === 1 && 'Banking'}
                {index === 2 && 'Identity'}
                {index === 3 && 'Deposit'}
                {index === 4 && 'Agreement'}
                {index === 5 && 'Complete'}
              </span>
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle size={16} />
              <span className="font-medium uppercase tracking-wide">{error}</span>
            </div>
          </div>
        )}

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            {/* Step 1: Personal Details */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wide flex items-center">
                    <User size={20} className="mr-2" />
                    INVESTOR PERSONAL DETAILS
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                        FULL NAME *
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
                        placeholder="Enter your full legal name"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                        EMAIL ADDRESS *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
                        placeholder="Enter your email address"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                        PHONE NUMBER *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
                        placeholder="Enter your phone number"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                        COUNTRY OF RESIDENCE *
                      </label>
                      <select
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
                        required
                      >
                        <option value="">Select your country</option>
                        {countries.map(country => (
                          <option key={country} value={country}>{country}</option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                        CITY *
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
                        placeholder="Enter your city"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                        INITIAL DEPOSIT (USD) *
                      </label>
                      <input
                        type="number"
                        name="initialDeposit"
                        value={formData.initialDeposit}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
                        placeholder="Minimum $1,000"
                        min="1000"
                        step="0.01"
                        required
                      />
                      <p className="text-xs text-gray-600 mt-1 uppercase tracking-wide">
                        Minimum initial deposit: $1,000
                      </p>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                        ACCOUNT TYPE
                      </label>
                      <select
                        name="accountType"
                        value={formData.accountType}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
                      >
                        <option value="Standard">Standard Account</option>
                        <option value="Pro">Pro Account</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Bank Account Details */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wide flex items-center">
                    <Building size={20} className="mr-2" />
                    BANK ACCOUNT DETAILS - {formData.country.toUpperCase()}
                  </h3>
                  
                  {!currentCountryBankingReqs ? (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle size={16} />
                        <span className="uppercase tracking-wide">Banking requirements not available for {formData.country}. Please select a different country in Step 1.</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <p className="text-blue-800 text-sm font-medium uppercase tracking-wide">
                          <strong>Currency:</strong> Withdrawals will be processed in {currentCountryBankingReqs.currency}
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentCountryBankingReqs.fields.map((field: any) => (
                          <div key={field.name} className={field.name === 'address' ? 'md:col-span-2' : ''}>
                            <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                              {field.label} {field.required && <span className="text-red-500">*</span>}
                            </label>
                            <input
                              type={field.type}
                              name={field.name}
                              value={formData.bankDetails[field.name] || ''}
                              onChange={handleBankInputChange}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
                              placeholder={field.label}
                              maxLength={field.maxLength}
                              required={field.required}
                            />
                            {field.pattern && (
                              <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">
                                {field.name === 'cbu' && 'Format: 22 digits'}
                                {field.name === 'clabe' && 'Format: 18 digits'}
                                {field.name === 'iban' && `Format: ${field.maxLength} characters max`}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Identity Verification */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wide flex items-center">
                    <Shield size={20} className="mr-2" />
                    IDENTITY VERIFICATION
                  </h3>
                  
                  {/* Document Type Selection */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3 uppercase tracking-wide">
                      SELECT DOCUMENT TYPE
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setIdentityDocument(prev => ({ ...prev, type: 'id_card' }))}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          identityDocument.type === 'id_card'
                            ? 'border-gray-900 bg-gray-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <IdCard size={20} className="text-gray-600" />
                          <span className="font-medium text-gray-900 uppercase tracking-wide">ID CARD</span>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIdentityDocument(prev => ({ ...prev, type: 'passport' }))}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          identityDocument.type === 'passport'
                            ? 'border-gray-900 bg-gray-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <FileText size={20} className="text-gray-600" />
                          <span className="font-medium text-gray-900 uppercase tracking-wide">PASSPORT</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* File Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                      UPLOAD {identityDocument.type === 'id_card' ? 'ID CARD' : 'PASSPORT'} *
                    </label>
                    <div className="border-2  border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleIdentityUpload}
                        className="hidden"
                        id="identity-upload"
                        disabled={isUploading}
                      />
                      <label htmlFor="identity-upload" className="cursor-pointer">
                        {identityDocument.base64Data ? (
                          <div className="space-y-4">
                            {identityDocument.file?.type.startsWith('image/') ? (
                              <img
                                src={identityDocument.base64Data}
                                alt="Identity Document"
                                className="max-h-48 mx-auto rounded-lg border border-gray-200"
                              />
                            ) : (
                              <div className="flex items-center justify-center space-x-2">
                                <FileText size={24} className="text-gray-600" />
                                <span className="text-gray-600 font-medium uppercase tracking-wide">
                                  {identityDocument.file?.name}
                                </span>
                              </div>
                            )}
                            <p className="text-green-600 font-medium uppercase tracking-wide">
                              ✓ DOCUMENT UPLOADED SUCCESSFULLY
                            </p>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">
                              Click to replace document
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Upload size={32} className="mx-auto text-gray-400" />
                            <p className="text-gray-600 font-medium uppercase tracking-wide">
                              {isUploading ? 'UPLOADING...' : 'CLICK TO UPLOAD DOCUMENT'}
                            </p>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">
                              JPG, PNG, or PDF (Max 10MB)
                            </p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Proof of Deposit */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wide flex items-center">
                    <CreditCard size={20} className="mr-2" />
                    ADCB BANK ACCOUNT DETAILS
                  </h3>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p className="text-blue-800 text-sm font-medium uppercase tracking-wide mb-2">
                      TRANSFER YOUR INITIAL DEPOSIT TO THE FOLLOWING ACCOUNT:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">ACCOUNT HOLDER</label>
                        <p className="font-bold text-gray-900">{adcbBankDetails.accountHolderName}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">BANK NAME</label>
                        <p className="font-bold text-gray-900">{adcbBankDetails.bankName}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">BANK ADDRESS</label>
                        <p className="font-bold text-gray-900">{adcbBankDetails.bankAddress}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">ACCOUNT NUMBER</label>
                        <p className="font-bold text-gray-900 font-mono">{adcbBankDetails.accountNumber}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">IBAN</label>
                        <p className="font-bold text-gray-900 font-mono">{adcbBankDetails.iban}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">SWIFT CODE</label>
                        <p className="font-bold text-gray-900 font-mono">{adcbBankDetails.swiftCode}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">ROUTING CODE</label>
                        <p className="font-bold text-gray-900 font-mono">{adcbBankDetails.routingCode}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">BRANCH CODE</label>
                        <p className="font-bold text-gray-900 font-mono">{adcbBankDetails.branchCode}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <p className="text-yellow-800 text-sm font-medium uppercase tracking-wide">
                      <strong>TRANSFER INSTRUCTIONS:</strong> {adcbBankDetails.additionalInstructions}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wide flex items-center">
                    <Upload size={20} className="mr-2" />
                    UPLOAD PROOF OF DEPOSIT
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                      PROOF OF DEPOSIT DOCUMENT *
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleProofOfDepositUpload}
                        className="hidden"
                        id="deposit-upload"
                        disabled={isUploading}
                      />
                      <label htmlFor="deposit-upload" className="cursor-pointer">
                        {proofOfDeposit.base64Data ? (
                          <div className="space-y-4">
                            {proofOfDeposit.file?.type.startsWith('image/') ? (
                              <img
                                src={proofOfDeposit.base64Data}
                                alt="Proof of Deposit"
                                className="max-h-48 mx-auto rounded-lg border border-gray-200"
                              />
                            ) : (
                              <div className="flex items-center justify-center space-x-2">
                                <FileText size={24} className="text-gray-600" />
                                <span className="text-gray-600 font-medium uppercase tracking-wide">
                                  {proofOfDeposit.file?.name}
                                </span>
                              </div>
                            )}
                            <p className="text-green-600 font-medium uppercase tracking-wide">
                              ✓ PROOF OF DEPOSIT UPLOADED SUCCESSFULLY
                            </p>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">
                              Click to replace document
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Upload size={32} className="mx-auto text-gray-400" />
                            <p className="text-gray-600 font-medium uppercase tracking-wide">
                              {isUploading ? 'UPLOADING...' : 'CLICK TO UPLOAD PROOF OF DEPOSIT'}
                            </p>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">
                              Bank receipt, transfer confirmation, or screenshot (JPG, PNG, PDF - Max 10MB)
                            </p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Agreement */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wide flex items-center">
                    <Scroll size={20} className="mr-2" />
                    INVESTMENT AGREEMENT
                  </h3>
                  
                  <div 
                    ref={agreementRef}
                    onScroll={handleAgreementScroll}
                    className="h-96 overflow-y-auto border border-gray-300 rounded-lg p-4 bg-white text-sm leading-relaxed"
                  >
                    <pre className="whitespace-pre-wrap font-mono text-xs">
                      {generateAgreementContent()}
                    </pre>
                  </div>

                  <div className="mt-6 space-y-4">
                    {!agreementScrolled && (
                      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle size={16} />
                          <span className="font-medium uppercase tracking-wide">
                            Please scroll to the end of the agreement to continue
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id="agreement-checkbox"
                        checked={agreementAccepted}
                        onChange={(e) => setAgreementAccepted(e.target.checked)}
                        disabled={!agreementScrolled}
                        className="mt-1 h-4 w-4 text-gray-900 focus:ring-gray-300 border-gray-300 rounded disabled:opacity-50"
                      />
                      <label 
                        htmlFor="agreement-checkbox" 
                        className={`text-sm font-medium uppercase tracking-wide ${
                          !agreementScrolled ? 'text-gray-400' : 'text-gray-900'
                        }`}
                      >
                        By clicking you agree to all terms and conditions in the agreement
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="flex items-center space-x-2 uppercase tracking-wide"
          >
            <ArrowLeft size={16} />
            <span>BACK</span>
          </Button>

          {currentStep < totalSteps ? (
            <Button
              onClick={handleNext}
              disabled={isLoading || isUploading}
              className="flex items-center space-x-2 uppercase tracking-wide"
            >
              <span>NEXT</span>
              <ArrowRight size={16} />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !agreementAccepted || !agreementScrolled}
              className="flex items-center space-x-2 uppercase tracking-wide"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>SUBMITTING...</span>
                </>
              ) : (
                <>
                  <span>SUBMIT APPLICATION</span>
                  <CheckCircle size={16} />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default InvestorOnboardingFlow;