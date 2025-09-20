import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  setDoc,
  deleteDoc,
  query, 
  where, 
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Investor, Transaction, WithdrawalRequest, Commission, AuditLog, SystemSettings, UserRole } from '../types/user';
import { NotificationService } from './notificationService';

export class FirestoreService {
  // Get all investors
  static async getInvestors(): Promise<Investor[]> {
    try {
      console.log('🔥 Firebase: Fetching all investors...');
      const usersQuery = query(collection(db, 'users'), where('role', '==', 'investor'));
      const querySnapshot = await getDocs(usersQuery);
      
      const investors = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        };
      }) as Investor[];
      
      console.log(`✅ Firebase: Retrieved ${investors.length} investors`);
      return investors;
    } catch (error) {
      console.error('❌ Firebase Error: Failed to fetch investors:', error);
      throw new Error(`Failed to load investors: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Real-time listener for investors
  static subscribeToInvestors(callback: (investors: Investor[]) => void): () => void {
    console.log('🔄 Setting up real-time listener for investors...');
    
    const usersQuery = query(collection(db, 'users'), where('role', '==', 'investor'));
    
    const unsubscribe = onSnapshot(
      usersQuery,
      (querySnapshot) => {
        console.log('🔄 Real-time update: Investors data changed');
        const investors = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date()
          };
        }) as Investor[];
        
        callback(investors);
      },
      (error) => {
        console.error('❌ Real-time listener failed for investors:', error);
        callback([]);
      }
    );

    return unsubscribe;
  }

  // Get single investor by ID
  static async getInvestorById(investorId: string): Promise<Investor | null> {
    try {
      console.log('🔥 Firebase: Fetching investor by ID:', investorId);
      const docRef = doc(db, 'users', investorId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('✅ Firebase: Investor found');
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Investor;
      } else {
        console.log('⚠️ Firebase: Investor not found');
        return null;
      }
    } catch (error) {
      console.error('❌ Firebase Error: Failed to fetch investor:', error);
      throw new Error(`Failed to load investor: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Real-time listener for single investor
  static subscribeToInvestor(investorId: string, callback: (investor: Investor | null) => void): () => void {
    console.log('🔄 Setting up real-time listener for investor:', investorId);
    
    const docRef = doc(db, 'users', investorId);
    
    const unsubscribe = onSnapshot(
      docRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          console.log('🔄 Real-time update: Investor data changed');
          const investor = {
            id: docSnapshot.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date()
          } as Investor;
          
          callback(investor);
        } else {
          console.log('⚠️ Real-time update: Investor not found');
          callback(null);
        }
      },
      (error) => {
        console.error('❌ Real-time listener failed for investor:', error);
        callback(null);
      }
    );

    return unsubscribe;
  }

  // Update investor
  static async updateInvestor(investorId: string, updates: Partial<Investor>): Promise<void> {
    try {
      console.log('🔥 Firebase: Updating investor:', investorId);
      const docRef = doc(db, 'users', investorId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      console.log('✅ Firebase: Investor updated successfully');
    } catch (error) {
      console.error('❌ Firebase Error: Failed to update investor:', error);
      throw new Error(`Failed to update investor: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Update investor balance
  static async updateInvestorBalance(investorId: string, newBalance: number): Promise<void> {
    try {
      console.log(`🔥 Firebase: Updating balance for investor ${investorId} to $${newBalance.toLocaleString()}`);
      const docRef = doc(db, 'users', investorId);
      await updateDoc(docRef, {
        currentBalance: newBalance,
        updatedAt: serverTimestamp()
      });
      console.log('✅ Firebase: Investor balance updated successfully');
    } catch (error) {
      console.error('❌ Firebase Error: Failed to update investor balance:', error);
      throw new Error(`Failed to update balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Add credit to investor
  static async addCreditToInvestor(investorId: string, amount: number, adminId: string): Promise<void> {
    try {
      console.log(`🔥 Firebase: Adding $${amount.toLocaleString()} credit to investor ${investorId}`);
      
      // Get current investor data
      const investor = await this.getInvestorById(investorId);
      if (!investor) {
        throw new Error('Investor not found');
      }
      
      // Update balance
      const newBalance = investor.currentBalance + amount;
      await this.updateInvestorBalance(investorId, newBalance);
      
      // Add transaction record
      await this.addTransaction({
        investorId,
        type: 'Credit',
        amount,
        date: new Date().toISOString().split('T')[0],
        status: 'Completed',
        description: `Credit added by admin`,
        processedBy: adminId
      });
      
      console.log('✅ Firebase: Credit added successfully');
    } catch (error) {
      console.error('❌ Firebase Error: Failed to add credit:', error);
      throw new Error(`Failed to add credit: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get all transactions
  static async getTransactions(investorId?: string): Promise<Transaction[]> {
    try {
      console.log('🔥 Firebase: Fetching transactions...', investorId ? `for investor ${investorId}` : 'all transactions');
      
      let transactionsQuery;
      if (investorId) {
        transactionsQuery = query(
          collection(db, 'transactions'),
          where('investorId', '==', investorId),
          orderBy('date', 'desc')
        );
      } else {
        transactionsQuery = query(
          collection(db, 'transactions'),
          orderBy('date', 'desc')
        );
      }
      
      const querySnapshot = await getDocs(transactionsQuery);
      
      const transactions = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date()
        };
      }) as Transaction[];
      
      console.log(`✅ Firebase: Retrieved ${transactions.length} transactions`);
      return transactions;
    } catch (error) {
      console.error('❌ Firebase Error: Failed to fetch transactions:', error);
      throw new Error(`Failed to load transactions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Real-time listener for transactions
  static subscribeToTransactions(investorId: string | undefined, callback: (transactions: Transaction[]) => void): () => void {
    // Validate investorId before setting up listener
    if (!investorId) {
      console.log('⚠️ No investorId provided to subscribeToTransactions, returning empty callback');
      callback([]);
      return () => {}; // Return empty unsubscribe function
    }

    console.log('🔄 Setting up real-time listener for transactions...', investorId ? `for investor ${investorId}` : 'all transactions');
    
    // Always use investorId filter for security
    const transactionsQuery = query(
      collection(db, 'transactions'),
      where('investorId', '==', investorId),
      orderBy('date', 'desc')
    );
    
    const unsubscribe = onSnapshot(
      transactionsQuery,
      (querySnapshot) => {
        console.log('🔄 Real-time update: Transactions data changed');
        const transactions = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date()
          };
        }) as Transaction[];
        
        callback(transactions);
      },
      (error) => {
        console.error('❌ Real-time listener failed for transactions:', error.message);
        console.log('🔄 Falling back to empty transactions array due to permission error');
        callback([]);
      }
    );

    return unsubscribe;
  }

  // Add transaction
  static async addTransaction(transaction: Omit<Transaction, 'id' | 'createdAt'>): Promise<string> {
    try {
      console.log('🔥 Firebase: Adding transaction:', transaction.type, transaction.amount);
      const docRef = await addDoc(collection(db, 'transactions'), {
        ...transaction,
        createdAt: serverTimestamp()
      });
      console.log('✅ Firebase: Transaction added successfully:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Firebase Error: Failed to add transaction:', error);
      throw new Error(`Failed to add transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Update transaction
  static async updateTransaction(transactionId: string, updates: Partial<Transaction>): Promise<void> {
    try {
      console.log('🔥 Firebase: Updating transaction:', transactionId);
      const docRef = doc(db, 'transactions', transactionId);
      await updateDoc(docRef, updates);
      console.log('✅ Firebase: Transaction updated successfully');
    } catch (error) {
      console.error('❌ Firebase Error: Failed to update transaction:', error);
      throw new Error(`Failed to update transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get withdrawal requests
  static async getWithdrawalRequests(investorId?: string): Promise<WithdrawalRequest[]> {
    try {
      console.log('🔥 Firebase: Fetching withdrawal requests...', investorId ? `for investor ${investorId}` : 'all requests');
      
      let withdrawalsQuery;
      if (investorId) {
        withdrawalsQuery = query(
          collection(db, 'withdrawalRequests'),
          where('investorId', '==', investorId),
          orderBy('date', 'desc')
        );
      } else {
        withdrawalsQuery = query(
          collection(db, 'withdrawalRequests'),
          orderBy('date', 'desc')
        );
      }
      
      const querySnapshot = await getDocs(withdrawalsQuery);
      
      const withdrawalRequests = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          processedAt: data.processedAt?.toDate() || null,
          approvalDate: data.approvalDate?.toDate() || null,
          createdAt: data.createdAt?.toDate() || new Date()
        };
      }) as WithdrawalRequest[];
      
      console.log(`✅ Firebase: Retrieved ${withdrawalRequests.length} withdrawal requests`);
      return withdrawalRequests;
    } catch (error) {
      console.error('❌ Firebase Error: Failed to fetch withdrawal requests:', error);
      throw new Error(`Failed to load withdrawal requests: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Add withdrawal request
  static async addWithdrawalRequest(
    investorId: string, 
    investorName: string, 
    amount: number,
    withdrawalId?: string
  ): Promise<string> {
    try {
      console.log(`🔥 Firebase: Adding withdrawal request for ${investorName}: $${amount.toLocaleString()}`);
      
      const requestData = {
        investorId,
        investorName,
        amount,
        date: new Date().toISOString().split('T')[0],
        status: 'Pending',
        processedBy: null,
        processedAt: null,
        approvalDate: null,
        reason: null,
        w8benStatus: amount >= 1000 ? 'required' : 'not_required',
        w8benSubmittedAt: null,
        w8benApprovedAt: null,
        w8benDocumentUrl: null,
        w8benRejectionReason: null,
        createdAt: serverTimestamp()
      };
      
      let docRef;
      if (withdrawalId) {
        // Use custom ID if provided
        docRef = doc(db, 'withdrawalRequests', withdrawalId);
        await updateDoc(docRef, requestData);
      } else {
        // Auto-generate ID
        docRef = await addDoc(collection(db, 'withdrawalRequests'), requestData);
      }
      
      // Create notification for admin users
      try {
        // Get all admin users
        const adminQuery = query(collection(db, 'users'), where('role', '==', 'admin'));
        const adminSnapshot = await getDocs(adminQuery);
        
        // Send notification to all admins
        for (const adminDoc of adminSnapshot.docs) {
          await NotificationService.createWithdrawalStageNotification(
            withdrawalId || docRef.id,
            investorId,
            investorName,
            amount,
            'submitted',
            adminDoc.id
          );
        }
      } catch (notificationError) {
        console.error('Error creating withdrawal notification:', notificationError);
      }
      
      console.log('✅ Firebase: Withdrawal request added successfully');
      return withdrawalId || docRef.id;
    } catch (error) {
      console.error('❌ Firebase Error: Failed to add withdrawal request:', error);
      throw new Error(`Failed to add withdrawal request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Update withdrawal request
  static async updateWithdrawalRequest(
    requestId: string, 
    status: string, 
    processedBy: string, 
    reason?: string
  ): Promise<void> {
    try {
      console.log(`🔥 Firebase: Updating withdrawal request ${requestId} to ${status}`);
      const docRef = doc(db, 'withdrawalRequests', requestId);
      
      // Get withdrawal request data for notification
      const withdrawalDoc = await getDoc(docRef);
      const withdrawalData = withdrawalDoc.exists() ? withdrawalDoc.data() : null;
      
      const updateData: any = {
        status,
        processedBy,
        processedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      if (reason) {
        updateData.reason = reason;
      }
      
      // Set approval date for approved requests
      if (status === 'Approved') {
        updateData.approvalDate = serverTimestamp();
      }
      
      await updateDoc(docRef, updateData);
      console.log('✅ Firebase: Withdrawal request updated successfully');
      // Create notification for withdrawal stage update
      if (withdrawalData) {
        try {
          // Get all admin users for notifications
          const adminQuery = query(collection(db, 'users'), where('role', '==', 'admin'));
          const adminSnapshot = await getDocs(adminQuery);
          
          const stage = status.toLowerCase() as 'approved' | 'credited' | 'rejected';
          
          // Send notification to all admins
          for (const adminDoc of adminSnapshot.docs) {
            await NotificationService.createWithdrawalStageNotification(
              requestId,
              withdrawalData.investorId,
              withdrawalData.investorName,
              withdrawalData.amount,
              stage,
              adminDoc.id
            );
          }
        } catch (notificationError) {
          console.error('Error creating withdrawal stage notification:', notificationError);
        }
      }
      
    } catch (error) {
      console.error('❌ Firebase Error: Failed to update withdrawal request:', error);
      throw new Error(`Failed to update withdrawal request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get commissions
  static async getCommissions(): Promise<Commission[]> {
    try {
      console.log('🔥 Firebase: Fetching commissions...');
      const commissionsQuery = query(
        collection(db, 'commissions'),
        orderBy('date', 'desc')
      );
      
      const querySnapshot = await getDocs(commissionsQuery);
      
      const commissions = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date()
        };
      }) as Commission[];
      
      console.log(`✅ Firebase: Retrieved ${commissions.length} commission records`);
      return commissions;
    } catch (error) {
      console.error('❌ Firebase Error: Failed to fetch commissions:', error);
      throw new Error(`Failed to load commissions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Add commission
  static async addCommission(commission: Omit<Commission, 'id' | 'createdAt'>): Promise<string> {
    try {
      console.log('🔥 Firebase: Adding commission record');
      const docRef = await addDoc(collection(db, 'commissions'), {
        ...commission,
        createdAt: serverTimestamp()
      });
      console.log('✅ Firebase: Commission added successfully:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Firebase Error: Failed to add commission:', error);
      throw new Error(`Failed to add commission: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Add commission withdrawal request
  static async addCommissionWithdrawalRequest(request: any): Promise<string> {
    try {
      console.log('🔥 Firebase: Adding commission withdrawal request');
      const docRef = await addDoc(collection(db, 'commissionWithdrawals'), {
        ...request,
        createdAt: serverTimestamp()
      });
      console.log('✅ Firebase: Commission withdrawal request added successfully');
      return docRef.id;
    } catch (error) {
      console.error('❌ Firebase Error: Failed to add commission withdrawal request:', error);
      throw new Error(`Failed to add commission withdrawal request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Add profile change request
  static async addProfileChangeRequest(request: any): Promise<string> {
    try {
      console.log('🔥 Firebase: Adding profile change request');
      const docRef = await addDoc(collection(db, 'profileChangeRequests'), {
        ...request,
        createdAt: serverTimestamp()
      });
      console.log('✅ Firebase: Profile change request added successfully');
      return docRef.id;
    } catch (error) {
      console.error('❌ Firebase Error: Failed to add profile change request:', error);
      throw new Error(`Failed to add profile change request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Enhanced Governor Powers - Direct Financial Adjustments
  static async adjustInvestorBalance(
    investorId: string,
    amount: number,
    reason: string,
    governorId: string,
    governorName: string
  ): Promise<void> {
    try {
      console.log(`🔥 Governor: Adjusting balance for investor ${investorId} by $${amount.toLocaleString()}`);
      
      // Get current investor data
      const investor = await this.getInvestorById(investorId);
      if (!investor) {
        throw new Error('Investor not found');
      }
      
      const oldBalance = investor.currentBalance;
      const newBalance = oldBalance + amount;
      
      // Update investor balance
      await this.updateInvestorBalance(investorId, newBalance);
      
      // Add adjustment transaction
      await this.addTransaction({
        investorId,
        type: 'Adjustment',
        amount,
        date: new Date().toISOString().split('T')[0],
        status: 'Completed',
        description: `Governor balance adjustment: ${reason}`,
        processedBy: governorId
      });
      
      // Log audit trail
      await this.addAuditLog({
        governorId,
        governorName,
        action: 'Balance Adjustment',
        targetId: investorId,
        targetName: investor.name,
        details: {
          oldBalance,
          newBalance,
          amount,
          reason
        }
      });
      
      console.log('✅ Governor: Balance adjustment completed successfully');
    } catch (error) {
      console.error('❌ Governor Error: Failed to adjust balance:', error);
      throw new Error(`Failed to adjust balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Enhanced Governor Powers - User Role Management
  static async changeUserRole(
    userId: string,
    newRole: UserRole,
    reason: string,
    governorId: string,
    governorName: string
  ): Promise<void> {
    try {
      console.log(`🔥 Governor: Changing role for user ${userId} to ${newRole}`);
      
      // Get current user data
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      
      const userData = userDoc.data();
      const oldRole = userData.role;
      
      // Update user role
      await updateDoc(doc(db, 'users', userId), {
        role: newRole,
        updatedAt: serverTimestamp()
      });
      
      // Log audit trail
      await this.addAuditLog({
        governorId,
        governorName,
        action: 'Role Change',
        targetId: userId,
        targetName: userData.name,
        details: {
          oldRole,
          newRole,
          reason
        }
      });
      
      console.log('✅ Governor: Role change completed successfully');
    } catch (error) {
      console.error('❌ Governor Error: Failed to change role:', error);
      throw new Error(`Failed to change role: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Enhanced Governor Powers - System Settings Management
  static async updateSystemSetting(
    settingName: string,
    value: any,
    governorId: string,
    governorName: string,
    oldValue?: any
  ): Promise<void> {
    try {
      console.log(`🔥 Governor: Updating system setting ${settingName}`);
      
      // Update system setting
      const docRef = doc(db, 'systemSettings', 'global');
      
      // Check if document exists first
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        console.log('🔧 Creating systemSettings document...');
        await setDoc(docRef, {
          [settingName]: value,
          updatedAt: serverTimestamp(),
          updatedBy: governorId
        });
      } else {
        await updateDoc(docRef, {
          [settingName]: value,
          updatedAt: serverTimestamp(),
          updatedBy: governorId
        });
      }
      
      // Log audit trail
      await this.addAuditLog({
        governorId,
        governorName,
        action: 'System Setting Update',
        targetId: 'system',
        targetName: 'Global Settings',
        details: {
          settingName,
          oldValue,
          newValue: value
        }
      });
      
      console.log('✅ Governor: System setting updated successfully');
    } catch (error) {
      console.error('❌ Governor Error: Failed to update system setting:', error);
      throw new Error(`Failed to update system setting: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get system settings
  static async getSystemSettings(): Promise<SystemSettings | null> {
    try {
      console.log('🔧 Firebase: Fetching system settings...');
      const docRef = doc(db, 'systemSettings', 'global');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('✅ Firebase: System settings retrieved:', data);
        return {
          ...data,
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as SystemSettings;
      } else {
        console.log('⚠️ Firebase: System settings document not found, creating default...');
        // Create default system settings
        const defaultSettings = {
          maintenanceMode: false,
          maintenanceMessage: 'System is under maintenance. Please try again later.',
          minWithdrawal: 100,
          maxWithdrawal: 50000,
          commissionRate: 15,
          autoApprovalLimit: 10000,
          securityLevel: 'MEDIUM',
          requireW8Ben: true,
          updatedAt: serverTimestamp(),
          updatedBy: 'system'
        };
        
        await setDoc(docRef, defaultSettings);
        console.log('✅ Firebase: Default system settings created:', defaultSettings);
        
        return {
          ...defaultSettings,
          updatedAt: new Date()
        } as SystemSettings;
      }
    } catch (error) {
      console.error('❌ Firebase Error: Failed to fetch system settings:', error);
      // Return default settings instead of throwing error to prevent app crash
      console.log('⚠️ Firebase: Returning fallback settings due to error');
      return {
        maintenanceMode: false,
        maintenanceMessage: 'System is under maintenance. Please try again later.',
        minWithdrawal: 100,
        maxWithdrawal: 50000,
        commissionRate: 15,
        autoApprovalLimit: 10000,
        securityLevel: 'MEDIUM',
        requireW8Ben: true,
        updatedAt: new Date(),
        updatedBy: 'system'
      } as SystemSettings;
    }
  }

  // Real-time listener for system settings
  static subscribeToSystemSettings(callback: (settings: SystemSettings | null) => void): () => void {
    console.log('🔄 Setting up real-time listener for system settings...');
    
    const docRef = doc(db, 'systemSettings', 'global');
    
    const unsubscribe = onSnapshot(
      docRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          console.log('🔄 Real-time update: System settings changed:', data);
          const settings = {
            ...data,
            updatedAt: data.updatedAt?.toDate() || new Date()
          } as SystemSettings;
          
          callback(settings);
        } else {
          console.log('⚠️ Real-time update: System settings document not found');
          callback(null);
        }
      },
      (error) => {
        console.error('❌ Real-time listener failed for system settings:', error);
        callback(null);
      }
    );

    return unsubscribe;
  }

  // Initialize system settings
  static async initializeSystemSettings(governorId: string, governorName: string): Promise<void> {
    try {
      console.log('🔥 Governor: Initializing system settings...');
      
      const defaultSettings: SystemSettings = {
        maintenanceMode: false,
        maintenanceMessage: 'System is under maintenance. Please try again later.',
        minWithdrawal: 100,
        maxWithdrawal: 50000,
        commissionRate: 15,
        autoApprovalLimit: 10000,
        securityLevel: 'MEDIUM',
        requireW8Ben: true,
        updatedAt: new Date(),
        updatedBy: governorId
      };
      
      const docRef = doc(db, 'systemSettings', 'global');
      await setDoc(docRef, {
        ...defaultSettings,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Log audit trail
      await this.addAuditLog({
        governorId,
        governorName,
        action: 'System Setting Update',
        targetId: 'system',
        targetName: 'Global Settings',
        details: {
          action: 'Initialize Default Settings',
          settings: defaultSettings
        }
      });
      
      console.log('✅ Governor: System settings initialized successfully');
    } catch (error) {
      console.error('❌ Governor Error: Failed to initialize system settings:', error);
      throw new Error(`Failed to initialize system settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Add document to collection
  static async addDocument(collectionName: string, data: any): Promise<string> {
    try {
      console.log(`🔥 Firebase: Adding document to ${collectionName}...`);
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: serverTimestamp()
      });
      console.log(`✅ Firebase: Document added successfully: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error(`❌ Firebase Error: Failed to add document to ${collectionName}:`, error);
      throw new Error(`Failed to add document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get account creation requests
  static async getAccountCreationRequests(): Promise<any[]> {
    try {
      console.log('🔥 Firebase: Fetching account creation requests...');
      const requestsQuery = query(
        collection(db, 'accountCreationRequests'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(requestsQuery);
      
      const requests = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          requestedAt: data.requestedAt?.toDate() || new Date(),
          agreementAcceptedAt: data.agreementAcceptedAt?.toDate() || new Date(),
          reviewedAt: data.reviewedAt?.toDate() || null,
          createdAt: data.createdAt?.toDate() || new Date()
        };
      });
      
      console.log(`✅ Firebase: Retrieved ${requests.length} account creation requests`);
      return requests;
    } catch (error) {
      console.error('❌ Firebase Error: Failed to fetch account creation requests:', error);
      throw new Error(`Failed to load account creation requests: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Add account creation request
  static async addAccountCreationRequest(request: Omit<AccountCreationRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      console.log('🔥 Firebase: Adding account creation request for:', request.applicantName);
      const docRef = await addDoc(collection(db, 'accountCreationRequests'), {
        ...request,
        requestedAt: serverTimestamp(),
        agreementAcceptedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log('✅ Firebase: Account creation request added successfully:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Firebase Error: Failed to add account creation request:', error);
      throw new Error(`Failed to add account creation request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Update account creation request
  static async updateAccountCreationRequest(requestId: string, updates: any): Promise<void> {
    try {
      console.log('🔥 Firebase: Updating account creation request:', requestId);
      const docRef = doc(db, 'accountCreationRequests', requestId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      console.log('✅ Firebase: Account creation request updated successfully');
    } catch (error) {
      console.error('❌ Firebase Error: Failed to update account creation request:', error);
      throw new Error(`Failed to update request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Add audit log
  static async addAuditLog(auditData: Omit<AuditLog, 'id' | 'timestamp' | 'createdAt'>): Promise<string> {
    try {
      console.log('🔥 Governor: Adding audit log entry');
      const docRef = await addDoc(collection(db, 'auditLogs'), {
        ...auditData,
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp()
      });
      console.log('✅ Governor: Audit log entry added successfully');
      return docRef.id;
    } catch (error) {
      console.error('❌ Governor Error: Failed to add audit log:', error);
      throw new Error(`Failed to add audit log: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get audit logs
  static async getAuditLogs(limitCount: number = 100): Promise<AuditLog[]> {
    try {
      console.log('🔥 Governor: Fetching audit logs...');
      const auditQuery = query(
        collection(db, 'auditLogs'),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(auditQuery);
      
      const auditLogs = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date()
        };
      }) as AuditLog[];
      
      console.log(`✅ Governor: Retrieved ${auditLogs.length} audit log entries`);
      return auditLogs;
    } catch (error) {
      console.error('❌ Governor Error: Failed to fetch audit logs:', error);
      throw new Error(`Failed to load audit logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}