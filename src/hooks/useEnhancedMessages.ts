import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { EnhancedMessageService } from '../services/enhancedMessageService';
import { ConversationMetadata, EnhancedMessage } from '../types/conversation';

export const useEnhancedConversations = (userId: string) => {
  const [conversations, setConversations] = useState<ConversationMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

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
    }, user?.role);

    // Cleanup listener on unmount
    return () => {
      console.log('🔄 Cleaning up real-time listener for conversations');
      unsubscribe();
    };
  }, [userId, user?.role]);

  return { conversations, loading, error };
};

export const useEnhancedMessages = (conversationId: string) => {
  const [messages, setMessages] = useState<EnhancedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!conversationId) {
      console.log('⚠️ useEnhancedMessages: No conversationId provided');
      setLoading(false);
      setMessages([]);
      setError(null);
      return;
    }

    console.log('🔄 useEnhancedMessages: Setting up listener for conversation:', conversationId);
    setLoading(true);
    
    // Set up real-time listener
    const unsubscribe = EnhancedMessageService.subscribeToEnhancedMessages(conversationId, (updatedMessages) => {
      try {
        console.log('🔄 useEnhancedMessages: Real-time update received for conversation', conversationId, ':', updatedMessages.length, 'messages');
        
        // Log each message for debugging
        updatedMessages.forEach((msg, index) => {
          console.log(`📨 Message ${index + 1}:`, {
            id: msg.id,
            sender: `${msg.senderName} (${msg.senderRole})`,
            content: msg.content?.substring(0, 50) + '...',
            timestamp: msg.timestamp
          });
        });
        
        // Validate messages before setting state
        const validMessages = updatedMessages.filter(msg => {
          if (!msg || !msg.id || !msg.timestamp) {
            console.error('❌ useEnhancedMessages: Invalid message found:', msg);
            return false;
          }
          return true;
        });
        
        console.log('✅ useEnhancedMessages: Valid messages after filtering:', validMessages.length);
        setMessages(validMessages);
        setLoading(false);
        setError(null);
      } catch (error) {
        console.error('❌ useEnhancedMessages: Error processing messages update:', error);
        setMessages([]);
        setLoading(false);
        setError('Failed to load messages');
      }
    });

    // Cleanup listener on unmount
    return () => {
      console.log('🔄 useEnhancedMessages: Cleaning up listener for conversation:', conversationId);
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