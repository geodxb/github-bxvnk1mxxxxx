import { useState } from 'react';
import { motion } from 'framer-motion';
import { useEnhancedConversations } from '../../hooks/useEnhancedMessages';
import { useAuth } from '../../contexts/AuthContext';
import { ConversationMetadata } from '../../types/conversation';
import { 
  MessageSquare, 
  User, 
  Clock,
  Search,
  Plus,
  Circle,
  Crown,
  Shield,
  Users,
  AlertTriangle,
  ArrowUp
} from 'lucide-react';

interface EnhancedConversationListProps {
  selectedConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
}

const EnhancedConversationList = ({ 
  selectedConversationId, 
  onSelectConversation,
  onNewConversation 
}: EnhancedConversationListProps) => {
  const { user } = useAuth();
  const { conversations, loading } = useEnhancedConversations(user?.id || '');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredConversations = conversations.filter(conv =>
    (conv.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.participants.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (conv.lastMessage || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const messageDate = new Date(timestamp);
    
    if (messageDate.toDateString() === now.toDateString()) {
      return messageDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return messageDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric'
      });
    }
  };

  const getConversationIcon = (conversation: ConversationMetadata) => {
    if (conversation.isEscalated) {
      return <AlertTriangle size={16} className="text-red-600" />;
    }
    
    switch (conversation.type) {
      case 'admin_governor':
        return <Crown size={16} className="text-purple-600" />;
      case 'affiliate_governor':
        return <Shield size={16} className="text-blue-600" />;
      case 'admin_affiliate':
        return <Users size={16} className="text-green-600" />;
      default:
        return <MessageSquare size={16} className="text-gray-600" />;
    }
  };

  const getPriorityIndicator = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>;
      case 'high':
        return <div className="w-2 h-2 bg-orange-500 rounded-full"></div>;
      case 'medium':
        return <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>;
      default:
        return <div className="w-2 h-2 bg-gray-400 rounded-full"></div>;
    }
  };

  const getOtherParticipants = (conversation: ConversationMetadata) => {
    return conversation.participants.filter(p => p.id !== user?.id);
  };

  if (loading) {
    return (
      <div className="w-80 bg-white border-r border-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm font-medium uppercase tracking-wide">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col min-h-0">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 uppercase tracking-wide">
            {user?.role === 'governor' ? 'ALL COMMUNICATIONS' : 'Messages'}
          </h2>
          <button
            onClick={onNewConversation}
            className="p-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 text-sm font-medium"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {filteredConversations.length === 0 ? (
          <div className="text-center py-12 px-6">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2 uppercase tracking-wide">
              No conversations
            </h3>
            <p className="text-gray-500 text-sm uppercase tracking-wide">
              {searchTerm ? 'No conversations match your search' : 'Start a new conversation'}
            </p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredConversations.map((conversation) => {
              const otherParticipants = getOtherParticipants(conversation);
              const isUnread = conversation.lastMessageSender !== user?.name;

              return (
                <motion.button
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation.id)}
                  whileHover={{ scale: 1.02 }}
                  className={`w-full text-left p-4 rounded-lg transition-all ${
                    selectedConversationId === conversation.id
                      ? 'bg-gray-100 border border-gray-300'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      {getConversationIcon(conversation)}
                    </div>
                    
                    {/* CONVERSATION PREVIEW - RESTORED */}
                    <div className="mb-2 p-2 bg-gray-50 rounded text-xs text-gray-600 border">
                      <div className="line-clamp-2 leading-relaxed">
                        {conversation.lastMessage ? (
                          <span>
                            <strong>{conversation.lastMessage.senderName}:</strong> {conversation.lastMessage.content}
                          </span>
                        ) : (
                          <span className="italic">No messages yet</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                     {/* Conversation Title and Department */}
                     <div className="flex items-center justify-between mb-1">
                       <h4 className="font-semibold text-gray-900 truncate uppercase tracking-wide text-sm">
                         {conversation.title || 'Communication'}
                       </h4>
                       <div className="flex items-center space-x-2">
                         {getPriorityIndicator(conversation.priority || 'low')}
                         <span className="text-xs text-gray-500 font-medium">
                           {formatTime(conversation.lastActivity)}
                         </span>
                       </div>
                     </div>
                     
                     {/* Department Tag */}
                     {conversation.department && (
                       <div className="mb-2">
                         <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium uppercase tracking-wide">
                           {conversation.department}
                         </span>
                       </div>
                     )}
                     
                     {/* Participants Info */}
                     <div className="flex items-center space-x-1 mb-2">
                       <span className="text-xs text-gray-600 font-medium uppercase tracking-wide">
                         Started by: {conversation.createdBy === user?.id ? 'You' : 
                           conversation.participants.find(p => p.id === conversation.createdBy)?.name || 'Unknown'}
                       </span>
                       {conversation.isEscalated && (
                         <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium uppercase tracking-wide">
                           <ArrowUp size={10} className="mr-1 inline" />
                           ESCALATED
                         </span>
                       )}
                     </div>
                     
                     {/* Message Preview */}
                     <div className="space-y-1">
                       <p className="text-sm text-gray-600 truncate font-medium">
                         {conversation.lastMessage || 'No messages yet'}
                       </p>
                       {conversation.lastMessage && (
                         <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded border">
                           <p className="font-medium uppercase tracking-wide mb-1">CONVERSATION PREVIEW:</p>
                           <p className="line-clamp-2">{conversation.lastMessage}</p>
                         </div>
                       )}
                     </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* Governor Audit Notice */}
      {user?.role === 'governor' && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">
            GOVERNOR OVERSIGHT: ALL PLATFORM COMMUNICATIONS VISIBLE
          </p>
        </div>
      )}
    </div>
  );
};

export default EnhancedConversationList;
