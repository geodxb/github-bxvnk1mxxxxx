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
  Clock,
  Save
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
  bankAddress?: string;
}

interface BankAccountRegistrationProps {
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
      { name: 'swiftCode', label: 'SWIFT Code', type: 'text', required: true, maxLength: 11 },
      { name: 'bankBranch', label: 'Bank Branch', type: 'text', required: false },
      { name: 'phoneNumber', label: 'Phone Number', type: 'tel', required: true },
      { name: 'bankAddress', label: 'Bank Address', type: 'text', required: true }
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
      { name: 'swiftCode', label: 'SWIFT Code', type: 'text', required: true, maxLength: 11 },
      { name: 'bic', label: 'BIC Code', type: 'text', required: false, maxLength: 11 },
      { name: 'address', label: 'Address', type: 'text', required: true },
      { name: 'bankAddress', label: 'Bank Address', type: 'text', required: true }
    ],
    currency: 'EUR'
  },
  'Switzerland': {
    fields: [
      { name: 'accountHolderName', label: 'Account Holder Name', type: 'text', required: true },
      { name: 'iban', label: 'IBAN', type: 'text', required: true, maxLength: 21 },
      { name: 'swiftCode', label: 'SWIFT Code', type: 'text', required: true, maxLength: 11 },
      { name: 'bic', label: 'BIC Code', type: 'text', required: false, maxLength: 11 },
      { name: 'address', label: 'Address', type: 'text', required: true },
      { name: 'bankAddress', label: 'Bank Address', type: 'text', required: true }
    ],
    currency: 'CHF'
  },
  'Saudi Arabia': {
    fields: [
      { name: 'accountHolderName', label: 'Account Holder Name', type: 'text', required: true },
      { name: 'iban', label: 'IBAN', type: 'text', required: true, maxLength: 24 },
      { name: 'swiftCode', label: 'SWIFT Code', type: 'text', required: true, maxLength: 11 },
      { name: 'phoneNumber', label: 'Phone Number', type: 'tel', required: true },
      { name: 'bankAddress', label: 'Bank Address', type: 'text', required: true }
    ],
    currency: 'SAR'
  },
  'United Arab Emirates': {
    fields: [
      { name: 'accountHolderName', label: 'Account Holder Name', type: 'text', required: true },
      { name: 'iban', label: 'IBAN', type: 'text', required: true, maxLength: 23 },
      { name: 'swiftCode', label: 'SWIFT Code', type: 'text', required: true, maxLength: 11 },
      { name: 'emiratesId', label: 'Emirates ID', type: 'text', required: true },
      { name: 'phoneNumber', label: 'Phone Number', type: 'tel', required: true },
      { name: 'bankAddress', label: 'Bank Address', type: 'text', required: true }
    ],
    currency: 'AED'
  }
};

