import { useState, useEffect } from 'react';
import { MessageService } from '../services/messageService';
import { AffiliateMessage, Conversation } from '../types/message';

export const useMessages = (conversationId: string) => {
  const [messages, setMessages] = useState<AffiliateMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!conversationId) {
      setLoading(false);
      return;
    }

    // Set up real-time listener
    console.log('🔄 Setting up real-time listener for messages...');
    const unsubscribe = MessageService.subscribeToMessages(conversationId, (updatedMessages) => {
      console.log('🔄 Real-time update: Messages updated');
      setMessages(updatedMessages);
      setLoading(false);
      setError(null);
    });

    // Cleanup listener on unmount
    return () => {
      console.log('🔄 Cleaning up real-time listener for messages');
      unsubscribe();
    };
  }, [conversationId]);

  return { messages, loading, error };
};

export const useConversations = (userId: string) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // Set up real-time listener
    console.log('🔄 Setting up real-time listener for conversations...');
    const unsubscribe = MessageService.subscribeToConversations(userId, (updatedConversations) => {
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