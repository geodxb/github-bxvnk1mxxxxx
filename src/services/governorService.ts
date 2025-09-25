import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  setDoc,
  query, 
  where, 
  orderBy,
  serverTimestamp,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FirestoreService } from './firestoreService';
import { 
  AccountFlag, 
  DocumentRequest, 
  AccountCreationRequest,
  CryptoWalletVerificationRequest,
  ShadowBan, 
  GovernorAction,
  MT103Document 
} from '../types/governor';

export class GovernorService {
  // Account Management
  static async suspendAccount(
    investorId: string,
    reason: string,
    governorId: string,
    governorName: string,
    suspensionType: 'temporary' | 'permanent' = 'temporary'
  ): Promise<void> {
    try {
      console.log(`🔥 Governor: Suspending account ${investorId}`);
      
      const batch = writeBatch(db);
      
      // Update investor account
      const investorRef = doc(db, 'users', investorId);
      batch.update(investorRef, {
        accountStatus: `SUSPENDED BY GOVERNOR - ${suspensionType.toUpperCase()}`,
        isActive: false,
        accountFlags: {
          governorSuspended: true,
          suspensionType,
          suspensionReason: reason,
          suspendedBy: governorName,
          suspendedAt: serverTimestamp()
        },
        updatedAt: serverTimestamp()
      });
      
      // Log governor action
      const actionRef = doc(collection(db, 'governorActions'));
      batch.set(actionRef, {
        governorId,
        governorName,
        actionType: 'account_suspension',
        targetId: investorId,
        targetName: 'Account Holder',
        targetType: 'investor',
        details: { reason, suspensionType },
        timestamp: serverTimestamp()
      });
      
      await batch.commit();
      console.log('✅ Governor: Account suspended successfully');
    } catch (error) {
      console.error('❌ Governor Error: Failed to suspend account:', error);
      throw error;
    }
  }

  static async activateAccount(
    investorId: string,
    reason: string,
    governorId: string,
    governorName: string
  ): Promise<void> {
    try {
      console.log(`🔥 Governor: Activating account ${investorId}`);
      
      const batch = writeBatch(db);
      
      // Update investor account
      const investorRef = doc(db, 'users', investorId);
      batch.update(investorRef, {
        accountStatus: 'Active',
        isActive: true,
        accountFlags: {
          governorSuspended: false,
          activationReason: reason,
          activatedBy: governorName,
          activatedAt: serverTimestamp()
        },
        updatedAt: serverTimestamp()
      });
      
      // Remove any shadow bans
      const shadowBanRef = doc(db, 'shadowBans', investorId);
      batch.update(shadowBanRef, {
        isActive: false,
        removedBy: governorName,
        removedAt: serverTimestamp()
      });
      
      // Log governor action
      const actionRef = doc(collection(db, 'governorActions'));
      batch.set(actionRef, {
        governorId,
        governorName,
        actionType: 'account_activation',
        targetId: investorId,
        targetName: 'Account Holder',
        targetType: 'investor',
        details: { reason },
        timestamp: serverTimestamp()
      });
      
      await batch.commit();
      console.log('✅ Governor: Account activated successfully');
    } catch (error) {
      console.error('❌ Governor Error: Failed to activate account:', error);
      throw error;
    }
  }

