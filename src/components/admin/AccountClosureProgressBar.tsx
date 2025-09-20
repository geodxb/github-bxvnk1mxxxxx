import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Calendar,
  AlertTriangle,
  DollarSign,
  Shield,
  FileText,
  User,
  Building
} from 'lucide-react';
import { AccountClosureRequest } from '../../types/accountClosure';
import { AccountClosureService } from '../../services/accountClosureService';

interface AccountClosureProgressBarProps {
  closureRequest: AccountClosureRequest;
  investorName: string;
  accountBalance: number;
}

const AccountClosureProgressBar = ({
  closureRequest,
  investorName,
  accountBalance
}: AccountClosureProgressBarProps) => {
  const [currentStage, setCurrentStage] = useState(1);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [timeUntilCompletion, setTimeUntilCompletion] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    isOverdue: false
  });
  const [countdownActive, setCountdownActive] = useState(false);

  const calculateTimeBetween = (startDate: Date, endDate: Date) => {
    const timeDiff = endDate.getTime() - startDate.getTime();
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    return {
      days: Math.max(0, days),
      hours: Math.max(0, hours),
      minutes: Math.max(0, minutes),
      isOverdue: timeDiff < 0
    };
  };

  useEffect(() => {
    const now = new Date();
    const requestDate = new Date(closureRequest.requestDate);
    
    // Determine stage and progress based on status
    switch (closureRequest.status) {
      case 'Pending':
        setCurrentStage(1);
        setProgressPercentage(33);
        setCountdownActive(false);
        break;
        
      case 'Approved':
        setCurrentStage(2);
        
        if (closureRequest.approvalDate) {
          const approval = closureRequest.approvalDate;
          const estimatedCompletion = new Date(approval);
          estimatedCompletion.setDate(estimatedCompletion.getDate() + 90);
          
          setCountdownActive(true);
          
          // Calculate real-time countdown
          const timeRemaining = calculateTimeBetween(now, estimatedCompletion);
          setTimeUntilCompletion(timeRemaining);
          setDaysRemaining(timeRemaining.days);
          
          // Calculate progress percentage based on time elapsed since approval
          const totalCountdownTime = 90 * 24 * 60 * 60 * 1000; // 90 days in milliseconds
          const timeElapsed = now.getTime() - approval.getTime();
          const progressPercent = Math.min(100, Math.max(33, 33 + (timeElapsed / totalCountdownTime) * 34));
          setProgressPercentage(progressPercent);
        } else {
          setProgressPercentage(66);
          setCountdownActive(false);
        }
        break;
        
      case 'Completed':
        setCurrentStage(3);
        setProgressPercentage(100);
        setCountdownActive(false);
        break;
        
      case 'Rejected':
        setCurrentStage(4);
        setProgressPercentage(100);
        setCountdownActive(false);
        break;
    }
  }, [closureRequest]);

  // Real-time countdown timer for approved closures
  useEffect(() => {
    if (!countdownActive || closureRequest.status !== 'Approved' || !closureRequest.approvalDate) {
      return;
    }

    const timer = setInterval(() => {
      const now = new Date();
      const estimatedCompletion = new Date(closureRequest.approvalDate!);
      estimatedCompletion.setDate(estimatedCompletion.getDate() + 90);
      
      const timeRemaining = calculateTimeBetween(now, estimatedCompletion);
      setTimeUntilCompletion(timeRemaining);
      setDaysRemaining(timeRemaining.days);
      
      // Update progress percentage in real-time
      const totalCountdownTime = 90 * 24 * 60 * 60 * 1000; // 90 days in milliseconds
      const timeElapsed = now.getTime() - closureRequest.approvalDate!.getTime();
      const progressPercent = Math.min(100, Math.max(33, 33 + (timeElapsed / totalCountdownTime) * 34));
      setProgressPercentage(progressPercent);
      
      // If time is up, stop the countdown
      if (timeRemaining.isOverdue) {
        setCountdownActive(false);
      }
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [countdownActive, closureRequest.approvalDate, closureRequest.status]);

  const getProgressBarColor = () => {
    switch (closureRequest.status) {
      case 'Pending':
        return 'bg-yellow-500';
      case 'Approved':
        return 'bg-red-500';
      case 'Completed':
        return 'bg-gray-500';
      case 'Rejected':
        return 'bg-green-500';
      default:
        return 'bg-gray-300';
    }
  };

  const getStatusIcon = () => {
    switch (closureRequest.status) {
      case 'Pending':
        return <Clock size={20} className="text-yellow-600" />;
      case 'Approved':
        return <AlertTriangle size={20} className="text-red-600" />;
      case 'Completed':
        return <XCircle size={20} className="text-gray-600" />;
      case 'Rejected':
        return <CheckCircle size={20} className="text-green-600" />;
      default:
        return <Clock size={20} className="text-gray-600" />;
    }
  };

  const getStatusMessage = () => {
    switch (closureRequest.status) {
      case 'Pending':
        return {
          title: 'Deletion Request Under Review',
          message: 'Your account closure request is being reviewed by our compliance team.',
          detail: 'We are verifying all account details and ensuring compliance with regulatory requirements.'
        };
      case 'Approved':
        return {
          title: 'Deletion Request Approved - 90 Day Countdown Active',
          message: `Account closure approved. ${daysRemaining} days remaining until permanent closure.`,
          detail: timeUntilCompletion.isOverdue
            ? 'Closure period has ended. Account will be permanently closed shortly.'
            : `Account will be permanently closed on ${closureRequest.approvalDate ? 
                new Date(new Date(closureRequest.approvalDate).getTime() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }) : 'TBD'}`
        };
      case 'Completed':
        return {
          title: 'Account Permanently Closed',
          message: 'Your account has been permanently closed and all data has been archived.',
          detail: closureRequest.completionDate 
            ? `Completed on ${closureRequest.completionDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}`
            : 'Account closure process completed.'
        };
      case 'Rejected':
        return {
          title: 'Deletion Request Rejected',
          message: 'Your account closure request has been rejected.',
          detail: closureRequest.rejectionReason || 'Please contact support for more information about this rejection.'
        };
      default:
        return {
          title: 'Account Closure Status',
          message: 'Processing account closure request...',
          detail: ''
        };
    }
  };

  const statusInfo = getStatusMessage();

  return (
    <div className="bg-white rounded-lg border border-gray-300 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-200 border border-gray-300 rounded-lg flex items-center justify-center">
              {getStatusIcon()}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">
                ACCOUNT CLOSURE PROGRESS
              </h3>
              <p className="text-sm text-gray-600 uppercase tracking-wide font-medium">
                REQUEST #{closureRequest.id.slice(-8)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-gray-900 uppercase tracking-wide">{investorName}</p>
            <p className="text-sm text-gray-600 uppercase tracking-wide font-medium">ACCOUNT HOLDER</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Industrial Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">
              CLOSURE PROGRESS
            </span>
            <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">
              {Math.round(progressPercentage)}% COMPLETE
              {countdownActive && closureRequest.status === 'Approved' && (
                <span className="ml-2 text-xs text-gray-700 font-medium">
                  ({daysRemaining} DAYS REMAINING)
                </span>
              )}
            </span>
          </div>
          
          <div className="w-full bg-gray-200 h-4 border border-gray-400">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full transition-all duration-1000 ${getProgressBarColor()}${
                countdownActive && closureRequest.status === 'Approved' ? ' animate-pulse' : ''
              }`}
            />
          </div>
          
          {/* Industrial Real-time countdown display */}
          {countdownActive && closureRequest.status === 'Approved' && (
            <div className="mt-3 text-center">
              <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg border border-gray-300 ${
                timeUntilCompletion.isOverdue 
                  ? 'bg-gray-50 text-gray-800' 
                  : 'bg-gray-50 text-gray-800'
              }`}>
                <div className={`w-3 h-3 ${
                  timeUntilCompletion.isOverdue ? 'bg-gray-700' : 'bg-gray-700 animate-pulse'
                }`}></div>
                <span className="text-sm font-bold uppercase tracking-wide">
                  {timeUntilCompletion.isOverdue 
                    ? 'CLOSURE PERIOD ENDED - FINALIZING ACCOUNT'
                    : `${daysRemaining} DAYS UNTIL PERMANENT CLOSURE`
                  }
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Industrial Status Information */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-300">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-gray-200 border border-gray-300 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
              {getStatusIcon()}
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-bold text-gray-900 mb-3 uppercase tracking-wide">
                {statusInfo.title.toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
              </h4>
              <p className="text-gray-700 mb-3 font-medium uppercase tracking-wide text-sm">
                {statusInfo.message.toUpperCase()}
              </p>
              {statusInfo.detail && (
                <p className="text-gray-600 text-sm uppercase tracking-wide">
                  {statusInfo.detail.toUpperCase()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Industrial Timeline Stages */}
        <div className="mt-6">
          <h4 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wide">
            CLOSURE TIMELINE
          </h4>
          <div className="space-y-4">
            {/* Industrial Stage 1: Request Submitted */}
            <div className={`flex items-center space-x-4 p-4 rounded-lg border border-gray-300 ${
              currentStage >= 1 
                ? 'bg-gray-50' 
                : 'bg-white'
            }`}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center border border-gray-300 ${
                currentStage >= 1 
                  ? 'bg-gray-200' 
                  : 'bg-white'
              }`}>
                {currentStage >= 1 ? (
                  <FileText size={16} className="text-gray-700" />
                ) : (
                  <span className="text-gray-500 font-bold text-sm">1</span>
                )}
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900 uppercase tracking-wide">
                  REQUEST SUBMITTED
                </p>
                <p className="text-gray-600 text-sm uppercase tracking-wide font-medium">
                  {currentStage >= 1 
                    ? `SUBMITTED ON ${new Date(closureRequest.requestDate).toLocaleDateString().toUpperCase()}`
                    : 'ACCOUNT CLOSURE REQUEST SUBMISSION'
                  }
                </p>
              </div>
              {currentStage >= 1 && (
                <div className="text-right">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                    {new Date(closureRequest.requestDate).toLocaleDateString().toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Industrial Stage 2: Under Review / Approved */}
            <div className={`flex items-center space-x-4 p-4 rounded-lg border border-gray-300 ${
              currentStage >= 2 
                ? 'bg-gray-50' 
                : 'bg-white'
            }`}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center border border-gray-300 ${
                currentStage >= 2 
                  ? 'bg-gray-200' 
                  : 'bg-white'
              }`}>
                {currentStage >= 2 ? (
                  closureRequest.status === 'Approved' ? (
                    <AlertTriangle size={16} className="text-gray-700" />
                  ) : (
                    <CheckCircle size={16} className="text-gray-700" />
                  )
                ) : (
                  <span className="text-gray-500 font-bold text-sm">2</span>
                )}
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900 uppercase tracking-wide">
                  {closureRequest.status === 'Approved' ? 'APPROVED - COUNTDOWN ACTIVE' : 'UNDER REVIEW'}
                </p>
                <p className="text-gray-600 text-sm uppercase tracking-wide font-medium">
                  {currentStage >= 2 
                    ? closureRequest.status === 'Approved' 
                      ? `90-DAY COUNTDOWN STARTED - ${daysRemaining} DAYS REMAINING`
                      : 'COMPLIANCE TEAM REVIEWING CLOSURE REQUEST'
                    : 'PENDING COMPLIANCE REVIEW'
                  }
                </p>
              </div>
              {currentStage >= 2 && closureRequest.approvalDate && (
                <div className="text-right">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                    {closureRequest.approvalDate.toLocaleDateString().toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Industrial Stage 3: Permanent Closure */}
            <div className={`flex items-center space-x-4 p-4 rounded-lg border border-gray-300 ${
              currentStage >= 3 && closureRequest.status === 'Completed'
                ? 'bg-gray-50' 
                : 'bg-white'
            }`}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center border border-gray-300 ${
                currentStage >= 3 && closureRequest.status === 'Completed'
                  ? 'bg-gray-200' 
                  : 'bg-white'
              }`}>
                {currentStage >= 3 && closureRequest.status === 'Completed' ? (
                  <XCircle size={16} className="text-gray-700" />
                ) : (
                  <span className="text-gray-500 font-bold text-sm">3</span>
                )}
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900 uppercase tracking-wide">
                  PERMANENT CLOSURE
                </p>
                <p className="text-gray-600 text-sm uppercase tracking-wide font-medium">
                  {currentStage >= 3 && closureRequest.status === 'Completed'
                    ? 'ACCOUNT PERMANENTLY CLOSED AND DATA ARCHIVED'
                    : 'AWAITING FINAL CLOSURE AND FUND TRANSFER'
                  }
                </p>
              </div>
              {currentStage >= 3 && closureRequest.status === 'Completed' && closureRequest.completionDate && (
                <div className="text-right">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                    {closureRequest.completionDate.toLocaleDateString().toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Industrial Stage 4: Rejected (if applicable) */}
            {closureRequest.status === 'Rejected' && (
              <div className="flex items-center space-x-4 p-4 rounded-lg border bg-gray-50 border-gray-300">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center border bg-gray-200 border-gray-300">
                  <CheckCircle size={16} className="text-gray-700" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900 uppercase tracking-wide">
                    REQUEST REJECTED
                  </p>
                  <p className="text-gray-600 text-sm uppercase tracking-wide font-medium">
                    CLOSURE REQUEST WAS REJECTED - ACCOUNT REMAINS ACTIVE
                  </p>
                  
                  {closureRequest.rejectionReason && (
                    <p className="text-gray-600 text-xs mt-1 uppercase tracking-wide">
                      REASON: {closureRequest.rejectionReason.toUpperCase()}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                    {closureRequest.rejectionDate 
                      ? closureRequest.rejectionDate.toLocaleDateString().toUpperCase()
                      : new Date().toLocaleDateString().toUpperCase()
                    }
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Industrial Countdown Information */}
        {closureRequest.status === 'Approved' && closureRequest.approvalDate && (
          <div className="mt-6 bg-gray-50 p-6 rounded-lg border border-gray-300">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-gray-200 border border-gray-300 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar size={20} className="text-gray-700" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 uppercase tracking-wide">
                  {timeUntilCompletion.isOverdue ? 'CLOSURE PERIOD ENDED' : '90-DAY COUNTDOWN ACTIVE'}
                </h4>
                <p className="text-gray-700 text-sm mt-2 uppercase tracking-wide font-medium">
                  {timeUntilCompletion.isOverdue 
                    ? 'THE 90-DAY COUNTDOWN PERIOD HAS ENDED. ACCOUNT CLOSURE IS BEING FINALIZED.'
                    : `ACCOUNT WILL BE PERMANENTLY CLOSED IN ${daysRemaining} DAYS. DURING THIS PERIOD, THE ACCOUNT CANNOT BE OPERATED OR MODIFIED.`
                  }
                </p>
                
                {/* Industrial Real-time countdown display */}
                {countdownActive && !timeUntilCompletion.isOverdue && (
                  <div className="mt-4 bg-white p-4 rounded-lg border border-gray-300">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-700 font-bold uppercase tracking-wide">TIME REMAINING</span>
                      <span className="text-gray-900 font-bold uppercase tracking-wide">{daysRemaining} DAYS</span>
                    </div>
                    <div className="mt-3 w-full bg-gray-300 h-3 border border-gray-400">
                      <motion.div
                        animate={{ width: `${100 - (daysRemaining / 90) * 100}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full bg-gray-700"
                      />
                    </div>
                    <div className="mt-3 text-center">
                      <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                        {daysRemaining} DAYS, {timeUntilCompletion.hours} HOURS, {timeUntilCompletion.minutes} MINUTES
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Industrial Fund Transfer Information */}
        {accountBalance > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-300 rounded-lg">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h5 className="font-bold text-gray-900 uppercase tracking-wide text-sm">
                  FUND TRANSFER DETAILS
                </h5>
              </div>
              <div className="p-4">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 uppercase tracking-wide font-medium">ACCOUNT BALANCE</span>
                    <span className="font-bold text-gray-900">${accountBalance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 uppercase tracking-wide font-medium">TRANSFER METHOD</span>
                    <span className="font-bold text-gray-900">BANK TRANSFER</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 uppercase tracking-wide font-medium">PROCESSING TIME</span>
                    <span className="font-bold text-gray-900">60-90 DAYS</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-300 rounded-lg">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h5 className="font-bold text-gray-900 uppercase tracking-wide text-sm">
                  IMPORTANT INFORMATION
                </h5>
              </div>
              <div className="p-4">
                <div className="space-y-2 text-sm text-gray-700">
                  <p className="uppercase tracking-wide font-medium">• ACCOUNT CANNOT BE OPERATED DURING CLOSURE PERIOD</p>
                  <p className="uppercase tracking-wide font-medium">• NO NEW ACCOUNT CREATION FOR 90 DAYS AFTER CLOSURE</p>
                  <p className="uppercase tracking-wide font-medium">• FUNDS TRANSFERRED TO REGISTERED BANK ACCOUNT</p>
                  <p className="uppercase tracking-wide font-medium">• ALL DATA ARCHIVED PER REGULATORY REQUIREMENTS</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Industrial Legal Notice */}
        <div className="mt-6 bg-gray-50 p-6 rounded-lg border border-gray-300">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-gray-200 border border-gray-300 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield size={20} className="text-gray-700" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 uppercase tracking-wide">LEGAL NOTICE</h4>
              <p className="text-gray-700 text-sm mt-2 uppercase tracking-wide font-medium">
                Account closure is governed by our Terms of Service and regulatory requirements. 
                The 90-day period ensures compliance with financial regulations and allows for 
                proper fund transfer procedures. This process cannot be cancelled once approved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountClosureProgressBar;