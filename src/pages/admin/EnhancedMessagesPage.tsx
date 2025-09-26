import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import EnhancedConversationList from '../../components/messaging/EnhancedConversationList';
import EnhancedMessageThread from '../../components/messaging/EnhancedMessageThread';
import { EnhancedMessageService } from '../../services/enhancedMessageService';
import { useAuth } from '../../contexts/AuthContext';
import { useAvailableRecipients } from '../../hooks/useEnhancedMessages';
import { ConversationMetadata } from '../../types/conversation';
import { MessageSquare, Send, Users, Shield, Building, AlertTriangle, DollarSign, User, Crown } from 'lucide-react';

const EnhancedMessagesPage = () => {
  const { user } = useAuth();
  const { recipients, loading: recipientsLoading } = useAvailableRecipients(
    user?.id || '', 
    user?.role === 'admin' ? 'admin' : user?.role === 'governor' ? 'governor' : 'affiliate'
  );
  
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<ConversationMetadata | null>(null);
  const [showNewMessageForm, setShowNewMessageForm] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);
  const [selectedDepartment, setSelectedDepartment] = useState('general');
  const [newMessageContent, setNewMessageContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Department options
  const departments = [
    { id: 'general', label: 'GENERAL ASSISTANCE', icon: <User size={16} />, color: 'text-gray-700' },
    { id: 'finance', label: 'FINANCE SUPPORT', icon: <DollarSign size={16} />, color: 'text-green-700' },
    { id: 'account', label: 'ACCOUNT MANAGEMENT', icon: <Building size={16} />, color: 'text-blue-700' },
    { id: 'compliance', label: 'COMPLIANCE REVIEW', icon: <Shield size={16} />, color: 'text-purple-700' },
    { id: 'technical', label: 'TECHNICAL SUPPORT', icon: <Users size={16} />, color: 'text-indigo-700' },
    { id: 'urgent', label: 'URGENT MATTERS', icon: <AlertTriangle size={16} />, color: 'text-red-700' }
  ];

  // Group recipients by role
  const groupedRecipients = {
    admins: recipients.filter(r => r.role === 'admin'),
    affiliates: recipients.filter(r => r.role === 'affiliate')
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
      const departmentLabel = selectedDept?.label || 'GENERAL ASSISTANCE';
      
      console.log('🔄 Admin creating new enhanced conversation:', {
        sender: `${user.name} (${user.role})`,
        recipient: selectedRecipient.id === 'management_team' ? 'Management Team (governor)' : `${selectedRecipient.name} (${selectedRecipient.role})`,
        department: departmentLabel
      });
      
      let conversationId;
      
      if (selectedRecipient.id === 'management_team') {
        // Route to Sam Hivanek specifically
        console.log('🔄 Creating conversation with Management Team for department:', departmentLabel);
        conversationId = await EnhancedMessageService.getOrCreateEnhancedConversation(
          user.id,
          user.name, 
          'admin',
          '2cSQTHfSSPUXAVaSKGl8zdO9hiC3', // Sam's Firebase UID
          'Sam Hivanek',
          'governor',
          departmentLabel
        );
      } else {
        // Regular recipient
        console.log('🔄 Creating conversation with recipient for department:', departmentLabel);
        conversationId = await EnhancedMessageService.getOrCreateEnhancedConversation(
          user.id,
          user.name, 
          'admin',
          selectedRecipient.id,
          selectedRecipient.name,
          selectedRecipient.role,
          departmentLabel
        );
      }
      
      console.log('✅ Conversation created/found:', conversationId);
      
      // Send message
      await EnhancedMessageService.sendEnhancedMessage(
        conversationId,
        user.id,
        user.name,
        'admin',
        newMessageContent.trim(),
        'medium',
        departmentLabel,
        undefined,
        false,
        undefined,
        'text'
      );
      
      console.log('✅ Admin enhanced message sent');
      setSelectedConversationId(conversationId);
      setNewMessageContent('');
      setShowNewMessageForm(false);
      setSelectedRecipient(null);
    } catch (error) {
      console.error('❌ Error creating admin enhanced conversation:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEscalateConversation = async (reason: string) => {
    if (!selectedConversationId || !user) return;

    try {
      await EnhancedMessageService.escalateConversation(
        selectedConversationId,
        user.id,
        user.name,
        user.role === 'admin' ? 'admin' : 'affiliate',
        reason
      );
    } catch (error) {
      console.error('Error escalating conversation:', error);
    }
  };

  const handleJoinConversation = async () => {
    if (!selectedConversationId || !user || user.role !== 'governor') return;

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
    <DashboardLayout title="Enhanced Messages">      
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-[calc(100vh-120px)] flex">
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
            onEscalate={handleEscalateConversation}
            onJoinConversation={handleJoinConversation}
          />
        ) : showNewMessageForm ? (
          <div className="flex-1 flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 uppercase tracking-wide">
                {user?.role === 'admin' ? 'NEW ADMIN COMMUNICATION' : 
                 user?.role === 'governor' ? 'NEW MANAGEMENT COMMUNICATION' : 
                 'New Message'}
              </h3>
            </div>
            
            <div className="flex-1 p-6">
              <div className="space-y-6">
                {/* Department Selection */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                    SELECT DEPARTMENT
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
                  <div className="max-h-64 overflow-y-auto border border-gray-300">
                    {/* Management Team (Single Option) */}
                    <div>
                      <div className="px-4 py-2 bg-purple-50 border-b border-purple-200">
                        <div className="flex items-center space-x-2">
                          <Crown size={16} className="text-purple-600" />
                          <span className="font-bold text-purple-800 text-sm uppercase tracking-wide">
                            MANAGEMENT TEAM
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedRecipient({
                          id: 'management_team',
                          name: 'Management Team',
                          role: 'governor',
                          email: 'sam@interactivebrokers.us',
                          title: 'MANAGEMENT TEAM'
                        })}
                        className={`w-full text-left p-4 border-b border-gray-200 transition-colors ${
                          selectedRecipient?.id === 'management_team'
                            ? 'bg-gray-900 text-white'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-sm uppercase tracking-wide">MANAGEMENT TEAM</p>
                            <p className="text-xs uppercase tracking-wide opacity-75">
                              EXECUTIVE OVERSIGHT
                            </p>
                          </div>
                          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        </div>
                      </button>
                    </div>

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

                    {/* Affiliates (Investors) */}
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
                  <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                    Message Content
                  </label>
                  <textarea
                    value={newMessageContent}
                    onChange={(e) => setNewMessageContent(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
                    rows={8}
                    placeholder="Type your message here..."
                  />
                </div>
                
                <div className="flex justify-end">
                  <button
                    onClick={handleSendNewMessage}
                    disabled={!newMessageContent.trim() || !selectedRecipient || isLoading}
                    className="px-6 py-3 bg-gray-900 text-white font-medium hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors rounded-lg uppercase tracking-wide"
                  >
                    <Send size={16} className="mr-2 inline" />
                    {isLoading ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageSquare size={40} className="text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 uppercase tracking-wide">
                {user?.role === 'admin' ? 'ADMIN COMMUNICATION CENTER' : 
                 user?.role === 'governor' ? 'MANAGEMENT COMMUNICATION CENTER' : 
                 'Communication Center'}
              </h3>
              <p className="text-gray-600 mb-6 uppercase tracking-wide text-sm">
                {user?.role === 'admin' 
                  ? 'COMMUNICATE WITH MANAGEMENT TEAM AND AFFILIATES'
                  : user?.role === 'governor'
                  ? 'OVERSEE ALL PLATFORM COMMUNICATIONS'
                  : 'Start a conversation with the admin team'
                }
              </p>
              <button
                onClick={() => setShowNewMessageForm(true)}
                className="px-6 py-3 bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors rounded-lg uppercase tracking-wide"
              >
                <Send size={18} className="mr-2 inline" />
                {user?.role === 'admin' ? 'START NEW COMMUNICATION' : 
                 user?.role === 'governor' ? 'START MANAGEMENT COMMUNICATION' : 
                 'Start New Conversation'}
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default EnhancedMessagesPage;