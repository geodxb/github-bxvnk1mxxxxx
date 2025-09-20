import { useState } from 'react';
import { motion } from 'framer-motion';
import { useConversations } from '../../hooks/useMessages';
import { useAuth } from '../../contexts/AuthContext';
import { Conversation } from '../../types/message';
import { 
  MessageSquare, 
  User, 
  Clock,
  Search,
  Plus,
  Circle
} from 'lucide-react';

interface ConversationListProps {
  selectedConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
}

const ConversationList = ({ 
  selectedConversationId, 
  onSelectConversation,
  onNewConversation 
}: ConversationListProps) => {
  const { user } = useAuth();
  const { conversations, loading } = useConversations(user?.id || '');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredConversations = conversations.filter(conv =>
    conv.participantNames.some(name => 
      name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
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

  const getOtherParticipantName = (conversation: Conversation) => {
    if (user?.role === 'admin' || user?.role === 'governor') {
      return conversation.participantNames.find(name => name !== user.name) || 'Affiliate';
    } else {
      return user?.role === 'governor' ? 'System User' : 'Admin';
    }
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
          <h2 className="text-lg font-semibold text-gray-900 uppercase tracking-wide">Messages</h2>
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
            {filteredConversations.map((conversation) => (
              <motion.button
                key={conversation.id}
                onClick={() => onSelectConversation(conversation.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full text-left p-4 rounded-lg transition-all ${
                  selectedConversationId === conversation.id
                    ? 'bg-gray-100 border border-gray-300'
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User size={16} className="text-gray-600" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-gray-900 truncate uppercase tracking-wide text-sm">
                        {getOtherParticipantName(conversation)}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500 font-medium">
                          {formatTime(conversation.lastMessageTime)}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 truncate font-medium">
                      {conversation.lastMessage || 'No messages yet'}
                    </p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationList;