import { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { WithdrawalFlagService } from '../../services/withdrawalFlagService';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Flag, 
  AlertTriangle, 
  Eye, 
  FileText, 
  Shield,
  Clock,
  CheckCircle
} from 'lucide-react';

interface WithdrawalFlagModalProps {
  isOpen: boolean;
  onClose: () => void;
  withdrawalId: string;
  withdrawalAmount: number;
  investorName: string;
  onSuccess?: () => void;
}

const WithdrawalFlagModal = ({ 
  isOpen, 
  onClose, 
  withdrawalId,
  withdrawalAmount,
  investorName,
  onSuccess 
}: WithdrawalFlagModalProps) => {
  const { user } = useAuth();
  const [flagType, setFlagType] = useState<'urgent' | 'suspicious' | 'high_amount' | 'documentation_required' | 'compliance_review'>('urgent');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('urgent');
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const flagTypes = [
    { 
      id: 'urgent', 
      label: 'URGENT PROCESSING', 
      icon: <AlertTriangle size={16} />, 
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      description: 'Mark for immediate attention and priority processing'
    },
    { 
      id: 'suspicious', 
      label: 'SUSPICIOUS ACTIVITY', 
      icon: <Eye size={16} />, 
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      description: 'Flag for potential fraudulent or suspicious behavior'
    },
    { 
      id: 'high_amount', 
      label: 'HIGH AMOUNT', 
      icon: <FileText size={16} />, 
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      description: 'Large withdrawal requiring additional oversight'
    },
    { 
      id: 'documentation_required', 
      label: 'DOCUMENTATION REQUIRED', 
      icon: <FileText size={16} />, 
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      description: 'Additional documentation needed before processing'
    },
    { 
      id: 'compliance_review', 
      label: 'COMPLIANCE REVIEW', 
      icon: <Shield size={16} />, 
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      description: 'Requires compliance team review and approval'
    }
  ];

  const priorityLevels = [
    { id: 'low', label: 'LOW', color: 'text-gray-600', bgColor: 'bg-gray-100' },
    { id: 'medium', label: 'MEDIUM', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
    { id: 'high', label: 'HIGH', color: 'text-orange-600', bgColor: 'bg-orange-100' },
    { id: 'urgent', label: 'URGENT', color: 'text-red-600', bgColor: 'bg-red-100' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!comment.trim() || !user) {
      setError('Please provide a comment for this flag request');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      await WithdrawalFlagService.requestWithdrawalFlag(
        withdrawalId,
        flagType,
        priority,
        comment.trim(),
        user.id,
        user.name,
        user.role === 'admin' ? 'admin' : 'governor'
      );
      
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
      setComment('');
      setFlagType('urgent');
      setPriority('urgent');
    } catch (error) {
      console.error('Error requesting withdrawal flag:', error);
      setError('Failed to submit flag request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setComment('');
    setFlagType('urgent');
    setPriority('urgent');
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="REQUEST WITHDRAWAL FLAG"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Withdrawal Information */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h4 className="font-medium text-gray-800 mb-3 uppercase tracking-wide">FLAG REQUEST DETAILS</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600 font-medium uppercase tracking-wide">INVESTOR</p>
              <p className="font-bold text-gray-900">{investorName}</p>
            </div>
            <div>
              <p className="text-gray-600 font-medium uppercase tracking-wide">AMOUNT</p>
              <p className="font-bold text-gray-900">${withdrawalAmount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-600 font-medium uppercase tracking-wide">REQUEST ID</p>
              <p className="font-bold text-gray-900">#{withdrawalId.slice(-8)}</p>
            </div>
            <div>
              <p className="text-gray-600 font-medium uppercase tracking-wide">REQUESTED BY</p>
              <p className="font-bold text-gray-900">{user?.name} ({user?.role?.toUpperCase()})</p>
            </div>
          </div>
          
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-blue-800 text-sm font-medium uppercase tracking-wide">
              <strong>IMPORTANT:</strong> This is a flag request that requires Governor approval before taking effect. 
              Only pending and approved withdrawals can be flagged. The flag will only appear after Governor approval.
            </p>
          </div>
        </div>

        {/* Flag Type Selection */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
            FLAG TYPE
          </label>
          <div className="grid grid-cols-1 gap-3">
            {flagTypes.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => setFlagType(type.id as any)}
                className={`p-4 border transition-all text-left ${
                  flagType === type.id
                    ? `${type.bgColor} ${type.borderColor} border-2`
                    : 'border-gray-300 hover:border-gray-400 bg-white'
                }`}
              >
                <div className="flex items-center space-x-3 mb-2">
                  {type.icon}
                  <span className={`font-bold text-sm uppercase tracking-wide ${
                    flagType === type.id ? type.color : 'text-gray-700'
                  }`}>
                    {type.label}
                  </span>
                </div>
                <p className={`text-xs uppercase tracking-wide ${
                  flagType === type.id ? type.color : 'text-gray-600'
                }`}>
                  {type.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Priority Selection */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
            PRIORITY LEVEL
          </label>
          <div className="flex space-x-2">
            {priorityLevels.map((level) => (
              <button
                key={level.id}
                type="button"
                onClick={() => setPriority(level.id as any)}
                className={`px-4 py-2 border transition-all font-bold uppercase tracking-wide text-sm ${
                  priority === level.id
                    ? `${level.bgColor} ${level.color} border-gray-900`
                    : 'border-gray-300 text-gray-600 hover:border-gray-400 bg-white'
                }`}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
            FLAG REQUEST REASON <span className="text-red-600">*</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
            rows={4}
            placeholder="Explain why this withdrawal should be flagged (e.g., investor needs withdrawal urgently, suspicious activity detected, etc.)..."
            required
          />
          <p className="text-xs text-gray-600 mt-1 uppercase tracking-wide">
            This request will be reviewed by the Governor before the flag is applied
          </p>
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
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1"
          >
            CANCEL
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            disabled={!comment.trim() || isLoading}
            className="flex-1"
          >
            {isLoading ? 'SUBMITTING REQUEST...' : 'SUBMIT FLAG REQUEST'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default WithdrawalFlagModal;