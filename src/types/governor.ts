export interface AccountFlag {
  id: string;
  investorId: string;
  investorName: string;
  flagType: 'fraud' | 'policy_violation' | 'withdrawal_restriction' | 'kyc_document_issue';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  flaggedBy: string;
  flaggedAt: Date;
  status: 'active' | 'resolved' | 'under_review';
  resolutionNotes?: string;
  resolvedBy?: string;
  resolvedAt?: Date;
  autoRestrictions: {
    withdrawalDisabled: boolean;
    accountSuspended: boolean;
    requiresApproval: boolean;
  };
}

export interface DocumentRequest {
  id: string;
  investorId: string;
  investorName: string;
  requestedBy: string;
  requestedAt: Date;
  documentType: 'bank_statement' | 'tax_report' | 'salary_certificate' | 'proof_of_revenue' | 'proof_of_residency' | 'identity_document' | 'other';
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'submitted' | 'approved' | 'rejected' | 'expired';
  dueDate?: Date;
  submittedAt?: Date;
  submittedDocuments?: string[];
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
}

export interface AccountCreationRequest {
  id: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string;
  applicantCountry: string;
  requestedBy: string;
  requestedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  initialDeposit: number;
  accountType: 'Standard' | 'Pro';
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  rejectionReason?: string;
  approvalConditions?: string[];
}

export interface ShadowBan {
  id: string;
  investorId: string;
  investorName: string;
  bannedBy: string;
  bannedAt: Date;
  banType: 'withdrawal_only' | 'trading_only' | 'full_platform';
  reason: string;
  isActive: boolean;
  expiresAt?: Date;
  removedBy?: string;
  removedAt?: Date;
}

export interface GovernorAction {
  id: string;
  governorId: string;
  governorName: string;
  actionType: 'account_suspension' | 'account_activation' | 'flag_creation' | 'document_request' | 'withdrawal_override' | 'shadow_ban' | 'account_creation_approval';
  targetId: string;
  targetName: string;
  targetType: 'investor' | 'admin' | 'withdrawal_request' | 'document' | 'account_application';
  details: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface MT103Document {
  id: string;
  withdrawalId: string;
  investorId: string;
  investorName: string;
  amount: number;
  currency: string;
  bankDetails: {
    bankName: string;
    swiftCode: string;
    accountNumber: string;
    accountHolder: string;
    bankAddress: string;
  };
  transactionReference: string;
  valueDate: string;
  generatedBy: string;
  generatedAt: Date;
  status: 'generated' | 'sent' | 'confirmed';
}