  // Flagging System
  static async createAccountFlag(
    investorId: string,
    investorName: string,
    flagType: AccountFlag['flagType'],
    severity: AccountFlag['severity'],
    description: string,
    governorId: string,
    governorName: string,
    autoRestrictions: AccountFlag['autoRestrictions']
  ): Promise<string> {
    try {
      console.log(`🔥 Governor: Creating ${flagType} flag for ${investorName}`);
      
      const batch = writeBatch(db);
      
      // Create flag document
      const flagRef = doc(collection(db, 'accountFlags'));
      const flagData: Omit<AccountFlag, 'id'> = {
        investorId,
        investorName,
        flagType,
        severity,
        description,
        flaggedBy: governorName,
        flaggedAt: new Date(),
        status: 'active',
        autoRestrictions
      };
      
      batch.set(flagRef, {
        ...flagData,
        flaggedAt: serverTimestamp()
      });
      
      // Apply auto-restrictions to investor account
      if (autoRestrictions.withdrawalDisabled || autoRestrictions.accountSuspended) {
        const investorRef = doc(db, 'users', investorId);
        const updateData: any = {
          updatedAt: serverTimestamp()
        };
        
        if (autoRestrictions.accountSuspended) {
          updateData.accountStatus = `FLAGGED: ${flagType.toUpperCase()} - SUSPENDED`;
          updateData.isActive = false;
        } else if (autoRestrictions.withdrawalDisabled) {
          updateData.accountStatus = `FLAGGED: ${flagType.toUpperCase()} - WITHDRAWAL RESTRICTED`;
        }
        
        updateData.accountFlags = {
          [`${flagType}Flag`]: true,
          withdrawalDisabled: autoRestrictions.withdrawalDisabled,
          requiresApproval: autoRestrictions.requiresApproval,
          flaggedAt: serverTimestamp()
        };
        
        batch.update(investorRef, updateData);
      }
      
      // Log governor action
      const actionRef = doc(collection(db, 'governorActions'));
      batch.set(actionRef, {
        governorId,
        governorName,
        actionType: 'flag_creation',
        targetId: investorId,
        targetName: investorName,
        targetType: 'investor',
        details: { flagType, severity, description, autoRestrictions },
        timestamp: serverTimestamp()
      });
      
      await batch.commit();
      console.log('✅ Governor: Account flag created successfully');
      return flagRef.id;
    } catch (error) {
      console.error('❌ Governor Error: Failed to create account flag:', error);
      throw error;
    }
  }

  // Document Request System
  static async requestDocument(
    investorId: string,
    investorName: string,
    documentType: DocumentRequest['documentType'],
    description: string,
    priority: DocumentRequest['priority'],
    governorId: string,
    governorName: string,
    dueDate?: Date
  ): Promise<string> {
    try {
      console.log(`🔥 Governor: Requesting ${documentType} from ${investorName}`);
      
      const requestData: Omit<DocumentRequest, 'id'> = {
        investorId,
        investorName,
        requestedBy: governorName,
        requestedAt: new Date(),
        documentType,
        description,
        priority,
        status: 'pending',
        dueDate
      };
      
      const docRef = await addDoc(collection(db, 'documentRequests'), {
        ...requestData,
        requestedAt: serverTimestamp(),
        dueDate: dueDate ? dueDate : null
      });
      
      // Update investor with pending document request flag
      await updateDoc(doc(db, 'users', investorId), {
        accountFlags: {
          pendingDocumentRequest: true,
          documentRequestMessage: `Document required: ${documentType.replace('_', ' ')}`,
          documentRequestPriority: priority
        },
        updatedAt: serverTimestamp()
      });
      
      // Log governor action
      await this.logGovernorAction(
        governorId,
        governorName,
        'document_request',
        investorId,
        investorName,
        'investor',
        { documentType, description, priority, dueDate }
      );
      
      console.log('✅ Governor: Document request created successfully');
      return docRef.id;
    } catch (error) {
      console.error('❌ Governor Error: Failed to create document request:', error);
      throw error;
    }
  }

  // Shadow Ban System
  static async createShadowBan(
    investorId: string,
    investorName: string,
    banType: ShadowBan['banType'],
    reason: string,
    governorId: string,
    governorName: string,
    expiresAt?: Date
  ): Promise<string> {
    try {
      console.log(`🔥 Governor: Creating ${banType} shadow ban for ${investorName}`);
      
      const batch = writeBatch(db);
      
      // Create shadow ban document
      const banRef = doc(db, 'shadowBans', investorId);
      const banData: Omit<ShadowBan, 'id'> = {
        investorId,
        investorName,
        bannedBy: governorName,
        bannedAt: new Date(),
        banType,
        reason,
        isActive: true,
        expiresAt
      };
      
      batch.set(banRef, {
        ...banData,
        bannedAt: serverTimestamp(),
        expiresAt: expiresAt || null
      });
      
      // Update investor account with shadow ban flags
      const investorRef = doc(db, 'users', investorId);
      const shadowBanFlags: any = {
        shadowBanned: true,
        shadowBanType: banType,
        shadowBanReason: reason
      };
      
      if (banType === 'withdrawal_only' || banType === 'full_platform') {
        shadowBanFlags.withdrawalDisabled = true;
      }
      
      if (banType === 'full_platform') {
        shadowBanFlags.platformAccessDisabled = true;
      }
      
      batch.update(investorRef, {
        accountFlags: shadowBanFlags,
        updatedAt: serverTimestamp()
      });
      
      // Log governor action
      const actionRef = doc(collection(db, 'governorActions'));
      batch.set(actionRef, {
        governorId,
        governorName,
        actionType: 'shadow_ban',
        targetId: investorId,
        targetName: investorName,
        targetType: 'investor',
        details: { banType, reason, expiresAt },
        timestamp: serverTimestamp()
      });
      
      await batch.commit();
      console.log('✅ Governor: Shadow ban created successfully');
      return banRef.id;
    } catch (error) {
      console.error('❌ Governor Error: Failed to create shadow ban:', error);
      throw error;
    }
  }

