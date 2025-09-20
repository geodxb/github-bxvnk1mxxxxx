import { useState, useEffect } from 'react';
import { NotificationService } from '../services/notificationService';
import { PushNotification } from '../types/notification';
import { useAuth } from '../contexts/AuthContext';

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Set up real-time listener
    console.log('🔔 Setting up notifications listener for user:', user.id);
    const unsubscribe = NotificationService.subscribeToNotifications(user.id, (updatedNotifications) => {
      console.log('🔔 Notifications updated:', updatedNotifications.length);
      setNotifications(updatedNotifications);
      setLoading(false);
      setError(null);
    });

    // Cleanup listener on unmount
    return () => {
      console.log('🔔 Cleaning up notifications listener');
      unsubscribe();
    };
  }, [user]);

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Get notifications by type
  const getNotificationsByType = (type: PushNotification['type']) => {
    return notifications.filter(n => n.type === type);
  };

  // Get urgent notifications
  const urgentNotifications = notifications.filter(n => !n.read && n.priority === 'urgent');

  return {
    notifications,
    unreadCount,
    urgentNotifications,
    loading,
    error,
    getNotificationsByType
  };
};