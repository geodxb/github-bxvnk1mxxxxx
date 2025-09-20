import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'critical' | 'maintenance';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  targetRoles: ('admin' | 'investor' | 'governor')[];
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
}

export class AnnouncementService {
  // Create a new announcement
  static async createAnnouncement(announcementData: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      console.log('📢 Creating announcement:', announcementData.title);
      
      const docRef = await addDoc(collection(db, 'announcements'), {
        ...announcementData,
        startDate: announcementData.startDate || null,
        endDate: announcementData.endDate || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Announcement created:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creating announcement:', error);
      throw new Error(`Failed to create announcement: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Update an existing announcement
  static async updateAnnouncement(announcementId: string, updates: Partial<Announcement>): Promise<void> {
    try {
      console.log('📢 Updating announcement:', announcementId);
      
      const docRef = doc(db, 'announcements', announcementId);
      await updateDoc(docRef, {
        ...updates,
        startDate: updates.startDate || null,
        endDate: updates.endDate || null,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Announcement updated successfully');
    } catch (error) {
      console.error('❌ Error updating announcement:', error);
      throw new Error(`Failed to update announcement: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Delete an announcement
  static async deleteAnnouncement(announcementId: string): Promise<void> {
    try {
      console.log('📢 Deleting announcement:', announcementId);
      
      const docRef = doc(db, 'announcements', announcementId);
      await deleteDoc(docRef);
      
      console.log('✅ Announcement deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting announcement:', error);
      throw new Error(`Failed to delete announcement: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get all announcements
  static async getAnnouncements(): Promise<Announcement[]> {
    try {
      console.log('📢 Fetching all announcements...');
      
      const announcementsQuery = query(
        collection(db, 'announcements'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(announcementsQuery);
      
      const announcements = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          startDate: data.startDate?.toDate() || null,
          endDate: data.endDate?.toDate() || null,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        };
      }) as Announcement[];
      
      console.log(`✅ Retrieved ${announcements.length} announcements`);
      return announcements;
    } catch (error) {
      console.error('❌ Error fetching announcements:', error);
      throw new Error(`Failed to load announcements: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get active announcements for a specific role
  static async getActiveAnnouncementsForRole(userRole: 'admin' | 'investor' | 'governor'): Promise<Announcement[]> {
    try {
      console.log('📢 Fetching active announcements for role:', userRole);
      
      const announcementsQuery = query(
        collection(db, 'announcements'),
        where('isActive', '==', true),
        orderBy('priority', 'desc'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(announcementsQuery);
      
      const announcements = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          startDate: data.startDate?.toDate() || null,
          endDate: data.endDate?.toDate() || null,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        };
      }) as Announcement[];
      
      // Filter by role and date range
      const now = new Date();
      const filteredAnnouncements = announcements.filter(announcement => {
        // Check if user role is in target roles
        const isTargetRole = announcement.targetRoles.includes(userRole);
        
        // Check date range
        const isInDateRange = (!announcement.startDate || announcement.startDate <= now) &&
                             (!announcement.endDate || announcement.endDate >= now);
        
        return isTargetRole && isInDateRange;
      });
      
      console.log(`✅ Retrieved ${filteredAnnouncements.length} active announcements for ${userRole}`);
      return filteredAnnouncements;
    } catch (error) {
      console.error('❌ Error fetching announcements for role:', error);
      return [];
    }
  }

  // Real-time listener for announcements
  static subscribeToAnnouncements(
    userRole: 'admin' | 'investor' | 'governor',
    callback: (announcements: Announcement[]) => void
  ): () => void {
    console.log('🔄 Setting up real-time listener for announcements for role:', userRole);
    
    const announcementsQuery = query(
      collection(db, 'announcements'),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(
      announcementsQuery,
      (querySnapshot) => {
        console.log('🔄 Announcements updated in real-time');
        const announcements = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            startDate: data.startDate?.toDate() || null,
            endDate: data.endDate?.toDate() || null,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date()
          };
        }) as Announcement[];
        
        // Filter by role and date range
        const now = new Date();
        const filteredAnnouncements = announcements.filter(announcement => {
          const isTargetRole = announcement.targetRoles.includes(userRole);
          const isInDateRange = (!announcement.startDate || announcement.startDate <= now) &&
                               (!announcement.endDate || announcement.endDate >= now);
          return isTargetRole && isInDateRange;
        });
        
        callback(filteredAnnouncements);
      },
      (error) => {
        console.error('❌ Real-time listener failed for announcements:', error);
        callback([]);
      }
    );

    return unsubscribe;
  }

  // Toggle announcement active status
  static async toggleAnnouncementStatus(announcementId: string, isActive: boolean): Promise<void> {
    try {
      console.log('📢 Toggling announcement status:', announcementId, 'to', isActive);
      
      const docRef = doc(db, 'announcements', announcementId);
      await updateDoc(docRef, {
        isActive,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Announcement status updated');
    } catch (error) {
      console.error('❌ Error toggling announcement status:', error);
      throw error;
    }
  }
}