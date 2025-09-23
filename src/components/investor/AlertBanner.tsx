import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { AlertTriangle, Shield, Clock, XCircle } from 'lucide-react';

interface AlertBannerProps {
  type: 'policy-violation' | 'pending-kyc' | 'withdrawal-disabled';
  message?: string;
  onDismiss?: () => void;
}

const AlertBanner = ({ type, message, onDismiss }: AlertBannerProps) => {
  // Log when alert banner is rendered
  useEffect(() => {
    console.log(`🚨 Alert Banner rendered: ${type} at ${new Date().toISOString()}`);
    console.log(`🚨 Alert Message: ${message}`);
  }, [type, message]);

  const getAlertConfig = () => {
    switch (type) {
      case 'policy-violation':
        return {
          icon: <AlertTriangle size={20} />,
          title: 'Policy Violation Detected',
          defaultMessage: 'Your account has been flagged for a policy violation. Please contact support for assistance.',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          iconColor: 'text-red-600'
        };
      case 'pending-kyc':
        return {
          icon: <Shield size={20} />,
          title: 'KYC Verification Required',
          defaultMessage: 'Your account requires KYC verification to continue. Please submit the required documents.',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          textColor: 'text-amber-800',
          iconColor: 'text-amber-600'
        };
      case 'withdrawal-disabled':
        return {
          icon: <Clock size={20} />,
          title: 'Withdrawals Temporarily Disabled',
          defaultMessage: 'Withdrawal functionality is temporarily disabled for your account. Contact support for more information.',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
          iconColor: 'text-blue-600'
        };
      default:
        return {
          icon: <AlertTriangle size={20} />,
          title: 'Account Notice',
          defaultMessage: 'There is an important notice regarding your account.',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800',
          iconColor: 'text-gray-600'
        };
    }
  };

  const config = getAlertConfig();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`${config.bgColor} ${config.borderColor} border-l-4 p-4 rounded-lg mb-6`}
    >
      <div className="flex items-start">
        <div className={`${config.iconColor} mr-3 mt-0.5`}>
          {config.icon}
        </div>
        <div className="flex-1">
          <h3 className={`${config.textColor} font-semibold text-lg mb-1`}>
            {config.title}
          </h3>
          <p className={`${config.textColor} text-sm leading-relaxed`}>
            {message || config.defaultMessage}
          </p>
          
          {/* Action buttons based on alert type */}
          <div className="mt-3 flex space-x-3">
            {type === 'policy-violation' && (
              <button className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors">
                Contact Support
              </button>
            )}
            {type === 'pending-kyc' && (
              <button className="bg-amber-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-amber-700 transition-colors">
                Upload Documents
              </button>
            )}
            {type === 'withdrawal-disabled' && (
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
                Learn More
              </button>
            )}
          </div>
        </div>
        
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`${config.textColor} hover:opacity-75 transition-opacity ml-4`}
          >
            <XCircle size={18} />
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default AlertBanner;