export interface WithdrawalFlag {
  id: string;
  withdrawalId: string;
  requestedBy: string;
  requestedByName: string;
  requestedByRole: 'admin' | 'governor';
  requestedAt: Date;
  flagType: 'urgent' | 'suspicious' | 'high_amount' | 'documentation_required' | 'compliance_review';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: Date;
  reviewComment?: string;
  isActive: boolean;
}

export interface EnhancedWithdrawalRequest {
  id: string;
  investorId: string;
  investorName: string;
  amount: number;
  date: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Credited' | 'Refunded';
  processedBy?: string;
  processedAt?: Date | null;
  approvalDate?: Date | null;
  reason?: string;
  w8benStatus?: 'not_required' | 'required' | 'submitted' | 'approved' | 'rejected';
  w8benSubmittedAt?: Date | null;
  w8benApprovedAt?: Date | null;
  w8benDocumentUrl?: string;
  w8benRejectionReason?: string;
  governorComment?: string;
  lastModifiedBy?: string;
  createdAt: Date;
  flags?: WithdrawalFlag[];
  hasUrgentFlag?: boolean;
  urgentComment?: string;
}