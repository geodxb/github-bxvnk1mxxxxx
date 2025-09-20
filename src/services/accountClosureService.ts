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
  onSnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AccountClosureRequest } from '../types/accountClosure';
import { FirestoreService } from './firestoreService';

export class AccountClosureService {
  // Create a new account closure request
  static async createClosureRequest(
    investorId: string,
    investorName: string,
    reason: string,
    requestedBy: string,
    accountBalance: number
  ): Promise<string> {
    try {
      console.log(`🔥 Creating account closure request for: ${investorName}`);
      
      const requestData = {
        investorId,
        investorName,
        requestDate: new Date().toISOString().split('T')[0],
        status: 'Pending',
        stage: 'request',
        reason,
        requestedBy,
        accountBalance,
        approvalDate: null,
        completionDate: null,
        rejectionDate: null,
        estimatedCompletionDate: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'accountClosureRequests'), requestData);
      
      // Update investor status
      await FirestoreService.updateInvestor(investorId, {
        accountStatus: 'Deletion Request Under Review',
        isActive: false
      });
      
      console.log(`✅ Account closure request created: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creating closure request:', error);
      throw new Error(`Failed to create closure request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get closure request by investor ID
  static async getClosureRequestByInvestorId(investorId: string): Promise<AccountClosureRequest | null> {
    try {
      console.log(`🔥 Fetching closure request for investor: ${investorId}`);
      
      const q = query(
        collection(db, 'accountClosureRequests'),
        where('investorId', '==', investorId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        
        console.log(`✅ Found closure request: ${doc.id}`);
        return {
          id: doc.id,
          ...data,
          approvalDate: data.approvalDate?.toDate() || null,
          completionDate: data.completionDate?.toDate() || null,
          rejectionDate: data.rejectionDate?.toDate() || null,
          estimatedCompletionDate: data.estimatedCompletionDate?.toDate() || null,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as AccountClosureRequest;
      }
      
      console.log(`⚠️ No closure request found for investor: ${investorId}`);
      return null;
    } catch (error) {
      console.error('❌ Error fetching closure request:', error);
      throw new Error(`Failed to fetch closure request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Approve closure request
  static async approveClosureRequest(
    requestId: string,
    approvedBy: string
  ): Promise<void> {
    try {
      console.log(`🔥 Approving closure request: ${requestId}`);
      
      const docRef = doc(db, 'accountClosureRequests', requestId);
      const requestDoc = await getDoc(docRef);
      
      if (!requestDoc.exists()) {
        throw new Error('Closure request not found');
      }
      
      const requestData = requestDoc.data();
      const approvalDate = new Date();
      const estimatedCompletionDate = new Date();
      estimatedCompletionDate.setDate(estimatedCompletionDate.getDate() + 90);
      
      // Update closure request
      await updateDoc(docRef, {
        status: 'Approved',
        stage: 'countdown',
        approvalDate: serverTimestamp(),
        approvedBy,
        estimatedCompletionDate: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Update investor status
      await FirestoreService.updateInvestor(requestData.investorId, {
        accountStatus: 'Deletion Request Approved - 90 Day Countdown Active',
        isActive: false
      });
      
      console.log(`✅ Closure request approved: ${requestId}`);
    } catch (error) {
      console.error('❌ Error approving closure request:', error);
      throw new Error(`Failed to approve closure request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Reject closure request
  static async rejectClosureRequest(
    requestId: string,
    rejectedBy: string,
    reason: string
  ): Promise<void> {
    try {
      console.log(`🔥 Rejecting closure request: ${requestId}`);
      
      const docRef = doc(db, 'accountClosureRequests', requestId);
      const requestDoc = await getDoc(docRef);
      
      if (!requestDoc.exists()) {
        throw new Error('Closure request not found');
      }
      
      const requestData = requestDoc.data();
      
      // Update closure request
      await updateDoc(docRef, {
        status: 'Rejected',
        stage: 'rejected',
        rejectionDate: serverTimestamp(),
        rejectionReason: reason,
        updatedAt: serverTimestamp()
      });
      
      // Restore investor status
      await FirestoreService.updateInvestor(requestData.investorId, {
        accountStatus: 'Active',
        isActive: true
      });
      
      console.log(`✅ Closure request rejected: ${requestId}`);
    } catch (error) {
      console.error('❌ Error rejecting closure request:', error);
      throw new Error(`Failed to reject closure request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Complete closure request (after 90 days)
  static async completeClosureRequest(requestId: string): Promise<void> {
    try {
      console.log(`🔥 Completing closure request: ${requestId}`);
      
      const docRef = doc(db, 'accountClosureRequests', requestId);
      const requestDoc = await getDoc(docRef);
      
      if (!requestDoc.exists()) {
        throw new Error('Closure request not found');
      }
      
      const requestData = requestDoc.data();
      
      // Update closure request
      await updateDoc(docRef, {
        status: 'Completed',
        stage: 'completed',
        completionDate: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Update investor status to permanently closed
      await FirestoreService.updateInvestor(requestData.investorId, {
        accountStatus: 'Account Permanently Closed',
        isActive: false,
        currentBalance: 0 // Funds transferred
      });
      
      console.log(`✅ Closure request completed: ${requestId}`);
    } catch (error) {
      console.error('❌ Error completing closure request:', error);
      throw new Error(`Failed to complete closure request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Real-time listener for closure request
  static subscribeToClosureRequest(
    investorId: string, 
    callback: (request: AccountClosureRequest | null) => void
  ): () => void {
    console.log(`🔥 Setting up real-time listener for closure request: ${investorId}`);
    
    const q = query(
      collection(db, 'accountClosureRequests'),
      where('investorId', '==', investorId),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          const data = doc.data();
          
          console.log(`🔄 Closure request updated: ${doc.id}`);
          
          const request: AccountClosureRequest = {
            id: doc.id,
            ...data,
            approvalDate: data.approvalDate?.toDate() || null,
            completionDate: data.completionDate?.toDate() || null,
            rejectionDate: data.rejectionDate?.toDate() || null,
            estimatedCompletionDate: data.estimatedCompletionDate?.toDate() || null,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date()
          } as AccountClosureRequest;
          
          callback(request);
        } else {
          console.log(`⚠️ No closure request found for investor: ${investorId}`);
          callback(null);
        }
      },
      (error) => {
        console.error(`❌ Real-time listener failed for closure request:`, error);
        callback(null);
      }
    );

    return unsubscribe;
  }

  // Calculate days remaining in countdown
  static calculateDaysRemaining(approvalDate: Date): number {
    const now = new Date();
    const completionDate = new Date(approvalDate);
    completionDate.setDate(completionDate.getDate() + 90);
    
    const timeDiff = completionDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    return Math.max(0, daysRemaining);
  }

  // Check if closure request is overdue
  static isClosureOverdue(approvalDate: Date): boolean {
    const now = new Date();
    const completionDate = new Date(approvalDate);
    completionDate.setDate(completionDate.getDate() + 90);
    
    return now > completionDate;
  }
}