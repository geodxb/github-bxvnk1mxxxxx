import { useState, useEffect } from 'react';
import { GovernorService } from '../services/governorService';
import { AccountFlag, DocumentRequest, ShadowBan, GovernorAction } from '../types/governor';

export const useAccountFlags = () => {
  const [flags, setFlags] = useState<AccountFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFlags = async () => {
    try {
      setLoading(true);
      const data = await GovernorService.getAccountFlags();
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

export const useDocumentRequests = (investorId?: string) => {
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await GovernorService.getDocumentRequests(investorId);
      setRequests(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [investorId]);

  return { requests, loading, error, refetch: fetchRequests };
};

export const useShadowBan = (investorId: string) => {
  const [shadowBan, setShadowBan] = useState<ShadowBan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!investorId) {
      setLoading(false);
      return;
    }

    // Set up real-time listener
    const unsubscribe = GovernorService.subscribeToShadowBan(investorId, (ban) => {
      setShadowBan(ban);
      setLoading(false);
      setError(null);
    });

    return unsubscribe;
  }, [investorId]);

  return { shadowBan, loading, error };
};

export const useGovernorActions = (limit: number = 100) => {
  const [actions, setActions] = useState<GovernorAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActions = async () => {
    try {
      setLoading(true);
      const data = await GovernorService.getGovernorActions(limit);
      setActions(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
  }, [limit]);

  return { actions, loading, error, refetch: fetchActions };
};