export interface SupportTicket {
  id: string;
  investorId: string;
  investorName: string;
  submittedBy: string;
  submittedByName: string;
  ticketType: 'suspicious_activity' | 'information_modification' | 'policy_violation' | 'account_issue' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'pending_approval' | 'resolved' | 'closed';
  submittedAt: Date;
  assignedTo?: string;
  assignedToName?: string;
  assignedAt?: Date;
  responses: TicketResponse[];
  resolution?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
  closedAt?: Date;
  closedBy?: string;
  tags: string[];
  attachments: string[];
  lastActivity: Date;
  escalated: boolean;
  escalatedAt?: Date;
  escalatedReason?: string;
}

export interface TicketResponse {
  id: string;
  ticketId: string;
  responderId: string;
  responderName: string;
  responderRole: 'admin' | 'governor';
  content: string;
  timestamp: Date;
  isInternal: boolean;
  attachments?: string[];
}

export interface TicketAction {
  id: string;
  ticketId: string;
  actionType: 'created' | 'assigned' | 'status_changed' | 'priority_changed' | 'responded' | 'escalated' | 'resolved' | 'closed';
  performedBy: string;
  performedByName: string;
  timestamp: Date;
  details: Record<string, any>;
}