import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { FirestoreService } from '../../services/firestoreService';
import { useAuth } from '../../contexts/AuthContext';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Upload,
  FileText,
  X,
  Eye,
  Building,
  Shield,
  Calendar,
  CreditCard
} from 'lucide-react';

interface InvestorOnboardingFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface UploadedDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  base64Data: string;
  uploadedAt: Date;
}

const InvestorOnboardingFlow = ({ isOpen, onClose, onSuccess }: InvestorOnboardingFlowProps) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Form data state
  const [formData, setFormData] = useState({
    // Personal Information
    name: '',
    email: '',
    phone: '',
    country: 'Mexico',
    city: '',
    
    // Financial Information
    initialDeposit: '',
    accountType: 'Standard',
    
    // Bank Details
    bankName: '',
    accountHolderName: '',
    accountNumber: '',
    iban: '',
    swiftCode: '',
    bic: '',
    cbu: '',
    alias: '',
    clabe: '',
    emiratesId: '',
    phoneNumber: '',
    address: '',
    bankBranch: '',
    currency: 'USD',
    
    // Identity Verification
    idType: 'passport',
    
    // Agreement
    agreementAccepted: false
  });

  // Document upload state
  const [identityDocument, setIdentityDocument] = useState<UploadedDocument | null>(null);
  const [proofOfDeposit, setProofOfDeposit] = useState<UploadedDocument | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const countries = [
    'Mexico', 'France', 'Switzerland', 'Saudi Arabia', 'United Arab Emirates'
  ];

  const currencies = {
    'Mexico': 'MXN',
    'France': 'EUR',
    'Switzerland': 'CHF',
    'Saudi Arabia': 'SAR',
    'United Arab Emirates': 'AED'
  };

  const steps = [
    { number: 1, title: 'Personal Information', description: 'Basic details and contact information' },
    { number: 2, title: 'Financial Information', description: 'Investment amount and account type' },
    { number: 3, title: 'Banking Details', description: 'Bank account information for withdrawals' },
    { number: 4, title: 'Identity Verification', description: 'Upload required documents' },
    { number: 5, title: 'Review & Submit', description: 'Review all information and submit for approval' }
  ];

  const handleFileUpload = async (file: File, documentType: 'identity' | 'deposit'): Promise<void> => {
    if (!file) return;

    // Validate file
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Please upload only PDF, JPG, or PNG files');
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File size must be less than 10MB');
    }

    setIsUploading(true);

    try {
      // Convert to base64
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const uploadedDoc: UploadedDocument = {
        id: `${documentType}_${Date.now()}`,
        name: file.name,
        type: file.type,
        size: file.size,
        base64Data,
        uploadedAt: new Date()
      };

      if (documentType === 'identity') {
        setIdentityDocument(uploadedDoc);
      } else {
        setProofOfDeposit(uploadedDoc);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleIdentityUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await handleFileUpload(file, 'identity');
      setError('');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Upload failed');
    }
  };

  const handleDepositUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await handleFileUpload(file, 'deposit');
      setError('');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Upload failed');
    }
  };

  const validateStep = (step: number): string => {
    switch (step) {
      case 1:
        if (!formData.name.trim()) return 'Please enter full name';
        if (!formData.email.trim()) return 'Please enter email address';
        if (!formData.country) return 'Please select country';
        if (!formData.city.trim()) return 'Please enter city';
        break;
      case 2:
        const deposit = parseFloat(formData.initialDeposit);
        if (isNaN(deposit) || deposit < 1000) return 'Initial deposit must be at least $1,000';
        break;
      case 3:
        if (!formData.bankName.trim()) return 'Please enter bank name';
        if (!formData.accountHolderName.trim()) return 'Please enter account holder name';
        if (!formData.accountNumber.trim()) return 'Please enter account number';
        break;
      case 4:
        if (!identityDocument) return 'Please upload identity document';
        if (!proofOfDeposit) return 'Please upload proof of deposit';
        break;
      case 5:
        if (!formData.agreementAccepted) return 'Please accept the investment agreement';
        break;
    }
    return '';
  };

  const handleNext = () => {
    const validationError = validateStep(currentStep);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setError('');
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setError('');
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      setError('User authentication required');
      return;
    }

    const validationError = validateStep(5);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('🔄 Submitting account creation request...');

      // Prepare the account creation request data
      const requestData = {
        applicantName: formData.name,
        applicantEmail: formData.email,
        applicantPhone: formData.phone,
        applicantCountry: formData.country,
        applicantCity: formData.city,
        requestedBy: user.id,
        requestedByName: user.name,
        status: 'pending',
        initialDeposit: parseFloat(formData.initialDeposit),
        accountType: formData.accountType,
        bankDetails: {
          bankName: formData.bankName,
          accountHolderName: formData.accountHolderName,
          accountNumber: formData.accountNumber,
          iban: formData.iban,
          swiftCode: formData.swiftCode,
          bic: formData.bic,
          cbu: formData.cbu,
          alias: formData.alias,
          clabe: formData.clabe,
          emiratesId: formData.emiratesId,
          phoneNumber: formData.phoneNumber,
          address: formData.address,
          bankBranch: formData.bankBranch,
          currency: currencies[formData.country as keyof typeof currencies] || 'USD',
          country: formData.country
        },
        identityDocument: identityDocument ? {
          type: formData.idType,
          fileName: identityDocument.name,
          fileType: identityDocument.type,
          fileSize: identityDocument.size,
          base64Data: identityDocument.base64Data,
          uploadedAt: identityDocument.uploadedAt
        } : null,
        proofOfDeposit: proofOfDeposit ? {
          fileName: proofOfDeposit.name,
          fileType: proofOfDeposit.type,
          fileSize: proofOfDeposit.size,
          base64Data: proofOfDeposit.base64Data,
          uploadedAt: proofOfDeposit.uploadedAt
        } : null,
        agreementAccepted: formData.agreementAccepted,
        agreementAcceptedAt: new Date()
      };

      // Submit to Firebase
      const requestId = await FirestoreService.addAccountCreationRequest(requestData);
      
      console.log('✅ Account creation request submitted successfully:', requestId);
      
      setIsSuccess(true);
      
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 3000);
      }
    } catch (error) {
      console.error('❌ Error submitting account creation request:', error);
      setError(`Failed to submit request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Reset all form data
    setCurrentStep(1);
    setFormData({
      name: '',
      email: '',
      phone: '',
      country: 'Mexico',
      city: '',
      initialDeposit: '',
      accountType: 'Standard',
      bankName: '',
      accountHolderName: '',
      accountNumber: '',
      iban: '',
      swiftCode: '',
      bic: '',
      cbu: '',
      alias: '',
      clabe: '',
      emiratesId: '',
      phoneNumber: '',
      address: '',
      bankBranch: '',
      currency: 'USD',
      idType: 'passport',
      agreementAccepted: false
    });
    setIdentityDocument(null);
    setProofOfDeposit(null);
    setError('');
    setIsSuccess(false);
    onClose();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                  <User size={16} className="inline mr-1" />
                  FULL NAME *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
                  placeholder="Enter full legal name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                  <Mail size={16} className="inline mr-1" />
                  EMAIL ADDRESS *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                  <Phone size={16} className="inline mr-1" />
                  PHONE NUMBER
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                  <MapPin size={16} className="inline mr-1" />
                  COUNTRY *
                </label>
                <select
                  value={formData.country}
                  onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
                  required
                >
                  {countries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                  CITY/LOCATION *
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
                  placeholder="Enter city or specific location"
                  required
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                  <DollarSign size={16} className="inline mr-1" />
                  INITIAL DEPOSIT (USD) *
                </label>
                <input
                  type="number"
                  value={formData.initialDeposit}
                  onChange={(e) => setFormData(prev => ({ ...prev, initialDeposit: e.target.value }))}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                  ACCOUNT TYPE
                </label>
                <select
                  value={formData.accountType}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountType: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
                >
                  <option value="Standard">Standard</option>
                  <option value="Pro">Pro</option>
                </select>
              </div>
            </div>

            {/* Investment Information */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-800 mb-4 uppercase tracking-wide">INVESTMENT INFORMATION</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">Initial Investment:</span>
                  <span className="font-bold text-gray-900">
                    ${formData.initialDeposit ? parseFloat(formData.initialDeposit).toLocaleString() : '0'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">Account Type:</span>
                  <span className="font-bold text-gray-900">{formData.accountType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">Target Currency:</span>
                  <span className="font-bold text-gray-900">
                    {currencies[formData.country as keyof typeof currencies] || 'USD'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <Building size={20} className="text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800 uppercase tracking-wide">BANK ACCOUNT INFORMATION</h4>
                  <p className="text-blue-700 text-sm mt-1 uppercase tracking-wide">
                    This information will be used for withdrawal transfers. Please ensure all details are accurate.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                  BANK NAME *
                </label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
                  placeholder="Enter bank name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                  ACCOUNT HOLDER NAME *
                </label>
                <input
                  type="text"
                  value={formData.accountHolderName}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountHolderName: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
                  placeholder="Must match your legal name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                  ACCOUNT NUMBER *
                </label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
                  placeholder="Enter account number"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                  IBAN (if applicable)
                </label>
                <input
                  type="text"
                  value={formData.iban}
                  onChange={(e) => setFormData(prev => ({ ...prev, iban: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
                  placeholder="International Bank Account Number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                  SWIFT CODE
                </label>
                <input
                  type="text"
                  value={formData.swiftCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, swiftCode: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
                  placeholder="Bank SWIFT code"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                  BIC CODE
                </label>
                <input
                  type="text"
                  value={formData.bic}
                  onChange={(e) => setFormData(prev => ({ ...prev, bic: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
                  placeholder="Bank Identifier Code"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <Shield size={20} className="text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800 uppercase tracking-wide">DOCUMENT VERIFICATION</h4>
                  <p className="text-yellow-700 text-sm mt-1 uppercase tracking-wide">
                    Please upload clear, high-quality images or PDFs of your documents for verification.
                  </p>
                </div>
              </div>
            </div>

            {/* Identity Document Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                IDENTITY DOCUMENT *
              </label>
              <div>
                <select
                  value={formData.idType}
                  onChange={(e) => setFormData(prev => ({ ...prev, idType: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium mb-3"
                >
                  <option value="passport">Passport</option>
                  <option value="id_card">National ID Card</option>
                </select>
                
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleIdentityUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 bg-white"
                  disabled={isUploading}
                />
                <p className="text-xs text-gray-600 mt-1 uppercase tracking-wide">
                  Accepted formats: PDF, JPG, PNG (Max 10MB)
                </p>
              </div>

              {identityDocument && (
                <div className="mt-3 flex items-center justify-between bg-green-50 p-3 rounded border border-green-200">
                  <div className="flex items-center space-x-3">
                    <FileText size={16} className="text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-900">{identityDocument.name}</p>
                      <p className="text-xs text-green-700">
                        {(identityDocument.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => window.open(identityDocument.base64Data, '_blank')}
                      className="p-1 text-green-600 hover:text-green-800"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIdentityDocument(null)}
                      className="p-1 text-red-600 hover:text-red-800"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Proof of Deposit Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                PROOF OF DEPOSIT *
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleDepositUpload}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 bg-white"
                disabled={isUploading}
              />
              <p className="text-xs text-gray-600 mt-1 uppercase tracking-wide">
                Bank statement or transfer receipt showing the initial deposit
              </p>

              {proofOfDeposit && (
                <div className="mt-3 flex items-center justify-between bg-green-50 p-3 rounded border border-green-200">
                  <div className="flex items-center space-x-3">
                    <FileText size={16} className="text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-900">{proofOfDeposit.name}</p>
                      <p className="text-xs text-green-700">
                        {(proofOfDeposit.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => window.open(proofOfDeposit.base64Data, '_blank')}
                      className="p-1 text-green-600 hover:text-green-800"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setProofOfDeposit(null)}
                      className="p-1 text-red-600 hover:text-red-800"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {isUploading && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                <span>Uploading document...</span>
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            {/* Review Summary */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-800 mb-4 uppercase tracking-wide">APPLICATION SUMMARY</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h5 className="font-medium text-gray-700 mb-3 uppercase tracking-wide">PERSONAL INFORMATION</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium text-gray-900">{formData.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium text-gray-900">{formData.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium text-gray-900">{formData.phone || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Country:</span>
                      <span className="font-medium text-gray-900">{formData.country}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">City:</span>
                      <span className="font-medium text-gray-900">{formData.city}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="font-medium text-gray-700 mb-3 uppercase tracking-wide">FINANCIAL INFORMATION</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Initial Deposit:</span>
                      <span className="font-bold text-gray-900">
                        ${parseFloat(formData.initialDeposit).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Account Type:</span>
                      <span className="font-medium text-gray-900">{formData.accountType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Currency:</span>
                      <span className="font-medium text-gray-900">
                        {currencies[formData.country as keyof typeof currencies] || 'USD'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h5 className="font-medium text-gray-700 mb-3 uppercase tracking-wide">BANKING INFORMATION</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bank Name:</span>
                    <span className="font-medium text-gray-900">{formData.bankName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Account Holder:</span>
                    <span className="font-medium text-gray-900">{formData.accountHolderName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Account Number:</span>
                    <span className="font-medium text-gray-900">{formData.accountNumber}</span>
                  </div>
                  {formData.iban && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">IBAN:</span>
                      <span className="font-medium text-gray-900">{formData.iban}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h5 className="font-medium text-gray-700 mb-3 uppercase tracking-wide">UPLOADED DOCUMENTS</h5>
                <div className="space-y-2">
                  {identityDocument && (
                    <div className="flex items-center space-x-3 bg-white p-3 rounded border border-gray-300">
                      <FileText size={16} className="text-blue-600" />
                      <span className="text-sm font-medium text-gray-900">
                        {formData.idType === 'passport' ? 'Passport' : 'National ID'}: {identityDocument.name}
                      </span>
                    </div>
                  )}
                  {proofOfDeposit && (
                    <div className="flex items-center space-x-3 bg-white p-3 rounded border border-gray-300">
                      <FileText size={16} className="text-green-600" />
                      <span className="text-sm font-medium text-gray-900">
                        Proof of Deposit: {proofOfDeposit.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Agreement */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-800 mb-4 uppercase tracking-wide">INVESTMENT AGREEMENT</h4>
              <div className="space-y-4">
                <div className="bg-white p-4 rounded border border-gray-300 max-h-32 overflow-y-auto">
                  <p className="text-sm text-gray-700">
                    By checking the box below, I acknowledge that I have read, understood, and agree to the terms and conditions 
                    of the Investment and Operation Agreement with Interactive Brokers. I understand that:
                  </p>
                  <ul className="list-disc list-inside text-sm text-gray-700 mt-2 space-y-1">
                    <li>My funds will be used for trading in Forex and cryptocurrency markets</li>
                    <li>The trader is entitled to 15% of net profits generated</li>
                    <li>Withdrawals are subject to a 15% platform commission</li>
                    <li>Account closure requires a 90-day process</li>
                    <li>All trading activities are conducted on the regulated Interactive Brokers platform</li>
                  </ul>
                </div>

                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.agreementAccepted}
                    onChange={(e) => setFormData(prev => ({ ...prev, agreementAccepted: e.target.checked }))}
                    className="mt-1 w-4 h-4"
                    required
                  />
                  <span className="text-sm font-medium text-gray-700 uppercase tracking-wide">
                    I ACCEPT THE INVESTMENT AGREEMENT AND TERMS OF SERVICE *
                  </span>
                </label>
              </div>
            </div>

            {/* Governor Review Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Eye size={20} className="text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800 uppercase tracking-wide">GOVERNOR REVIEW PROCESS</h4>
                  <p className="text-blue-700 text-sm mt-1 uppercase tracking-wide">
                    Your application will be submitted to the Governor for review and approval. 
                    This process typically takes 1-3 business days. You will be notified via email once a decision is made.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (isSuccess) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="APPLICATION SUBMITTED" size="lg">
        <div className="text-center py-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4 uppercase tracking-wide">
            APPLICATION SUBMITTED SUCCESSFULLY
          </h3>
          <p className="text-gray-700 mb-6 text-lg font-medium uppercase tracking-wide">
            The investor application for {formData.name} has been submitted for Governor review.
          </p>
          
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-6">
            <h4 className="font-bold text-gray-900 mb-4 uppercase tracking-wide">APPLICATION SUMMARY</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600 font-medium uppercase tracking-wide">APPLICANT</p>
                <p className="font-bold text-gray-900">{formData.name}</p>
              </div>
              <div>
                <p className="text-gray-600 font-medium uppercase tracking-wide">INITIAL DEPOSIT</p>
                <p className="font-bold text-gray-900">${parseFloat(formData.initialDeposit).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-600 font-medium uppercase tracking-wide">COUNTRY</p>
                <p className="font-bold text-gray-900">{formData.country}</p>
              </div>
              <div>
                <p className="text-gray-600 font-medium uppercase tracking-wide">ACCOUNT TYPE</p>
                <p className="font-bold text-gray-900">{formData.accountType}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
            <p className="text-blue-800 text-sm font-medium uppercase tracking-wide">
              <strong>NEXT STEPS:</strong> The Governor will review the application and all uploaded documents. 
              You will receive an email notification once the review is complete.
            </p>
          </div>
          
          <button
            onClick={handleClose}
            className="px-6 py-3 bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors rounded-lg uppercase tracking-wide"
          >
            CLOSE
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="NEW INVESTOR ONBOARDING" size="xl">
      <div className="space-y-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                currentStep >= step.number
                  ? 'bg-gray-900 border-gray-900 text-white'
                  : 'bg-white border-gray-300 text-gray-500'
              }`}>
                {currentStep > step.number ? (
                  <CheckCircle size={16} />
                ) : (
                  <span className="font-bold">{step.number}</span>
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-1 mx-2 ${
                  currentStep > step.number ? 'bg-gray-900' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Information */}
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-900 uppercase tracking-wide">
            STEP {currentStep}: {steps[currentStep - 1].title}
          </h3>
          <p className="text-gray-600 uppercase tracking-wide text-sm">
            {steps[currentStep - 1].description}
          </p>
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {renderStepContent()}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle size={16} />
              <span className="font-medium uppercase tracking-wide">{error}</span>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide"
          >
            PREVIOUS
          </button>

          {currentStep < 5 ? (
            <button
              onClick={handleNext}
              className="px-6 py-3 bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors rounded-lg uppercase tracking-wide"
            >
              NEXT
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isLoading || !formData.agreementAccepted}
              className="px-6 py-3 bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  
                  SUBMITTING...
                </div>
              ) : (
                'SUBMIT FOR GOVERNOR REVIEW'
              )}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default InvestorOnboardingFlow;