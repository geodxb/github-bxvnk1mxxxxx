import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, CircleCheck as CheckCircle, Circle as XCircle, Send, Wallet, Building, TriangleAlert as AlertTriangle, DollarSign, Calendar, Shield, Hash, TrendingUp, FileText } from 'lucide-react';

interface WithdrawalProgressBarProps {
  withdrawalId: string;
  submissionDate: string;
  currentStatus: string;
  approvalDate?: Date | null;
  creditDate?: Date | null;
  rejectionDate?: Date | null;
  amount: number;
  investorName: string;
  rejectionReason?: string;
  withdrawalRequest?: any; // Full withdrawal request object
}

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
  const [estimatedCompletion, setEstimatedCompletion] = useState<Date | null>(null);

  // Determine if this is a crypto withdrawal
  const isCryptoWithdrawal = withdrawalRequest?.type === 'crypto' || withdrawalRequest?.destinationDetails?.address;

  // Calculate business days between two dates (excluding weekends)
  const calculateBusinessDays = (startDate: Date, endDate: Date): number => {
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

  // Add business days to a date
  const addBusinessDays = (startDate: Date, businessDays: number): Date => {
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

    // Determine stage and progress based on status and withdrawal type
    if (isCryptoWithdrawal) {
      // Crypto withdrawal flow: Pending -> Approved -> Sent -> Credited
      switch (currentStatus) {
        case 'pending':
        case 'Pending':
          setCurrentStage(1);
          setProgressPercentage(25);
          setEstimatedCompletion(addBusinessDays(submissionDateTime, 2)); // 2 business days for approval
          break;
        case 'approved':
        case 'Approved':
          setCurrentStage(2);
          setProgressPercentage(50);
          setEstimatedCompletion(addBusinessDays(approvalDate || submissionDateTime, 1)); // 1 business day to send to blockchain
          break;
        case 'sent':
        case 'Sent':
          setCurrentStage(3);
          setProgressPercentage(75);
          setEstimatedCompletion(addBusinessDays(new Date(), 1)); // 1 business day for blockchain confirmation
          break;
        case 'credited':
        case 'Credited':
          setCurrentStage(4);
          setProgressPercentage(100);
          setEstimatedCompletion(creditDate || now);
          break;
        case 'rejected':
        case 'Rejected':
          setCurrentStage(5);
          setProgressPercentage(100);
          setEstimatedCompletion(rejectionDate || now);
          break;
        case 'refunded':
        case 'Refunded':
          setCurrentStage(6);
          setProgressPercentage(100);
          setEstimatedCompletion(now);
          break;
        default:
          setCurrentStage(1);
          setProgressPercentage(25);
      }
    } else {
      // Bank withdrawal flow: Pending -> Approved -> Credited
      switch (currentStatus) {
        case 'pending':
        case 'Pending':
          setCurrentStage(1);
          setProgressPercentage(33);
          setEstimatedCompletion(addBusinessDays(submissionDateTime, 3)); // 3 business days for approval
          break;
        case 'approved':
        case 'Approved':
          setCurrentStage(2);
          setProgressPercentage(66);
          setEstimatedCompletion(addBusinessDays(approvalDate || submissionDateTime, 3)); // 3 business days for transfer
          break;
        case 'credited':
        case 'Credited':
          setCurrentStage(3);
          setProgressPercentage(100);
          setEstimatedCompletion(creditDate || now);
          break;
        case 'rejected':
        case 'Rejected':
          setCurrentStage(4);
          setProgressPercentage(100);
          setEstimatedCompletion(rejectionDate || now);
          break;
        case 'refunded':
        case 'Refunded':
          setCurrentStage(5);
          setProgressPercentage(100);
          setEstimatedCompletion(now);
          break;
        default:
          setCurrentStage(1);
          setProgressPercentage(33);
      }
    }
  }, [currentStatus, submissionDate, approvalDate, creditDate, rejectionDate, isCryptoWithdrawal]);

  const getProgressBarColor = () => {
    if (currentStatus === 'rejected' || currentStatus === 'Rejected') return 'bg-red-500';
    if (currentStatus === 'refunded' || currentStatus === 'Refunded') return 'bg-purple-500';
    if (currentStatus === 'credited' || currentStatus === 'Credited') return 'bg-green-500';
    return 'bg-blue-500';
  };

  const getStatusIcon = () => {
    switch (currentStatus) {
      case 'pending':
      case 'Pending':
        return <Clock size={20} className="text-yellow-600" />;
      case 'approved':
      case 'Approved':
        return <CheckCircle size={20} className="text-green-600" />;
      case 'sent':
      case 'Sent':
        return <Send size={20} className="text-blue-600" />;
      case 'credited':
      case 'Credited':
        return <CheckCircle size={20} className="text-green-600" />;
      case 'rejected':
      case 'Rejected':
        return <XCircle size={20} className="text-red-600" />;
      case 'refunded':
      case 'Refunded':
        return <TrendingUp size={20} className="text-purple-600" />;
      default:
        return <Clock size={20} className="text-gray-600" />;
    }
  };

  const getStatusMessage = () => {
    if (isCryptoWithdrawal) {
      switch (currentStatus) {
        case 'pending':
        case 'Pending':
          return {
            title: 'Crypto Withdrawal Submitted',
            message: 'Your cryptocurrency withdrawal request is being reviewed by the Governor.',
            detail: `Estimated approval time: ${estimatedCompletion?.toLocaleDateString()} (${Math.max(0, 2 - businessDaysElapsed)} business days remaining)`
          };
        case 'approved':
        case 'Approved':
          return {
            title: 'Crypto Withdrawal Approved',
            message: 'Your withdrawal has been approved and is being prepared for blockchain transfer.',
            detail: 'The transaction will be sent to the blockchain within 1 business day.'
          };
        case 'sent':
        case 'Sent':
          return {
            title: 'Sent to Blockchain',
            message: 'Your crypto withdrawal has been sent to the blockchain network.',
            detail: withdrawalRequest?.transactionHash 
              ? `Transaction Hash: ${withdrawalRequest.transactionHash}`
              : 'Waiting for blockchain confirmation...'
          };
        case 'credited':
        case 'Credited':
          return {
            title: 'Transfer Complete',
            message: 'Your cryptocurrency has been successfully transferred to your wallet.',
            detail: creditDate 
              ? `Completed on ${creditDate.toLocaleDateString()}`
              : 'Transfer confirmed on blockchain.'
          };
        case 'rejected':
        case 'Rejected':
          return {
            title: 'Withdrawal Rejected',
            message: 'Your crypto withdrawal request has been rejected.',
            detail: rejectionReason || 'Please contact support for more information.'
          };
        case 'refunded':
        case 'Refunded':
          return {
            title: 'Withdrawal Refunded',
            message: 'The withdrawal amount has been credited back to your account.',
            detail: 'Funds are now available in your account balance.'
          };
        default:
          return {
            title: 'Processing Crypto Withdrawal',
            message: 'Your withdrawal request is being processed.',
            detail: ''
          };
      }
    } else {
      // Bank withdrawal messages
      switch (currentStatus) {
        case 'pending':
        case 'Pending':
          return {
            title: 'Bank Withdrawal Submitted',
            message: 'Your bank withdrawal request is being reviewed by the Governor.',
            detail: `Estimated approval time: ${estimatedCompletion?.toLocaleDateString()} (${Math.max(0, 3 - businessDaysElapsed)} business days remaining)`
          };
        case 'approved':
        case 'Approved':
          return {
            title: 'Withdrawal Approved',
            message: 'Your withdrawal has been approved and is being processed for bank transfer.',
            detail: 'Bank transfer will be initiated within 1-3 business days.'
          };
        case 'credited':
        case 'Credited':
          return {
            title: 'Transfer Complete',
            message: 'Your funds have been successfully transferred to your bank account.',
            detail: creditDate 
              ? `Completed on ${creditDate.toLocaleDateString()}`
              : 'Bank transfer completed.'
          };
        case 'rejected':
        case 'Rejected':
          return {
            title: 'Withdrawal Rejected',
            message: 'Your bank withdrawal request has been rejected.',
            detail: rejectionReason || 'Please contact support for more information.'
          };
        case 'refunded':
        case 'Refunded':
          return {
            title: 'Withdrawal Refunded',
            message: 'The withdrawal amount has been credited back to your account.',
            detail: 'Funds are now available in your account balance.'
          };
        default:
          return {
            title: 'Processing Bank Withdrawal',
            message: 'Your withdrawal request is being processed.',
            detail: ''
          };
      }
    }
  };

  const statusInfo = getStatusMessage();

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              {getStatusIcon()}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 uppercase tracking-wide">
                {isCryptoWithdrawal ? 'CRYPTO WITHDRAWAL PROGRESS' : 'BANK WITHDRAWAL PROGRESS'}
              </h3>
              <p className="text-sm text-gray-600 uppercase tracking-wide">
                REQUEST #{withdrawalId.slice(-8)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-gray-900">${amount.toLocaleString()}</p>
            <p className="text-sm text-gray-600 uppercase tracking-wide">{investorName}</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-gray-700 uppercase tracking-wide">
              {isCryptoWithdrawal ? 'CRYPTO TRANSFER PROGRESS' : 'BANK TRANSFER PROGRESS'}
            </span>
            <span className="text-sm font-medium text-gray-700 uppercase tracking-wide">
              {Math.round(progressPercentage)}% COMPLETE
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-3 rounded-full transition-all duration-1000 ${getProgressBarColor()}`}
            />
          </div>
        </div>

        {/* Status Information */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
              {getStatusIcon()}
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-gray-900 mb-2 uppercase tracking-wide">
                {statusInfo.title}
              </h4>
              <p className="text-gray-700 mb-2 uppercase tracking-wide text-sm">
                {statusInfo.message}
              </p>
              {statusInfo.detail && (
                <p className="text-gray-600 text-sm uppercase tracking-wide">
                  {statusInfo.detail}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Timeline Stages */}
        <div className="mt-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 uppercase tracking-wide">
            {isCryptoWithdrawal ? 'CRYPTO TRANSFER TIMELINE' : 'BANK TRANSFER TIMELINE'}
          </h4>
          <div className="space-y-4">
            {isCryptoWithdrawal ? (
              <>
                {/* Crypto Stage 1: Submitted */}
                <div className={`flex items-center space-x-4 p-4 rounded-lg ${
                  currentStage >= 1 ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'
                }`}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    currentStage >= 1 ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    {currentStage >= 1 ? (
                      <FileText size={16} className="text-blue-600" />
                    ) : (
                      <span className="text-gray-500 font-bold text-sm">1</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 uppercase tracking-wide">
                      CRYPTO WITHDRAWAL SUBMITTED
                    </p>
                    <p className="text-gray-600 text-sm uppercase tracking-wide">
                      {currentStage >= 1 
                        ? `SUBMITTED ON ${new Date(submissionDate).toLocaleDateString()}`
                        : 'AWAITING SUBMISSION'
                      }
                    </p>
                  </div>
                  {currentStage >= 1 && (
                    <div className="text-right">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">
                        {new Date(submissionDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Crypto Stage 2: Governor Approved */}
                <div className={`flex items-center space-x-4 p-4 rounded-lg ${
                  currentStage >= 2 ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
                }`}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    currentStage >= 2 ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    {currentStage >= 2 ? (
                      <Shield size={16} className="text-green-600" />
                    ) : (
                      <span className="text-gray-500 font-bold text-sm">2</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 uppercase tracking-wide">
                      GOVERNOR APPROVED
                    </p>
                    <p className="text-gray-600 text-sm uppercase tracking-wide">
                      {currentStage >= 2 
                        ? 'CRYPTO WITHDRAWAL APPROVED FOR BLOCKCHAIN PROCESSING'
                        : 'PENDING GOVERNOR APPROVAL'
                      }
                    </p>
                  </div>
                  {currentStage >= 2 && approvalDate && (
                    <div className="text-right">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">
                        {approvalDate.toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Crypto Stage 3: Sent to Blockchain */}
                <div className={`flex items-center space-x-4 p-4 rounded-lg ${
                  currentStage >= 3 ? 'bg-purple-50 border border-purple-200' : 'bg-gray-50 border border-gray-200'
                }`}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    currentStage >= 3 ? 'bg-purple-100' : 'bg-gray-100'
                  }`}>
                    {currentStage >= 3 ? (
                      <Hash size={16} className="text-purple-600" />
                    ) : (
                      <span className="text-gray-500 font-bold text-sm">3</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 uppercase tracking-wide">
                      SENT TO BLOCKCHAIN
                    </p>
                    <p className="text-gray-600 text-sm uppercase tracking-wide">
                      {currentStage >= 3 
                        ? 'TRANSACTION HASH GENERATED AND SENT TO BLOCKCHAIN'
                        : 'AWAITING BLOCKCHAIN TRANSFER'
                      }
                    </p>
                    {withdrawalRequest?.transactionHash && (
                      <p className="text-xs text-purple-600 font-mono mt-1">
                        Hash: {withdrawalRequest.transactionHash.slice(0, 16)}...{withdrawalRequest.transactionHash.slice(-8)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Crypto Stage 4: Transfer Complete */}
                <div className={`flex items-center space-x-4 p-4 rounded-lg ${
                  currentStage >= 4 && currentStatus === 'Credited' ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
                }`}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    currentStage >= 4 && currentStatus === 'Credited' ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    {currentStage >= 4 && currentStatus === 'Credited' ? (
                      <Wallet size={16} className="text-green-600" />
                    ) : (
                      <span className="text-gray-500 font-bold text-sm">4</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 uppercase tracking-wide">
                      CRYPTO TRANSFER COMPLETE
                    </p>
                    <p className="text-gray-600 text-sm uppercase tracking-wide">
                      {currentStage >= 4 && currentStatus === 'Credited'
                        ? 'CRYPTOCURRENCY SUCCESSFULLY TRANSFERRED TO YOUR WALLET'
                        : 'AWAITING BLOCKCHAIN CONFIRMATION'
                      }
                    </p>
                  </div>
                  {currentStage >= 4 && currentStatus === 'Credited' && creditDate && (
                    <div className="text-right">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">
                        {creditDate.toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Bank Stage 1: Submitted */}
                <div className={`flex items-center space-x-4 p-4 rounded-lg ${
                  currentStage >= 1 ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'
                }`}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    currentStage >= 1 ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    {currentStage >= 1 ? (
                      <FileText size={16} className="text-blue-600" />
                    ) : (
                      <span className="text-gray-500 font-bold text-sm">1</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 uppercase tracking-wide">
                      BANK WITHDRAWAL SUBMITTED
                    </p>
                    <p className="text-gray-600 text-sm uppercase tracking-wide">
                      {currentStage >= 1 
                        ? `SUBMITTED ON ${new Date(submissionDate).toLocaleDateString()}`
                        : 'AWAITING SUBMISSION'
                      }
                    </p>
                  </div>
                  {currentStage >= 1 && (
                    <div className="text-right">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">
                        {new Date(submissionDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Bank Stage 2: Governor Approved */}
                <div className={`flex items-center space-x-4 p-4 rounded-lg ${
                  currentStage >= 2 ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
                }`}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    currentStage >= 2 ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    {currentStage >= 2 ? (
                      <Shield size={16} className="text-green-600" />
                    ) : (
                      <span className="text-gray-500 font-bold text-sm">2</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 uppercase tracking-wide">
                      GOVERNOR APPROVED
                    </p>
                    <p className="text-gray-600 text-sm uppercase tracking-wide">
                      {currentStage >= 2 
                        ? 'BANK WITHDRAWAL APPROVED FOR PROCESSING'
                        : 'PENDING GOVERNOR APPROVAL'
                      }
                    </p>
                  </div>
                  {currentStage >= 2 && approvalDate && (
                    <div className="text-right">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">
                        {approvalDate.toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Bank Stage 3: Transfer Complete */}
                <div className={`flex items-center space-x-4 p-4 rounded-lg ${
                  currentStage >= 3 && currentStatus === 'Credited' ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
                }`}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    currentStage >= 3 && currentStatus === 'Credited' ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    {currentStage >= 3 && currentStatus === 'Credited' ? (
                      <Building size={16} className="text-green-600" />
                    ) : (
                      <span className="text-gray-500 font-bold text-sm">3</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 uppercase tracking-wide">
                      BANK TRANSFER COMPLETE
                    </p>
                    <p className="text-gray-600 text-sm uppercase tracking-wide">
                      {currentStage >= 3 && currentStatus === 'Credited'
                        ? 'FUNDS SUCCESSFULLY TRANSFERRED TO YOUR BANK ACCOUNT'
                        : 'AWAITING BANK TRANSFER COMPLETION'
                      }
                    </p>
                  </div>
                  {currentStage >= 3 && currentStatus === 'Credited' && creditDate && (
                    <div className="text-right">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">
                        {creditDate.toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Rejection/Refund Stage */}
            {(currentStatus === 'Rejected' || currentStatus === 'Refunded') && (
              <div className={`flex items-center space-x-4 p-4 rounded-lg ${
                currentStatus === 'Rejected' ? 'bg-red-50 border border-red-200' : 'bg-purple-50 border border-purple-200'
              }`}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  currentStatus === 'Rejected' ? 'bg-red-100' : 'bg-purple-100'
                }`}>
                  {currentStatus === 'Rejected' ? (
                    <XCircle size={16} className="text-red-600" />
                  ) : (
                    <TrendingUp size={16} className="text-purple-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 uppercase tracking-wide">
                    {currentStatus === 'Rejected' ? 'WITHDRAWAL REJECTED' : 'WITHDRAWAL REFUNDED'}
                  </p>
                  <p className="text-gray-600 text-sm uppercase tracking-wide">
                    {currentStatus === 'Rejected' 
                      ? 'WITHDRAWAL REQUEST WAS REJECTED BY GOVERNOR'
                      : 'WITHDRAWAL AMOUNT REFUNDED TO ACCOUNT BALANCE'
                    }
                  </p>
                  {rejectionReason && (
                    <p className="text-gray-600 text-xs mt-1 uppercase tracking-wide">
                      REASON: {rejectionReason}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500 uppercase tracking-wide">
                    {(rejectionDate || new Date()).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Withdrawal Details */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h5 className="font-medium text-gray-800 mb-3 uppercase tracking-wide">
              WITHDRAWAL DETAILS
            </h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 uppercase tracking-wide">AMOUNT</span>
                <span className="font-bold text-gray-900">${amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 uppercase tracking-wide">METHOD</span>
                <span className="font-bold text-gray-900">
                  {isCryptoWithdrawal ? 'CRYPTOCURRENCY' : 'BANK TRANSFER'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 uppercase tracking-wide">STATUS</span>
                <span className="font-bold text-gray-900">{currentStatus.toUpperCase()}</span>
              </div>
              {isCryptoWithdrawal && withdrawalRequest?.cryptoCoinType && (
                <div className="flex justify-between">
                  <span className="text-gray-600 uppercase tracking-wide">COIN TYPE</span>
                  <span className="font-bold text-gray-900">{withdrawalRequest?.destinationDetails?.coinType || withdrawalRequest?.cryptoCoinType}</span>
                </div>
              )}
              {isCryptoWithdrawal && withdrawalRequest?.cryptoNetworkType && (
                <div className="flex justify-between">
                  <span className="text-gray-600 uppercase tracking-wide">NETWORK</span>
                  <span className="font-bold text-gray-900">{withdrawalRequest?.destinationDetails?.network || withdrawalRequest?.cryptoNetworkType}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h5 className="font-medium text-gray-800 mb-3 uppercase tracking-wide">
              PROCESSING INFORMATION
            </h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 uppercase tracking-wide">BUSINESS DAYS ELAPSED</span>
                <span className="font-bold text-gray-900">{businessDaysElapsed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 uppercase tracking-wide">ESTIMATED COMPLETION</span>
                <span className="font-bold text-gray-900">
                  {estimatedCompletion?.toLocaleDateString() || 'TBD'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 uppercase tracking-wide">PROCESSING TIME</span>
                <span className="font-bold text-gray-900">
                  {isCryptoWithdrawal ? '1-2 BUSINESS DAYS' : '1-3 BUSINESS DAYS'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Destination Information */}
        <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h5 className="font-medium text-gray-800 mb-3 uppercase tracking-wide">
            DESTINATION INFORMATION
          </h5>
          {isCryptoWithdrawal ? (
            <div className="space-y-2 text-sm">
              {(withdrawalRequest?.destinationDetails?.address || withdrawalRequest?.cryptoWalletAddress) && (
                <div>
                  <span className="text-gray-600 uppercase tracking-wide">WALLET ADDRESS:</span>
                  <p className="font-mono text-gray-900 break-all mt-1">
                    {withdrawalRequest?.destinationDetails?.address || withdrawalRequest?.cryptoWalletAddress}
                  </p>
                </div>
              )}
              {(withdrawalRequest?.destinationDetails?.network || withdrawalRequest?.cryptoNetworkType) && (
                <div>
                  <span className="text-gray-600 uppercase tracking-wide">NETWORK:</span>
                  <span className="font-bold text-gray-900 ml-2">{withdrawalRequest?.destinationDetails?.network || withdrawalRequest?.cryptoNetworkType}</span>
                </div>
              )}
              {(withdrawalRequest?.destinationDetails?.coinType || withdrawalRequest?.cryptoCoinType) && (
                <div>
                  <span className="text-gray-600 uppercase tracking-wide">COIN TYPE:</span>
                  <span className="font-bold text-gray-900 ml-2">{withdrawalRequest?.destinationDetails?.coinType || withdrawalRequest?.cryptoCoinType}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600 uppercase tracking-wide">TRANSFER METHOD:</span>
                <span className="font-bold text-gray-900 ml-2">BANK WIRE TRANSFER</span>
              </div>
              <div>
                <span className="text-gray-600 uppercase tracking-wide">PROCESSING TIME:</span>
                <span className="font-bold text-gray-900 ml-2">1-3 BUSINESS DAYS</span>
              </div>
              <div>
                <span className="text-gray-600 uppercase tracking-wide">DESTINATION:</span>
                <span className="font-bold text-gray-900 ml-2">REGISTERED BANK ACCOUNT</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WithdrawalProgressBar;