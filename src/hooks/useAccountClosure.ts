import { useState, useEffect } from 'react';
import { AccountClosureService } from '../services/accountClosureService';
import { AccountClosureRequest } from '../types/accountClosure';

export const useAccountClosure = (investorId: string) => {
  const [closureRequest, setClosureRequest] = useState<AccountClosureRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!investorId) {
      setLoading(false);
      return;
    }

    // Set up real-time listener
    console.log('🔄 Setting up real-time listener for account closure...');
    const unsubscribe = AccountClosureService.subscribeToClosureRequest(investorId, (request) => {
      console.log('🔄 Real-time update: Closure request data updated');
      setClosureRequest(request);
      setLoading(false);
      setError(null);
    });

    // Cleanup listener on unmount
    return () => {
      console.log('🔄 Cleaning up real-time listener for account closure');
      unsubscribe();
    };
  }, [investorId]);

  return { closureRequest, loading, error };
};