import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { EnhancedMessageService } from '../services/enhancedMessageService';
import { ConversationMetadata, EnhancedMessage } from '../types/conversation';

export const useEnhancedConversations = (userId: string) => {
  const [conversations, setConversations] = useState<ConversationMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // Set up real-time listener
    console.log('🔄 Setting up real-time listener for conversations...');
    const unsubscribe = EnhancedMessageService.subscribeToEnhancedConversations(userId, (updatedConversations) => {
      console.log('🔄 Real-time update: Conversations updated');
      setConversations(updatedConversations);
      setLoading(false);
      setError(null);
    });

    // Cleanup listener on unmount
    return () => {
      console.log('🔄 Cleaning up real-time listener for conversations');
      unsubscribe();
    };
  }, [userId]);

  return { conversations, loading, error };
};

export const useEnhancedMessages = (conversationId: string) => {
  const [messages, setMessages] = useState<EnhancedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!conversationId) {
      console.log('⚠️ No conversationId provided to useEnhancedMessages');
      setLoading(false);
      return;
    }

    // Set up real-time listener
    console.log('🔄 Setting up real-time listener for enhanced messages:', conversationId);
    const unsubscribe = EnhancedMessageService.subscribeToEnhancedMessages(conversationId, (updatedMessages) => {
      console.log('🔄 Real-time update: Enhanced messages updated:', updatedMessages.length);
      setMessages(updatedMessages);
      setLoading(false);
      setError(null);
    });

    // Cleanup listener on unmount
    return () => {
      console.log('🔄 Cleaning up real-time listener for enhanced messages:', conversationId);
      unsubscribe();
    };
  }, [conversationId]);

  return { messages, loading, error };
};

export const useAvailableRecipients = (userId: string, userRole: 'governor' | 'admin' | 'affiliate') => {
  const [recipients, setRecipients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecipients = async () => {
      try {
        setLoading(true);
        const availableRecipients = await EnhancedMessageService.getAvailableRecipients(userId, userRole);
        setRecipients(availableRecipients);
        setError(null);
      } catch (err) {
        console.error('Error fetching recipients:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch recipients');
      } finally {
        setLoading(false);
      }
    };

    if (userId && userRole) {
      fetchRecipients();
    }
  }, [userId, userRole]);

  return { recipients, loading, error };
};