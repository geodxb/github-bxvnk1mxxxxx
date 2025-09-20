import { useState, useEffect } from 'react';
import { SupportTicketService } from '../services/supportTicketService';
import { SupportTicket } from '../types/supportTicket';

export const useSupportTickets = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Set up real-time listener
    console.log('🔄 Setting up real-time listener for support tickets...');
    const unsubscribe = SupportTicketService.subscribeToTickets((updatedTickets) => {
      console.log('🔄 Real-time update: Support tickets updated');
      setTickets(updatedTickets);
      setLoading(false);
      setError(null);
    });

    // Cleanup listener on unmount
    return () => {
      console.log('🔄 Cleaning up real-time listener for support tickets');
      unsubscribe();
    };
  }, []);

  return { tickets, loading, error };
};