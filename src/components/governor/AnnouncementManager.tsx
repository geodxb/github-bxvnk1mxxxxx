import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Button from '../common/Button';
import Modal from '../common/Modal';
import { AnnouncementService, Announcement } from '../../services/announcementService';
import { useAllAnnouncements } from '../../hooks/useAnnouncements';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Megaphone, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye,
  Calendar,
  Users,
  AlertTriangle,
  Info,
  Settings,
  Clock
} from 'lucide-react';

const AnnouncementManager = () => {
  const { user } = useAuth();
  const { announcements, loading: isLoading, refetch } = useAllAnnouncements();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'warning' | 'critical' | 'maintenance',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    targetRoles: ['admin', 'investor'] as ('admin' | 'investor' | 'governor')[],
    startDate: '',
    endDate: ''
  });

  const announcementTypes = [
    { id: 'info', label: 'INFORMATION', icon: <Info size={16} />, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
    { id: 'warning', label: 'WARNING', icon: <AlertTriangle size={16} />, color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' },
    { id: 'critical', label: 'CRITICAL', icon: <AlertTriangle size={16} />, color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
    { id: 'maintenance', label: 'MAINTENANCE', icon: <Settings size={16} />, color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' }
  ];

  const priorityLevels = [
    { id: 'low', label: 'LOW', color: 'text-gray-600', bgColor: 'bg-gray-100' },
    { id: 'medium', label: 'MEDIUM', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
    { id: 'high', label: 'HIGH', color: 'text-orange-600', bgColor: 'bg-orange-100' },
    { id: 'urgent', label: 'URGENT', color: 'text-red-600', bgColor: 'bg-red-100' }
  ];

  const handleCreateAnnouncement = async () => {
    if (!user || !formData.title.trim() || !formData.message.trim()) return;

    setIsSaving(true);
    try {
      const announcementData = {
        title: formData.title,
        message: formData.message,
        type: formData.type,
        priority: formData.priority,
        targetRoles: formData.targetRoles,
        isActive: true,
        startDate: formData.startDate ? new Date(formData.startDate) : undefined,
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
        createdBy: user.id,
        createdByName: user.name,
      };

      if (editingAnnouncement) {
        // Update existing announcement
        await AnnouncementService.updateAnnouncement(editingAnnouncement.id, announcementData);
      } else {
        // Create new announcement
        await AnnouncementService.createAnnouncement(announcementData);
      }
      
      // Reset form
      setFormData({
        title: '',
        message: '',
        type: 'info',
        priority: 'medium',
        targetRoles: ['admin', 'investor'],
        startDate: '',
        endDate: ''
      });
      
      setShowCreateModal(false);
      setEditingAnnouncement(null);
      
      // Refresh announcements list
      await refetch();
    } catch (error) {
      console.error('Error saving announcement:', error);
      alert('Failed to save announcement. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (announcementId: string, currentStatus: boolean) => {
    try {
      await AnnouncementService.toggleAnnouncementStatus(announcementId, !currentStatus);
      await refetch();
    } catch (error) {
      console.error('Error toggling announcement:', error);
      alert('Failed to update announcement status. Please try again.');
    }
  };

  const handleDeleteAnnouncement = async (announcementId: string) => {
    if (!confirm('DELETE ANNOUNCEMENT?\n\nThis action cannot be undone.')) return;

    try {
      await AnnouncementService.deleteAnnouncement(announcementId);
      await refetch();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      alert('Failed to delete announcement. Please try again.');
    }
  };

  const getTypeConfig = (type: string) => {
    return announcementTypes.find(t => t.id === type) || announcementTypes[0];
  };

  const getPriorityConfig = (priority: string) => {
    return priorityLevels.find(p => p.id === priority) || priorityLevels[1];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-300 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gray-200 border border-gray-400 rounded-lg flex items-center justify-center">
              <Megaphone size={24} className="text-gray-700" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">ANNOUNCEMENT MANAGEMENT</h1>
              <p className="text-gray-600 uppercase tracking-wide text-sm font-medium">CREATE AND MANAGE SYSTEM-WIDE ANNOUNCEMENTS</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors uppercase tracking-wide border border-blue-700"
          >
            <Plus size={16} className="mr-2 inline" />
            CREATE ANNOUNCEMENT
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-300 p-6">
          <div className="border-b border-gray-300 pb-3 mb-4">
            <p className="text-gray-600 font-medium text-sm uppercase tracking-wider">ACTIVE ANNOUNCEMENTS</p>
          </div>
          <div>
            <p className="text-gray-900 text-3xl font-bold">{announcements.filter(a => a.isActive).length}</p>
            <p className="text-gray-500 text-xs mt-1">Currently Visible</p>
          </div>
        </div>

        <div className="bg-white border border-gray-300 p-6">
          <div className="border-b border-gray-300 pb-3 mb-4">
            <p className="text-gray-600 font-medium text-sm uppercase tracking-wider">TOTAL ANNOUNCEMENTS</p>
          </div>
          <div>
            <p className="text-gray-900 text-3xl font-bold">{announcements.length}</p>
            <p className="text-gray-500 text-xs mt-1">All Time</p>
          </div>
        </div>

        <div className="bg-white border border-gray-300 p-6">
          <div className="border-b border-gray-300 pb-3 mb-4">
            <p className="text-gray-600 font-medium text-sm uppercase tracking-wider">URGENT ALERTS</p>
          </div>
          <div>
            <p className="text-gray-900 text-3xl font-bold">
              {announcements.filter(a => a.isActive && a.priority === 'urgent').length}
            </p>
            <p className="text-gray-500 text-xs mt-1">High Priority</p>
          </div>
        </div>

        <div className="bg-white border border-gray-300 p-6">
          <div className="border-b border-gray-300 pb-3 mb-4">
            <p className="text-gray-600 font-medium text-sm uppercase tracking-wider">SCHEDULED</p>
          </div>
          <div>
            <p className="text-gray-900 text-3xl font-bold">
              {announcements.filter(a => a.startDate && new Date(a.startDate) > new Date()).length}
            </p>
            <p className="text-gray-500 text-xs mt-1">Future Announcements</p>
          </div>
        </div>
      </div>

      {/* Announcements List */}
      <div className="bg-white border border-gray-300">
        <div className="px-6 py-4 border-b border-gray-300 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">
            SYSTEM ANNOUNCEMENTS ({announcements.length} TOTAL)
          </h3>
        </div>
        
        {isLoading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-gray-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-700 font-bold uppercase tracking-wide">LOADING ANNOUNCEMENTS...</p>
          </div>
        ) : announcements.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {announcements.map((announcement) => {
              const typeConfig = getTypeConfig(announcement.type);
              const priorityConfig = getPriorityConfig(announcement.priority);

              return (
                <div key={announcement.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className={`p-2 rounded border ${typeConfig.bgColor} ${typeConfig.borderColor}`}>
                          {typeConfig.icon}
                        </div>
                        <h4 className="font-bold text-gray-900 uppercase tracking-wide">{announcement.title}</h4>
                        <span className={`px-3 py-1 text-xs font-bold border uppercase tracking-wide ${typeConfig.bgColor} ${typeConfig.color} ${typeConfig.borderColor}`}>
                          {typeConfig.label}
                        </span>
                        <span className={`px-3 py-1 text-xs font-bold border uppercase tracking-wide ${priorityConfig.bgColor} ${priorityConfig.color}`}>
                          {priorityConfig.label}
                        </span>
                        <span className={`px-3 py-1 text-xs font-bold border uppercase tracking-wide ${
                          announcement.isActive ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'
                        }`}>
                          {announcement.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>
                      
                      <p className="text-gray-800 mb-3">{announcement.message}</p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="uppercase tracking-wide">TARGET: {announcement.targetRoles.join(', ').toUpperCase()}</span>
                        <span className="uppercase tracking-wide">CREATED: {announcement.createdAt.toLocaleDateString()}</span>
                        <span className="uppercase tracking-wide">BY: {announcement.createdByName}</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setEditingAnnouncement(announcement);
                          setFormData({
                            title: announcement.title,
                            message: announcement.message,
                            type: announcement.type,
                            priority: announcement.priority,
                            targetRoles: announcement.targetRoles,
                            startDate: announcement.startDate ? announcement.startDate.toISOString().split('T')[0] : '',
                            endDate: announcement.endDate ? announcement.endDate.toISOString().split('T')[0] : ''
                          });
                          setShowCreateModal(true);
                        }}
                        className="px-3 py-2 bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition-colors uppercase tracking-wide border border-gray-700"
                      >
                        <Edit3 size={14} className="mr-1 inline" />
                        EDIT
                      </button>
                      <button
                        onClick={() => handleToggleActive(announcement.id, announcement.isActive)}
                        className={`px-3 py-2 text-sm font-bold transition-colors uppercase tracking-wide border ${
                          announcement.isActive
                            ? 'bg-red-600 text-white border-red-700 hover:bg-red-700'
                            : 'bg-green-600 text-white border-green-700 hover:bg-green-700'
                        }`}
                      >
                        {announcement.isActive ? 'DEACTIVATE' : 'ACTIVATE'}
                      </button>
                      <button
                        onClick={() => handleDeleteAnnouncement(announcement.id)}
                        className="px-3 py-2 bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors uppercase tracking-wide border border-red-700"
                      >
                        <Trash2 size={14} className="mr-1 inline" />
                        DELETE
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 border border-gray-300 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Megaphone size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2 uppercase tracking-wide">NO ANNOUNCEMENTS</h3>
            <p className="text-gray-500 uppercase tracking-wide text-sm">Create your first system announcement</p>
          </div>
        )}
      </div>

      {/* Create/Edit Announcement Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingAnnouncement(null);
          setFormData({
            title: '',
            message: '',
            type: 'info',
            priority: 'medium',
            targetRoles: ['admin', 'investor'],
            startDate: '',
            endDate: ''
          });
        }}
        title={editingAnnouncement ? "EDIT ANNOUNCEMENT" : "CREATE ANNOUNCEMENT"}
        size="lg"
      >
        <div className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
              ANNOUNCEMENT TITLE <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 font-medium"
              placeholder="ENTER ANNOUNCEMENT TITLE..."
              required
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
              MESSAGE CONTENT <span className="text-red-600">*</span>
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 font-medium"
              rows={4}
              placeholder="ENTER DETAILED ANNOUNCEMENT MESSAGE..."
              required
            />
          </div>

          {/* Type Selection */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
              ANNOUNCEMENT TYPE
            </label>
            <div className="grid grid-cols-2 gap-3">
              {announcementTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: type.id as any }))}
                  className={`p-4 border transition-all text-left ${
                    formData.type === type.id
                      ? `${type.bgColor} ${type.borderColor} border-2`
                      : 'border-gray-300 hover:border-gray-400 bg-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {type.icon}
                    <span className={`font-bold text-sm uppercase tracking-wide ${
                      formData.type === type.id ? type.color : 'text-gray-700'
                    }`}>
                      {type.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Priority Selection */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
              PRIORITY LEVEL
            </label>
            <div className="flex space-x-2">
              {priorityLevels.map((level) => (
                <button
                  key={level.id}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, priority: level.id as any }))}
                  className={`px-4 py-2 border transition-all font-bold uppercase tracking-wide text-sm ${
                    formData.priority === level.id
                      ? `${level.bgColor} ${level.color} border-gray-900`
                      : 'border-gray-300 text-gray-600 hover:border-gray-400 bg-white'
                  }`}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>

          {/* Target Roles */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
              TARGET AUDIENCE
            </label>
            <div className="space-y-2">
              {[
                { id: 'admin', label: 'ADMINISTRATORS' },
                { id: 'investor', label: 'INVESTORS' },
                { id: 'governor', label: 'GOVERNORS' }
              ].map((role) => (
                <label key={role.id} className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.targetRoles.includes(role.id as any)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData(prev => ({
                          ...prev,
                          targetRoles: [...prev.targetRoles, role.id as any]
                        }));
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          targetRoles: prev.targetRoles.filter(r => r !== role.id)
                        }));
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                    {role.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Scheduling */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                START DATE (OPTIONAL)
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                END DATE (OPTIONAL)
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 font-medium"
                min={formData.startDate || undefined}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex space-x-4">
            <button
              onClick={() => {
                setShowCreateModal(false);
                setEditingAnnouncement(null);
                setFormData({
                  title: '',
                  message: '',
                  type: 'info',
                  priority: 'medium',
                  targetRoles: ['admin', 'investor'],
                  startDate: '',
                  endDate: ''
                });
              }}
              className="flex-1 px-4 py-3 bg-white border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors uppercase tracking-wide"
            >
              CANCEL
            </button>
            <button
              onClick={handleCreateAnnouncement}
              disabled={!formData.title.trim() || !formData.message.trim() || formData.targetRoles.length === 0 || isSaving}
              className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide border border-blue-700"
            >
              {isSaving ? 'SAVING...' : editingAnnouncement ? 'UPDATE ANNOUNCEMENT' : 'CREATE ANNOUNCEMENT'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AnnouncementManager;