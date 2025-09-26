import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { EnhancedMessageService } from '../services/enhancedMessageService';
import { ConversationMetadata, EnhancedMessage } from '../types/conversation';

export const useEnhancedConversations = (userId: string, userRole?: string) => {
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
    const unsubscribe = EnhancedMessageService.subscribeToEnhancedConversations(userId, userRole, (updatedConversations) => {
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
  }, [userId, userRole]);

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

    console.log('🔄 useEnhancedMessages: Setting up listener for conversation:', conversationId);
    
    // Set up real-time listener
    const unsubscribe = EnhancedMessageService.subscribeToEnhancedMessages(conversationId, (updatedMessages) => {
      try {
        console.log('🔄 Real-time update: Enhanced messages updated:', updatedMessages.length);
        
        // Validate messages before setting state
        const validMessages = updatedMessages.filter(msg => {
          if (!msg || !msg.id || !msg.timestamp) {
            console.error('❌ Invalid message found:', msg);
            return false;
          }
          return true;
        });
        
        console.log('✅ Valid messages after filtering:', validMessages.length);
        setMessages(validMessages);
        setLoading(false);
        setError(null);
      } catch (error) {
        console.error('❌ Error processing enhanced messages update:', error);
        setMessages([]);
        setLoading(false);
        setError('Failed to load messages');
      }
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