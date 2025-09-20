import { useState, useEffect } from 'react';
import { AnnouncementService, Announcement } from '../services/announcementService';

export const useAnnouncements = (userRole: 'admin' | 'investor' | 'governor') => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userRole) {
      setLoading(false);
      return;
    }

    // Set up real-time listener
    console.log('📢 Setting up announcements listener for role:', userRole);
    const unsubscribe = AnnouncementService.subscribeToAnnouncements(userRole, (updatedAnnouncements) => {
      console.log('📢 Announcements updated for role:', userRole, 'Count:', updatedAnnouncements.length);
      setAnnouncements(updatedAnnouncements);
      setLoading(false);
      setError(null);
    });

    // Cleanup listener on unmount
    return () => {
      console.log('📢 Cleaning up announcements listener');
      unsubscribe();
    };
  }, [userRole]);

  return { announcements, loading, error };
};

export const useAllAnnouncements = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await AnnouncementService.getAnnouncements();
      setAnnouncements(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  return { announcements, loading, error, refetch: fetchAnnouncements };
};