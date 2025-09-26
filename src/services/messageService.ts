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
  limit,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AffiliateMessage, Conversation } from '../types/message';
import { NotificationService } from './notificationService';

export class MessageService {
  // Send a new message
  static async sendMessage(
    senderId: string,
    senderName: string,
    senderRole: 'admin' | 'investor' | 'governor', // Changed 'affiliate' to 'investor'
    content: string,
    conversationId?: string,
    replyTo?: string,
    priority: 'low' | 'medium' | 'high' = 'medium',
    department?: string,
    attachments?: string[]
  ): Promise<string> {
    try {
      console.log('📨 Sending message from:', senderName, 'Role:', senderRole);
      
      // If no conversation ID provided, create or find existing conversation
      let finalConversationId = conversationId;
      if (!conversationId) {
        finalConversationId = await this.getOrCreateConversation(senderId, senderName, senderRole);
      }
      
      console.log('📨 Using conversation ID:', finalConversationId);
      
      const messageData = {
        senderId,
        senderName,
        senderRole,
        content,
        timestamp: serverTimestamp(),
        conversationId: finalConversationId,
        replyTo: replyTo || null,
        priority,
        status: 'sent',
        department: department || null,
        attachments: attachments || [],
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'affiliateMessages'), messageData);
      
      console.log('✅ Message document created:', docRef.id);
      
      // Update conversation with last message
      await this.updateConversationLastMessageWithSender(finalConversationId, content, senderId, senderName, senderRole);
      
      // Create notifications for message recipients
      try {
        // Get conversation participants
        const conversationDoc = await getDoc(doc(db, 'conversations', finalConversationId));
        if (conversationDoc.exists()) {
          const conversationData = conversationDoc.data();
          const participants = conversationData.participants || [];
          
          // Send notification to all participants except sender
          for (const participantId of participants) {
            if (participantId !== senderId) {
              // Get participant role
              const userDoc = await getDoc(doc(db, 'users', participantId));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                await NotificationService.createMessageNotification(
                  senderId,
                  senderName,
                  participantId,
                  userData.role,
                  content,
                  finalConversationId
                );
              }
            }
          }
        }
      } catch (notificationError) {
        console.error('Error creating message notification:', notificationError);
      }
      
