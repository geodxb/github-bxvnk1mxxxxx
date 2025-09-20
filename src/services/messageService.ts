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
    senderRole: 'admin' | 'affiliate' | 'governor',
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
      await this.updateConversationLastMessage(finalConversationId, content);
      
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

  // Get or create conversation between admin and affiliate
  static async getOrCreateConversation(
    userId: string, 
    userName: string, 
    userRole: 'admin' | 'affiliate' | 'governor',
    targetUserId?: string
  ): Promise<string> {
    try {
      console.log('🔍 Finding or creating conversation for:', userName);
      
      // Look for existing conversation with specific target if provided
      let conversationsQuery;
      if (targetUserId) {
        conversationsQuery = query(
          collection(db, 'conversations'),
          where('participants', 'array-contains-any', [userId, targetUserId])
        );
      } else {
        conversationsQuery = query(
          collection(db, 'conversations'),
          where('participants', 'array-contains', userId)
        );
      }
      
      const conversationsSnapshot = await getDocs(conversationsQuery);
      
      // If targeting specific user, find conversation with both participants
      if (targetUserId && !conversationsSnapshot.empty) {
        const existingConversation = conversationsSnapshot.docs.find(doc => {
          const data = doc.data();
          return data.participants.includes(userId) && data.participants.includes(targetUserId);
        });
        
        if (existingConversation) {
          console.log('✅ Found existing conversation:', existingConversation.id);
          return existingConversation.id;
        }
      } else if (!targetUserId && !conversationsSnapshot.empty) {
        const existingConversation = conversationsSnapshot.docs[0];
        console.log('✅ Found existing conversation:', existingConversation.id);
        return existingConversation.id;
      }
      
      // Create new conversation
      let otherParticipantId = 'admin_fallback';
      let otherParticipantName = 'Admin';
      
      if (targetUserId) {
        // Use the specific target user
        otherParticipantId = targetUserId;
        // Get target user name
        const targetUserDoc = await getDoc(doc(db, 'users', targetUserId));
        if (targetUserDoc.exists()) {
          otherParticipantName = targetUserDoc.data().name || 'User';
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
          console.log('✅ Found admin user:', otherParticipantId, otherParticipantName);
        } else {
          console.log('⚠️ Admin user not found, using fallback');
        }
      }
      
      const conversationData = {
        participants: [userId, otherParticipantId],
        participantNames: [userName, otherParticipantName],
        participantRoles: [userRole, targetUserId ? 'governor' : 'admin'],
        lastMessage: '',
        lastMessageTime: serverTimestamp(),
        adminId: userRole === 'admin' ? userId : otherParticipantId,
        affiliateId: userRole === 'admin' ? otherParticipantId : userId,
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
      await updateDoc(docRef, {
        lastMessage: lastMessage.substring(0, 100), // Truncate for preview
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
        console.log('🔄 Messages updated in real-time');
        const messages = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate() || new Date(),
            createdAt: data.createdAt?.toDate() || new Date()
          };
        }) as AffiliateMessage[];
        
        callback(messages);
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
        orderBy('lastMessageTime', 'desc')
      );
      
      const conversationsSnapshot = await getDocs(conversationsQuery);
      
      const conversations = conversationsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          lastMessageTime: data.lastMessageTime?.toDate() || new Date(),
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

  // Real-time listener for conversations
  static subscribeToConversations(
    userId: string, 
    callback: (conversations: Conversation[]) => void
  ): () => void {
    console.log('🔄 Setting up real-time listener for conversations for user:', userId);
    
    const conversationsQuery = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', userId),
      orderBy('lastMessageTime', 'desc')
    );
    
    const unsubscribe = onSnapshot(
      conversationsQuery,
      (querySnapshot) => {
        console.log('🔄 Conversations updated in real-time');
        const conversations = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            lastMessageTime: data.lastMessageTime?.toDate() || new Date(),
            createdAt: data.createdAt?.toDate() || new Date(),
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

}
