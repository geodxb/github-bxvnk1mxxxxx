import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Announcement } from '../../services/announcementService';
import { 
  X, 
  AlertTriangle, 
  Info, 
  Settings, 
  Megaphone,
  Clock
} from 'lucide-react';

interface AnnouncementBannerProps {
  announcements: Announcement[];
  onDismiss?: (announcementId: string) => void;
}

const AnnouncementBanner = ({ announcements, onDismiss }: AnnouncementBannerProps) => {
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<string[]>([]);

  const handleDismiss = (announcementId: string) => {
    setDismissedAnnouncements(prev => [...prev, announcementId]);
    if (onDismiss) {
      onDismiss(announcementId);
    }
  };

  const getAnnouncementIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle size={20} className="text-red-600" />;
      case 'warning':
        return <AlertTriangle size={20} className="text-amber-600" />;
      case 'maintenance':
        return <Settings size={20} className="text-purple-600" />;
      case 'info':
      default:
        return <Info size={20} className="text-blue-600" />;
    }
  };

  const getAnnouncementStyles = (type: string, priority: string) => {
    let baseStyles = 'border-l-4 p-4 mb-4 rounded-lg';
    
    // Type-based styling
    switch (type) {
      case 'critical':
        baseStyles += ' bg-red-50 border-red-500 border border-red-200';
        break;
      case 'warning':
        baseStyles += ' bg-amber-50 border-amber-500 border border-amber-200';
        break;
      case 'maintenance':
        baseStyles += ' bg-purple-50 border-purple-500 border border-purple-200';
        break;
      case 'info':
      default:
        baseStyles += ' bg-blue-50 border-blue-500 border border-blue-200';
        break;
    }

    // Priority-based additional styling
    if (priority === 'urgent') {
      baseStyles += ' animate-pulse';
    }

    return baseStyles;
  };

  const getTextColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'text-red-800';
      case 'warning':
        return 'text-amber-800';
      case 'maintenance':
        return 'text-purple-800';
      case 'info':
      default:
        return 'text-blue-800';
    }
  };

  const getMessageColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'text-red-700';
      case 'warning':
        return 'text-amber-700';
      case 'maintenance':
        return 'text-purple-700';
      case 'info':
      default:
        return 'text-blue-700';
    }
  };

  // Filter out dismissed announcements
  const visibleAnnouncements = announcements.filter(
    announcement => !dismissedAnnouncements.includes(announcement.id)
  );

  if (visibleAnnouncements.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {visibleAnnouncements.map((announcement) => (
          <motion.div
            key={announcement.id}
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            transition={{ duration: 0.3 }}
            className={getAnnouncementStyles(announcement.type, announcement.priority)}
          >
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 mt-1">
                {getAnnouncementIcon(announcement.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className={`text-lg font-bold uppercase tracking-wide ${getTextColor(announcement.type)}`}>
                        {announcement.title}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-bold rounded-full uppercase tracking-wide ${
                        announcement.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        announcement.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        announcement.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {announcement.priority}
                      </span>
                      <span className="px-2 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-800 uppercase tracking-wide">
                        <Megaphone size={10} className="mr-1 inline" />
                        ANNOUNCEMENT
                      </span>
                    </div>
                    
                    <p className={`text-sm leading-relaxed mb-3 uppercase tracking-wide font-medium ${getMessageColor(announcement.type)}`}>
                      {announcement.message}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-xs">
                      <span className={`flex items-center space-x-1 ${getMessageColor(announcement.type)}`}>
                        <Clock size={12} />
                        <span className="uppercase tracking-wide">
                          {announcement.createdAt.toLocaleDateString()} at {announcement.createdAt.toLocaleTimeString()}
                        </span>
                      </span>
                      <span className={`uppercase tracking-wide ${getMessageColor(announcement.type)}`}>
                        BY: {announcement.createdByName}
                      </span>
                      {announcement.endDate && (
                        <span className={`uppercase tracking-wide ${getMessageColor(announcement.type)}`}>
                          EXPIRES: {announcement.endDate.toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleDismiss(announcement.id)}
                    className={`p-2 hover:bg-white/50 rounded-lg transition-colors ${getTextColor(announcement.type)}`}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default AnnouncementBanner;