      console.log('✅ Message sent successfully:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error sending message:', error);
      throw new Error(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get or create conversation between admin and investor
  static async getOrCreateConversation(
    userId: string, 
    userName: string, 
    userRole: 'admin' | 'investor' | 'governor',
    targetUserId?: string
  ): Promise<string> {
    try {
      console.log('🔍 Finding or creating conversation for:', userName);
      
      // Look for existing conversation that includes this user
      const conversationsQuery = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', userId)
      );
      
      const conversationsSnapshot = await getDocs(conversationsQuery);
      
      // Check for existing conversation
      if (!conversationsSnapshot.empty) {
        let existingConversation;
        
        if (targetUserId) {
          // Find conversation with both participants
          existingConversation = conversationsSnapshot.docs.find(doc => {
            const data = doc.data();
            return data.participants.includes(userId) && data.participants.includes(targetUserId);
          });
        } else {
          // For investor role, find conversation with admin
          if (userRole === 'investor') {
            existingConversation = conversationsSnapshot.docs.find(doc => {
              const data = doc.data();
              const participantDetails = data.participantDetails || [];
              return participantDetails.some((p: any) => p.role === 'admin');
            });
          } else {
            // For admin/governor, use first available conversation
            existingConversation = conversationsSnapshot.docs[0];
          }
        }
        
        if (existingConversation) {
          console.log('✅ Found existing conversation:', existingConversation.id);
          return existingConversation.id;
        }
      }
      
      // Create new conversation
      let otherParticipantId = 'admin_fallback';
      let otherParticipantName = 'Admin';
      let otherParticipantRole = 'admin';
      
      if (targetUserId) {
        // Use the specific target user
        otherParticipantId = targetUserId;
        // Get target user name
        const targetUserDoc = await getDoc(doc(db, 'users', targetUserId));
        if (targetUserDoc.exists()) {
          otherParticipantName = targetUserDoc.data().name || 'User';
          otherParticipantRole = targetUserDoc.data().role || 'admin';
        }
      } else if (userRole === 'investor') {
        // Investor needs to connect to admin
        const adminQuery = query(
          collection(db, 'users'),
          where('role', '==', 'admin'),
          where('email', '==', 'crisdoraodxb@gmail.com')
        );
        
        const adminSnapshot = await getDocs(adminQuery);
        
        if (!adminSnapshot.empty) {
          const adminDoc = adminSnapshot.docs[0];
          otherParticipantId = adminDoc.id;
          otherParticipantName = adminDoc.data().name || 'Cristian Dorao';
          otherParticipantRole = 'admin';
          console.log('✅ Found admin user for investor conversation:', otherParticipantId, otherParticipantName);
        }
      } else {
        // Get the default admin user
        const adminQuery = query(
          collection(db, 'users'),
          where('role', '==', 'admin'),
          where('email', '==', 'crisdoraodxb@gmail.com')
        );
        
        const adminSnapshot = await getDocs(adminQuery);
        
        if (!adminSnapshot.empty) {
          const adminDoc = adminSnapshot.docs[0];
          otherParticipantId = adminDoc.id;
          otherParticipantName = adminDoc.data().name || 'Cristian Dorao';
          otherParticipantRole = 'admin';
          console.log('✅ Found admin user:', otherParticipantId, otherParticipantName);
        } else {
          console.log('⚠️ Admin user not found, using fallback');
        }
      }
      
      // Create participant details for the new structure
      const participantDetails = [
        {
          id: userId,
          name: userName,
          role: userRole
        },
        {
          id: otherParticipantId,
          name: otherParticipantName,
          role: otherParticipantRole
        }
      ];
      
      const conversationData = {
        participants: [userId, otherParticipantId],
        participantNames: [userName, otherParticipantName],
        participantDetails: participantDetails,
        lastMessage: {
          content: '',
          senderId: '',
          senderName: '',
          senderRole: userRole,
          createdAt: serverTimestamp(),
          id: '',
          attachments: []
        },
        title: userRole === 'investor' ? 'Support Request' : 'Admin Communication',
        department: userRole === 'investor' ? 'General Support' : 'Admin',
        isActive: true,
        urgency: 'low',
        recipientType: userRole === 'investor' ? 'admin' : 'investor',
        adminId: userRole === 'admin' ? userId : otherParticipantId,
        investorId: userRole === 'investor' ? userId : otherParticipantId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'conversations'), conversationData);
      console.log('✅ Created new conversation:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creating conversation:', error);
      throw new Error(`Failed to create conversation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Update conversation with last message
  static async updateConversationLastMessage(conversationId: string, lastMessage: string): Promise<void> {
    try {
      const docRef = doc(db, 'conversations', conversationId);
      
      // Get the current user info for the lastMessage object
      const messageObject = {
        content: lastMessage.substring(0, 100),
        senderId: '', // Will be filled by the calling function
        senderName: '', // Will be filled by the calling function
        senderRole: 'investor', // Default to investor
        createdAt: serverTimestamp(),
        id: `msg_${Date.now()}`,
        attachments: []
      };
      
      await updateDoc(docRef, {
        lastMessage: messageObject,
        lastMessageTime: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('❌ Error updating conversation:', error);
    }
  }

  // Get messages for a conversation
  static async getMessages(conversationId: string): Promise<AffiliateMessage[]> {
    try {
      console.log('📨 Fetching messages for conversation:', conversationId);
      
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
          createdAt: data.createdAt?.toDate() || new Date()
        };
      }) as AffiliateMessage[];
      
      console.log(`✅ Retrieved ${messages.length} messages`);
      return messages;
    } catch (error) {
      console.error('❌ Error fetching messages:', error);
      throw new Error(`Failed to load messages: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Real-time listener for messages
  static subscribeToMessages(
    conversationId: string, 
    callback: (messages: AffiliateMessage[]) => void
  ): () => void {
    console.log('🔄 Setting up real-time listener for messages in conversation:', conversationId);
    
    const messagesQuery = query(
      collection(db, 'affiliateMessages'),
      where('conversationId', '==', conversationId),
      orderBy('timestamp', 'asc')
    );
    
    const unsubscribe = onSnapshot(
      messagesQuery,
      (querySnapshot) => {
        try {
          console.log('🔄 Regular messages updated in real-time:', querySnapshot.docs.length);
          
          const messages = querySnapshot.docs.map(doc => {
            try {
              const data = doc.data();
              
              // Validate required fields
              if (!data.senderId || (!data.content && (!data.attachments || data.attachments.length === 0))) {
                console.error('❌ Invalid regular message data:', { docId: doc.id, data });
                return null;
              }
              
              return {
                id: doc.id,
                ...data,
                senderName: data.senderName || 'Unknown User',
                senderRole: data.senderRole || 'investor',
                timestamp: data.timestamp?.toDate() || new Date(),
                createdAt: data.createdAt?.toDate() || new Date(),
                attachments: data.attachments || []
              };
            } catch (docError) {
              console.error('❌ Error processing regular message document:', docError, { docId: doc.id });
              return null;
            }
          }).filter(Boolean) as AffiliateMessage[];
          
          console.log('✅ Regular messages processed:', messages.length);
          callback(messages);
        } catch (error) {
          console.error('❌ Error in regular messages snapshot listener:', error);
          callback([]);
        }
      },
      (error) => {
        console.error('❌ Real-time listener failed for messages:', error);
        callback([]);
      }
    );

    return unsubscribe;
  }
  // Get conversations for a user
  static async getConversations(userId: string): Promise<Conversation[]> {
    try {
      console.log('💬 Fetching conversations for user:', userId);
      
      const conversationsQuery = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', userId),
        orderBy('updatedAt', 'desc')
      );
      
      const conversationsSnapshot = await getDocs(conversationsQuery);
      
      const conversations = conversationsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          lastMessageTime: data.updatedAt?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        };
      }) as Conversation[];
      
