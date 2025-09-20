import { useState } from 'react';
import { motion } from 'framer-motion';
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
  Eye
} from 'lucide-react';

interface AddInvestorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface UploadedDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: Date;
}

const AddInvestorModal = ({ isOpen, onClose, onSuccess }: AddInvestorModalProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    country: 'Mexico',
    location: '',
    initialDeposit: '',
    accountType: 'Standard'
  });
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const countries = [
    'Mexico', 'France', 'Switzerland', 'Saudi Arabia', 'United Arab Emirates'
  ];

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) return;

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      const maxSize = 10 * 1024 * 1024; // 10MB
      return validTypes.includes(file.type) && file.size <= maxSize;
    });

    if (validFiles.length !== files.length) {
      setError('Please upload only PDF, JPG, or PNG files under 10MB');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      // Simulate file upload (in real implementation, upload to Firebase Storage)
      for (const file of validFiles) {
        const mockUrl = `https://firebasestorage.googleapis.com/documents/${Date.now()}_${file.name}`;
        
        const uploadedDoc: UploadedDocument = {
          id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          type: file.type,
          size: file.size,
          url: mockUrl,
          uploadedAt: new Date()
        };

        setUploadedDocuments(prev => [...prev, uploadedDoc]);
      }
    } catch (error) {
      console.error('Error uploading documents:', error);
      setError('Failed to upload documents. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const removeDocument = (documentId: string) => {
    setUploadedDocuments(prev => prev.filter(doc => doc.id !== documentId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('User authentication required');
      return;
    }

    const initialDeposit = parseFloat(formData.initialDeposit);
    if (isNaN(initialDeposit) || initialDeposit < 1000) {
      setError('Initial deposit must be at least $1,000');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Create investor ID
      const investorId = `investor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create investor data
      const investorData = {
        id: investorId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        country: formData.country,
        location: formData.location,
        role: 'investor',
        joinDate: new Date().toISOString().split('T')[0],
        initialDeposit: initialDeposit,
        currentBalance: initialDeposit,
        accountType: formData.accountType,
        isActive: true,
        accountStatus: 'Pending Governor Approval',
        uploadedDocuments: uploadedDocuments,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Store in Firebase
      await FirestoreService.updateInvestor(investorId, investorData);

      // Add initial deposit transaction
      await FirestoreService.addTransaction({
        investorId: investorId,
        type: 'Deposit',
        amount: initialDeposit,
        date: new Date().toISOString().split('T')[0],
        status: 'Completed',
        description: 'Initial deposit',
        processedBy: user.id
      });

      console.log(`📊 New Investor AUM Impact: +$${initialDeposit.toLocaleString()} (${formData.name})`);
      
      setIsSuccess(true);
      
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (error) {
      console.error('Error creating investor:', error);
      setError('Failed to create investor. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      country: 'Mexico',
      location: '',
      initialDeposit: '',
      accountType: 'Standard'
    });
    setUploadedDocuments([]);
    setError('');
    setIsSuccess(false);
    onClose();
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) {
      return <FileText size={16} className="text-red-600" />;
    } else if (fileType.includes('image')) {
      return <FileText size={16} className="text-blue-600" />;
    }
    return <FileText size={16} className="text-gray-600" />;
  };

  if (isSuccess) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="INVESTOR CREATED">
        <div className="text-center py-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wide">
            INVESTOR CREATED SUCCESSFULLY
          </h3>
          <p className="text-gray-700 mb-6 font-medium uppercase tracking-wide">
            {formData.name} has been added with an initial deposit of ${parseFloat(formData.initialDeposit).toLocaleString()}.
            {uploadedDocuments.length > 0 && (
              <span className="block mt-2">
                {uploadedDocuments.length} document(s) uploaded for Governor review.
              </span>
            )}
          </p>
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
    <Modal isOpen={isOpen} onClose={handleClose} title="ADD NEW INVESTOR" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h4 className="font-medium text-gray-800 mb-4 uppercase tracking-wide">PERSONAL INFORMATION</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                FULL NAME *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                PHONE NUMBER
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                LOCATION/CITY
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
                placeholder="City or specific location"
              />
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
        </div>

        {/* Financial Information */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h4 className="font-medium text-gray-800 mb-4 uppercase tracking-wide">FINANCIAL INFORMATION</h4>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
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
        </div>

        {/* Document Upload Section */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h4 className="font-medium text-gray-800 mb-4 uppercase tracking-wide">
            <Upload size={16} className="inline mr-1" />
            VERIFICATION DOCUMENTS
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                UPLOAD DOCUMENTS (ID, PASSPORT, PROOF OF DEPOSIT)
              </label>
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 bg-white"
                disabled={isUploading}
              />
              <p className="text-xs text-gray-600 mt-1 uppercase tracking-wide">
                Accepted formats: PDF, JPG, PNG (Max 10MB per file)
              </p>
            </div>

            {/* Uploaded Documents List */}
            {uploadedDocuments.length > 0 && (
              <div className="space-y-2">
                <h5 className="font-medium text-gray-800 uppercase tracking-wide">
                  UPLOADED DOCUMENTS ({uploadedDocuments.length}):
                </h5>
                {uploadedDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between bg-white p-3 rounded border border-gray-300">
                    <div className="flex items-center space-x-3">
                      {getFileIcon(doc.type)}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                        <p className="text-xs text-gray-500">
                          {(doc.size / 1024 / 1024).toFixed(2)} MB • {doc.uploadedAt.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => window.open(doc.url, '_blank')}
                        className="p-1 text-gray-600 hover:text-gray-800"
                        title="Preview document"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeDocument(doc.id)}
                        className="p-1 text-red-600 hover:text-red-800"
                        title="Remove document"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isUploading && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                <span>Uploading documents...</span>
              </div>
            )}
          </div>
        </div>

        {/* Governor Review Notice */}
        {uploadedDocuments.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Eye size={20} className="text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800 uppercase tracking-wide">GOVERNOR REVIEW</h4>
                <p className="text-blue-700 text-sm mt-1 uppercase tracking-wide">
                  All uploaded documents will be available for Governor review during the account approval process. 
                  The Governor can view, download, and verify all submitted documentation.
                </p>
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
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors rounded-lg uppercase tracking-wide"
          >
            CANCEL
          </button>
          <button
            type="submit"
            disabled={isLoading || isUploading}
            className="flex-1 px-4 py-3 bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                CREATING INVESTOR...
              </div>
            ) : (
              'CREATE INVESTOR'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddInvestorModal;