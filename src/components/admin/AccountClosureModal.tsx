import { useState } from 'react';
import { motion } from 'framer-motion';
import Modal from '../common/Modal';
import Button from '../common/Button';
import AccountClosureProgressBar from './AccountClosureProgressBar';
import { AccountClosureService } from '../../services/accountClosureService';
import { AccountClosureRequest } from '../../types/accountClosure';
import { Investor } from '../../types/user';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Calendar,
  DollarSign,
  Shield,
  Clock,
  FileText
} from 'lucide-react';

interface AccountClosureModalProps {
  isOpen: boolean;
  onClose: () => void;
  investor: Investor;
  closureRequest?: AccountClosureRequest | null;
  onSuccess?: () => void;
}

const AccountClosureModal = ({ 
  isOpen, 
  onClose, 
  investor,
  closureRequest,
  onSuccess 
}: AccountClosureModalProps) => {
  const [viewMode, setViewMode] = useState<'progress' | 'details'>('progress');

  const handleClose = () => {
    setViewMode('progress');
    onClose();
  };

  if (!closureRequest) {
    return null;
  }

  const renderProgressView = () => (
    <div className="space-y-6">
      <AccountClosureProgressBar
        closureRequest={closureRequest}
        investorName={investor.name}
        accountBalance={investor.currentBalance}
      />
      
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setViewMode('details')}
        >
          <FileText size={16} className="mr-2" />
          View Details
        </Button>
        <Button
          variant="primary"
          onClick={handleClose}
        >
          Close
        </Button>
      </div>
    </div>
  );

  const renderDetailsView = () => (
    <div className="space-y-6">
      {/* Request Information */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Closure Request Details</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Request ID</label>
                <p className="font-mono text-gray-900">{closureRequest.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Investor Name</label>
                <p className="font-medium text-gray-900">{closureRequest.investorName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Request Date</label>
                <p className="font-medium text-gray-900">
                  {new Date(closureRequest.requestDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Current Status</label>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  closureRequest.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                  closureRequest.status === 'Approved' ? 'bg-red-100 text-red-800' :
                  closureRequest.status === 'Completed' ? 'bg-gray-100 text-gray-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {closureRequest.status}
                </span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Account Balance</label>
                <p className="font-bold text-lg text-gray-900">${closureRequest.accountBalance.toLocaleString()}</p>
              </div>
              {closureRequest.approvalDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Approval Date</label>
                  <p className="font-medium text-gray-900">
                    {closureRequest.approvalDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}
              {closureRequest.status === 'Approved' && closureRequest.approvalDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Expected Completion</label>
                  <p className="font-medium text-gray-900">
                    {new Date(new Date(closureRequest.approvalDate).getTime() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}
              {closureRequest.completionDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Completion Date</label>
                  <p className="font-medium text-gray-900">
                    {closureRequest.completionDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Closure Reason */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-2">Closure Reason</h4>
        <p className="text-gray-700 text-sm">{closureRequest.reason}</p>
      </div>

      {/* Fund Transfer Information */}
      {closureRequest.accountBalance > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-start space-x-3">
            <DollarSign size={20} className="text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-800">Fund Transfer Process</h4>
              <p className="text-blue-700 text-sm mt-1">
                The remaining balance of ${closureRequest.accountBalance.toLocaleString()} will be transferred 
                to the registered bank account within 60-90 days after closure approval. This process is 
                automated and requires no additional action from the investor.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Legal Information */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
          <Shield size={18} className="mr-2" />
          Legal & Compliance Information
        </h4>
        <div className="space-y-2 text-sm text-gray-700">
          <p>• Account closure is governed by our Terms of Service and regulatory requirements</p>
          <p>• The 90-day period ensures compliance with financial regulations</p>
          <p>• All account data will be archived per regulatory retention requirements</p>
          <p>• New account creation is restricted for 90 days after closure</p>
          <p>• Fund transfers are processed through secure banking channels</p>
          <p>• This process cannot be cancelled once approved</p>
        </div>
      </div>

      {/* Timeline History */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Timeline History</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {/* Request Stage */}
            <div className="flex items-start space-x-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-300">
                <FileText size={16} className="text-gray-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-900">Request Submitted</p>
                  <span className="text-xs text-gray-500">
                    {new Date(closureRequest.requestDate).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Account closure request submitted for review
                </p>
              </div>
            </div>

            {/* Approval Stage */}
            {closureRequest.approvalDate && (
              <div className="flex items-start space-x-4 p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center border border-red-300">
                  <AlertTriangle size={16} className="text-red-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-red-900">Request Approved</p>
                    <span className="text-xs text-red-600">
                      {closureRequest.approvalDate.toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-red-700 mt-1">
                    90-day countdown period initiated
                  </p>
                </div>
              </div>
            )}

            {/* Completion Stage */}
            {closureRequest.completionDate && (
              <div className="flex items-start space-x-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-300">
                  <XCircle size={16} className="text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-900">Account Closed</p>
                    <span className="text-xs text-gray-500">
                      {closureRequest.completionDate.toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Account permanently closed and data archived
                  </p>
                </div>
              </div>
            )}

            {/* Rejection Stage */}
            {closureRequest.rejectionDate && (
              <div className="flex items-start space-x-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center border border-green-300">
                  <CheckCircle size={16} className="text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-green-900">Request Rejected</p>
                    <span className="text-xs text-green-600">
                      {closureRequest.rejectionDate.toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    Account remains active - {closureRequest.rejectionReason || 'No reason provided'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setViewMode('progress')}
        >
          <Clock size={16} className="mr-2" />
          Back to Progress
        </Button>
        <Button
          variant="primary"
          onClick={handleClose}
        >
          Close
        </Button>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Account Closure Progress"
      size="lg"
    >
      {viewMode === 'progress' ? renderProgressView() : renderDetailsView()}
    </Modal>
  );
};

export default AccountClosureModal;