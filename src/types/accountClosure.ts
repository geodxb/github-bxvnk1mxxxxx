export interface AccountClosureRequest {
  id: string;
  investorId: string;
  investorName: string;
  requestDate: string;
  status: 'Pending' | 'Approved' | 'Completed' | 'Rejected';
  stage: 'request' | 'approval' | 'countdown' | 'completed' | 'rejected';
  approvalDate?: Date | null;
  completionDate?: Date | null;
  rejectionDate?: Date | null;
  rejectionReason?: string;
  requestedBy: string;
  approvedBy?: string;
  reason: string;
  accountBalance: number;
  fundTransferMethod?: string;
  estimatedCompletionDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccountClosureStage {
  id: string;
  stage: 'request' | 'approval' | 'countdown' | 'completed' | 'rejected';
  status: string;
  timestamp: Date;
  description: string;
  completedBy?: string;
  notes?: string;
}