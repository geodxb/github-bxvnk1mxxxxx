import { useState, useEffect } from 'react';
import GovernorLayout from '../../components/layout/GovernorLayout';
import EnhancedConversationList from '../../components/messaging/EnhancedConversationList';
import EnhancedMessageThread from '../../components/messaging/EnhancedMessageThread';
import { EnhancedMessageService } from '../../services/enhancedMessageService';
import { useAuth } from '../../contexts/AuthContext';
import { useAvailableRecipients } from '../../hooks/useEnhancedMessages';
import { ConversationMetadata } from '../../types/conversation';
import { MessageSquare, Send, Users, Shield, Building, AlertTriangle, DollarSign, User, Crown, Eye } from 'lucide-react';

const GovernorEnhancedMessagesPage = () => {
  const { user } = useAuth();
  const { recipients, loading: recipientsLoading } = useAvailableRecipients(
    user?.id || '', 
    'governor'
  );
  
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<ConversationMetadata | null>(null);
  const [showNewMessageForm, setShowNewMessageForm] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);
  const [selectedDepartment, setSelectedDepartment] = useState('general');
  const [newMessageContent, setNewMessageContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAuditView, setShowAuditView] = useState(false);
  const [allConversations, setAllConversations] = useState<ConversationMetadata[]>([]);

  // Department options for Governor
  const departments = [
    { id: 'general', label: 'GENERAL OVERSIGHT', icon: <User size={16} />, color: 'text-gray-700' },
    { id: 'finance', label: 'FINANCIAL OVERSIGHT', icon: <DollarSign size={16} />, color: 'text-green-700' },
    { id: 'account', label: 'ACCOUNT OVERSIGHT', icon: <Building size={16} />, color: 'text-blue-700' },
    { id: 'fraud', label: 'FRAUD & VIOLATIONS', icon: <AlertTriangle size={16} />, color: 'text-red-700' },
    { id: 'compliance', label: 'COMPLIANCE OVERSIGHT', icon: <Shield size={16} />, color: 'text-purple-700' },
    { id: 'audit', label: 'AUDIT & INVESTIGATION', icon: <Eye size={16} />, color: 'text-indigo-700' }
  ];

  // Group recipients by role
  const groupedRecipients = {
    admins: recipients.filter(r => r.role === 'admin'),
    affiliates: recipients.filter(r => r.role === 'affiliate')
  };

  // Load all conversations for audit
  useEffect(() => {
    if (user?.role === 'governor') {
      loadAllConversationsForAudit();
    }
  }, [user]);

  const loadAllConversationsForAudit = async () => {
    try {
      const conversations = await EnhancedMessageService.getAllConversationsForAudit();
      setAllConversations(conversations);
    } catch (error) {
      console.error('Error loading conversations for audit:', error);
    }
  };

  const handleNewConversation = () => {
    setShowNewMessageForm(true);
    setSelectedRecipient(null);
    setNewMessageContent('');
    setSelectedDepartment('general');
  };

  const handleSendNewMessage = async () => {
    if (!newMessageContent.trim() || !user || !selectedRecipient) return;

    setIsLoading(true);
    
    try {
      const selectedDept = departments.find(d => d.id === selectedDepartment);
      const departmentLabel = selectedDept?.label || 'GENERAL OVERSIGHT';
      
      console.log('🔄 Governor creating new enhanced conversation:', {
        sender: `${user.name} (${user.role})`,
        recipient: `${selectedRecipient.name} (${selectedRecipient.role})`,
        department: departmentLabel
      });
      
      // Get or create conversation with the selected recipient
      const conversationId = await EnhancedMessageService.getOrCreateEnhancedConversation(
        user.id,
        user.name,
        'governor',
        selectedRecipient.id,
        selectedRecipient.name,
        selectedRecipient.role,
        departmentLabel
      );
      
      console.log('✅ Governor conversation created/found:', conversationId);
      
      // Send message
      await EnhancedMessageService.sendEnhancedMessage(
        conversationId,
        user.id,
        `${user.name} - ${departmentLabel}`,
        'governor',
        newMessageContent.trim(),
        'high',
        departmentLabel,
        undefined,
        false,
        undefined,
        'text'
      );
      
      console.log('✅ Governor enhanced conversation created and message sent');
      setSelectedConversationId(conversationId);
      setNewMessageContent('');
      setShowNewMessageForm(false);
      setSelectedRecipient(null);
    } catch (error) {
      console.error('❌ Error creating governor enhanced conversation:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinConversation = async () => {
    if (!selectedConversationId || !user) return;

    try {
      await EnhancedMessageService.joinConversation(
        selectedConversationId,
        user.id,
        user.name,
        'governor'
      );
    } catch (error) {
      console.error('Error joining conversation:', error);
    }
  };

  return (
    <GovernorLayout title="COMMUNICATION OVERSIGHT">
      <div className="mb-6">
        <div className="bg-white border border-gray-300 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">COMMUNICATION OVERSIGHT CENTER</h1>
              <p className="text-gray-600 uppercase tracking-wide text-sm font-medium">COMPLETE OVERSIGHT OF ALL PLATFORM COMMUNICATIONS</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowAuditView(!showAuditView)}
                className="px-4 py-2 bg-gray-900 text-white font-bold hover:bg-gray-800 transition-colors uppercase tracking-wide border border-gray-700"
              >
                <Eye size={16} className="mr-2 inline" />
                {showAuditView ? 'HIDE AUDIT VIEW' : 'SHOW AUDIT VIEW'}
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700 uppercase tracking-wide">OVERSIGHT ACTIVE</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Audit View */}
      {showAuditView && (
        <div className="bg-white border border-gray-300 mb-6">
          <div className="px-6 py-4 border-b border-gray-300 bg-purple-50">
            <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">
              COMMUNICATION AUDIT TRAIL ({allConversations.length} CONVERSATIONS)
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {allConversations.map((conv) => (
                <div key={conv.id} className="bg-gray-50 p-4 border border-gray-200 rounded">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900 uppercase tracking-wide">{conv.title}</p>
                      <p className="text-sm text-gray-600 uppercase tracking-wide">
                        PARTICIPANTS: {conv.participants.map(p => `${p.name} (${p.role})`).join(', ')}
                      </p>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">
                        CREATED: {conv.createdAt.toLocaleDateString()} | LAST ACTIVITY: {conv.lastActivity.toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedConversationId(conv.id)}
                      className="px-3 py-2 bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition-colors uppercase tracking-wide"
                    >
                      <Eye size={14} className="mr-1 inline" />
                      AUDIT
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white border border-gray-300 h-[calc(100vh-120px)] flex">
        {/* Enhanced Conversation List */}
        <EnhancedConversationList
          selectedConversationId={selectedConversationId}
          onSelectConversation={setSelectedConversationId}
          onNewConversation={handleNewConversation}
        />
        
        {/* Enhanced Message Thread */}
        {selectedConversationId ? (
          <EnhancedMessageThread
            conversationId={selectedConversationId}
            conversation={selectedConversation}
            onJoinConversation={handleJoinConversation}
          />
        ) : showNewMessageForm ? (
          <div className="flex-1 flex flex-col">
            <div className="px-6 py-4 border-b border-gray-300 bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">
                NEW MANAGEMENT COMMUNICATION
              </h3>
            </div>
            
            <div className="flex-1 p-6 space-y-6">
              {/* Department Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                  SELECT OVERSIGHT DEPARTMENT
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {departments.map((dept) => (
                    <button
                      key={dept.id}
                      onClick={() => setSelectedDepartment(dept.id)}
                      className={`p-3 border border-gray-300 text-left transition-all ${
                        selectedDepartment === dept.id
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        {dept.icon}
                        <span className="font-bold text-xs uppercase tracking-wide">{dept.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Enhanced Recipient Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                  SELECT RECIPIENT
                </label>
                <div className="max-h-48 overflow-y-auto border border-gray-300">
                  {/* Admin Team */}
                  {groupedRecipients.admins.length > 0 && (
                    <div>
                      <div className="px-4 py-2 bg-blue-50 border-b border-blue-200">
                        <div className="flex items-center space-x-2">
                          <Shield size={16} className="text-blue-600" />
                          <span className="font-bold text-blue-800 text-sm uppercase tracking-wide">
                            ADMIN TEAM
                          </span>
                        </div>
                      </div>
                      {groupedRecipients.admins.map((recipient) => (
                        <button
                          key={recipient.id}
                          onClick={() => setSelectedRecipient(recipient)}
                          className={`w-full text-left p-4 border-b border-gray-200 transition-colors ${
                            selectedRecipient?.id === recipient.id
                              ? 'bg-gray-900 text-white'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-bold text-sm uppercase tracking-wide">{recipient.name}</p>
                              <p className="text-xs uppercase tracking-wide opacity-75">
                                ADMIN USER
                              </p>
                            </div>
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Affiliates */}
                  {groupedRecipients.affiliates.length > 0 && (
                    <div>
                      <div className="px-4 py-2 bg-green-50 border-b border-green-200">
                        <div className="flex items-center space-x-2">
                          <Users size={16} className="text-green-600" />
                          <span className="font-bold text-green-800 text-sm uppercase tracking-wide">
                            AFFILIATES ({groupedRecipients.affiliates.length})
                          </span>
                        </div>
                      </div>
                      {groupedRecipients.affiliates.map((recipient) => (
                        <button
                          key={recipient.id}
                          onClick={() => setSelectedRecipient(recipient)}
                          className={`w-full text-left p-4 border-b border-gray-200 transition-colors ${
                            selectedRecipient?.id === recipient.id
                              ? 'bg-gray-900 text-white'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-bold text-sm uppercase tracking-wide">{recipient.name}</p>
                              <p className="text-xs uppercase tracking-wide opacity-75">
                                AFFILIATE - {recipient.country}
                              </p>
                              {recipient.accountStatus && (
                                <p className="text-xs uppercase tracking-wide opacity-60">
                                  STATUS: {recipient.accountStatus}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-sm">${recipient.currentBalance?.toLocaleString() || '0'}</p>
                              <p className="text-xs opacity-75">BALANCE</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Message Content */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  MESSAGE CONTENT
                </label>
                <textarea
                  value={newMessageContent}
                  onChange={(e) => setNewMessageContent(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 font-medium"
                  rows={8}
                  placeholder="TYPE YOUR MANAGEMENT MESSAGE HERE..."
                />
              </div>
              
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowNewMessageForm(false)}
                  className="flex-1 px-4 py-3 bg-white border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors uppercase tracking-wide"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleSendNewMessage}
                  disabled={!newMessageContent.trim() || !selectedRecipient || isLoading}
                  className="flex-1 px-4 py-3 bg-gray-900 text-white font-bold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide"
                >
                  <Send size={16} className="mr-2 inline" />
                  {isLoading ? 'SENDING...' : 'SEND MESSAGE'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-200 border border-gray-400 flex items-center justify-center mx-auto mb-6">
                <MessageSquare size={40} className="text-gray-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wide">
                GOVERNOR COMMUNICATION CENTER
              </h3>
              <p className="text-gray-600 mb-6 uppercase tracking-wide text-sm font-medium">
                OVERSEE ALL PLATFORM COMMUNICATIONS AND SEND MANAGEMENT DIRECTIVES
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowNewMessageForm(true)}
                  className="px-6 py-3 bg-gray-900 text-white font-bold hover:bg-gray-800 transition-colors uppercase tracking-wide"
                >
                  <Send size={18} className="mr-2 inline" />
                  START MANAGEMENT COMMUNICATION
                </button>
                <button
                  onClick={() => setShowAuditView(!showAuditView)}
                  className="px-6 py-3 bg-gray-900 text-white font-bold hover:bg-gray-800 transition-colors uppercase tracking-wide border border-gray-700"
                >
                  <Eye size={18} className="mr-2 inline" />
                  AUDIT ALL COMMUNICATIONS
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </GovernorLayout>
  );
};

export default GovernorEnhancedMessagesPage;