import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { FirestoreService } from '../../services/firestoreService';
import { GovernorService } from '../../services/governorService';
import { useAuth } from '../../contexts/AuthContext';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  DollarSign, 
  FileText, 
  Eye, 
  Download, 
  Shield,
  Clock
} from 'lucide-react';

interface AccountCreationRequestsProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AccountCreationRequest {
  id: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string;
  applicantCountry: string;
  requestedBy: string;
  requestedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  initialDeposit: number;
  accountType: 'Standard' | 'Pro';
  applicationData: any; // Full investor data from onboarding
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  rejectionReason?: string;
  approvalConditions?: string[];
}

const AccountCreationRequests = ({ isOpen, onClose }: AccountCreationRequestsProps) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<AccountCreationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<AccountCreationRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvalConditions, setApprovalConditions] = useState('');
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchRequests();
    }
  }, [isOpen]);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const fetchedRequests = await FirestoreService.getAccountCreationRequests();
      setRequests(fetchedRequests);
    } catch (error) {
      console.error('Error fetching account creation requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest || !user) return;

    setProcessingRequest(selectedRequest.id);
    try {
      console.log('🔄 Governor approving account creation request:', selectedRequest.id);
      
      await GovernorService.approveAccountCreation(
        selectedRequest.id,
        user.id,
        user.name,
        approvalConditions.split(',').map(cond => cond.trim()).filter(cond => cond)
      );
      setSelectedRequest(null);
      console.log('✅ Account creation approved successfully');
      
      setApprovalConditions('');
      fetchRequests(); // Refresh list
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Failed to approve request. Please try again.');
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !user || !rejectionReason.trim()) return;

    setProcessingRequest(selectedRequest.id);
    try {
      await FirestoreService.updateAccountCreationRequest(selectedRequest.id, {
        status: 'rejected',
        reviewedBy: user.id,
        reviewedAt: new Date(),
        rejectionReason: rejectionReason
      });
      setSelectedRequest(null);
      setApprovalConditions([]);
      
      // Show success message
      alert(`ACCOUNT APPROVED SUCCESSFULLY\n\nInvestor: ${selectedRequest.applicantName}\nInitial Deposit: $${selectedRequest.initialDeposit.toLocaleString()}\n\nThe new investor account has been created and activated.`);
      setRejectionReason('');
      fetchRequests(); // Refresh list
    } catch (error) {
      console.error('Error rejecting request:', error);
      setError(`Failed to approve account creation: ${err instanceof Error ? err.message : 'Unknown error'}`);
      alert(`APPROVAL FAILED\n\nError: ${err instanceof Error ? err.message : 'Unknown error'}\n\nPlease try again or contact technical support.`);
    } finally {
      setProcessingRequest(null);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) {
      return <FileText size={16} className="text-red-600" />;
    } else if (fileType.includes('image')) {
      return <FileText size={16} className="text-blue-600" />;
    }
    return <FileText size={16} className="text-gray-600" />;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="ACCOUNT CREATION REQUESTS" size="xl">
      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-gray-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 font-bold uppercase tracking-wide">LOADING REQUESTS...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {requests.filter(req => req.status === 'pending').length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 uppercase tracking-wide">NO PENDING REQUESTS</h3>
              <p className="text-gray-500 uppercase tracking-wide text-sm">All account creation requests have been reviewed.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.filter(req => req.status === 'pending').map(request => (
                <div key={request.id} className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 uppercase tracking-wide">{request.applicantName}</h4>
                      <p className="text-sm text-gray-600 uppercase tracking-wide">
                        {request.applicantCountry} | {request.accountType} Account
                      </p>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">
                        Requested: {request.requestedAt.toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">
                        Initial Deposit: ${request.initialDeposit.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="primary"
                        onClick={() => setSelectedRequest(request)}
                        disabled={processingRequest === request.id}
                      >
                        <Eye size={16} className="mr-2" /> Review
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedRequest && (
            <Modal
              isOpen={!!selectedRequest}
              onClose={() => setSelectedRequest(null)}
              title={`REVIEW APPLICATION: ${selectedRequest.applicantName}`}
              size="xl"
            >
              <div className="space-y-6">
                {/* Applicant Information */}
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-800 mb-4 uppercase tracking-wide flex items-center">
                    <User size={16} className="mr-2" />
                    APPLICANT INFORMATION
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 uppercase tracking-wide">FULL NAME</label>
                      <p className="text-gray-900 font-medium">{selectedRequest.applicantName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 uppercase tracking-wide">EMAIL</label>
                      <p className="text-gray-900 font-medium">{selectedRequest.applicantEmail}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 uppercase tracking-wide">PHONE</label>
                      <p className="text-gray-900 font-medium">{selectedRequest.applicantPhone || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 uppercase tracking-wide">COUNTRY</label>
                      <p className="text-gray-900 font-medium">{selectedRequest.applicantCountry}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 uppercase tracking-wide">INITIAL DEPOSIT</label>
                      <p className="text-gray-900 font-medium">${selectedRequest.initialDeposit.toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 uppercase tracking-wide">ACCOUNT TYPE</label>
                      <p className="text-gray-900 font-medium">{selectedRequest.accountType}</p>
                    </div>
                  </div>
                </div>

                {/* Uploaded Documents */}
                {selectedRequest.applicationData?.uploadedDocuments && selectedRequest.applicationData.uploadedDocuments.length > 0 && (
                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <h4 className="font-medium text-gray-800 mb-4 uppercase tracking-wide flex items-center">
                      <FileText size={16} className="mr-2" />
                      UPLOADED DOCUMENTS ({selectedRequest.applicationData.uploadedDocuments.length})
                    </h4>
                    <div className="space-y-3">
                      {selectedRequest.applicationData.uploadedDocuments.map((doc: any) => (
                        <div key={doc.id} className="flex items-center justify-between bg-white p-4 rounded border border-gray-300">
                          <div className="flex items-center space-x-3">
                            {getFileIcon(doc.type)}
                            <div>
                              <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                              <p className="text-xs text-gray-500">
                                {(doc.size / 1024 / 1024).toFixed(2)} MB • 
                                Uploaded: {new Date(doc.uploadedAt.seconds * 1000).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => window.open(doc.url, '_blank')}
                              className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors flex items-center space-x-1 uppercase tracking-wide"
                            >
                              <Eye size={12} />
                              <span>VIEW</span>
                            </button>
                            <button
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = doc.url;
                                link.download = doc.name;
                                link.click();
                              }}
                              className="px-3 py-1 bg-gray-600 text-white text-xs font-medium rounded hover:bg-gray-700 transition-colors flex items-center space-x-1 uppercase tracking-wide"
                            >
                              <Download size={12} />
                              <span>DOWNLOAD</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Approval Conditions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Approval Conditions (comma-separated)</label>
                  <textarea
                    value={approvalConditions}
                    onChange={(e) => setApprovalConditions(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                    placeholder="e.g., KYC verification, additional document submission"
                  />
                  <p className="text-xs text-gray-500 mt-1">These conditions will be applied to the investor's account upon approval.</p>
                </div>

                {/* Rejection Reason */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rejection Reason</label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                    placeholder="Provide a reason if rejecting the application"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4">
                  <Button
                    variant="danger"
                    onClick={handleReject}
                    isLoading={processingRequest === selectedRequest.id}
                    disabled={processingRequest === selectedRequest.id || !rejectionReason.trim()}
                    className="flex-1"
                  >
                    <XCircle size={16} className="mr-2" /> Reject
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleApprove}
                    isLoading={processingRequest === selectedRequest.id}
                    disabled={processingRequest === selectedRequest.id}
                    className="flex-1"
                  >
                    <CheckCircle size={16} className="mr-2" /> Approve
                  </Button>
                </div>
              </div>
            </Modal>
          )}
        </div>
      )}
    </Modal>
  );
};

export default AccountCreationRequests;