  // Account Creation Approval
  static async approveAccountCreation(
    requestId: string,
    governorId: string,
    governorName: string,
    conditions?: string[]
  ): Promise<string> {
    try {
      console.log(`🔥 Governor: Approving account creation request ${requestId}`);
      
      // Get the request details
      const requestDoc = await getDoc(doc(db, 'accountCreationRequests', requestId));
      if (!requestDoc.exists()) {
        throw new Error('Account creation request not found');
      }
      
      const requestData = requestDoc.data() as AccountCreationRequest;
      
      // Create the investor account
      const investorId = doc(collection(db, 'users')).id; // Use Firebase auto-generated ID
      const investorData = {
        name: requestData.applicantName,
        email: requestData.applicantEmail,
        phone: requestData.applicantPhone || '',
        country: requestData.applicantCountry,
        location: requestData.applicantCity || '',
        role: 'investor',
        joinDate: new Date().toISOString().split('T')[0],
        initialDeposit: requestData.initialDeposit,
        currentBalance: requestData.initialDeposit,
        accountType: requestData.accountType,
        isActive: true,
        accountStatus: conditions && conditions.length > 0 ? 'Active - Conditional Approval' : 'Active',
        bankDetails: requestData.bankDetails || {},
        uploadedDocuments: [],
        accountFlags: {
          governorApproved: true,
          approvalConditions: conditions || [],
          approvedBy: governorName,
          approvedAt: new Date()
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Handle uploaded documents if they exist
      if (requestData.identityDocument) {
        investorData.uploadedDocuments.push({
          id: `identity_${Date.now()}`,
          name: requestData.identityDocument.fileName,
          type: requestData.identityDocument.fileType,
          size: requestData.identityDocument.fileSize,
          url: requestData.identityDocument.base64Data,
          uploadedAt: requestData.identityDocument.uploadedAt,
          documentType: 'identity'
        });
      }
      
      if (requestData.proofOfDeposit) {
        investorData.uploadedDocuments.push({
          id: `deposit_${Date.now()}`,
          name: requestData.proofOfDeposit.fileName,
          type: requestData.proofOfDeposit.fileType,
          size: requestData.proofOfDeposit.fileSize,
          url: requestData.proofOfDeposit.base64Data,
          uploadedAt: requestData.proofOfDeposit.uploadedAt,
          documentType: 'proof_of_deposit'
        });
      }
      
      const batch = writeBatch(db);
      
      // Create investor document
      const investorRef = doc(db, 'users', investorId);
      batch.set(investorRef, {
        ...investorData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        accountFlags: {
          ...investorData.accountFlags,
          approvedAt: serverTimestamp()
        }
      });

      // Add initial deposit transaction
      const transactionRef = doc(collection(db, 'transactions'));
      batch.set(transactionRef, {
        investorId: investorId,
        type: 'Deposit',
        amount: requestData.initialDeposit,
        date: new Date().toISOString().split('T')[0],
        status: 'Completed',
        description: 'Initial deposit from onboarding',
        processedBy: governorId,
        createdAt: serverTimestamp()
      });
      
      // Update request status
      const requestRef = doc(db, 'accountCreationRequests', requestId);
      batch.update(requestRef, {
        status: 'approved',
        reviewedBy: governorName,
        reviewedAt: serverTimestamp(),
        approvalConditions: conditions || []
      });
      
      // Log governor action
      const actionRef = doc(collection(db, 'governorActions'));
      batch.set(actionRef, {
        governorId,
        governorName,
        actionType: 'account_creation_approval',
        targetId: requestId,
        targetName: requestData.applicantName,
        targetType: 'account_application',
        details: { 
          newInvestorId: investorId,
          initialDeposit: requestData.initialDeposit,
          accountType: requestData.accountType,
          conditions 
        },
        timestamp: serverTimestamp()
      });
      
      await batch.commit();
      console.log('✅ Governor: Account creation approved successfully');
      return investorId;
    } catch (error) {
      console.error('❌ Governor Error: Failed to approve account creation:', error);
      throw error;
    }
  }

  // Withdrawal Override System
  static async overrideWithdrawalDecision(
    withdrawalId: string,
    newStatus: 'Approved' | 'Rejected' | 'Credited' | 'Refunded',
    reason: string,
    governorId: string,
    governorName: string,
    requestDocuments?: string[]
  ): Promise<void> {
    try {
      console.log(`🔥 Governor: Overriding withdrawal ${withdrawalId} to ${newStatus}`);
      
      const batch = writeBatch(db);
      
      // Update withdrawal request
      const withdrawalRef = doc(db, 'withdrawalRequests', withdrawalId);
      const updateData: any = {
        status: newStatus,
        governorOverride: true,
        governorComment: reason,
        overriddenBy: governorName,
        overriddenAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      if (requestDocuments && requestDocuments.length > 0) {
        updateData.requiredDocuments = requestDocuments;
        updateData.documentRequestedAt = serverTimestamp();
      }
      
      batch.update(withdrawalRef, updateData);
      
      // If refunding, credit the investor
      if (newStatus === 'Refunded') {
        const withdrawalDoc = await getDoc(withdrawalRef);
        if (withdrawalDoc.exists()) {
          const withdrawalData = withdrawalDoc.data();
          const investor = await FirestoreService.getInvestorById(withdrawalData.investorId);
          
          if (investor) {
            const newBalance = investor.currentBalance + withdrawalData.amount;
            const investorRef = doc(db, 'users', withdrawalData.investorId);
            batch.update(investorRef, {
              currentBalance: newBalance,
              updatedAt: serverTimestamp()
            });
            
            // Add refund transaction
            const transactionRef = doc(collection(db, 'transactions'));
            batch.set(transactionRef, {
              investorId: withdrawalData.investorId,
              type: 'Credit',
              amount: withdrawalData.amount,
              date: new Date().toISOString().split('T')[0],
              status: 'Completed',
              description: `Governor refund: ${reason}`,
              processedBy: governorId,
              createdAt: serverTimestamp()
            });
          }
        }
      }
      
      // Log governor action
      const actionRef = doc(collection(db, 'governorActions'));
      batch.set(actionRef, {
        governorId,
        governorName,
        actionType: 'withdrawal_override',
        targetId: withdrawalId,
        targetName: 'Withdrawal Request',
        targetType: 'withdrawal_request',
        details: { newStatus, reason, requestDocuments },
        timestamp: serverTimestamp()
      });
      
      await batch.commit();
      console.log('✅ Governor: Withdrawal override completed successfully');
    } catch (error) {
      console.error('❌ Governor Error: Failed to override withdrawal:', error);
      throw error;
    }
  }

  // Crypto withdrawal specific methods
  static async sendCryptoToBlockchain(
    withdrawalId: string,
    governorId: string,
    governorName: string
  ): Promise<void> {
    try {
      console.log(`🔥 Governor: Sending crypto withdrawal ${withdrawalId} to blockchain`);
      
      // Generate transaction hash and update status to 'Sent'
      await FirestoreService.generateCryptoTransactionHash(withdrawalId);
      
      // Update withdrawal status to 'Sent'
      await updateDoc(doc(db, 'withdrawalRequests', withdrawalId), {
        status: 'Sent',
        sentToBlockchainAt: serverTimestamp(),
        sentToBlockchainBy: governorName,
        updatedAt: serverTimestamp()
      });
      
      // Log governor action
      await this.logGovernorAction(
        governorId,
        governorName,
        'crypto_sent_to_blockchain',
        withdrawalId,
        'Crypto Withdrawal',
        'withdrawal_request',
        { action: 'sent_to_blockchain' }
      );
      
      console.log('✅ Governor: Crypto withdrawal sent to blockchain successfully');
    } catch (error) {
      console.error('❌ Governor Error: Failed to send crypto to blockchain:', error);
      throw error;
    }
  }

  static async confirmCryptoTransferCompleted(
    withdrawalId: string,
    governorId: string,
    governorName: string
  ): Promise<void> {
    try {
      console.log(`🔥 Governor: Confirming crypto transfer completion for ${withdrawalId}`);
      
      // Update withdrawal status to 'Credited'
      await updateDoc(doc(db, 'withdrawalRequests', withdrawalId), {
        status: 'Credited',
        creditedAt: serverTimestamp(),
        creditedBy: governorName,
        updatedAt: serverTimestamp()
      });
      
      // Log governor action
      await this.logGovernorAction(
        governorId,
        governorName,
        'crypto_transfer_confirmed',
        withdrawalId,
        'Crypto Withdrawal',
        'withdrawal_request',
        { action: 'transfer_confirmed' }
      );
      
      console.log('✅ Governor: Crypto transfer completion confirmed successfully');
    } catch (error) {
      console.error('❌ Governor Error: Failed to confirm crypto transfer completion:', error);
      throw error;
    }
  }
  // MT103 Document Generation
  static async generateMT103(
    withdrawalId: string,
    governorId: string,
    governorName: string
  ): Promise<MT103Document> {
    try {
      console.log(`🔥 Governor: Generating MT103 for withdrawal ${withdrawalId}`);
      
      // Get withdrawal and investor details
      const withdrawalDoc = await getDoc(doc(db, 'withdrawalRequests', withdrawalId));
      if (!withdrawalDoc.exists()) {
        throw new Error('Withdrawal request not found');
      }
      
      const withdrawalData = withdrawalDoc.data();
      const investor = await FirestoreService.getInvestorById(withdrawalData.investorId);
      
      if (!investor) {
        throw new Error('Investor not found');
      }
      
      // Get bank details
      const bankDetails = investor.bankDetails || investor.bankAccounts?.[0];
      if (!bankDetails) {
        throw new Error('Bank details not found for investor');
      }
      
      // Generate MT103 document
      const mt103Data: Omit<MT103Document, 'id'> = {
        withdrawalId,
        investorId: investor.id,
        investorName: investor.name,
        amount: withdrawalData.amount,
        currency: 'USD',
        bankDetails: {
          bankName: bankDetails.bankName || '',
          swiftCode: bankDetails.swiftCode || '',
          accountNumber: bankDetails.accountNumber || '',
          accountHolder: bankDetails.accountHolderName || investor.name,
          bankAddress: bankDetails.bankAddress || investor.country
        },
        transactionReference: `MT103${Date.now()}${withdrawalId.slice(-6)}`,
        valueDate: new Date().toISOString().split('T')[0],
        generatedBy: governorName,
        generatedAt: new Date(),
        status: 'generated'
      };
      
      const docRef = await addDoc(collection(db, 'mt103Documents'), {
        ...mt103Data,
        generatedAt: serverTimestamp()
      });
      
      // Log governor action
      await this.logGovernorAction(
        governorId,
        governorName,
        'document_generation',
        withdrawalId,
        'MT103 Document',
        'document',
        { documentType: 'MT103', transactionReference: mt103Data.transactionReference }
      );
      
      console.log('✅ Governor: MT103 document generated successfully');
      return { id: docRef.id, ...mt103Data };
    } catch (error) {
      console.error('❌ Governor Error: Failed to generate MT103:', error);
      throw error;
    }
  }

  // Get all account flags
  static async getAccountFlags(): Promise<AccountFlag[]> {
    try {
      const flagsQuery = query(
        collection(db, 'accountFlags'),
        orderBy('flaggedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(flagsQuery);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        flaggedAt: doc.data().flaggedAt?.toDate() || new Date(),
        resolvedAt: doc.data().resolvedAt?.toDate() || null
      })) as AccountFlag[];
    } catch (error) {
      console.error('❌ Error fetching account flags:', error);
      throw error;
    }
  }

  // Resolve account flag
  static async resolveAccountFlag(
    flagId: string,
    resolutionNotes: string,
    governorId: string,
    governorName: string
  ): Promise<void> {
    try {
      console.log(`🔥 Governor: Resolving account flag ${flagId}`);
      
      const batch = writeBatch(db);
      
      // Get the flag to update investor account
      const flagDoc = await getDoc(doc(db, 'accountFlags', flagId));
      if (!flagDoc.exists()) {
        throw new Error('Account flag not found');
      }
      
      const flagData = flagDoc.data() as AccountFlag;
      
      // Update flag status
      const flagRef = doc(db, 'accountFlags', flagId);
      batch.update(flagRef, {
        status: 'resolved',
        resolutionNotes,
        resolvedBy: governorName,
        resolvedAt: serverTimestamp()
      });
      
      // Remove restrictions from investor account
      const investorRef = doc(db, 'users', flagData.investorId);
      const updateData: any = {
        updatedAt: serverTimestamp()
      };
      
      // Remove flag-specific restrictions
      if (flagData.autoRestrictions.accountSuspended) {
        updateData.accountStatus = 'Active';
        updateData.isActive = true;
      } else if (flagData.autoRestrictions.withdrawalDisabled) {
        updateData.accountStatus = 'Active';
      }
      
      // Clear account flags
      updateData.accountFlags = {
        [`${flagData.flagType}Flag`]: false,
        withdrawalDisabled: false,
        requiresApproval: false,
        flagResolved: true,
        resolvedAt: serverTimestamp(),
        resolvedBy: governorName
      };
      
      batch.update(investorRef, updateData);
      
      // Log governor action
      const actionRef = doc(collection(db, 'governorActions'));
      batch.set(actionRef, {
        governorId,
        governorName,
        actionType: 'flag_resolution',
        targetId: flagData.investorId,
        targetName: flagData.investorName,
        targetType: 'investor',
        details: { flagType: flagData.flagType, resolutionNotes },
        timestamp: serverTimestamp()
      });
      
      await batch.commit();
      console.log('✅ Governor: Account flag resolved successfully');
    } catch (error) {
      console.error('❌ Governor Error: Failed to resolve account flag:', error);
      throw error;
    }
  }
  // Get document requests
  static async getDocumentRequests(investorId?: string): Promise<DocumentRequest[]> {
    try {
      let requestsQuery;
      if (investorId) {
        requestsQuery = query(
          collection(db, 'documentRequests'),
          where('investorId', '==', investorId),
          orderBy('requestedAt', 'desc')
        );
      } else {
        requestsQuery = query(
          collection(db, 'documentRequests'),
          orderBy('requestedAt', 'desc')
        );
      }
      
      const querySnapshot = await getDocs(requestsQuery);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        requestedAt: doc.data().requestedAt?.toDate() || new Date(),
        submittedAt: doc.data().submittedAt?.toDate() || null,
        reviewedAt: doc.data().reviewedAt?.toDate() || null,
        dueDate: doc.data().dueDate?.toDate() || null
      })) as DocumentRequest[];
    } catch (error) {
      console.error('❌ Error fetching document requests:', error);
      throw error;
    }
  }

  // Check if investor has shadow ban
  static async getShadowBan(investorId: string): Promise<ShadowBan | null> {
    try {
      const banDoc = await getDoc(doc(db, 'shadowBans', investorId));
      
      if (banDoc.exists() && banDoc.data().isActive) {
        const data = banDoc.data();
        return {
          id: banDoc.id,
          ...data,
          bannedAt: data.bannedAt?.toDate() || new Date(),
          expiresAt: data.expiresAt?.toDate() || null,
          removedAt: data.removedAt?.toDate() || null
        } as ShadowBan;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error fetching shadow ban:', error);
      return null;
    }
  }

  // Real-time listener for shadow bans
  static subscribeToShadowBan(
    investorId: string,
    callback: (shadowBan: ShadowBan | null) => void
  ): () => void {
    const banRef = doc(db, 'shadowBans', investorId);
    
    return onSnapshot(banRef, (docSnapshot) => {
      if (docSnapshot.exists() && docSnapshot.data().isActive) {
        const data = docSnapshot.data();
        callback({
          id: docSnapshot.id,
          ...data,
          bannedAt: data.bannedAt?.toDate() || new Date(),
          expiresAt: data.expiresAt?.toDate() || null,
          removedAt: data.removedAt?.toDate() || null
        } as ShadowBan);
      } else {
        callback(null);
      }
    });
  }

  // Log governor actions
  static async logGovernorAction(
    governorId: string,
    governorName: string,
    actionType: GovernorAction['actionType'],
    targetId: string,
    targetName: string,
    targetType: GovernorAction['targetType'],
    details: Record<string, any>
  ): Promise<void> {
    try {
      await addDoc(collection(db, 'governorActions'), {
        governorId,
        governorName,
        actionType,
        targetId,
        targetName,
        targetType,
        details,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('❌ Error logging governor action:', error);
    }
  }

  // Get governor actions (audit trail)
  static async getGovernorActions(limit: number = 100): Promise<GovernorAction[]> {
    try {
      const actionsQuery = query(
        collection(db, 'governorActions'),
        orderBy('timestamp', 'desc'),
        ...(limit > 0 ? [limit] : [])
      );
      
      const querySnapshot = await getDocs(actionsQuery);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      })) as GovernorAction[];
    } catch (error) {
      console.error('❌ Error fetching governor actions:', error);
      throw error;
    }
  }

  // Crypto Wallet Verification Requests
  static async getPendingCryptoWalletVerificationRequests(): Promise<CryptoWalletVerificationRequest[]> {
    try {
      console.log('🔥 Governor: Fetching pending crypto wallet verification requests...');
      const requestsQuery = query(
        collection(db, 'cryptoWalletVerificationRequests'),
        where('status', '==', 'pending'),
        orderBy('requestedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(requestsQuery);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        requestedAt: doc.data().requestedAt?.toDate() || new Date(),
        reviewedAt: doc.data().reviewedAt?.toDate() || null
      })) as CryptoWalletVerificationRequest[];
    } catch (error) {
      console.error('❌ Governor Error: Failed to fetch pending crypto wallet verification requests:', error);
      throw error;
    }
  }

  static async approveCryptoWalletVerification(
    requestId: string,
    governorId: string,
    governorName: string,
    reviewComment?: string
  ): Promise<void> {
    try {
      console.log(`🔥 Governor: Approving crypto wallet verification request ${requestId}`);
      const requestRef = doc(db, 'cryptoWalletVerificationRequests', requestId);
      const requestDoc = await getDoc(requestRef);

      if (!requestDoc.exists()) {
        throw new Error('Crypto wallet verification request not found');
      }
      const requestData = requestDoc.data() as CryptoWalletVerificationRequest;
      const investorRef = doc(db, 'users', requestData.investorId);

      const batch = writeBatch(db);

      // Update the verification request status
      batch.update(requestRef, {
        status: 'approved',
        reviewedBy: governorName,
        reviewedAt: serverTimestamp(),
        reviewComment: reviewComment || null
      });

      // Update the investor's cryptoWallets array
      const investorDoc = await getDoc(investorRef);
      if (investorDoc.exists()) {
        const investorData = investorDoc.data();
        let updatedCryptoWallets = investorData.cryptoWallets || [];

        if (requestData.requestType === 'add' || requestData.requestType === 'update') {
          const walletIndex = updatedCryptoWallets.findIndex((w: any) => w.id === requestData.newWalletData.id);
          if (walletIndex > -1) {
            // Update existing wallet (which was already added with pending status)
            updatedCryptoWallets[walletIndex] = { ...requestData.newWalletData, verificationStatus: 'approved' };
          } else if (requestData.requestType === 'add') {
            // This case should ideally not happen if addCryptoWallet already added it
            updatedCryptoWallets.push({ ...requestData.newWalletData, verificationStatus: 'approved' });
          }
        } else if (requestData.requestType === 'delete') {
          // Remove the wallet from the array
          updatedCryptoWallets = updatedCryptoWallets.filter((w: any) => w.id !== requestData.walletId);
        }

        batch.update(investorRef, {
          cryptoWallets: updatedCryptoWallets,
          updatedAt: serverTimestamp()
        });
      }

      // Log governor action
      const actionRef = doc(collection(db, 'governorActions'));
      batch.set(actionRef, {
        governorId,
        governorName,
        actionType: 'crypto_wallet_verification_approval',
        targetId: requestData.investorId,
        targetName: requestData.investorName,
        targetType: 'investor',
        details: { requestType: requestData.requestType, walletAddress: requestData.newWalletData.walletAddress, reviewComment },
        timestamp: serverTimestamp()
      });

      await batch.commit();
      console.log('✅ Governor: Crypto wallet verification approved successfully');
    } catch (error) {
      console.error('❌ Governor Error: Failed to approve crypto wallet verification:', error);
      throw error;
    }
  }

  static async rejectCryptoWalletVerification(
    requestId: string,
    governorId: string,
    governorName: string,
    rejectionReason: string
  ): Promise<void> {
    try {
      console.log(`🔥 Governor: Rejecting crypto wallet verification request ${requestId}`);
      const requestRef = doc(db, 'cryptoWalletVerificationRequests', requestId);
      const requestDoc = await getDoc(requestRef);

      if (!requestDoc.exists()) {
        throw new Error('Crypto wallet verification request not found');
      }
      const requestData = requestDoc.data() as CryptoWalletVerificationRequest;
      const investorRef = doc(db, 'users', requestData.investorId);

      const batch = writeBatch(db);

      // Update the verification request status
      batch.update(requestRef, {
        status: 'rejected',
        reviewedBy: governorName,
        reviewedAt: serverTimestamp(),
        rejectionReason
      });

      // If it was an add or update request, revert the wallet status to rejected or remove it if it was an add
      const investorDoc = await getDoc(investorRef);
      if (investorDoc.exists()) {
        const investorData = investorDoc.data();
        let updatedCryptoWallets = investorData.cryptoWallets || [];

        if (requestData.requestType === 'add' || requestData.requestType === 'update') {
          updatedCryptoWallets = updatedCryptoWallets.map((w: any) =>
            w.id === requestData.newWalletData.id ? { ...w, verificationStatus: 'rejected', rejectionReason } : w
          );
        } else if (requestData.requestType === 'delete') {
          // If deletion was rejected, set status back to approved or previous status
          updatedCryptoWallets = updatedCryptoWallets.map((w: any) =>
            w.id === requestData.walletId ? { ...w, verificationStatus: 'approved' } : w // Assuming it was approved before deletion request
          );
        }
        batch.update(investorRef, {
          cryptoWallets: updatedCryptoWallets,
          updatedAt: serverTimestamp()
        });
      }

      // Log governor action
      const actionRef = doc(collection(db, 'governorActions'));
      batch.set(actionRef, {
        governorId,
        governorName,
        actionType: 'crypto_wallet_verification_rejection',
        targetId: requestData.investorId,
        targetName: requestData.investorName,
        targetType: 'investor',
        details: { requestType: requestData.requestType, walletAddress: requestData.newWalletData.walletAddress, rejectionReason },
        timestamp: serverTimestamp()
      });

      await batch.commit();
      console.log('✅ Governor: Crypto wallet verification rejected successfully');
    } catch (error) {
      console.error('❌ Governor Error: Failed to reject crypto wallet verification:', error);
      throw error;
    }
  }

  static async approveCryptoWithdrawal(
    withdrawalId: string,
    governorId: string,
    governorName: string,
    reviewComment?: string
  ): Promise<void> {
    try {
      console.log(`🔥 Governor: Approving crypto withdrawal ${withdrawalId}`);
      const withdrawalRef = doc(db, 'withdrawalRequests', withdrawalId);

      await updateDoc(withdrawalRef, {
        status: 'Approved',
        processedBy: governorName,
        processedAt: serverTimestamp(),
        approvalDate: serverTimestamp(),
        governorComment: reviewComment || 'Approved by Governor',
        updatedAt: serverTimestamp()
      });


      // Log governor action
      await this.logGovernorAction(
        governorId,
        governorName,
        'withdrawal_override',
        withdrawalId,
        'Crypto Withdrawal Request',
        'withdrawal_request',
        { reviewComment }
      );

      console.log('✅ Governor: Crypto withdrawal approved successfully');
    } catch (error) {
      console.error('❌ Governor Error: Failed to approve crypto withdrawal:', error);
      throw error;
    }
  }

  static async rejectCryptoWithdrawal(
    withdrawalId: string,
    governorId: string,
    governorName: string,
    rejectionReason: string
  ): Promise<void> {
    try {
      console.log(`🔥 Governor: Rejecting crypto withdrawal ${withdrawalId}`);
      const withdrawalRef = doc(db, 'withdrawalRequests', withdrawalId);

      await updateDoc(withdrawalRef, {
        status: 'Rejected',
        processedBy: governorName,
        processedAt: serverTimestamp(),
        rejectionReason,
        governorComment: `Rejected by Governor: ${rejectionReason}`,
        updatedAt: serverTimestamp()
      });

      // Log governor action
      await this.logGovernorAction(
        governorId,
        governorName,
        'crypto_withdrawal_rejection',
        withdrawalId,
        'Crypto Withdrawal Request',
        'withdrawal_request',
        { rejectionReason }
      );

      console.log('✅ Governor: Crypto withdrawal rejected successfully');
    } catch (error) {
      console.error('❌ Governor Error: Failed to reject crypto withdrawal:', error);
      throw error;
    }
  }
}