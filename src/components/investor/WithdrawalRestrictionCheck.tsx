import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useInvestor } from '../../hooks/useFirestore';
import { useShadowBan } from '../../hooks/useGovernor';

interface WithdrawalRestrictionCheckProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const WithdrawalRestrictionCheck = ({ children, fallback }: WithdrawalRestrictionCheckProps) => {
  const { user } = useAuth();
  const { investor } = useInvestor(user?.id || '');
  const { shadowBan } = useShadowBan(user?.id || '');
  const [isRestricted, setIsRestricted] = useState(false);

  useEffect(() => {
    // Check multiple restriction sources
    const checkRestrictions = () => {
      // Check shadow ban
      if (shadowBan && shadowBan.isActive && 
          (shadowBan.banType === 'withdrawal_only' || shadowBan.banType === 'full_platform')) {
        console.log('🚨 Withdrawal restricted by shadow ban:', shadowBan.banType);
        setIsRestricted(true);
        return;
      }

      // Check account flags
      if (investor?.accountFlags?.withdrawalDisabled) {
        console.log('🚨 Withdrawal restricted by account flags');
        setIsRestricted(true);
        return;
      }

      // Check account status
      if (investor?.accountStatus?.includes('Restricted') || 
          investor?.accountStatus?.includes('SUSPENDED') ||
          investor?.accountStatus?.includes('Closed')) {
        console.log('🚨 Withdrawal restricted by account status:', investor.accountStatus);
        setIsRestricted(true);
        return;
      }

      // No restrictions found
      setIsRestricted(false);
    };

    checkRestrictions();
  }, [investor, shadowBan]);

  // If restricted, show fallback or nothing
  if (isRestricted) {
    return fallback ? <>{fallback}</> : null;
  }

  // Not restricted, show children
  return <>{children}</>;
};

export default WithdrawalRestrictionCheck;