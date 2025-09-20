import { useState, useEffect } from 'react';
import { WithdrawalFlagService } from '../services/withdrawalFlagService';
import { WithdrawalFlag } from '../types/withdrawal';

export const useWithdrawalFlags = (withdrawalId: string) => {
  const [flags, setFlags] = useState<WithdrawalFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!withdrawalId) {
      setFlags([]);
      setLoading(false);
      setError(null);
      return;
    }

    // Set up real-time listener
    console.log('🚩 Setting up real-time listener for withdrawal flags...');
    const unsubscribe = WithdrawalFlagService.subscribeToWithdrawalFlags(withdrawalId, (updatedFlags) => {
      console.log('🚩 Withdrawal flags updated:', updatedFlags.length);
      setFlags(updatedFlags);
      setLoading(false);
      setError(null);
    }, (error) => {
      console.error('🚩 Error in withdrawal flags listener:', error);
      setFlags([]);
      setLoading(false);
      setError(error.message);
    });

    // Cleanup listener on unmount
    return () => {
      console.log('🚩 Cleaning up withdrawal flags listener');
      unsubscribe();
    };
  }, [withdrawalId]);

  // Get urgent flag info
  const urgentFlag = flags?.find(flag => 
    flag.isActive && flag.status === 'approved' && (flag.flagType === 'urgent' || flag.priority === 'urgent')
  ) || null;

  const hasUrgentFlag = !!urgentFlag;
  const urgentComment = urgentFlag?.comment;

  return { flags, loading, error, hasUrgentFlag, urgentComment };
};

export const useAllWithdrawalFlags = () => {
  const [flags, setFlags] = useState<WithdrawalFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFlags = async () => {
    try {
      setLoading(true);
      const data = await WithdrawalFlagService.getAllWithdrawalFlags();
      setFlags(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  return { flags, loading, error, refetch: fetchFlags };
};