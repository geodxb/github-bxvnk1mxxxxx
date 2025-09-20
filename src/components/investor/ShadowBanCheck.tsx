import { useEffect, useState } from 'react';
import { useShadowBan } from '../../hooks/useGovernor';
import { useAuth } from '../../contexts/AuthContext';
import { EyeOff, Ban, Shield, AlertTriangle } from 'lucide-react';

interface ShadowBanCheckProps {
  children: React.ReactNode;
}

const ShadowBanCheck = ({ children }: ShadowBanCheckProps) => {
  const { user } = useAuth();
  const { shadowBan, loading } = useShadowBan(user?.id || '');
  const [showRestrictionMessage, setShowRestrictionMessage] = useState(false);

  useEffect(() => {
    if (shadowBan && shadowBan.isActive) {
      console.log('🚨 Shadow ban detected:', shadowBan.banType, shadowBan.reason);
      setShowRestrictionMessage(true);
    } else {
      setShowRestrictionMessage(false);
    }
  }, [shadowBan]);

  // If loading, show children normally
  if (loading) {
    return <>{children}</>;
  }

  // If shadow banned, show restriction message
  if (shadowBan && shadowBan.isActive) {
    const getBanIcon = () => {
      switch (shadowBan.banType) {
        case 'withdrawal_only': return <div className="w-8 h-8 bg-amber-600"></div>;
        case 'trading_only': return <div className="w-8 h-8 bg-blue-600"></div>;
        case 'full_platform': return <div className="w-8 h-8 bg-red-600"></div>;
        default: return <div className="w-8 h-8 bg-gray-600"></div>;
      }
    };

    const getBanMessage = () => {
      switch (shadowBan.banType) {
        case 'withdrawal_only':
          return {
            title: 'WITHDRAWAL ACCESS RESTRICTED',
            message: 'Your withdrawal functionality has been temporarily restricted.',
            details: 'You can continue trading and viewing your account, but withdrawal requests are currently disabled.'
          };
        case 'trading_only':
          return {
            title: 'TRADING ACCESS RESTRICTED',
            message: 'Your trading functionality has been temporarily restricted.',
            details: 'You can still view your account and make withdrawal requests, but trading is currently disabled.'
          };
        case 'full_platform':
          return {
            title: 'PLATFORM ACCESS RESTRICTED',
            message: 'Your platform access has been temporarily restricted.',
            details: 'All platform functionality is currently disabled. Please contact support for assistance.'
          };
        default:
          return {
            title: 'ACCESS RESTRICTED',
            message: 'Your account access has been restricted.',
            details: 'Please contact support for more information.'
          };
      }
    };

    const banInfo = getBanMessage();

    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg border border-gray-300 shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-gray-100 border border-gray-300 rounded-lg flex items-center justify-center mx-auto mb-6">
            {getBanIcon()}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4 uppercase tracking-wide">
            {banInfo.title}
          </h1>
          <p className="text-gray-700 mb-4 uppercase tracking-wide text-sm font-medium">
            {banInfo.message}
          </p>
          <p className="text-gray-600 mb-6 text-sm uppercase tracking-wide">
            {banInfo.details}
          </p>
          
          {shadowBan.reason && (
            <div className="bg-gray-50 p-4 border border-gray-300 mb-6">
              <p className="text-gray-800 text-sm font-bold uppercase tracking-wide mb-1">RESTRICTION REASON:</p>
              <p className="text-gray-700 text-sm">{shadowBan.reason}</p>
            </div>
          )}
          
          {shadowBan.expiresAt && (
            <div className="bg-blue-50 p-4 border border-blue-300 mb-6">
              <p className="text-blue-800 text-sm font-bold uppercase tracking-wide mb-1">EXPIRES:</p>
              <p className="text-blue-700 text-sm">{shadowBan.expiresAt.toLocaleDateString()}</p>
            </div>
          )}
          
          <button
            onClick={() => window.location.href = 'mailto:support@interactivebrokers.us'}
            className="px-6 py-3 bg-gray-900 text-white font-bold hover:bg-gray-800 transition-colors rounded-lg uppercase tracking-wide"
          >
            CONTACT SUPPORT
          </button>
        </div>
      </div>
    );
  }

  // No shadow ban, show children normally
  return <>{children}</>;
};

export default ShadowBanCheck;