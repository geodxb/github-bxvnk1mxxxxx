import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { WithdrawalFlag } from '../types/withdrawal';

export class WithdrawalFlagService {
  // Create a new withdrawal flag
  static async requestWithdrawalFlag(
    withdrawalId: string,
    flagType: WithdrawalFlag['flagType'],
    priority: WithdrawalFlag['priority'],
    comment: string,
    requestedBy: string,
    requestedByName: string,
    requestedByRole: 'admin' | 'governor'
  ): Promise<string> {
    try {
      console.log('🚩 Requesting withdrawal flag:', { withdrawalId, flagType, priority });
      
      const flagData: Omit<WithdrawalFlag, 'id'> = {
        withdrawalId,
        requestedBy,
        requestedByName,
        requestedByRole,
        requestedAt: new Date(),
        flagType,
        priority,
        comment,
        status: 'pending',
        isActive: false // Only active after governor approval
      };
      
      const docRef = await addDoc(collection(db, 'withdrawalFlags'), {
        ...flagData,
        requestedAt: serverTimestamp()
      });
      
      console.log('✅ Withdrawal flag request created:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error requesting withdrawal flag:', error);
      throw new Error(`Failed to request withdrawal flag: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Approve withdrawal flag request (Governor only)
  static async approveWithdrawalFlag(
    flagId: string,
    reviewedBy: string,
    reviewedByName: string,
    reviewComment?: string
  ): Promise<void> {
    try {
      console.log('🚩 Approving withdrawal flag:', flagId);
      
      const docRef = doc(db, 'withdrawalFlags', flagId);
      await updateDoc(docRef, {
        status: 'approved',
        isActive: true,
        reviewedBy,
        reviewedByName,
        reviewedAt: serverTimestamp(),
        reviewComment: reviewComment || null
      });
      
      console.log('✅ Withdrawal flag approved successfully');
    } catch (error) {
      console.error('❌ Error approving withdrawal flag:', error);
      throw new Error(`Failed to approve withdrawal flag: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Reject withdrawal flag request (Governor only)
  static async rejectWithdrawalFlag(
    flagId: string,
    reviewedBy: string,
    reviewedByName: string,
    reviewComment: string
  ): Promise<void> {
    try {
      console.log('🚩 Rejecting withdrawal flag:', flagId);
      
      const docRef = doc(db, 'withdrawalFlags', flagId);
      await updateDoc(docRef, {
        status: 'rejected',
        isActive: false,
        reviewedBy,
        reviewedByName,
        reviewedAt: serverTimestamp(),
        reviewComment
      });
      
      console.log('✅ Withdrawal flag rejected successfully');
    } catch (error) {
      console.error('❌ Error rejecting withdrawal flag:', error);
      throw new Error(`Failed to reject withdrawal flag: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get flags for a specific withdrawal
  static async getWithdrawalFlags(withdrawalId: string): Promise<WithdrawalFlag[]> {
    try {
      console.log('🚩 Fetching flags for withdrawal:', withdrawalId);
      
      const flagsQuery = query(
        collection(db, 'withdrawalFlags'),
        where('withdrawalId', '==', withdrawalId),
        orderBy('requestedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(flagsQuery);
      
      const flags = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        requestedAt: doc.data().requestedAt?.toDate() || new Date(),
        reviewedAt: doc.data().reviewedAt?.toDate() || null
      })) as WithdrawalFlag[];
      
      console.log(`✅ Retrieved ${flags.length} flags for withdrawal`);
      return flags;
    } catch (error) {
      console.error('❌ Error fetching withdrawal flags:', error);
      throw new Error(`Failed to load withdrawal flags: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get all pending flag requests (Governor only)
  static async getPendingFlagRequests(): Promise<WithdrawalFlag[]> {
    try {
      console.log('🚩 Fetching pending flag requests...');
      
      const flagsQuery = query(
        collection(db, 'withdrawalFlags'),
        where('status', '==', 'pending'),
        orderBy('requestedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(flagsQuery);
      
      const flags = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        requestedAt: doc.data().requestedAt?.toDate() || new Date(),
        reviewedAt: doc.data().reviewedAt?.toDate() || null
      })) as WithdrawalFlag[];
      
      console.log(`✅ Retrieved ${flags.length} pending flag requests`);
      return flags;
    } catch (error) {
      console.error('❌ Error fetching pending flag requests:', error);
      throw new Error(`Failed to load pending flag requests: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get all withdrawal flags
  static async getAllWithdrawalFlags(): Promise<WithdrawalFlag[]> {
    try {
      console.log('🚩 Fetching all withdrawal flags...');
      
      const flagsQuery = query(
        collection(db, 'withdrawalFlags'),
        orderBy('requestedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(flagsQuery);
      
      const flags = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        requestedAt: doc.data().requestedAt?.toDate() || new Date(),
        reviewedAt: doc.data().reviewedAt?.toDate() || null
      })) as WithdrawalFlag[];
      
      console.log(`✅ Retrieved ${flags.length} total withdrawal flags`);
      return flags;
    } catch (error) {
      console.error('❌ Error fetching all withdrawal flags:', error);
      throw new Error(`Failed to load withdrawal flags: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Real-time listener for withdrawal flags
  static subscribeToWithdrawalFlags(
    withdrawalId: string,
    callback: (flags: WithdrawalFlag[]) => void,
    errorCallback?: (error: Error) => void
  ): () => void {
    console.log('🔄 Setting up real-time listener for withdrawal flags:', withdrawalId);
    
    const flagsQuery = query(
      collection(db, 'withdrawalFlags'),
      where('withdrawalId', '==', withdrawalId),
      orderBy('requestedAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(
      flagsQuery,
      (querySnapshot) => {
        console.log('🔄 Withdrawal flags updated in real-time');
        try {
          const flags = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            requestedAt: doc.data().requestedAt?.toDate() || new Date(),
            reviewedAt: doc.data().reviewedAt?.toDate() || null
          })) as WithdrawalFlag[];
        
          callback(flags);
        } catch (error) {
          console.error('Error processing withdrawal flags:', error);
          if (errorCallback) {
            errorCallback(error as Error);
          } else {
            callback([]);
          }
        }
      },
      (error) => {
        console.error('❌ Real-time listener failed for withdrawal flags:', error);
        if (errorCallback) {
          errorCallback(error as Error);
        } else {
          callback([]);
        }
      }
    );

    return unsubscribe;
  }

  // Check if withdrawal has urgent flag
  static async hasUrgentFlag(withdrawalId: string): Promise<{ hasUrgent: boolean; comment?: string }> {
    try {
      const flags = await this.getWithdrawalFlags(withdrawalId);
      const urgentFlag = flags.find(flag => 
        flag.isActive && flag.status === 'approved' && (flag.flagType === 'urgent' || flag.priority === 'urgent')
      );
      
      return {
        hasUrgent: !!urgentFlag,
        comment: urgentFlag?.comment
      };
    } catch (error) {
      console.error('❌ Error checking urgent flag:', error);
      return { hasUrgent: false };
    }
  }
}