const BankAccountRegistration = ({ investor, onUpdate }: BankAccountRegistrationProps) => {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(investor.bankAccounts || []);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [selectedBank, setSelectedBank] = useState('');
  const [bankFormData, setBankFormData] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Get investor country and available banks
  const investorCountry = investor.country;
  const availableBanks = banksByCountry[investorCountry] || [];
  const countryBankFields = bankFormFields[investorCountry];

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
    
    setError('');
    return true;
  };

  const handleSaveBankAccount = async () => {
    if (!validateBankForm()) return;

    setIsLoading(true);
    
    try {
      let updatedBankAccounts;
      
      if (editingAccount) {
        // Update existing account
        updatedBankAccounts = bankAccounts.map(account => 
          account.id === editingAccount.id 
            ? {
                ...account,
                bankName: selectedBank,
                ...bankFormData,
                currency: countryBankFields?.currency || 'USD',
                country: investor.country,
                verificationStatus: 'approved' as const // Admin-added accounts are auto-approved
              }
            : account
        );
      } else {
        // Add new account
        const newBankAccount: BankAccount = {
          id: `bank_${Date.now()}`,
          bankName: selectedBank,
          accountHolderName: bankFormData.accountHolderName || investor.name,
          accountNumber: bankFormData.accountNumber || '',
          iban: bankFormData.iban || '',
          swiftCode: bankFormData.swiftCode || (countryBankFields?.getSwiftCode ? countryBankFields.getSwiftCode(selectedBank) : ''),
          bic: bankFormData.bic || '',
          currency: countryBankFields?.currency || 'USD',
          country: investor.country,
          isVerified: true,
          isPrimary: bankAccounts.length === 0,
          createdAt: new Date(),
          verificationStatus: 'approved',
          bankAddress: bankFormData.bankAddress || ''
        };

        updatedBankAccounts = [...bankAccounts, newBankAccount];
      }

      setBankAccounts(updatedBankAccounts);

      // Update investor in Firebase with new bank accounts
      await FirestoreService.updateInvestor(investor.id, {
        bankAccounts: updatedBankAccounts,
        // Also update the legacy bankDetails for backward compatibility
        bankDetails: updatedBankAccounts.find(acc => acc.isPrimary) || updatedBankAccounts[0] || {}
      });

      setIsSuccess(true);
      setSelectedBank('');
      setBankFormData({});
      setEditingAccount(null);
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setIsSuccess(false);
        setShowAddModal(false);
      }, 2000);

      onUpdate();
    } catch (error) {
      console.error('Error saving bank account:', error);
      setError('Failed to save bank account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditAccount = (account: BankAccount) => {
    setEditingAccount(account);
    setSelectedBank(account.bankName);
    setBankFormData({
      accountHolderName: account.accountHolderName,
      accountNumber: account.accountNumber,
      iban: account.iban || '',
      swiftCode: account.swiftCode || '',
      bic: account.bic || '',
      phoneNumber: account.phoneNumber || '',
      address: account.address || '',
      bankAddress: account.bankAddress || ''
    });
    setShowAddModal(true);
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
        bankAccounts: updatedAccounts,
        bankDetails: updatedAccounts.find(acc => acc.id === accountId) || {}
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
        bankAccounts: updatedAccounts,
        bankDetails: updatedAccounts.find(acc => acc.isPrimary) || updatedAccounts[0] || {}
      });
      
      onUpdate();
    } catch (error) {
      console.error('Error removing bank account:', error);
    }
  };

  const resetForm = () => {
    setSelectedBank('');
    setBankFormData({});
    setEditingAccount(null);
    setError('');
    setIsSuccess(false);
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
                        <p className="font-medium text-gray-900">{account.accountNumber}</p>
                      </div>
                      {account.iban && (
                        <div>
                          <p className="text-gray-600 font-medium uppercase tracking-wide">IBAN</p>
                          <p className="font-medium text-gray-900">{account.iban}</p>
                        </div>
                      )}
                      {account.swiftCode && (
                        <div>
                          <p className="text-gray-600 font-medium uppercase tracking-wide">SWIFT CODE</p>
                          <p className="font-medium text-gray-900">{account.swiftCode}</p>
                        </div>
                      )}
                      {account.bic && (
                        <div>
                          <p className="text-gray-600 font-medium uppercase tracking-wide">BIC CODE</p>
                          <p className="font-medium text-gray-900">{account.bic}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-gray-600 font-medium uppercase tracking-wide">CURRENCY</p>
                        <p className="font-medium text-gray-900">{account.currency}</p>
                      </div>
                      {account.bankAddress && (
                        <div>
                          <p className="text-gray-600 font-medium uppercase tracking-wide">BANK ADDRESS</p>
                          <p className="font-medium text-gray-900">{account.bankAddress}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditAccount(account)}
                    >
                      <Edit3 size={14} className="mr-1" />
                      Edit
                    </Button>
                    {!account.isPrimary && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleSetPrimary(account.id)}
                      >
                        Set Primary
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleRemoveAccount(account.id)}
                    >
                      <Trash2 size={14} className="mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2 uppercase tracking-wide">
                NO BANK ACCOUNTS REGISTERED
              </h3>
              <p className="text-gray-500 mb-6 uppercase tracking-wide text-sm">
                Add bank account information for this investor
              </p>
            </div>
          )}
          
          {/* Add Bank Account Button */}
          <div className="pt-4 border-t border-gray-200">
            <Button
              variant="primary"
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              disabled={!availableBanks.length}
              className="w-full md:w-auto"
            >
              <Plus size={18} className="mr-2" />
              {editingAccount ? 'Edit Bank Account' : 'Add Bank Account'}
            </Button>
            
            {!availableBanks.length && (
              <p className="text-sm text-gray-500 mt-2 uppercase tracking-wide">
                Bank registration not available for {investor.country}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Add/Edit Bank Account Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title={editingAccount ? "EDIT BANK ACCOUNT" : "ADD BANK ACCOUNT"}
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
                    Bank account for {investor.name} in {investor.country}
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
                <option value="">Choose bank...</option>
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
                    <div key={field.name} className={field.name === 'address' || field.name === 'bankAddress' ? 'md:col-span-2' : ''}>
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
                        {(field.name === 'address' || field.name === 'bankAddress') && (
                          <MapPin size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        )}
                        <input
                          type={field.type}
                          value={bankFormData[field.name] || (field.name === 'accountHolderName' ? investor.name : '')}
                          onChange={(e) => handleBankFormChange(field.name, e.target.value)}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium ${
                            ['accountHolderName', 'phoneNumber', 'address', 'bankAddress'].includes(field.name) ? 'pl-9' : ''
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
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                disabled={isLoading}
                className="flex-1"
              >
                CANCEL
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveBankAccount}
                isLoading={isLoading}
                disabled={!selectedBank || isLoading}
                className="flex-1"
              >
                <Save size={16} className="mr-2" />
                {isLoading ? 'SAVING...' : editingAccount ? 'UPDATE ACCOUNT' : 'ADD ACCOUNT'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wide">
              BANK ACCOUNT {editingAccount ? 'UPDATED' : 'ADDED'} SUCCESSFULLY
            </h3>
            <p className="text-gray-700 mb-6 font-medium uppercase tracking-wide">
              The bank account has been {editingAccount ? 'updated' : 'registered'} for {investor.name}.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BankAccountRegistration;