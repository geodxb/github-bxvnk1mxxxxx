import { useState } from 'react';
import { motion } from 'framer-motion';
import Card from '../common/Card';
import Button from '../common/Button';
import { FirestoreService } from '../../services/firestoreService';
import { Investor } from '../../types/user';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Upload,
  FileText,
  Shield,
  Clock
} from 'lucide-react';

interface ProfileEditFormProps {
  investor: Investor;
  onUpdate: () => void;
  isModal?: boolean;
}

interface ProfileChangeRequest {
  id: string;
  investorId: string;
  investorName: string;
  changeType: 'personal_info' | 'contact_info' | 'address_change';
  currentData: any;
  requestedData: any;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  documentsRequired: string[];
  documentsSubmitted: string[];
  reviewNotes?: string;
}

const ProfileEditForm = ({ investor, onUpdate, isModal = false }: ProfileEditFormProps) => {
  const [formData, setFormData] = useState({
    name: investor.name,
    email: investor.email || '',
    phone: investor.phone || '',
    country: investor.country,
    location: investor.location || ''
  });
  const [changeReason, setChangeReason] = useState('');
  const [selectedDocuments, setSelectedDocuments] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [pendingChanges, setPendingChanges] = useState<ProfileChangeRequest[]>([]);

  // Detect what fields have changed
  const getChangedFields = () => {
    const changes: any = {};
    
    if (formData.name !== investor.name) changes.name = formData.name;
    if (formData.email !== (investor.email || '')) changes.email = formData.email;
    if (formData.phone !== (investor.phone || '')) changes.phone = formData.phone;
    if (formData.country !== investor.country) changes.country = formData.country;
    if (formData.location !== (investor.location || '')) changes.location = formData.location;
    
    return changes;
  };

  const getRequiredDocuments = (changes: any) => {
    const docs = [];
    
    if (changes.name) {
      docs.push('Government-issued ID (passport, driver\'s license, or national ID)');
    }
    
    if (changes.country || changes.location) {
      docs.push('Proof of address (utility bill, bank statement, or rental agreement)');
      docs.push('Updated government-issued ID from new country');
    }
    
    if (changes.email || changes.phone) {
      docs.push('Identity verification document');
    }
    
    return docs;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Validate file types (PDF, JPG, PNG only)
    const validFiles = files.filter(file => {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      return validTypes.includes(file.type) && file.size <= 10 * 1024 * 1024; // 10MB max
    });
    
    if (validFiles.length !== files.length) {
      setError('Please upload only PDF, JPG, or PNG files under 10MB');
      return;
    }
    
    setSelectedDocuments(prev => [...prev, ...validFiles]);
    setError('');
  };

  const removeDocument = (index: number) => {
    setSelectedDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const changes = getChangedFields();
    
    if (Object.keys(changes).length === 0) {
      setError('No changes detected');
      return;
    }
    
    if (!changeReason.trim()) {
      setError('Please provide a reason for the changes');
      return;
    }
    
    const requiredDocs = getRequiredDocuments(changes);
    if (requiredDocs.length > 0 && selectedDocuments.length === 0) {
      setError('Please upload required verification documents');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Create profile change request
      const changeRequest: ProfileChangeRequest = {
        id: `change_${Date.now()}`,
        investorId: investor.id,
        investorName: investor.name,
        changeType: changes.country ? 'address_change' : 
                   (changes.email || changes.phone) ? 'contact_info' : 'personal_info',
        currentData: {
          name: investor.name,
          email: investor.email,
          phone: investor.phone,
          country: investor.country,
          location: investor.location
        },
        requestedData: formData,
        reason: changeReason,
        status: 'pending',
        submittedAt: new Date(),
        documentsRequired: requiredDocs,
        documentsSubmitted: selectedDocuments.map(file => file.name)
      };
      
      // Store change request in Firebase
      await FirestoreService.addProfileChangeRequest(changeRequest);
      
      // Update investor status to show pending changes
      await FirestoreService.updateInvestor(investor.id, {
        accountFlags: {
          ...investor.accountFlags,
          pendingProfileChanges: true,
          profileChangeMessage: 'Profile changes submitted for verification'
        }
      });
      
      setIsSuccess(true);
      
      // Reset form after success
      setTimeout(() => {
        setIsSuccess(false);
        setChangeReason('');
        setSelectedDocuments([]);
        onUpdate();
      }, 3000);
      
    } catch (error) {
      console.error('Error submitting profile changes:', error);
      setError('Failed to submit profile changes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const changes = getChangedFields();
  const requiredDocs = getRequiredDocuments(changes);
  const hasChanges = Object.keys(changes).length > 0;

  if (isSuccess) {
    return (
      <div className="text-center py-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wide">
          PROFILE CHANGES SUBMITTED
        </h3>
        <p className="text-gray-700 mb-6 font-medium uppercase tracking-wide">
          Your profile changes have been submitted for verification. You will be notified once the review is complete.
        </p>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <p className="text-gray-800 text-sm font-medium uppercase tracking-wide">
            <strong>Processing Time:</strong> Profile changes typically take 3-5 business days to review and approve.
          </p>
        </div>
      </div>
    );
  }

  const ContentWrapper = ({ children }: { children: React.ReactNode }) => {
    if (isModal) {
      return <div className="space-y-6">{children}</div>;
    }
    return <Card title="EDIT PROFILE INFORMATION">{children}</Card>;
  };

  return (
    <ContentWrapper>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Current vs New Information */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h4 className="font-medium text-gray-800 mb-4 uppercase tracking-wide">PROFILE INFORMATION</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                <User size={16} className="inline mr-1" />
                FULL NAME
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
                <Mail size={16} className="inline mr-1" />
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
                <Phone size={16} className="inline mr-1" />
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
                <MapPin size={16} className="inline mr-1" />
                COUNTRY
              </label>
              <select
                value={formData.country}
                onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
              >
                <option value="Mexico">Mexico</option>
                <option value="France">France</option>
                <option value="Switzerland">Switzerland</option>
                <option value="Saudi Arabia">Saudi Arabia</option>
                <option value="United Arab Emirates">United Arab Emirates</option>
              </select>
            </div>

            <div className="md:col-span-2">
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
          </div>
        </div>

        {/* Changes Summary */}
        {hasChanges && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-3 uppercase tracking-wide">DETECTED CHANGES</h4>
            <div className="space-y-2 text-sm">
              {Object.entries(changes).map(([field, newValue]) => (
                <div key={field} className="flex justify-between">
                  <span className="text-blue-700 font-medium uppercase tracking-wide">{field}:</span>
                  <span className="text-blue-900 font-medium">
                    {String(investor[field as keyof Investor] || 'Not set')} → {String(newValue)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Required Documents */}
        {hasChanges && requiredDocs.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-800 mb-3 uppercase tracking-wide">REQUIRED VERIFICATION DOCUMENTS</h4>
            <ul className="text-yellow-700 text-sm space-y-1 mb-4">
              {requiredDocs.map((doc, index) => (
                <li key={index} className="uppercase tracking-wide">• {doc}</li>
              ))}
            </ul>
            
            {/* File Upload */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-yellow-800 uppercase tracking-wide">
                UPLOAD DOCUMENTS
              </label>
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white"
              />
              <p className="text-xs text-yellow-700 uppercase tracking-wide">
                Accepted formats: PDF, JPG, PNG (Max 10MB per file)
              </p>
            </div>

            {/* Selected Documents */}
            {selectedDocuments.length > 0 && (
              <div className="mt-4 space-y-2">
                <h5 className="font-medium text-yellow-800 uppercase tracking-wide">SELECTED DOCUMENTS:</h5>
                {selectedDocuments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-white p-3 rounded border border-yellow-300">
                    <div className="flex items-center space-x-2">
                      <FileText size={16} className="text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-900">{file.name}</span>
                      <span className="text-xs text-yellow-700">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDocument(index)}
                      className="text-yellow-600 hover:text-yellow-800"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Change Reason */}
        {hasChanges && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
              REASON FOR CHANGES <span className="text-red-500">*</span>
            </label>
            <textarea
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
              rows={4}
              placeholder="Please explain why you need to update your profile information..."
              required
            />
          </div>
        )}

        {/* Verification Notice */}
        {hasChanges && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Shield size={20} className="text-gray-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-800 uppercase tracking-wide">VERIFICATION PROCESS</h4>
                <p className="text-gray-700 text-sm mt-1 uppercase tracking-wide">
                  All profile changes require verification for security and compliance. 
                  Your changes will be reviewed within 3-5 business days.
                </p>
                <ul className="text-gray-700 text-sm mt-2 space-y-1">
                  <li className="uppercase tracking-wide">• Changes are reviewed by our compliance team</li>
                  <li className="uppercase tracking-wide">• You'll receive email notifications about the status</li>
                  <li className="uppercase tracking-wide">• Additional documentation may be requested</li>
                  <li className="uppercase tracking-wide">• Account access remains unchanged during review</li>
                </ul>
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
        {hasChanges && (
          <div className="flex space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFormData({
                  name: investor.name,
                  email: investor.email || '',
                  phone: investor.phone || '',
                  country: investor.country,
                  location: investor.location || ''
                });
                setChangeReason('');
                setSelectedDocuments([]);
                setError('');
              }}
              disabled={isLoading}
              className="flex-1"
            >
              RESET CHANGES
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              disabled={isLoading || !changeReason.trim()}
              className="flex-1"
            >
              <Upload size={16} className="mr-2" />
              {isLoading ? 'SUBMITTING CHANGES...' : 'SUBMIT FOR VERIFICATION'}
            </Button>
          </div>
        )}

        {!hasChanges && (
          <div className="text-center py-6">
            <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2 uppercase tracking-wide">
              PROFILE UP TO DATE
            </h3>
            <p className="text-gray-600 uppercase tracking-wide text-sm">
              Make changes to any field above to submit for verification
            </p>
          </div>
        )}
      </form>

      {/* Pending Changes Status */}
      {investor.accountFlags?.pendingProfileChanges && (
        <Card title="PENDING PROFILE CHANGES">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Clock size={20} className="text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800 uppercase tracking-wide">CHANGES UNDER REVIEW</h4>
                <p className="text-yellow-700 text-sm mt-1 uppercase tracking-wide">
                  {investor.accountFlags.profileChangeMessage || 
                   'Your profile changes are being reviewed by our compliance team.'}
                </p>
                <p className="text-yellow-700 text-xs mt-2 uppercase tracking-wide">
                  You will receive an email notification once the review is complete.
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </ContentWrapper>
  );
};

export default ProfileEditForm;