import { useState, useEffect } from 'react';
import { FirestoreService } from '../services/firestoreService';
import { Investor, Transaction, WithdrawalRequest } from '../types/user';

// Hook for investors data with enhanced Firebase integration and real-time updates
export const useInvestors = () => {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvestors = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔥 Firebase: Fetching all investors from Firestore...');
      
      const data = await FirestoreService.getInvestors();
      console.log('✅ Firebase: Successfully retrieved', data.length, 'investor profiles');
      
      // Log investor details for debugging
      data.forEach(investor => {
        console.log(`📊 Investor: ${investor.name} | Status: ${investor.accountStatus || 'Active'} | Balance: $${investor.currentBalance?.toLocaleString() || '0'}`);
      });
      
      setInvestors(data);
    } catch (err: any) {
      console.error('❌ Firebase Error: Failed to fetch investors:', err);
      setError(`Failed to load investor data: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestors();

    // Set up real-time listener
    console.log('🔄 Setting up real-time listener for investors...');
    const unsubscribe = FirestoreService.subscribeToInvestors((updatedInvestors) => {
      console.log('🔄 Real-time update: Received', updatedInvestors.length, 'investors');
      setInvestors(updatedInvestors);
      setLoading(false);
      setError(null);
    });

    // Cleanup listener on unmount
    return () => {
      console.log('🔄 Cleaning up real-time listener');
      unsubscribe();
    };
  }, []);

  return { investors, loading, error, refetch: fetchInvestors };
};

// Hook for transactions data with enhanced Firebase integration
export const useTransactions = (investorId?: string) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only set up listener if we have a valid investorId
    if (!investorId) {
      console.log('⚠️ No investorId provided to useTransactions hook');
      setTransactions([]);
      setLoading(false);
      setError(null);
      return;
    }

    // Set up real-time listener for transactions
    console.log('🔄 Setting up real-time listener for transactions...', investorId ? `for investor ${investorId}` : 'all transactions');
    
    const unsubscribe = FirestoreService.subscribeToTransactions(investorId, (updatedTransactions) => {
      console.log('🔄 Real-time update: Received', updatedTransactions.length, 'transactions');
      
      // Log transaction summary for debugging
      if (updatedTransactions.length > 0) {
        const deposits = updatedTransactions.filter(tx => tx.type === 'Deposit').length;
        const withdrawals = updatedTransactions.filter(tx => tx.type === 'Withdrawal').length;
        const earnings = updatedTransactions.filter(tx => tx.type === 'Earnings').length;
        console.log(`📈 Real-time Transaction Summary: ${deposits} deposits, ${withdrawals} withdrawals, ${earnings} earnings`);
      }
      
      setTransactions(updatedTransactions);
      setLoading(false);
      setError(null);
    });

    // Cleanup listener on unmount
    return () => {
      console.log('🔄 Cleaning up real-time listener for transactions');
      unsubscribe();
    };
  }, [investorId]);

  return { transactions, loading, error };
};

// Hook for withdrawal requests data with enhanced Firebase integration
export const useWithdrawalRequests = (investorId?: string) => {
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWithdrawalRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔥 Firebase: Fetching withdrawal requests...', investorId ? `for investor ${investorId}` : 'all requests');
      
      const data = await FirestoreService.getWithdrawalRequests(investorId);
      console.log('✅ Firebase: Successfully retrieved', data.length, 'withdrawal requests', investorId ? `for investor ${investorId}` : '');
      
      // Log withdrawal request summary for debugging
      if (data.length > 0) {
        const pending = data.filter(req => req.status === 'Pending').length;
        const approved = data.filter(req => req.status === 'Approved').length;
        const rejected = data.filter(req => req.status === 'Rejected').length;
        console.log(`💰 Withdrawal Summary: ${pending} pending, ${approved} approved, ${rejected} rejected`);
      }
      
      setWithdrawalRequests(data);
    } catch (err: any) {
      console.error('❌ Firebase Error: Failed to fetch withdrawal requests:', err);
      setError(`Failed to load withdrawal data: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawalRequests();
  }, [investorId]);

  return { withdrawalRequests, loading, error, refetch: fetchWithdrawalRequests };
};

// Hook for investor's own withdrawal requests
export const useInvestorWithdrawalRequests = (investorId: string) => {
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvestorWithdrawalRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔥 Firebase: Fetching withdrawal requests for investor:', investorId);
      
      const investorRequests = await FirestoreService.getWithdrawalRequests(investorId);
      
      console.log(`✅ Firebase: Found ${investorRequests.length} withdrawal requests for investor`);
      setWithdrawalRequests(investorRequests);
    } catch (err: any) {
      console.error('❌ Firebase Error: Failed to fetch investor withdrawal requests:', err);
      setError(`Failed to load withdrawal requests: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (investorId) {
      fetchInvestorWithdrawalRequests();
    }
  }, [investorId]);

  return { withdrawalRequests, loading, error, refetch: fetchInvestorWithdrawalRequests };
};

// Hook for single investor data with enhanced Firebase integration
export const useInvestor = (investorId: string) => {
  const [investor, setInvestor] = useState<Investor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState(0);

  useEffect(() => {
    if (investorId) {
      // Set up real-time listener for this specific investor
      console.log('🔄 Setting up real-time listener for investor:', investorId);
      const unsubscribe = FirestoreService.subscribeToInvestor(investorId, (updatedInvestor) => {
        if (updatedInvestor) {
          console.log('🔄 Real-time update: Investor data updated:', updatedInvestor.name);
          console.log('🔄 Account Status:', updatedInvestor.accountStatus);
          console.log('🔄 Account Flags:', JSON.stringify(updatedInvestor.accountFlags, null, 2));
          console.log('🔄 Current Balance:', updatedInvestor.currentBalance);
          console.log('🔄 Updated At:', updatedInvestor.updatedAt);
          setInvestor(updatedInvestor);
          setLastUpdate(Date.now());
          setLoading(false);
          setError(null);
        } else {
          console.log('⚠️ Firebase: Investor not found:', investorId);
          setError('Investor profile not found');
          setLoading(false);
        }
      });

      // Cleanup listener on unmount
      return () => {
        console.log('🔄 Cleaning up real-time listener for investor:', investorId);
        unsubscribe();
      };
    } else {
      console.log('⚠️ No investorId provided to useInvestor hook');
      setLoading(false);
    }
  }, [investorId]);

  return { investor, loading, error, lastUpdate, refetch: () => {} };
};