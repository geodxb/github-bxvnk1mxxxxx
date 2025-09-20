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
  writeBatch,
  arrayUnion
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ConversationMetadata, EnhancedMessage, ConversationParticipant, ConversationAuditEntry } from '../types/conversation';
import { NotificationService } from './notificationService';

export class EnhancedMessageService {
  // Create a new conversation with proper role-based setup
  static async createConversation(
    initiatorId: string,
    initiatorName: string,
    initiatorRole: 'governor' | 'admin' | 'affiliate',
    targetId: string,
    targetName: string,
    targetRole: 'governor' | 'admin' | 'affiliate',
    department?: string,
    initialMessage?: string
  ): Promise<string> {
    try {
      console.log('📨 Creating enhanced conversation:', {
        initiator: `${initiatorName} (${initiatorRole})`,
        target: `${targetName} (${targetRole})`,
        department
      });

      // Determine conversation type and title
      const conversationType = this.getConversationType(initiatorRole, targetRole);
      const conversationTitle = this.getConversationTitle(
        initiatorRole, 
        targetRole, 
        initiatorName, 
        targetName, 
        department
      );

      // Create participants
      const participants: ConversationParticipant[] = [
        {
          id: initiatorId,
          name: initiatorName,
          role: initiatorRole,
          joinedAt: new Date()
        },
        {
          id: targetId,
          name: targetName,
          role: targetRole,
          joinedAt: new Date()
        }
      ];

      // Create conversation metadata
      const conversationData: Omit<ConversationMetadata, 'id'> = {
        type: conversationType,
        title: conversationTitle,
        participants: participants,
        participantNames: participants.map(p => p.name),
        participantRoles: participants.map(p => p.role),
        createdBy: initiatorId,
        createdAt: new Date(),
        lastActivity: new Date(),
        lastMessage: initialMessage || '',
        lastMessageSender: initiatorName,
        isEscalated: false,
        status: 'active',
        priority: 'medium',
        tags: department ? [department] : [],
        department,
        auditTrail: [{
          id: `audit_${Date.now()}`,
          action: 'created',
          performedBy: initiatorId,
          performedByName: initiatorName,
          performedByRole: initiatorRole,
          timestamp: new Date(),
          details: { conversationType, department, targetRole }
        }]
      };

      const docRef = await addDoc(collection(db, 'conversations'), {
        ...conversationData,
        createdAt: serverTimestamp(),
        lastActivity: serverTimestamp()
      });

      console.log('✅ Enhanced conversation created:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creating enhanced conversation:', error);
      throw new Error(`Failed to create conversation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Send enhanced message with proper routing
  static async sendEnhancedMessage(
    conversationId: string,
    senderId: string,
    senderName: string,
    senderRole: 'governor' | 'admin' | 'affiliate',
    content: string,
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium',
    department?: string,
    replyTo?: string,
    isEscalation: boolean = false,
    escalationReason?: string,
    messageType: 'text' | 'system' | 'escalation' | 'resolution' = 'text',
    attachments?: string[]
  ): Promise<string> {
    try {
      console.log('📨 Sending enhanced message:', {
        sender: `${senderName} (${senderRole})`,
        conversationId,
        isEscalation,
        department
      });

      const messageData: Omit<EnhancedMessage, 'id'> = {
        conversationId,
        senderId,
        senderName,
        senderRole,
        content,
        timestamp: new Date(),
        replyTo: replyTo || null,
        priority,
        status: 'sent',
        department: department || null,
        isEscalation,
        escalationReason: escalationReason || null,
        readBy: [],
        messageType: isEscalation ? 'escalation' : messageType,
        attachments: attachments || [],
      };

      const docRef = await addDoc(collection(db, 'affiliateMessages'), {
        ...messageData,
        timestamp: serverTimestamp()
      });

      console.log('✅ Enhanced message document created:', docRef.id);
      // Update conversation metadata
      await this.updateConversationActivity(conversationId, content, senderName, isEscalation);

      // Create notifications for all participants except sender
      await this.createMessageNotifications(conversationId, senderId, senderName, senderRole, content, department);

      console.log('✅ Enhanced message sent:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error sending enhanced message:', error);
      throw new Error(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Escalate conversation to governor
  static async escalateConversation(
    conversationId: string,
    escalatedBy: string,
    escalatedByName: string,
    escalatedByRole: 'admin' | 'affiliate',
    reason: string,
    governorId?: string
  ): Promise<void> {
    try {
      console.log('🚨 Escalating conversation to governor:', conversationId);

      // Get conversation data
      const conversationDoc = await getDoc(doc(db, 'conversations', conversationId));
      if (!conversationDoc.exists()) {
        throw new Error('Conversation not found');
      }

      const conversationData = conversationDoc.data() as ConversationMetadata;

      // Find or add governor to conversation
      let targetGovernorId = governorId;
      if (!targetGovernorId) {
        // Find Sam Hivanek or any governor
        const governorQuery = query(
          collection(db, 'users'),
          where('role', '==', 'governor')
        );
        const governorSnapshot = await getDocs(governorQuery);
        
        if (!governorSnapshot.empty) {
          // Prefer Sam Hivanek if available
          const samDoc = governorSnapshot.docs.find(doc => 
            doc.data().email === 'sam@interactivebrokers.us'
          );
          targetGovernorId = samDoc ? samDoc.id : governorSnapshot.docs[0].id;
        } else {
          throw new Error('No governor found for escalation');
        }
      }

      // Get governor details
      const governorDoc = await getDoc(doc(db, 'users', targetGovernorId));
      if (!governorDoc.exists()) {
        throw new Error('Governor not found');
      }

      const governorData = governorDoc.data();

      // Add governor as participant if not already present
      const isGovernorParticipant = conversationData.participants.some(p => p.id === targetGovernorId);
      let updatedParticipants = conversationData.participants;

      if (!isGovernorParticipant) {
        updatedParticipants = [
          ...conversationData.participants,
          {
            id: targetGovernorId,
            name: governorData.name,
            role: 'governor',
            email: governorData.email,
            joinedAt: new Date()
          }
        ];
      }

      // Create audit entry
      const auditEntry: ConversationAuditEntry = {
        id: `audit_${Date.now()}`,
        action: 'escalated',
        performedBy: escalatedBy,
        performedByName: escalatedByName,
        performedByRole: escalatedByRole,
        timestamp: new Date(),
        details: { reason, governorId: targetGovernorId, governorName: governorData.name }
      };

      // Update conversation
      await updateDoc(doc(db, 'conversations', conversationId), {
        participants: updatedParticipants,
        isEscalated: true,
        escalatedAt: serverTimestamp(),
        escalatedBy: escalatedBy,
        escalationReason: reason,
        status: 'escalated',
        priority: 'urgent',
        title: `${conversationData.title} - ESCALATED TO MANAGEMENT`,
        auditTrail: arrayUnion({
          ...auditEntry,
          timestamp: serverTimestamp()
        }),
        lastActivity: serverTimestamp()
      });

      // Send escalation message
      await this.sendEnhancedMessage(
        conversationId,
        escalatedBy,
        escalatedByName,
        escalatedByRole,
        `🚨 CONVERSATION ESCALATED TO MANAGEMENT\n\nReason: ${reason}\n\nThis conversation has been escalated and requires management attention.`,
        'urgent',
        undefined,
        undefined,
        true,
        reason
      );

      // Create notification for governor
      await NotificationService.createNotification(
        'message',
        'Conversation Escalated to Management',
        `${escalatedByName} escalated a conversation: ${reason}`,
        targetGovernorId,
        'governor',
        'urgent',
        {
          conversationId,
          escalatedBy,
          escalatedByName,
          reason
        },
        '/governor/messages'
      );

      console.log('✅ Conversation escalated successfully');
    } catch (error) {
      console.error('❌ Error escalating conversation:', error);
      throw new Error(`Failed to escalate conversation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get or create conversation with enhanced logic
  static async getOrCreateEnhancedConversation(
    userId: string,
    userName: string,
    userRole: 'governor' | 'admin' | 'affiliate',
    targetId?: string,
    targetName?: string,
    targetRole?: 'governor' | 'admin' | 'affiliate',
    department?: string
  ): Promise<string> {
    try {
      console.log('🔍 Finding or creating enhanced conversation:', {
        user: `${userName} (${userRole})`,
        target: targetId ? `${targetName} (${targetRole})` : 'Auto-select',
        department
      });

      // If specific target provided, look for existing conversation
      if (targetId && targetRole) {
        console.log('🔍 Looking for existing conversation between:', userId, 'and', targetId);
        
        // First check enhanced conversations with department matching
        const enhancedQuery = query(collection(db, 'conversations'));
        const enhancedSnapshot = await getDocs(enhancedQuery);
        const existingEnhancedConversation = enhancedSnapshot.docs.find(doc => {
          const data = doc.data() as ConversationMetadata;
          const hasUser = data.participants.some(p => p.id === userId);
          const hasTarget = data.participants.some(p => p.id === targetId);
          const hasSameDepartment = data.department === department;
          console.log('🔍 Checking enhanced conversation:', doc.id, 'hasUser:', hasUser, 'hasTarget:', hasTarget, 'department:', data.department, 'targetDepartment:', department, 'match:', hasSameDepartment);
          return hasUser && hasTarget && hasSameDepartment;
        });

        if (existingEnhancedConversation) {
          console.log('✅ Found existing enhanced conversation with same department:', existingEnhancedConversation.id);
          return existingEnhancedConversation.id;
        }
        
        // Check regular conversations collection (only if no department specified)
        if (!department) {
        const regularQuery = query(
          collection(db, 'conversations'),
          where('participants', 'array-contains', userId)
        );
        
        const regularSnapshot = await getDocs(regularQuery);
        const existingRegularConversation = regularSnapshot.docs.find(doc => {
          const data = doc.data();
          const participants = data.participants || [];
          const hasTarget = participants.includes(targetId);
          console.log('🔍 Checking regular conversation:', doc.id, 'participants:', participants, 'hasTarget:', hasTarget);
          return hasTarget;
        });
        
        if (existingRegularConversation) {
          console.log('✅ Found existing regular conversation:', existingRegularConversation.id);
          return existingRegularConversation.id;
        }
        }

        // Create new conversation with specific target
        return await this.createConversation(
          userId, userName, userRole,
          targetId, targetName || 'User', targetRole,
          department
        );
      }

      // Auto-select target based on role
      let autoTargetId = '';
      let autoTargetName = '';
      let autoTargetRole: 'governor' | 'admin' | 'affiliate' = 'admin';

      if (userRole === 'affiliate') {
        // Affiliate -> Admin
        const adminQuery = query(
          collection(db, 'users'),
          where('role', '==', 'admin')
        );
        const adminSnapshot = await getDocs(adminQuery);
        
        if (!adminSnapshot.empty) {
          const adminDoc = adminSnapshot.docs[0];
          autoTargetId = adminDoc.id;
          autoTargetName = adminDoc.data().name;
          autoTargetRole = 'admin';
        }
      } else if (userRole === 'admin') {
        // Admin -> Governor (Sam Hivanek preferred)
        const governorQuery = query(
          collection(db, 'users'),
          where('role', '==', 'governor')
        );
        const governorSnapshot = await getDocs(governorQuery);
        
        if (!governorSnapshot.empty) {
          // Prefer Sam Hivanek
          const samDoc = governorSnapshot.docs.find(doc => 
            doc.data().email === 'sam@interactivebrokers.us'
          );
          const selectedDoc = samDoc || governorSnapshot.docs[0];
          
          autoTargetId = selectedDoc.id;
          autoTargetName = selectedDoc.data().name;
          autoTargetRole = 'governor';
        }
      }

      if (!autoTargetId) {
        throw new Error('No suitable conversation target found');
      }

      return await this.createConversation(
        userId, userName, userRole,
        autoTargetId, autoTargetName, autoTargetRole,
        department
      );
    } catch (error) {
      console.error('❌ Error getting/creating enhanced conversation:', error);
      throw error;
    }
  }

  // Get conversation title based on roles
  static getConversationTitle(
    initiatorRole: string,
    targetRole: string,
    initiatorName: string,
    targetName: string,
    department?: string
  ): string {
    const departmentPrefix = department ? `${department} - ` : '';

    if (initiatorRole === 'admin' && targetRole === 'governor') {
      return `${departmentPrefix}Communication with Management`;
    }
    if (initiatorRole === 'governor' && targetRole === 'admin') {
      return `${departmentPrefix}Communication with Team`;
    }
    if (initiatorRole === 'admin' && targetRole === 'affiliate') {
      return `${departmentPrefix}Communication with Affiliate`;
    }
    if (initiatorRole === 'affiliate' && targetRole === 'admin') {
      return `${departmentPrefix}Communication with Admin`;
    }
    if (initiatorRole === 'affiliate' && targetRole === 'governor') {
      return `${departmentPrefix}Communication with Management`;
    }
    if (initiatorRole === 'governor' && targetRole === 'affiliate') {
      return `${departmentPrefix}Communication with Affiliate`;
    }

    return `${departmentPrefix}Communication`;
  }

  // Get conversation type
  static getConversationType(
    initiatorRole: string,
    targetRole: string
  ): 'admin_affiliate' | 'admin_governor' | 'affiliate_governor' | 'group' {
    if ((initiatorRole === 'admin' && targetRole === 'affiliate') || 
        (initiatorRole === 'affiliate' && targetRole === 'admin')) {
      return 'admin_affiliate';
    }
    if ((initiatorRole === 'admin' && targetRole === 'governor') || 
        (initiatorRole === 'governor' && targetRole === 'admin')) {
      return 'admin_governor';
    }
    if ((initiatorRole === 'affiliate' && targetRole === 'governor') || 
        (initiatorRole === 'governor' && targetRole === 'affiliate')) {
      return 'affiliate_governor';
    }
    return 'group';
  }

  // Update conversation activity
  static async updateConversationActivity(
    conversationId: string,
    lastMessage: string,
    senderName: string,
    isEscalation: boolean = false
  ): Promise<void> {
    try {
      // Check if conversation exists in enhanced collection first
      const enhancedConversationDoc = await getDoc(doc(db, 'conversations', conversationId));
      
      if (enhancedConversationDoc.exists()) {
        // Update enhanced conversation
        const updateData: any = {
          lastMessage: lastMessage.substring(0, 100),
          lastMessageSender: senderName,
          lastActivity: serverTimestamp()
        };

        if (isEscalation) {
          updateData.priority = 'urgent';
          updateData.status = 'escalated';
        }

        await updateDoc(doc(db, 'conversations', conversationId), updateData);
      } else {
        // Delegate to regular MessageService for regular conversations
        console.log('🔄 Delegating to regular MessageService for conversation:', conversationId);
        // This would be handled by the regular MessageService
      }
    } catch (error) {
      console.error('❌ Error updating conversation activity:', error);
    }
  }

  // Create notifications for message recipients
  static async createMessageNotifications(
    conversationId: string,
    senderId: string,
    senderName: string,
    senderRole: 'governor' | 'admin' | 'affiliate',
    content: string,
    department?: string
  ): Promise<void> {
    try {
      // Get conversation participants
      const conversationDoc = await getDoc(doc(db, 'conversations', conversationId));
      if (!conversationDoc.exists()) return;

      const conversationData = conversationDoc.data() as ConversationMetadata;
      
      // Send notifications to all participants except sender
      for (const participant of conversationData.participants) {
        if (participant.id && typeof participant.id === 'string' && participant.id !== senderId) {
          const title = department 
            ? `New ${department} Message from ${senderName}`
            : `New Message from ${senderName}`;

          await NotificationService.createNotification(
            'message',
            title,
            content.substring(0, 100),
            participant.id,
            participant.role,
            'medium',
            {
              conversationId,
              senderId,
              senderName,
              department: department || null
            },
            participant.role === 'governor' ? '/governor/messages' :
            participant.role === 'admin' ? '/admin/messages' : '/investor'
          );
        }
      }
    } catch (error) {
      console.error('❌ Error creating message notifications:', error);
    }
  }

  // Get enhanced conversations for user
  static async getEnhancedConversations(userId: string): Promise<ConversationMetadata[]> {
    try {
      console.log('💬 Fetching enhanced conversations for user:', userId);
      
      const conversationsQuery = query(
        collection(db, 'conversations'),
        orderBy('lastActivity', 'desc')
      );
      
      const conversationsSnapshot = await getDocs(conversationsQuery);
      
      const conversations = conversationsSnapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            lastActivity: data.lastActivity?.toDate() || new Date(),
            lastMessage: data.lastMessage || '',
            escalatedAt: data.escalatedAt?.toDate() || null,
            participants: data.participants?.map((p: any) => ({
              ...p,
              joinedAt: p.joinedAt?.toDate() || new Date(),
              lastSeen: p.lastSeen?.toDate() || null
            })) || [],
            auditTrail: data.auditTrail?.map((entry: any) => ({
              ...entry,
              timestamp: entry.timestamp?.toDate() || new Date()
            })) || []
          };
        })
        .filter(conv => 
          conv.participants.some((p: ConversationParticipant) => p.id === userId)
        ) as ConversationMetadata[];
      
      console.log(`✅ Retrieved ${conversations.length} enhanced conversations`);
      return conversations;
    } catch (error) {
      console.error('❌ Error fetching enhanced conversations:', error);
      throw new Error(`Failed to load conversations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get ALL conversations for governor oversight (including ones they're not participants in)
  static async getGovernorConversations(governorId: string): Promise<ConversationMetadata[]> {
    try {
      console.log('👑 Fetching ALL conversations for governor oversight:', governorId);
      
      const conversationsQuery = query(
        collection(db, 'conversations'),
        orderBy('lastActivity', 'desc')
      );
      
      const conversationsSnapshot = await getDocs(conversationsQuery);
      
      const allConversations = conversationsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          lastActivity: data.lastActivity?.toDate() || new Date(),
          lastMessage: data.lastMessage || '',
          escalatedAt: data.escalatedAt?.toDate() || null,
          participants: data.participants?.map((p: any) => ({
            ...p,
            joinedAt: p.joinedAt?.toDate() || new Date(),
            lastSeen: p.lastSeen?.toDate() || null
          })) || [],
          auditTrail: data.auditTrail?.map((entry: any) => ({
            ...entry,
            timestamp: entry.timestamp?.toDate() || new Date()
          })) || []
        };
      }) as ConversationMetadata[];
      
      console.log(`👑 Governor can see ${allConversations.length} total conversations`);
      return allConversations;
    } catch (error) {
      console.error('❌ Error fetching governor conversations:', error);
      throw new Error(`Failed to load conversations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  // Real-time listener for enhanced conversations
  static subscribeToEnhancedConversations(
    userId: string,
    callback: (conversations: ConversationMetadata[]) => void
  ): () => void {
    console.log('🔄 Setting up real-time listener for enhanced conversations for userId:', userId);
    
    // Query BOTH conversations and affiliateMessages collections to find all conversations
    const conversationsQuery = query(collection(db, 'conversations'));
    
    const unsubscribe = onSnapshot(
      conversationsQuery,
      (querySnapshot) => {
        console.log('🔄 RAW Firebase conversations snapshot:', querySnapshot.docs.length, 'documents found');
        
        // Log each raw document
        querySnapshot.docs.forEach((doc, index) => {
          const data = doc.data();
          console.log(`📄 Document ${index + 1}:`, {
            id: doc.id,
            title: data.title,
            participants: data.participants,
            participantNames: data.participantNames,
            lastMessage: data.lastMessage,
            lastActivity: data.lastActivity
          });
        });
        
        if (querySnapshot.docs.length === 0) {
          console.log('❌ NO CONVERSATIONS FOUND IN FIREBASE');
          callback([]);
          return;
        }
        
        const allConversations = querySnapshot.docs.map(doc => {
          const data = doc.data();
          
          console.log(`🔍 Processing conversation ${doc.id}:`, data);
          
          return {
            id: doc.id,
            type: data.type || 'admin_affiliate',
            title: data.title || 'Conversation',
            description: data.description,
            participants: data.participants || [],
            participantNames: data.participantNames || [],
            participantRoles: data.participantRoles || [],
            createdBy: data.createdBy || '',
            createdAt: data.createdAt?.toDate() || new Date(),
            lastActivity: data.lastActivity?.toDate() || new Date(),
            lastMessage: data.lastMessage || '',
            lastMessageSender: data.lastMessageSender || '',
            isEscalated: data.isEscalated || false,
            escalatedAt: data.escalatedAt?.toDate() || null,
            escalatedBy: data.escalatedBy,
            escalationReason: data.escalationReason,
            status: data.status || 'active',
            priority: data.priority || 'medium',
            tags: data.tags || [],
            department: data.department,
            auditTrail: data.auditTrail?.map((entry: any) => ({
              ...entry,
              timestamp: entry.timestamp?.toDate() || new Date()
            })) || []
          };
        }) as ConversationMetadata[];
        
        console.log('📊 Processed conversations:', allConversations.length);
        allConversations.forEach((conv, index) => {
          console.log(`📋 Conversation ${index + 1}:`, {
            id: conv.id,
            title: conv.title,
            participants: conv.participants,
            participantNames: conv.participantNames,
            lastMessage: conv.lastMessage
          });
        });
        
        // For now, show ALL conversations to debug the issue
        console.log('🔄 Showing ALL conversations for debugging');
        const sortedConversations = allConversations.sort((a, b) => 
          b.lastActivity.getTime() - a.lastActivity.getTime()
        );
        
        console.log('✅ Final sorted conversations:', sortedConversations.length);
        sortedConversations.forEach((conv, index) => {
          console.log(`📋 Final conversation ${index + 1}:`, {
            id: conv.id,
            title: conv.title,
            participants: conv.participants,
            participantNames: conv.participantNames,
            lastMessage: conv.lastMessage,
            lastActivity: conv.lastActivity
          });
        });
        
        callback(sortedConversations);
      },
      (error) => {
        console.error('❌ Real-time listener failed for conversations:', error);
        callback([]);
      }
    );

    return unsubscribe;
  }

  // Get enhanced messages for conversation
  static async getEnhancedMessages(conversationId: string): Promise<EnhancedMessage[]> {
    try {
      console.log('📨 Fetching enhanced messages for conversation:', conversationId);
      
      const messagesQuery = query(
        collection(db, 'affiliateMessages'),
        where('conversationId', '==', conversationId),
        orderBy('timestamp', 'asc')
      );
      
      const messagesSnapshot = await getDocs(messagesQuery);
      
      const messages = messagesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date(),
          editedAt: data.editedAt?.toDate() || null,
          readBy: data.readBy?.map((read: any) => ({
            ...read,
            readAt: read.readAt?.toDate() || new Date()
          })) || []
        };
      }) as EnhancedMessage[];
      
      console.log(`✅ Retrieved ${messages.length} enhanced messages`);
      return messages;
    } catch (error) {
      console.error('❌ Error fetching enhanced messages:', error);
      throw new Error(`Failed to load messages: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Real-time listener for enhanced messages
  static subscribeToEnhancedMessages(
    conversationId: string,
    callback: (messages: EnhancedMessage[]) => void
  ): () => void {
    console.log('🔄 Setting up real-time listener for enhanced messages in collection:', conversationId);
    
    // Use simple query without orderBy to avoid index requirements
    const messagesQuery = query(
      collection(db, 'affiliateMessages'),
      where('conversationId', '==', conversationId)
    );
    
    const unsubscribe = onSnapshot(
      messagesQuery,
      (querySnapshot) => {
        console.log('🔄 Enhanced messages updated in real-time:', querySnapshot.docs.length);
        const messages = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate() || new Date(),
            editedAt: data.editedAt?.toDate() || null,
            readBy: data.readBy?.map((read: any) => ({
              ...read,
              readAt: read.readAt?.toDate() || new Date()
            })) || []
          };
        }) as EnhancedMessage[];
        
        // Sort messages by timestamp in JavaScript
        const sortedMessages = messages.sort((a, b) => 
          a.timestamp.getTime() - b.timestamp.getTime()
        );
        
        console.log('✅ Enhanced messages sorted:', sortedMessages.length);
        callback(sortedMessages);
      },
      (error) => {
        console.error('❌ Real-time listener failed for enhanced messages:', error);
        callback([]);
      }
    );

    return unsubscribe;
  }

  // Mark message as read
  static async markMessageAsRead(
    messageId: string,
    userId: string,
    userName: string
  ): Promise<void> {
    try {
      const messageRef = doc(db, 'affiliateMessages', messageId);
      await updateDoc(messageRef, {
        readBy: arrayUnion({
          userId,
          userName,
          readAt: serverTimestamp()
        })
      });
    } catch (error) {
      console.error('❌ Error marking message as read:', error);
    }
  }

  // Get all conversations for governor audit
  static async getAllConversationsForAudit(): Promise<ConversationMetadata[]> {
    try {
      console.log('🔍 Fetching all conversations for governor audit...');
      
      const conversationsQuery = query(
        collection(db, 'conversations'),
        orderBy('lastActivity', 'desc')
      );
      
      const conversationsSnapshot = await getDocs(conversationsQuery);
      
      const conversations = conversationsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          lastActivity: data.lastActivity?.toDate() || new Date(),
          lastMessage: data.lastMessage || '',
          escalatedAt: data.escalatedAt?.toDate() || null,
          participants: data.participants?.map((p: any) => ({
            ...p,
            joinedAt: p.joinedAt?.toDate() || new Date(),
            lastSeen: p.lastSeen?.toDate() || null
          })) || [],
          auditTrail: data.auditTrail?.map((entry: any) => ({
            ...entry,
            timestamp: entry.timestamp?.toDate() || new Date()
          })) || []
        };
      }) as ConversationMetadata[];
      
      console.log(`✅ Retrieved ${conversations.length} conversations for audit`);
      return conversations;
    } catch (error) {
      console.error('❌ Error fetching conversations for audit:', error);
      throw new Error(`Failed to load conversations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Join conversation (for governor oversight)
  static async joinConversation(
    conversationId: string,
    userId: string,
    userName: string,
    userRole: 'governor'
  ): Promise<void> {
    try {
      console.log('👥 Governor joining conversation:', conversationId);

      const conversationRef = doc(db, 'conversations', conversationId);
      const conversationDoc = await getDoc(conversationRef);
      
      if (!conversationDoc.exists()) {
        throw new Error('Conversation not found');
      }

      const conversationData = conversationDoc.data() as ConversationMetadata;
      
      // Check if already a participant
      const isAlreadyParticipant = conversationData.participants.some(p => p.id === userId);
      if (isAlreadyParticipant) {
        console.log('✅ Governor already participant in conversation');
        return;
      }

      // Add governor as participant
      const newParticipant: ConversationParticipant = {
        id: userId,
        name: userName,
        role: userRole,
        joinedAt: new Date()
      };

      const auditEntry: ConversationAuditEntry = {
        id: `audit_${Date.now()}`,
        action: 'participant_added',
        performedBy: userId,
        performedByName: userName,
        performedByRole: userRole,
        timestamp: new Date(),
        details: { reason: 'Governor oversight', participantAdded: userName }
      };

      await updateDoc(conversationRef, {
        participants: arrayUnion(newParticipant),
        title: `${conversationData.title} - MANAGEMENT OVERSIGHT`,
        auditTrail: arrayUnion({
          ...auditEntry,
          timestamp: serverTimestamp()
        }),
        lastActivity: serverTimestamp()
      });

      // Send system message about governor joining
      await this.sendEnhancedMessage(
        conversationId,
        userId,
        userName,
        userRole,
        `🔍 MANAGEMENT OVERSIGHT ACTIVATED\n\nSam has joined this conversation for oversight and audit purposes.`,
        'high',
        undefined,
        undefined,
        false,
        undefined,
        'system'
      );

      console.log('✅ Governor joined conversation successfully');
    } catch (error) {
      console.error('❌ Error joining conversation:', error);
      throw error;
    }
  }

  // Get all available recipients for a user
  static async getAvailableRecipients(
    userId: string,
    userRole: 'governor' | 'admin' | 'affiliate'
  ): Promise<Array<{
    id: string;
    name: string;
    role: 'governor' | 'admin' | 'affiliate';
    email?: string;
    title?: string;
    country?: string;
    accountStatus?: string;
    currentBalance?: number;
  }>> {
    try {
      const recipients: any[] = [];

      if (userRole === 'admin' || userRole === 'governor') {
        // Add governors (management team)
        const governorQuery = query(collection(db, 'users'), where('role', '==', 'governor'));
        const governorSnapshot = await getDocs(governorQuery);
        
        governorSnapshot.docs.forEach(doc => {
          const data = doc.data();
          if (doc.id !== userId) { // Don't include self
            recipients.push({
              id: doc.id,
              name: data.name,
              role: 'governor',
              email: data.email,
              title: 'Management Team'
            });
          }
        });

        // Ensure Sam Hivanek is included
        const samExists = recipients.some(r => r.email === 'sam@interactivebrokers.us');
        if (!samExists) {
          recipients.push({
            id: 'sam_hivanek_governor',
            name: 'Sam Hivanek',
            role: 'governor',
            email: 'sam@interactivebrokers.us',
            title: 'Management Team - Governor'
          });
        }

        // Add admins
        const adminQuery = query(collection(db, 'users'), where('role', '==', 'admin'));
        const adminSnapshot = await getDocs(adminQuery);
        
        adminSnapshot.docs.forEach(doc => {
          const data = doc.data();
          if (doc.id !== userId) {
            recipients.push({
              id: doc.id,
              name: data.name,
              role: 'admin',
              email: data.email,
              title: 'Admin Team'
            });
          }
        });

        // Add investors (affiliates)
        const investorQuery = query(collection(db, 'users'), where('role', '==', 'investor'));
        const investorSnapshot = await getDocs(investorQuery);
        
        investorSnapshot.docs.forEach(doc => {
          const data = doc.data();
          recipients.push({
            id: doc.id,
            name: data.name,
            role: 'affiliate',
            email: data.email,
            country: data.country,
            accountStatus: data.accountStatus,
            currentBalance: data.currentBalance
          });
        });
      } else {
        // Affiliate can message admin and governor
        const adminQuery = query(collection(db, 'users'), where('role', '==', 'admin'));
        const adminSnapshot = await getDocs(adminQuery);
        
        adminSnapshot.docs.forEach(doc => {
          const data = doc.data();
          recipients.push({
            id: doc.id,
            name: data.name,
            role: 'admin',
            email: data.email,
            title: 'Admin Team'
          });
        });

        const governorQuery = query(collection(db, 'users'), where('role', '==', 'governor'));
        const governorSnapshot = await getDocs(governorQuery);
        
        governorSnapshot.docs.forEach(doc => {
          const data = doc.data();
          recipients.push({
            id: doc.id,
            name: data.name,
            role: 'governor',
            email: data.email,
            title: 'Management Team'
          });
        });
      }

      return recipients;
    } catch (error) {
      console.error('❌ Error fetching available recipients:', error);
      return [];
    }
  }
}
