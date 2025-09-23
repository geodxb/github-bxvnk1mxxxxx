import { useState } from 'react';
import { motion } from 'framer-motion';
import Card from '../common/Card';
import Button from '../common/Button';
import Modal from '../common/Modal';
import { FirestoreService } from '../../services/firestoreService';
import { Investor } from '../../types/user';
import { 
  Building, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle,
  AlertTriangle,
  CreditCard,
  Shield,
  User,
  Phone,
  MapPin,
  Clock
} from 'lucide-react';

interface BankAccount {
  id: string;
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  iban?: string;
  swiftCode?: string;
  bic?: string;
  currency: string;
  country: string;
  isVerified: boolean;
  isPrimary: boolean;
  createdAt: Date;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
}

interface BankAccountManagementProps {
  investor: Investor;
  onUpdate: () => void;
}

// Enhanced bank data for the 5 specified countries
const banksByCountry: Record<string, string[]> = {
  'Mexico': [
    'Santander México', 'Banorte', 'BBVA México', 'Banamex (Citibanamex)', 'HSBC México',
    'Scotiabank México', 'Banco Azteca', 'Inbursa', 'Banco del Bajío', 'Banregio'
  ],
  'France': [
    'BNP Paribas', 'Crédit Agricole', 'Société Générale', 'Crédit Mutuel', 'BPCE (Banque Populaire)',
    'La Banque Postale', 'Crédit du Nord', 'HSBC France', 'ING Direct France', 'Boursorama Banque'
  ],
  'Switzerland': [
    'UBS', 'Credit Suisse', 'Julius Baer', 'Pictet', 'Lombard Odier',
    'Banque Cantonale Vaudoise', 'Zürcher Kantonalbank', 'PostFinance', 'Raiffeisen Switzerland', 'Migros Bank'
  ],
  'Saudi Arabia': [
    'Saudi National Bank (SNB)', 'Al Rajhi Bank', 'Riyad Bank', 'Banque Saudi Fransi', 'Saudi British Bank (SABB)',
    'Arab National Bank', 'Bank AlJazira', 'Alinma Bank', 'Bank Albilad', 'Saudi Investment Bank'
  ],
  'United Arab Emirates': [
    'Emirates NBD', 'First Abu Dhabi Bank (FAB)', 'Abu Dhabi Commercial Bank (ADCB)', 'Dubai Islamic Bank', 'Mashreq Bank',
    'Commercial Bank of Dubai', 'Union National Bank', 'Ajman Bank', 'Bank of Sharjah', 'Fujairah National Bank'
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
    currency: 'MXN'
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

const BankAccountManagement = ({ investor, onUpdate }: BankAccountManagementProps) => {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedBank, setSelectedBank] = useState('');
  const [bankFormData, setBankFormData] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Get investor country and available banks
  const investorCountry = investor.country;
  const availableBanks = banksByCountry[investorCountry] || [];
  const countryBankFields = bankFormFields[investorCountry];

  // Initialize with existing bank details if available
  useState(() => {
    if (investor.bankDetails && investor.bankDetails.bankName) {
      const existingAccount: BankAccount = {
        id: 'primary',
        bankName: investor.bankDetails.bankName,
        accountHolderName: investor.bankDetails.accountHolderName || investor.name,
        accountNumber: investor.bankDetails.accountNumber || '',
        iban: investor.bankDetails.iban || '',
        swiftCode: investor.bankDetails.swiftCode || '',
        currency: investor.bankDetails.currency || countryBankFields?.currency || 'USD',
        country: investor.country,
        isVerified: true,
        isPrimary: true,
        createdAt: new Date(),
        verificationStatus: 'approved'
      };
      setBankAccounts([existingAccount]);
    }
  });

  const handleBankFormChange = (fieldName: string, value: string) => {
    setBankFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const validateBankForm = () => {
    if (!selectedBank) {
      setError('Please select a bank');
      return false;
    }
    
    if (countryBankFields) {
      for (const field of countryBankFields.fields) {
        if (field.required && !bankFormData[field.name]?.trim()) {
          setError(`Please enter ${field.label}`);
          return false;
        }
      }
    }
    
    // Validate account holder name matches investor name
    if (bankFormData.accountHolderName && 
        bankFormData.accountHolderName.toLowerCase() !== investor.name.toLowerCase()) {
      setError('Account holder name must match your registered name');
      return false;
    }
    
    setError('');
    return true;
  };

  const handleAddBankAccount = async () => {
    if (!validateBankForm()) return;

    setIsLoading(true);
    
    try {
      const newBankAccount: BankAccount = {
        id: `bank_${Date.now()}`,
        bankName: selectedBank,
        accountHolderName: bankFormData.accountHolderName || investor.name,
        accountNumber: bankFormData.accountNumber || '',
        iban: bankFormData.iban || '',
        swiftCode: bankFormData.swiftCode || bankFormData.bic || '',
        currency: countryBankFields?.currency || 'USD',
        country: investor.country,
        isVerified: false,
        isPrimary: bankAccounts.length === 0,
        createdAt: new Date(),
        verificationStatus: 'pending'
      };

      // Add to local state
      setBankAccounts(prev => [...prev, newBankAccount]);

      // Store in Firebase under investor's bankAccounts array
      const updatedBankAccounts = [...bankAccounts, newBankAccount];
      await FirestoreService.updateInvestor(investor.id, {
        bankAccounts: updatedBankAccounts
      });

      setIsSuccess(true);
      setSelectedBank('');
      setBankFormData({});
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setIsSuccess(false);
        setShowAddModal(false);
      }, 3000);

      onUpdate();
    } catch (error) {
      console.error('Error adding bank account:', error);
      setError('Failed to add bank account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetPrimary = async (accountId: string) => {
    try {
      const updatedAccounts = bankAccounts.map(account => ({
        ...account,
        isPrimary: account.id === accountId
      }));
      
      setBankAccounts(updatedAccounts);
      
      // Update in Firebase
      await FirestoreService.updateInvestor(investor.id, {
        bankAccounts: updatedAccounts
      });
      
      onUpdate();
    } catch (error) {
      console.error('Error setting primary account:', error);
    }
  };

  const handleRemoveAccount = async (accountId: string) => {
    try {
      const updatedAccounts = bankAccounts.filter(account => account.id !== accountId);
      setBankAccounts(updatedAccounts);
      
      // Update in Firebase
      await FirestoreService.updateInvestor(investor.id, {
        bankAccounts: updatedAccounts
      });
      
      onUpdate();
    } catch (error) {
      console.error('Error removing bank account:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Bank Accounts List */}
      <Card title="REGISTERED BANK ACCOUNTS">
        <div className="space-y-4">
          {bankAccounts.length > 0 ? (
            bankAccounts.map((account) => (
              <div key={account.id} className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <Building size={20} className="text-gray-600" />
                      <h4 className="font-bold text-gray-900 uppercase tracking-wide">{account.bankName}</h4>
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
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 font-medium uppercase tracking-wide">ACCOUNT HOLDER</p>
                        <p className="font-medium text-gray-900">{account.accountHolderName}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 font-medium uppercase tracking-wide">ACCOUNT NUMBER</p>
                        <p className="font-medium text-gray-900">***{account.accountNumber.slice(-4)}</p>
                      </div>
                      {account.iban && (
                        <div>
                          <p className="text-gray-600 font-medium uppercase tracking-wide">IBAN</p>
                          <p className="font-medium text-gray-900">{account.iban}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-gray-600 font-medium uppercase tracking-wide">CURRENCY</p>
                        <p className="font-medium text-gray-900">{account.currency}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    {!account.isPrimary && account.verificationStatus === 'approved' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSetPrimary(account.id)}
                      >
                        Set as Primary
                      </Button>
                    )}
                    {account.id !== 'primary' && (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleRemoveAccount(account.id)}
                      >
                        <Trash2 size={14} className="mr-1" />
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
                
                {account.verificationStatus === 'rejected' && account.rejectionReason && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle size={16} className="text-red-600 mt-0.5" />
                      <div>
                        <h5 className="font-medium text-red-800 uppercase tracking-wide">VERIFICATION REJECTED</h5>
                        <p className="text-red-700 text-sm mt-1">{account.rejectionReason}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">No Bank Accounts Registered</h3>
              <p className="text-gray-500 mb-6">
                Add your bank account information to enable withdrawals
              </p>
            </div>
          )}
          
          {/* Add Bank Account Button */}
          <div className="pt-4 border-t border-gray-200">
            <Button
              variant="primary"
              onClick={() => setShowAddModal(true)}
              disabled={!availableBanks.length}
              className="w-full md:w-auto"
            >
              <Plus size={18} className="mr-2" />
              Add New Bank Account
            </Button>
            
            {!availableBanks.length && (
              <p className="text-sm text-gray-500 mt-2 uppercase tracking-wide">
                Bank registration not available for {investor.country}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Bank Account Guidelines */}
      <Card title="BANK ACCOUNT GUIDELINES">
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Shield size={20} className="text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800 uppercase tracking-wide">VERIFICATION REQUIREMENTS</h4>
                <ul className="text-blue-700 text-sm mt-2 space-y-1">
                  <li className="uppercase tracking-wide">• Account holder name must match your registered name exactly</li>
                  <li className="uppercase tracking-wide">• Bank must be located in your registered country ({investor.country})</li>
                  <li className="uppercase tracking-wide">• All bank accounts require verification before use</li>
                  <li className="uppercase tracking-wide">• Verification typically takes 1-3 business days</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-2 uppercase tracking-wide">SUPPORTED COUNTRIES</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              {Object.keys(banksByCountry).map(country => (
                <div key={country} className={`p-2 rounded ${
                  country === investor.country ? 'bg-green-100 text-green-800 font-medium' : 'text-gray-600'
                }`}>
                  {country}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Add Bank Account Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setSelectedBank('');
          setBankFormData({});
          setError('');
          setIsSuccess(false);
        }}
        title="ADD NEW BANK ACCOUNT"
        size="lg"
      >
        {!isSuccess ? (
          <div className="space-y-6">
            {/* Country Information */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-3">
                <MapPin size={20} className="text-gray-600" />
                <div>
                  <h4 className="font-medium text-gray-800 uppercase tracking-wide">ACCOUNT COUNTRY</h4>
                  <p className="text-gray-700 text-sm uppercase tracking-wide">
                    Bank account must be registered in {investor.country}
                  </p>
                </div>
              </div>
            </div>

            {/* Bank Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                SELECT BANK
              </label>
              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
                required
              >
                <option value="">Choose your bank...</option>
                {availableBanks.map((bank, index) => (
                  <option key={index} value={bank}>{bank}</option>
                ))}
              </select>
            </div>

            {/* Bank Account Form */}
            {selectedBank && countryBankFields && (
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h5 className="font-medium text-gray-800 mb-4 uppercase tracking-wide">
                  BANK ACCOUNT DETAILS FOR {selectedBank}
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {countryBankFields.fields.map((field: any) => (
                    <div key={field.name} className={field.name === 'address' ? 'md:col-span-2' : ''}>
                      <label className="block text-sm font-medium text-gray-700 mb-1 uppercase tracking-wide">
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
                          value={bankFormData[field.name] || (field.name === 'accountHolderName' ? investor.name : '')}
                          onChange={(e) => handleBankFormChange(field.name, e.target.value)}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium ${
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
                
                <div className="mt-4 p-3 bg-white rounded border border-gray-300">
                  <p className="text-gray-800 text-sm font-medium uppercase tracking-wide">
                    <strong>Currency:</strong> Withdrawals will be converted to {countryBankFields.currency} at current exchange rates.
                  </p>
                </div>
              </div>
            )}

            {/* Verification Notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Clock size={20} className="text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800 uppercase tracking-wide">VERIFICATION REQUIRED</h4>
                  <p className="text-yellow-700 text-sm mt-1 uppercase tracking-wide">
                    New bank accounts require verification before they can be used for withdrawals. 
                    This process typically takes 1-3 business days.
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle size={16} />
                  <span className="font-medium uppercase tracking-wide">{error}</span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex space-x-4">
              <Button
                variant="outline"
                onClick={() => setShowAddModal(false)}
                disabled={isLoading}
                className="flex-1"
              >
                CANCEL
              </Button>
              <Button
                variant="primary"
                onClick={handleAddBankAccount}
                isLoading={isLoading}
                disabled={!selectedBank || isLoading}
                className="flex-1"
              >
                <Plus size={16} className="mr-2" />
                {isLoading ? 'ADDING ACCOUNT...' : 'ADD BANK ACCOUNT'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wide">
              BANK ACCOUNT ADDED SUCCESSFULLY
            </h3>
            <p className="text-gray-700 mb-6 font-medium uppercase tracking-wide">
              Your new bank account has been submitted for verification. You will be notified once the verification is complete.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-gray-800 text-sm font-medium uppercase tracking-wide">
                <strong>Next Steps:</strong> Our compliance team will verify your bank account details. 
                This typically takes 1-3 business days. You'll receive an email notification once verification is complete.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BankAccountManagement;