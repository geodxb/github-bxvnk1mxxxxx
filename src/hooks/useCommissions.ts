import { useState, useEffect } from 'react';
import { FirestoreService } from '../services/firestoreService';

export interface Commission {
  id: string;
  investorId: string;
  investorName: string;
  withdrawalAmount: number;
  commissionRate: number;
  commissionAmount: number;
  date: string;
  status: 'Earned' | 'Pending';
  createdAt: Date;
  withdrawalId?: string;
}

export const useCommissions = () => {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [totalCommissions, setTotalCommissions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCommissions = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Interactive Brokers: Fetching commissions...');
      
      const data = await FirestoreService.getCommissions();
      console.log('Interactive Brokers: Found', data.length, 'commission records');
      
      setCommissions(data);
      
      // Calculate total commissions
      const total = data.reduce((sum, commission) => sum + commission.commissionAmount, 0);
      setTotalCommissions(total);
      
    } catch (err) {
      console.error('Error fetching commissions from Interactive Brokers:', err);
      setError('Failed to fetch commission data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommissions();
  }, []);

  return { 
    commissions, 
    totalCommissions, 
    loading, 
    error, 
    refetch: fetchCommissions 
  };
};