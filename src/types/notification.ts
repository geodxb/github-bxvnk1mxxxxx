export interface PushNotification {
  id: string;
  type: 'message' | 'withdrawal' | 'ticket' | 'withdrawal_stage' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  userId: string;
  userRole: 'admin' | 'investor' | 'governor';
  data?: {
    messageId?: string;
    withdrawalId?: string;
    ticketId?: string;
    investorId?: string;
    investorName?: string;
    amount?: number;
    stage?: string;
    conversationId?: string;
  };
  actionUrl?: string;
  createdAt: Date;
  expiresAt?: Date;
}

export interface NotificationPreferences {
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  messageNotifications: boolean;
  withdrawalNotifications: boolean;
  ticketNotifications: boolean;
  systemNotifications: boolean;
  soundEnabled: boolean;
  updatedAt: Date;
}