      console.log(`✅ Retrieved ${conversations.length} conversations`);
      return conversations;
    } catch (error) {
      console.error('❌ Error fetching conversations:', error);
      throw new Error(`Failed to load conversations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get ALL conversations for governor oversight
  static async getAllConversationsForGovernor(): Promise<Conversation[]> {
    try {
      console.log('👑 Fetching ALL conversations for governor oversight');
      
      const conversationsQuery = query(
        collection(db, 'conversations'),
        orderBy('updatedAt', 'desc')
      );
      
      const conversationsSnapshot = await getDocs(conversationsQuery);
      
      const conversations = conversationsSnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Handle new structure with lastMessage as object
        let lastMessage = '';
        let lastMessageSender = '';
        let lastMessageTime = data.updatedAt;
        
        if (data.lastMessage) {
          if (typeof data.lastMessage === 'object' && data.lastMessage.content) {
            // New structure: lastMessage is an object
            lastMessage = data.lastMessage.content;
            lastMessageSender = data.lastMessage.senderName || '';
            lastMessageTime = data.lastMessage.createdAt || data.updatedAt;
          } else if (typeof data.lastMessage === 'string') {
            // Legacy structure: lastMessage is a string
            lastMessage = data.lastMessage;
            lastMessageSender = data.lastMessageSender || '';
          }
        }
        
        return {
          id: doc.id,
          participants: data.participants || [],
          participantNames: data.participantDetails?.map((p: any) => p.name) || 
                           data.participantNames || 
                           data.participants || [],
          createdAt: data.createdAt?.toDate() || new Date(),
          lastActivity: lastMessageTime?.toDate() || new Date(),
          lastMessage: lastMessage,
          lastMessageSender: lastMessageSender,
          lastMessageTime: lastMessageTime?.toDate() || new Date(),
          adminId: data.adminId || '',
          investorId: data.investorId || data.affiliateId || '',
          title: data.title || '',
          department: data.department || null,
          urgency: data.urgency || 'low',
          isActive: data.isActive !== false,
          recipientType: data.recipientType || 'admin',
          updatedAt: data.updatedAt?.toDate() || new Date()
        };
      }) as Conversation[];
      
      console.log(`👑 Retrieved ${conversations.length} total conversations for governor`);
      return conversations;
    } catch (error) {
      console.error('❌ Error fetching all conversations for governor:', error);
      throw new Error(`Failed to load conversations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Real-time listener for conversations
  static subscribeToConversations(
    userId: string, 
    callback: (conversations: Conversation[]) => void,
    userRole?: string
  ): () => void {
    console.log('🔄 Setting up real-time listener for conversations for user:', userId);
    
    let conversationsQuery;
    
    if (userRole === 'governor') {
      // Governor can see ALL conversations
      console.log('👑 Governor accessing ALL conversations for oversight');
      conversationsQuery = query(
        collection(db, 'conversations'),
        orderBy('updatedAt', 'desc')
      );
    } else {
      // Regular users only see their own conversations
      conversationsQuery = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', userId),
        orderBy('updatedAt', 'desc')
      );
    }
    
    const unsubscribe = onSnapshot(
      conversationsQuery,
      (querySnapshot) => {
        console.log(`🔄 Conversations updated in real-time for ${userRole === 'governor' ? 'GOVERNOR (ALL)' : 'USER'}: ${querySnapshot.docs.length} conversations`);
        const conversations = querySnapshot.docs.map(doc => {
          const data = doc.data();
          
          // Handle new structure with lastMessage as object
          let lastMessage = '';
          let lastMessageSender = '';
          let lastMessageTime = data.updatedAt;
          
          if (data.lastMessage) {
            if (typeof data.lastMessage === 'object' && data.lastMessage.content) {
              // New structure: lastMessage is an object
              lastMessage = data.lastMessage.content;
              lastMessageSender = data.lastMessage.senderName || '';
              lastMessageTime = data.lastMessage.createdAt || data.updatedAt;
            } else if (typeof data.lastMessage === 'string') {
              // Legacy structure: lastMessage is a string
              lastMessage = data.lastMessage;
              lastMessageSender = data.lastMessageSender || '';
            }
          }
          
          return {
            id: doc.id,
            participants: data.participants || [],
            participantNames: data.participantDetails?.map((p: any) => p.name) || 
                             data.participantNames || 
                             data.participants || [],
            createdAt: data.createdAt?.toDate() || new Date(),
            lastActivity: lastMessageTime?.toDate() || new Date(),
            lastMessage: lastMessage,
            lastMessageSender: lastMessageSender,
            lastMessageTime: lastMessageTime?.toDate() || new Date(),
            adminId: data.adminId || '',
            investorId: data.investorId || data.affiliateId || '',
            title: data.title || '',
            department: data.department || null,
            urgency: data.urgency || 'low',
            isActive: data.isActive !== false,
            recipientType: data.recipientType || 'admin',
            updatedAt: data.updatedAt?.toDate() || new Date()
          };
        }) as Conversation[];
        
        callback(conversations);
      },
      (error) => {
        console.error('❌ Real-time listener failed for conversations:', error);
        callback([]);
      }
    );

    return unsubscribe;
  }

  // Update conversation with last message including sender info
  static async updateConversationLastMessageWithSender(
    conversationId: string, 
    lastMessage: string, 
    senderId: string, 
    senderName: string, 
    senderRole: string
  ): Promise<void> {
    try {
      const docRef = doc(db, 'conversations', conversationId);
      
      const messageObject = {
        content: lastMessage.substring(0, 100),
        senderId,
        senderName,
        senderRole,
        createdAt: serverTimestamp(),
        id: `msg_${Date.now()}`,
        attachments: []
      };
      
      await updateDoc(docRef, {
        lastMessage: messageObject,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('❌ Error updating conversation with sender info:', error);
    }
  }

}