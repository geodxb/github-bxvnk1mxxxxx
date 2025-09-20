import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  getDocs
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PushNotification, NotificationPreferences } from '../types/notification';

export class NotificationService {
  // Create a new notification
  static async createNotification(
    type: PushNotification['type'],
    title: string,
    message: string,
    userId: string,
    userRole: 'admin' | 'investor' | 'governor',
    priority: PushNotification['priority'] = 'medium',
    data?: PushNotification['data'],
    actionUrl?: string,
    expiresAt?: Date
  ): Promise<string> {
    try {
      console.log('🔔 Creating notification:', { type, title, userId, userRole });
      
      const notification: Omit<PushNotification, 'id'> = {
        type,
        title,
        message,
        timestamp: new Date(),
        read: false,
        priority,
        userId,
        userRole,
        data: data || {},
        actionUrl,
        createdAt: new Date(),
        expiresAt
      };
      
      const docRef = await addDoc(collection(db, 'notifications'), {
        ...notification,
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp(),
        expiresAt: expiresAt ? expiresAt : null
      });
      
      console.log('✅ Notification created:', docRef.id);
      
      // Play notification sound if enabled
      this.playNotificationSound(priority);
      
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creating notification:', error);
      throw error;
    }
  }

  // Create withdrawal stage notification
  static async createWithdrawalStageNotification(
    withdrawalId: string,
    investorId: string,
    investorName: string,
    amount: number,
    stage: 'submitted' | 'approved' | 'credited' | 'rejected',
    adminUserId: string
  ): Promise<void> {
    try {
      const stageMessages = {
        submitted: {
          title: 'New Withdrawal Request',
          message: `${investorName} submitted a withdrawal request for $${amount.toLocaleString()}`,
          priority: 'high' as const
        },
        approved: {
          title: 'Withdrawal Approved',
          message: `Withdrawal request for ${investorName} ($${amount.toLocaleString()}) has been approved`,
          priority: 'medium' as const
        },
        credited: {
          title: 'Withdrawal Completed',
          message: `Withdrawal for ${investorName} ($${amount.toLocaleString()}) has been completed`,
          priority: 'medium' as const
        },
        rejected: {
          title: 'Withdrawal Rejected',
          message: `Withdrawal request for ${investorName} ($${amount.toLocaleString()}) has been rejected`,
          priority: 'high' as const
        }
      };

      const stageInfo = stageMessages[stage];
      
      await this.createNotification(
        'withdrawal_stage',
        stageInfo.title,
        stageInfo.message,
        adminUserId,
        'admin',
        stageInfo.priority,
        {
          withdrawalId,
          investorId,
          investorName,
          amount,
          stage
        },
        `/admin/withdrawals`
      );
    } catch (error) {
      console.error('❌ Error creating withdrawal stage notification:', error);
    }
  }

  // Create message notification
  static async createMessageNotification(
    senderId: string,
    senderName: string,
    recipientId: string,
    recipientRole: 'admin' | 'investor' | 'governor',
    messageContent: string,
    conversationId: string
  ): Promise<void> {
    try {
      const truncatedMessage = messageContent.length > 100 
        ? messageContent.substring(0, 100) + '...'
        : messageContent;

      await this.createNotification(
        'message',
        `New Message from ${senderName}`,
        truncatedMessage,
        recipientId,
        recipientRole,
        'medium',
        {
          messageId: senderId,
          conversationId
        },
        recipientRole === 'admin' ? '/admin/messages' : 
        recipientRole === 'governor' ? '/governor/messages' : '/investor'
      );
    } catch (error) {
      console.error('❌ Error creating message notification:', error);
    }
  }

  // Create ticket notification
  static async createTicketNotification(
    ticketId: string,
    investorId: string,
    investorName: string,
    ticketType: string,
    subject: string,
    priority: 'low' | 'medium' | 'high' | 'urgent',
    adminUserId: string
  ): Promise<void> {
    try {
      await this.createNotification(
        'ticket',
        `New Support Ticket: ${ticketType.replace('_', ' ').toUpperCase()}`,
        `${investorName} submitted a ${priority} priority ticket: ${subject}`,
        adminUserId,
        'admin',
        priority === 'urgent' ? 'urgent' : priority === 'high' ? 'high' : 'medium',
        {
          ticketId,
          investorId,
          investorName
        },
        `/governor/support-tickets`
      );
    } catch (error) {
      console.error('❌ Error creating ticket notification:', error);
    }
  }

  // Get notifications for user
  static async getUserNotifications(userId: string, limitCount: number = 50): Promise<PushNotification[]> {
    try {
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(notificationsQuery);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        expiresAt: doc.data().expiresAt?.toDate() || null
      })) as PushNotification[];
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      return [];
    }
  }

  // Real-time listener for notifications
  static subscribeToNotifications(
    userId: string,
    callback: (notifications: PushNotification[]) => void
  ): () => void {
    console.log('🔔 Setting up real-time listener for notifications:', userId);
    
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
    
    const unsubscribe = onSnapshot(
      notificationsQuery,
      (querySnapshot) => {
        console.log('🔔 Notifications updated in real-time');
        const notifications = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          expiresAt: doc.data().expiresAt?.toDate() || null
        })) as PushNotification[];
        
        callback(notifications);
      },
      (error) => {
        console.error('❌ Real-time listener failed for notifications:', error);
        callback([]);
      }
    );

    return unsubscribe;
  }

  // Mark notification as read
  static async markAsRead(notificationId: string): Promise<void> {
    try {
      const docRef = doc(db, 'notifications', notificationId);
      await updateDoc(docRef, {
        read: true,
        readAt: serverTimestamp()
      });
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
    }
  }

  // Mark all notifications as read for user
  static async markAllAsRead(userId: string): Promise<void> {
    try {
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false)
      );
      
      const querySnapshot = await getDocs(notificationsQuery);
      const batch = writeBatch(db);
      
      querySnapshot.docs.forEach(doc => {
        batch.update(doc.ref, {
          read: true,
          readAt: serverTimestamp()
        });
      });
      
      await batch.commit();
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
    }
  }

  // Play notification sound
  static playNotificationSound(priority: PushNotification['priority']): void {
    try {
      // Create audio context for notification sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Different tones for different priorities
      const frequencies = {
        low: 400,
        medium: 600,
        high: 800,
        urgent: 1000
      };
      
      oscillator.frequency.setValueAtTime(frequencies[priority], audioContext.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('Notification sound not available');
    }
  }

  // Clean up expired notifications
  static async cleanupExpiredNotifications(): Promise<void> {
    try {
      const now = new Date();
      const expiredQuery = query(
        collection(db, 'notifications'),
        where('expiresAt', '<=', now)
      );
      
      const querySnapshot = await getDocs(expiredQuery);
      const batch = writeBatch(db);
      
      querySnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      console.log(`🔔 Cleaned up ${querySnapshot.size} expired notifications`);
    } catch (error) {
      console.error('❌ Error cleaning up expired notifications:', error);
    }
  }
}