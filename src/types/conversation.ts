export interface ConversationParticipant {
  id: string;
  name: string;
  role: 'governor' | 'admin' | 'affiliate';
  email?: string;
  joinedAt: Date;
  lastSeen?: Date;
}

export interface ConversationMetadata {
  id: string;
  type: 'admin_affiliate' | 'admin_governor' | 'affiliate_governor' | 'group';
  title: string;
  description?: string;
  participants: ConversationParticipant[];
  createdBy: string;
  createdAt: Date;
  lastActivity: Date;
  lastMessage: string;
  lastMessageSender: string;
  isEscalated: boolean;
  escalatedAt?: Date;
  escalatedBy?: string;
  escalationReason?: string;
  status: 'active' | 'archived' | 'escalated' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
  department?: string;
  auditTrail: ConversationAuditEntry[];
}

export interface ConversationAuditEntry {
  id: string;
  action: 'created' | 'participant_added' | 'participant_removed' | 'escalated' | 'resolved' | 'archived';
  performedBy: string;
  performedByName: string;
  performedByRole: 'governor' | 'admin' | 'affiliate';
  timestamp: Date;
  details: Record<string, any>;
}

export interface EnhancedMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: 'governor' | 'admin' | 'affiliate';
  content: string;
  timestamp: Date;
  replyTo?: string;
  attachments?: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'sent' | 'delivered' | 'read';
  department?: string;
  isEscalation?: boolean;
  escalationReason?: string;
  readBy: Array<{
    userId: string;
    userName: string;
    readAt: Date;
  }>;
  editedAt?: Date;
  editedBy?: string;
  originalContent?: string;
  messageType: 'text' | 'system' | 'escalation' | 'resolution';
  metadata?: Record<string, any>;
}

export interface MessageDraft {
  conversationId: string;
  content: string;
  lastSaved: Date;
  autoSaveEnabled: boolean;
}