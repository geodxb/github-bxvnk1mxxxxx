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
    userRole: 'admin' | 'governor', // Removed 'investor'
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
    recipientRole: 'admin' | 'governor', // Changed 'investor' to 'investor'
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
          conversationId,
          senderId,
          senderName,
          department: department || null
        },
        recipientRole === 'governor' ? '/governor/messages' : 
        recipientRole === 'admin' ? '/admin/messages' : '/login' // Changed '/investor' to '/login'
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
    }

  }
}