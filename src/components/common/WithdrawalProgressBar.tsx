import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWithdrawalFlags } from '../../hooks/useWithdrawalFlags';
import { WithdrawalFlagService } from '../../services/withdrawalFlagService';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Calendar,
  AlertTriangle,
  DollarSign,
  Download,
  FileText,
  Upload,
  Eye,
  Globe,
  TrendingUp,
  Flag,
  Shield
} from 'lucide-react';
import Button from './Button';
import Modal from './Modal';

interface WithdrawalProgressBarProps {
  withdrawalId: string;
  submissionDate: string;
  currentStatus: 'Pending' | 'Approved' | 'Credited' | 'Rejected';
  approvalDate?: string | null;
  creditDate?: string | null;
  rejectionDate?: string | null;
  amount: number;
  investorName: string;
  rejectionReason?: string;
  withdrawalRequest?: any;
}

// Country to currency mapping
const countryCurrencyMap: Record<string, string> = {
  'Mexico': 'MXN',
  'France': 'EUR', 
  'Switzerland': 'CHF',
  'Saudi Arabia': 'SAR',
  'United Arab Emirates': 'AED',
  'United States': 'USD'
};

const WithdrawalProgressBar = ({
  withdrawalId,
  submissionDate,
  currentStatus,
  approvalDate,
  creditDate,
  rejectionDate,
  amount,
  investorName,
  rejectionReason,
  withdrawalRequest
}: WithdrawalProgressBarProps) => {
  const [currentStage, setCurrentStage] = useState(1);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [businessDaysElapsed, setBusinessDaysElapsed] = useState(0);
  const [estimatedCompletionDate, setEstimatedCompletionDate] = useState<Date | null>(null);
  
  // W-8 BEN form status tracking
  const [w8benRequired, setW8benRequired] = useState(false);
  const [w8benStatus, setW8benStatus] = useState<string>('not_required');
  const [w8benSubmittedDate, setW8benSubmittedDate] = useState<Date | null>(null);
  const [w8benApprovedDate, setW8benApprovedDate] = useState<Date | null>(null);
  const [w8benRejectionReason, setW8benRejectionReason] = useState<string>('');
  
  // Currency conversion
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [localCurrency, setLocalCurrency] = useState<string>('USD');
  const [localAmount, setLocalAmount] = useState<number>(amount);
  const [isLoadingRate, setIsLoadingRate] = useState(false);
  
  // Flag system state
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flagType, setFlagType] = useState<'urgent' | 'suspicious' | 'high_amount' | 'documentation_required' | 'compliance_review'>('urgent');
  const [flagPriority, setFlagPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('urgent');
  const [flagComment, setFlagComment] = useState('');
  const [isFlagging, setIsFlagging] = useState(false);
  const [flagError, setFlagError] = useState('');
  
  // Get withdrawal flags with error handling
  const { flags = [], hasUrgentFlag = false, urgentComment = '' } = useWithdrawalFlags(withdrawalId) || {};
  
  const { user } = useAuth();

  // Check if user has already requested a flag for this withdrawal
  const hasUserRequestedFlag = flags?.some(flag => 
    flag.requestedBy === user?.id && 
    (flag.status === 'pending' || flag.status === 'approved')
  ) || false;
  
  // Get approved flag for display
  const approvedFlag = flags?.find(flag => 
    flag.status === 'approved' && flag.isActive
  ) || null;

  // Get investor country from withdrawal request
  const getInvestorCountry = () => {
    if (withdrawalRequest?.investorCountry) {
      return withdrawalRequest.investorCountry;
    }
    // Try to extract from investor name or other data
    return 'United States'; // Default fallback
  };

  // Flag types for the modal
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

  // Check if withdrawal can be flagged (only pending and approved)
  const canBeFlagged = currentStatus === 'Pending' || currentStatus === 'Approved';

  const handleSubmitFlag = async () => {
    if (!flagComment.trim() || !user) {
      setFlagError('Please provide a comment for this priority request');
      return;
    }
    
    setIsFlagging(true);
    setFlagError('');
    
    try {
      await WithdrawalFlagService.requestWithdrawalFlag(
        withdrawalId,
        flagType,
        flagPriority,
        flagComment.trim(),
        user.id,
        user.name,
        user.role === 'admin' ? 'admin' : 'governor'
      );
      
      setShowFlagModal(false);
      setFlagComment('');
      setFlagType('urgent');
      setFlagPriority('urgent');
      setFlagError('');
      
      // The useWithdrawalFlags hook will automatically update the flags
    } catch (error) {
      console.error('Error submitting flag request:', error);
      setFlagError('Failed to submit priority request. Please try again.');
    } finally {
      setIsFlagging(false);
    }
  };

  // Fetch exchange rate for currency conversion
  const fetchExchangeRate = async (fromCurrency: string, toCurrency: string) => {
    if (fromCurrency === toCurrency) {
      return 1;
    }

    setIsLoadingRate(true);
    try {
      // Using a free exchange rate API
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
      const data = await response.json();
      
      if (data.rates && data.rates[toCurrency]) {
        return data.rates[toCurrency];
      }
      
      // Fallback rates if API fails
      const fallbackRates: Record<string, number> = {
        'MXN': 20.15, // USD to MXN
        'EUR': 0.85,  // USD to EUR
        'CHF': 0.88,  // USD to CHF
        'SAR': 3.75,  // USD to SAR
        'AED': 3.67   // USD to AED
      };
      
      return fallbackRates[toCurrency] || 1;
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      // Return fallback rates
      const fallbackRates: Record<string, number> = {
        'MXN': 20.15,
        'EUR': 0.85,
        'CHF': 0.88,
        'SAR': 3.75,
        'AED': 3.67
      };
      return fallbackRates[toCurrency] || 1;
    } finally {
      setIsLoadingRate(false);
    }
  };

  // Initialize currency conversion
  useEffect(() => {
    const investorCountry = getInvestorCountry();
    const currency = countryCurrencyMap[investorCountry] || 'USD';
    setLocalCurrency(currency);

    if (currency !== 'USD') {
      fetchExchangeRate('USD', currency).then(rate => {
        setExchangeRate(rate);
        setLocalAmount(amount * rate);
      });
    } else {
      setLocalAmount(amount);
    }
  }, [amount, withdrawalRequest]);

  // Initialize W-8 BEN status from Firebase
  useEffect(() => {
    if (withdrawalRequest) {
      console.log('🔄 Syncing W-8 BEN status from Firebase:', {
        withdrawalId,
        w8benStatus: withdrawalRequest.w8benStatus,
        w8benSubmittedAt: withdrawalRequest.w8benSubmittedAt,
        w8benApprovedAt: withdrawalRequest.w8benApprovedAt,
        w8benRejectionReason: withdrawalRequest.w8benRejectionReason,
        amount
      });

      // Check if W-8 BEN is required (≥$1000)
      const isRequired = amount >= 1000;
      setW8benRequired(isRequired);

      if (isRequired) {
        // Sync status from Firebase
        const status = withdrawalRequest.w8benStatus || 'not_required';
        setW8benStatus(status);
        
        // Sync dates
        if (withdrawalRequest.w8benSubmittedAt) {
          setW8benSubmittedDate(withdrawalRequest.w8benSubmittedAt.toDate ? 
            withdrawalRequest.w8benSubmittedAt.toDate() : 
            new Date(withdrawalRequest.w8benSubmittedAt)
          );
        }
        
        if (withdrawalRequest.w8benApprovedAt) {
          setW8benApprovedDate(withdrawalRequest.w8benApprovedAt.toDate ? 
            withdrawalRequest.w8benApprovedAt.toDate() : 
            new Date(withdrawalRequest.w8benApprovedAt)
          );
        }
        
        if (withdrawalRequest.w8benRejectionReason) {
          setW8benRejectionReason(withdrawalRequest.w8benRejectionReason);
        }

        console.log('✅ W-8 BEN status synced:', {
          status,
          submittedDate: withdrawalRequest.w8benSubmittedAt,
          approvedDate: withdrawalRequest.w8benApprovedAt
        });
      }
    }
  }, [withdrawalRequest, amount, withdrawalId]);

  const calculateBusinessDays = (startDate: Date, endDate: Date) => {
    let count = 0;
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    return count;
  };

  const addBusinessDays = (startDate: Date, businessDays: number) => {
    const result = new Date(startDate);
    let daysAdded = 0;
    
    while (daysAdded < businessDays) {
      result.setDate(result.getDate() + 1);
      const dayOfWeek = result.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not weekend
        daysAdded++;
      }
    }
    
    return result;
  };

  useEffect(() => {
    const now = new Date();
    const submissionDateTime = new Date(submissionDate);
    
    // Calculate business days elapsed since submission
    const businessDays = calculateBusinessDays(submissionDateTime, now);
    setBusinessDaysElapsed(businessDays);
    
    // Determine stage and progress based on status
    switch (currentStatus) {
      case 'Pending':
        setCurrentStage(1);
        // Progress based on business days elapsed (max 5 days for pending)
        const pendingProgress = Math.min(businessDays / 5, 1) * 25;
        setProgressPercentage(pendingProgress);
        
        // Estimate completion date (3-5 business days from submission)
        const estimatedDate = addBusinessDays(submissionDateTime, 5);
        setEstimatedCompletionDate(estimatedDate);
        break;
        
      case 'Approved':
        setCurrentStage(2);
        setProgressPercentage(50);
        
        if (approvalDate) {
          const approvalDateTime = new Date(approvalDate);
          // Estimate credit date (1-3 business days from approval)
          const creditEstimate = addBusinessDays(approvalDateTime, 3);
          setEstimatedCompletionDate(creditEstimate);
        }
        break;
        
      case 'Credited':
        setCurrentStage(3);
        setProgressPercentage(100);
        setEstimatedCompletionDate(null);
        break;
        
      case 'Rejected':
        setCurrentStage(4);
        setProgressPercentage(100);
        setEstimatedCompletionDate(null);
        break;
    }
  }, [currentStatus, submissionDate, approvalDate, creditDate, rejectionDate]);

  const getProgressBarColor = () => {
    switch (currentStatus) {
      case 'Pending':
        return 'bg-gray-500';
      case 'Approved':
        return 'bg-gray-600';
      case 'Credited':
        return 'bg-gray-700';
      case 'Rejected':
        return 'bg-gray-400';
      default:
        return 'bg-gray-300';
    }
  };

  const getStatusIcon = () => {
    switch (currentStatus) {
      case 'Pending':
        return <Clock size={20} className="text-gray-600" />;
      case 'Approved':
        return <CheckCircle size={20} className="text-gray-600" />;
      case 'Credited':
        return <CheckCircle size={20} className="text-gray-600" />;
      case 'Rejected':
        return <XCircle size={20} className="text-gray-600" />;
      default:
        return <Clock size={20} className="text-gray-600" />;
    }
  };

  const getStatusMessage = () => {
    switch (currentStatus) {
      case 'Pending':
        return {
          title: 'Withdrawal Request Submitted',
          message: 'Your withdrawal request is being reviewed by our team.',
          detail: `Submitted ${businessDaysElapsed} business day${businessDaysElapsed !== 1 ? 's' : ''} ago. Typical processing time is 1-3 business days.`
        };
      case 'Approved':
        return {
          title: 'Withdrawal Request Approved',
          message: 'Your withdrawal has been approved and is being processed for transfer.',
          detail: approvalDate 
            ? `Approved on ${new Date(approvalDate).toLocaleDateString()}. Funds will be transferred within 1-3 business days.`
            : 'Funds will be transferred to your registered bank account within 1-3 business days.'
        };
      case 'Credited':
        return {
          title: 'Withdrawal Completed',
          message: 'Your withdrawal has been successfully transferred to your bank account.',
          detail: creditDate 
            ? `Completed on ${new Date(creditDate).toLocaleDateString()}. Funds should appear in your account within 1-2 business days.`
            : 'Funds have been transferred and should appear in your account within 1-2 business days.'
        };
      case 'Rejected':
        return {
          title: 'Withdrawal Request Rejected',
          message: 'Your withdrawal request has been rejected.',
          detail: rejectionReason || 'Please contact support for more information about this rejection.'
        };
      default:
        return {
          title: 'Processing Withdrawal',
          message: 'Your withdrawal request is being processed.',
          detail: ''
        };
    }
  };

  const downloadW8BenForm = () => {
    // Open the W-8 BEN form PDF
    window.open('/fw8ben.pdf', '_blank');
  };

  const statusInfo = getStatusMessage();

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              {getStatusIcon()}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Withdrawal Progress</h3>
              <p className="text-sm text-gray-600">Request #{withdrawalId.slice(-8)}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-gray-900">${amount.toLocaleString()}</p>
            <p className="text-sm text-gray-600">{investorName}</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Currency Conversion Display */}
        {localCurrency !== 'USD' && (
          <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2 mb-3">
              <Globe size={18} className="text-gray-600" />
              <h4 className="font-semibold text-gray-800 uppercase tracking-wide">Currency Conversion</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-600 font-medium uppercase tracking-wide">USD Amount</p>
                <p className="font-bold text-gray-900">${amount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-600 font-medium uppercase tracking-wide">Exchange Rate</p>
                <p className="font-bold text-gray-900">
                  {isLoadingRate ? (
                    <span className="flex items-center">
                      <div className="w-3 h-3 border border-gray-600 border-t-transparent rounded-full animate-spin mr-1"></div>
                      Loading...
                    </span>
                  ) : (
                    `1 USD = ${exchangeRate.toFixed(4)} ${localCurrency}`
                  )}
                </p>
              </div>
              <div>
                <p className="text-gray-600 font-medium uppercase tracking-wide">Local Amount</p>
                <p className="font-bold text-gray-900">
                  {localCurrency} {localAmount.toLocaleString(undefined, { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })}
                </p>
              </div>
            </div>
            <p className="text-gray-700 text-xs mt-2 uppercase tracking-wide font-medium">
              * Exchange rate is updated in real-time and may vary at the time of actual transfer
            </p>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm font-medium text-gray-700">{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-3 rounded-full transition-all duration-1000 ${getProgressBarColor()}`}
            />
          </div>
          {estimatedCompletionDate && currentStatus !== 'Credited' && currentStatus !== 'Rejected' && (
            <p className="text-xs text-gray-500 mt-1">
              Estimated completion: {estimatedCompletionDate.toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Mark as Priority Button - Only for Admin and only for active withdrawals */}
        {user?.role === 'admin' && canBeFlagged && !hasUserRequestedFlag && (
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => setShowFlagModal(true)}
              className="w-full"
            >
              Mark as Priority
            </Button>
          </div>
        )}
        
        {/* Show flag status if user has already requested */}
        {user?.role === 'admin' && hasUserRequestedFlag && (
          <div className="mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <span className="text-blue-800 font-medium text-sm uppercase tracking-wide">
                  Priority request submitted
                </span>
              </div>
              <p className="text-blue-700 text-sm mt-1">
                Your priority request is pending Governor review.
              </p>
            </div>
          </div>
        )}

        {/* Status Information */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 mb-6">
          <div className="flex items-start space-x-3">
            <div className="mt-1">{getStatusIcon()}</div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">{statusInfo.title}</h4>
              <p className="text-gray-700 text-sm mb-2">{statusInfo.message}</p>
              {statusInfo.detail && (
                <p className="text-gray-600 text-xs">{statusInfo.detail}</p>
              )}
              
              {/* Display withdrawal flags and comments */}
              {flags.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h5 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">
                    WITHDRAWAL FLAGS & REQUESTS
                  </h5>
                  
                  {/* Show approved flags */}
                  {flags.filter(flag => flag.isActive && flag.status === 'approved').map((flag) => (
                    <div key={flag.id} className={`p-3 border rounded-lg ${
                      flag.flagType === 'urgent' || flag.priority === 'urgent'
                        ? 'bg-red-50 border-red-200'
                        : flag.flagType === 'suspicious'
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-blue-50 border-blue-200'
                    }`}>
                      <div className="flex items-start space-x-2">
                        <Flag size={14} className={
                          flag.flagType === 'urgent' || flag.priority === 'urgent'
                            ? 'text-red-600'
                            : flag.flagType === 'suspicious'
                            ? 'text-amber-600'
                            : 'text-blue-600'
                        } />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className={`px-2 py-1 text-xs font-bold border uppercase tracking-wide ${
                              flag.flagType === 'urgent' || flag.priority === 'urgent'
                                ? 'bg-red-100 text-red-800 border-red-200'
                                : flag.flagType === 'suspicious'
                                ? 'bg-amber-100 text-amber-800 border-amber-200'
                                : 'bg-blue-100 text-blue-800 border-blue-200'
                            }`}>
                              APPROVED: {flag.flagType.replace('_', ' ')}
                            </span>
                            <span className={`px-2 py-1 text-xs font-bold border uppercase tracking-wide ${
                              flag.priority === 'urgent' ? 'bg-red-100 text-red-800 border-red-200' :
                              flag.priority === 'high' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                              flag.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                              'bg-gray-100 text-gray-800 border-gray-200'
                            }`}>
                              {flag.priority}
                            </span>
                          </div>
                          <p className={`text-sm font-medium ${
                            flag.flagType === 'urgent' || flag.priority === 'urgent'
                              ? 'text-red-700'
                              : flag.flagType === 'suspicious'
                              ? 'text-amber-700'
                              : 'text-blue-700'
                          }`}>
                            Original Request: {flag.comment}
                          </p>
                          {flag.reviewComment && (
                            <p className="text-sm text-gray-700 mt-2 p-2 bg-white border border-gray-300 rounded">
                              <strong>Governor Decision:</strong> {flag.reviewComment}
                            </p>
                          )}
                          <div className="mt-2 space-y-1">
                            <p className="text-xs text-gray-500 uppercase tracking-wide">
                              Requested by: {flag.requestedByName} ({flag.requestedByRole.toUpperCase()}) on {flag.requestedAt.toLocaleDateString()}
                            </p>
                            {flag.reviewedByName && (
                              <p className="text-xs text-gray-600 uppercase tracking-wide">
                                Approved by: {flag.reviewedByName} (GOVERNOR) on {flag.reviewedAt?.toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Show pending flag requests */}
                  {flags.filter(flag => flag.status === 'pending').map((flag) => (
                    <div key={flag.id} className="p-3 border border-gray-300 rounded-lg bg-gray-50">
                      <div className="flex items-start space-x-2">
                        <Clock size={14} className="text-gray-500 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="px-2 py-1 text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-200 uppercase tracking-wide">
                              PENDING GOVERNOR REVIEW
                            </span>
                            <span className="px-2 py-1 text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-200 uppercase tracking-wide">
                              {flag.priority}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 font-medium">
                            Flag Type: {flag.flagType.replace('_', ' ').toUpperCase()}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {flag.comment}
                          </p>
                          <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">
                            Requested by: {flag.requestedByName} ({flag.requestedByRole.toUpperCase()}) on {flag.requestedAt.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Show rejected flag requests */}
                  {flags.filter(flag => flag.status === 'rejected').map((flag) => (
                    <div key={flag.id} className="p-3 border border-gray-300 rounded-lg bg-gray-50">
                      <div className="flex items-start space-x-2">
                        <XCircle size={14} className="text-gray-500 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="px-2 py-1 text-xs font-bold bg-red-100 text-red-800 border border-red-200 uppercase tracking-wide">
                              REJECTED BY GOVERNOR
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 font-medium">
                            Flag Type: {flag.flagType.replace('_', ' ').toUpperCase()}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            Original request: {flag.comment}
                          </p>
                          {flag.reviewComment && (
                            <p className="text-sm text-red-700 mt-2 p-2 bg-red-50 border border-red-200 rounded">
                              <strong>Governor Rejection:</strong> {flag.reviewComment}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">
                            Requested by: {flag.requestedByName} | Rejected by: {flag.reviewedByName} on {flag.reviewedAt?.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Governor Comment Display */}
              {withdrawalRequest?.governorComment && (
                <div className="mt-3 bg-gray-100 p-3 border border-gray-200">
                  <p className="text-gray-800 text-xs font-bold uppercase tracking-wide mb-1">
                    GOVERNOR UPDATE:
                  </p>
                  <p className="text-gray-700 text-xs">
                    {withdrawalRequest.governorComment}
                  </p>
                  {withdrawalRequest.lastModifiedBy && (
                    <p className="text-gray-500 text-xs mt-1 uppercase tracking-wide">
                      BY: {withdrawalRequest.lastModifiedBy}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* W-8 BEN Form Section - Only show for withdrawals ≥ $1000 */}
        {w8benRequired && (
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <FileText size={18} className="text-gray-600" />
              <h4 className="font-semibold text-gray-900">W-8 BEN Tax Form</h4>
              <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full font-medium">
                Required for withdrawals ≥ $1,000
              </span>
            </div>

            {/* W-8 BEN Status Display */}
            {w8benStatus === 'not_required' || w8benStatus === 'required' ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle size={20} className="text-gray-600 mt-0.5" />
                  <div className="flex-1">
                    <h5 className="font-semibold text-gray-800 uppercase tracking-wide">W-8 BEN Form Required</h5>
                    <p className="text-gray-700 text-sm mt-1 uppercase tracking-wide font-medium">
                      Your withdrawal amount of ${amount.toLocaleString()} requires a completed W-8 BEN tax form. 
                      Please download, complete, and submit the form to proceed with your withdrawal.
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadW8BenForm}
                  >
                    <Download size={16} className="mr-2" />
                    Download W-8 BEN Form
                  </Button>
                </div>
              </div>
            ) : w8benStatus === 'submitted' ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Clock size={20} className="text-gray-600 mt-0.5" />
                  <div className="flex-1">
                    <h5 className="font-semibold text-gray-800 uppercase tracking-wide">W-8 BEN Form Under Review</h5>
                    <p className="text-gray-700 text-sm mt-1 uppercase tracking-wide font-medium">
                      Your W-8 BEN form has been submitted and is currently under review by our compliance team.
                      {w8benSubmittedDate && (
                        <span className="block mt-1">
                          Submitted on: {w8benSubmittedDate.toLocaleDateString().toUpperCase()}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadW8BenForm}
                    disabled
                  >
                    <Eye size={16} className="mr-2" />
                    Form Under Review
                  </Button>
                </div>
              </div>
            ) : w8benStatus === 'approved' ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle size={20} className="text-gray-600 mt-0.5" />
                  <div className="flex-1">
                    <h5 className="font-semibold text-gray-800 uppercase tracking-wide">W-8 BEN Form Approved</h5>
                    <p className="text-gray-700 text-sm mt-1 uppercase tracking-wide font-medium">
                      Your W-8 BEN form has been approved by our compliance team. Your withdrawal can now proceed.
                      {w8benApprovedDate && (
                        <span className="block mt-1">
                          Approved on: {w8benApprovedDate.toLocaleDateString().toUpperCase()}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ) : w8benStatus === 'rejected' ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <XCircle size={20} className="text-gray-600 mt-0.5" />
                  <div className="flex-1">
                    <h5 className="font-semibold text-gray-800 uppercase tracking-wide">W-8 BEN Form Rejected</h5>
                    <p className="text-gray-700 text-sm mt-1 uppercase tracking-wide font-medium">
                      Your W-8 BEN form has been rejected. Please download a new form, complete it correctly, and resubmit.
                      {w8benRejectionReason && (
                        <span className="block mt-2 font-medium">
                          Reason: {w8benRejectionReason.toUpperCase()}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadW8BenForm}
                  >
                    <Download size={16} className="mr-2" />
                    Download New W-8 BEN Form
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Timeline Stages */}
        <div className="space-y-4">
          {/* Stage 1: Submitted */}
          <div className={`flex items-center space-x-4 p-4 rounded-lg ${
            currentStage >= 1 
              ? 'bg-gray-50 border border-gray-200' 
              : 'bg-white border border-gray-100'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStage >= 1 
                ? 'bg-gray-100 border-2 border-gray-400' 
                : 'bg-gray-100 border-2 border-gray-300'
            }`}>
              {currentStage >= 1 ? (
                <CheckCircle size={16} className="text-gray-600" />
              ) : (
                <span className="text-gray-500 font-bold text-sm">1</span>
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">Request Submitted</p>
              <p className="text-gray-600 text-sm">
                {currentStage >= 1 
                  ? `Submitted on ${new Date(submissionDate).toLocaleDateString()}`
                  : 'Withdrawal request submission'
                }
              </p>
            </div>
            {currentStage >= 1 && (
              <div className="text-right">
                <span className="text-xs text-gray-500">
                  {new Date(submissionDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {/* Stage 2: Approved */}
          <div className={`flex items-center space-x-4 p-4 rounded-lg ${
            currentStage >= 2 
              ? 'bg-gray-50 border border-gray-200' 
              : 'bg-white border border-gray-100'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStage >= 2 
                ? 'bg-gray-100 border-2 border-gray-400' 
                : 'bg-gray-100 border-2 border-gray-300'
            }`}>
              {currentStage >= 2 ? (
                <CheckCircle size={16} className="text-gray-600" />
              ) : (
                <span className="text-gray-500 font-bold text-sm">2</span>
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">Approved for Transfer</p>
              <p className="text-gray-600 text-sm">
                {currentStage >= 2 
                  ? approvalDate 
                    ? `Approved on ${new Date(approvalDate).toLocaleDateString()}`
                    : 'Approved and queued for transfer'
                  : 'Pending approval from compliance team'
                }
              </p>
            </div>
            {currentStage >= 2 && approvalDate && (
              <div className="text-right">
                <span className="text-xs text-gray-500">
                  {new Date(approvalDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {/* Stage 3: Credited */}
          <div className={`flex items-center space-x-4 p-4 rounded-lg ${
            currentStage >= 3 && currentStatus === 'Credited'
              ? 'bg-gray-50 border border-gray-200' 
              : 'bg-white border border-gray-100'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStage >= 3 && currentStatus === 'Credited'
                ? 'bg-gray-100 border-2 border-gray-400' 
                : 'bg-gray-100 border-2 border-gray-300'
            }`}>
              {currentStage >= 3 && currentStatus === 'Credited' ? (
                <CheckCircle size={16} className="text-gray-600" />
              ) : (
                <span className="text-gray-500 font-bold text-sm">3</span>
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">Transfer Completed</p>
              <p className="text-gray-600 text-sm">
                {currentStage >= 3 && currentStatus === 'Credited'
                  ? creditDate 
                    ? `Completed on ${new Date(creditDate).toLocaleDateString()}`
                    : 'Funds transferred to your bank account'
                  : 'Awaiting bank transfer completion'
                }
              </p>
            </div>
            {currentStage >= 3 && currentStatus === 'Credited' && creditDate && (
              <div className="text-right">
                <span className="text-xs text-gray-500">
                  {new Date(creditDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {/* Stage 4: Rejected (if applicable) */}
          {currentStatus === 'Rejected' && (
            <div className="flex items-center space-x-4 p-4 rounded-lg bg-gray-50 border border-gray-200">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 border-2 border-gray-400">
                <XCircle size={16} className="text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Request Rejected</p>
                <p className="text-gray-600 text-sm">
                  {rejectionDate 
                    ? `Rejected on ${new Date(rejectionDate).toLocaleDateString()}`
                    : 'Withdrawal request was rejected'
                  }
                </p>
                {rejectionReason && (
                  <p className="text-gray-700 text-sm mt-1 font-medium">
                    Reason: {rejectionReason}
                  </p>
                )}
              </div>
              {rejectionDate && (
                <div className="text-right">
                  <span className="text-xs text-gray-500">
                    {new Date(rejectionDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Processing Information */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
          <h4 className="font-semibold text-gray-900 mb-2">Processing Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
            <div>
              <p><strong>Submission Date:</strong> {new Date(submissionDate).toLocaleDateString()}</p>
              <p><strong>Business Days Elapsed:</strong> {businessDaysElapsed}</p>
              <p><strong>Current Status:</strong> {currentStatus}</p>
            </div>
            <div>
              <p><strong>Processing Time:</strong> 1-3 business days</p>
              <p><strong>Transfer Method:</strong> Bank Wire Transfer</p>
              {localCurrency !== 'USD' && (
                <p><strong>Currency:</strong> Converted to {localCurrency}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mark as Priority Modal - Only for Admin */}
      <Modal
        isOpen={showFlagModal}
        onClose={() => {
          setShowFlagModal(false);
          setFlagComment('');
          setFlagType('urgent');
          setFlagPriority('urgent');
          setFlagError('');
        }}
        title="MARK AS PRIORITY"
        size="lg"
      >
        <div className="space-y-6">
          {/* Withdrawal Information */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-800 mb-3 uppercase tracking-wide">PRIORITY REQUEST DETAILS</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600 font-medium uppercase tracking-wide">INVESTOR</p>
                <p className="font-bold text-gray-900">{investorName}</p>
              </div>
              <div>
                <p className="text-gray-600 font-medium uppercase tracking-wide">AMOUNT</p>
                <p className="font-bold text-gray-900">${amount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-600 font-medium uppercase tracking-wide">REQUEST ID</p>
                <p className="font-bold text-gray-900">#{withdrawalId.slice(-8)}</p>
              </div>
              <div>
                <p className="text-gray-600 font-medium uppercase tracking-wide">CURRENT STATUS</p>
                <p className="font-bold text-gray-900">{currentStatus}</p>
              </div>
            </div>
            
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-blue-800 text-sm font-medium uppercase tracking-wide">
                <strong>NOTE:</strong> This will submit a priority request to the Governor for review. 
                The Governor will decide whether to approve or reject this priority marking.
              </p>
            </div>
          </div>

          {/* Priority Type Selection */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
              PRIORITY TYPE
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

          {/* Priority Level Selection */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
              PRIORITY LEVEL
            </label>
            <div className="flex space-x-2">
              {priorityLevels.map((level) => (
                <button
                  key={level.id}
                  type="button"
                  onClick={() => setFlagPriority(level.id as any)}
                  className={`px-4 py-2 border transition-all font-bold uppercase tracking-wide text-sm ${
                    flagPriority === level.id
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
              PRIORITY REQUEST REASON <span className="text-red-600">*</span>
            </label>
            <textarea
              value={flagComment}
              onChange={(e) => setFlagComment(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
              rows={4}
              placeholder="Explain why this withdrawal should be marked as priority (e.g., investor needs withdrawal urgently for medical emergency, time-sensitive business requirement, etc.)..."
              required
            />
            <p className="text-xs text-gray-600 mt-1 uppercase tracking-wide">
              This request will be reviewed by the Governor before the priority marking is applied
            </p>
          </div>

          {flagError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertTriangle size={16} />
                <span className="font-medium uppercase tracking-wide">{flagError}</span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowFlagModal(false);
                setFlagComment('');
                setFlagType('urgent');
                setFlagPriority('urgent');
                setFlagError('');
              }}
              disabled={isFlagging}
              className="flex-1"
            >
              CANCEL
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleSubmitFlag}
              isLoading={isFlagging}
              disabled={!flagComment.trim() || isFlagging}
              className="flex-1"
            >
              {isFlagging ? 'SUBMITTING REQUEST...' : 'SUBMIT PRIORITY REQUEST'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default WithdrawalProgressBar;