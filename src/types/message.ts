// Message types for the messaging system

export interface AffiliateMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'governor' | 'admin' | 'affiliate';
  content: string;
  timestamp: Date;
  conversationId: string;
  replyTo?: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'sent' | 'delivered' | 'read';
  department?: string | null;
  isEscalation?: boolean;
  escalationReason?: string | null;
  readBy: Array<{
    userId: string;
    userName: string;
    readAt: Date;
  }>;
  messageType: 'text' | 'system' | 'escalation' | 'resolution';
  attachments?: Array<{
    url: string;
    name: string;
    type: string;
    size: number;
  }>;
}

export interface Conversation {
  id: string;
  participants: string[];
  participantNames: string[];
  createdAt: Date;
  lastActivity: Date;
  lastMessage: string;
  lastMessageSender: string;
  isEscalated?: boolean;
  escalatedAt?: Date | null;
  escalatedBy?: string;
  escalationReason?: string;
  status: 'active' | 'archived' | 'escalated';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags?: string[];
  department?: string;
}