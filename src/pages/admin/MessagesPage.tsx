import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ConversationList from '../../components/messaging/ConversationList';
import MessageThread from '../../components/messaging/MessageThread';
import { MessageService } from '../../services/messageService';
import { useAuth } from '../../contexts/AuthContext';
import { useInvestors } from '../../hooks/useFirestore';
import { MessageSquare, Send, Users, Shield, Building, AlertTriangle, DollarSign, User } from 'lucide-react';

const MessagesPage = () => {
  const { user, setGlobalLoading } = useAuth();
  const { investors } = useInvestors();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [showNewMessageForm, setShowNewMessageForm] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);
  const [selectedDepartment, setSelectedDepartment] = useState('general');
  const [newMessageContent, setNewMessageContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Department options for Admin
  const departments = [
    { id: 'general', label: 'GENERAL ASSISTANCE', icon: <User size={16} />, color: 'text-gray-700' },
    { id: 'finance', label: 'FINANCE SUPPORT', icon: <DollarSign size={16} />, color: 'text-green-700' },
    { id: 'account', label: 'ACCOUNT MANAGEMENT', icon: <Building size={16} />, color: 'text-blue-700' },
    { id: 'compliance', label: 'COMPLIANCE REVIEW', icon: <Shield size={16} />, color: 'text-purple-700' },
    { id: 'technical', label: 'TECHNICAL SUPPORT', icon: <Users size={16} />, color: 'text-indigo-700' },
    { id: 'urgent', label: 'URGENT MATTERS', icon: <AlertTriangle size={16} />, color: 'text-red-700' }
  ];

  // Get all possible recipients (all investors)
  const getAllRecipients = () => {
    const recipients: any[] = [];

    // Add single Management Team option
    recipients.push({
      id: 'management_team',
      name: 'Management Team',
      type: 'governor',
      email: 'sam@interactivebrokers.us',
      role: 'governor',
      title: 'Management Team'
    });

    // Add all investors
    investors.forEach(investor => {
      recipients.push({
        id: investor.id,
        name: investor.name,
        type: 'investor',
        email: investor.email || '',
        country: investor.country,
        accountStatus: investor.accountStatus || 'Active',
        currentBalance: investor.currentBalance
      });
    });

    return recipients;
  };

  // Auto-create or find conversation for investor users
  useEffect(() => {
    if (user?.role === 'investor' && !selectedConversationId) {
      // For investors, automatically create/find conversation with admin
      handleNewConversation();
    }
  }, [user]);

  const handleNewConversation = async () => {
    if (!user) return;
    
    try {
      console.log('🔄 Creating conversation for user:', user.name, 'Role:', user.role);
      const conversationId = await MessageService.getOrCreateConversation(
        user.id,
        user.name,
        user.role === 'admin' ? 'admin' : 'affiliate'
      );
      console.log('✅ Conversation created/found:', conversationId);
      setSelectedConversationId(conversationId);
      setShowNewMessageForm(false);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const handleSendNewMessage = async () => {
    if (!newMessageContent.trim() || !user) return;
    
    // For admin users, require recipient selection
    if (user.role === 'admin' && !selectedRecipient) {
      alert('Please select a recipient for your message');
      return;
    }

    setIsLoading(true);
    
    try {
      if (user.role === 'admin' && selectedRecipient) {
        const selectedDept = departments.find(d => d.id === selectedDepartment);
        const departmentLabel = selectedDept?.label || 'GENERAL ASSISTANCE';
        
        console.log('🔄 Admin sending message to:', selectedRecipient.id === 'management_team' ? 'Management Team' : selectedRecipient.name, 'Department:', departmentLabel);
        
        let targetUserId = selectedRecipient.id;
        let targetUserName = selectedRecipient.name;
        
        // Route Management Team to Sam Hivanek
        if (selectedRecipient.id === 'management_team') {
          targetUserId = '2cSQTHfSSPUXAVaSKGl8zdO9hiC3'; // Sam's Firebase UID
          targetUserName = 'Sam Hivanek';
        }
        
        // Create conversation with the target user
        const actualConversationId = await MessageService.getOrCreateConversation(
          user.id,
          `Admin - ${departmentLabel}`,
          'admin',
          targetUserId
        );
        
        // Send the message
        await MessageService.sendMessage(
          user.id,
          `Admin - ${departmentLabel}`,
          'admin',
          newMessageContent.trim(),
          actualConversationId,
          undefined,
          'medium',
          departmentLabel
        );
        
        console.log('✅ Admin message sent with department context to:', targetUserName);
        
        setSelectedConversationId(actualConversationId);
      } else {
        // For investor users, use existing logic
        console.log('🔄 Sending new message from:', user.name, 'Role:', user.role);
        const messageId = await MessageService.sendMessage(
          user.id,
          user.name,
          user.role === 'admin' ? 'admin' : 'affiliate',
          newMessageContent.trim()
        );
        
        // Get the conversation ID for this user
        const conversationId = await MessageService.getOrCreateConversation(
          user.id,
          user.name,
          user.role === 'admin' ? 'admin' : 'affiliate'
        );
        setSelectedConversationId(conversationId);
      }
      
      setNewMessageContent('');
      setSelectedRecipient(null);
      setShowNewMessageForm(false);
    } catch (error) {
      console.error('❌ Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout title="Messages">      
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-[calc(100vh-120px)] flex">
        {/* Conversation List */}
        <ConversationList
          selectedConversationId={selectedConversationId}
          onSelectConversation={setSelectedConversationId}
          onNewConversation={handleNewConversation}
        />
        
        {/* Message Thread */}
        {selectedConversationId ? (
          <MessageThread
            conversationId={selectedConversationId}
            recipientName={user?.role === 'admin' ? 'Affiliate' : 'Admin'}
          />
        ) : showNewMessageForm ? (
          <div className="flex-1 flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 uppercase tracking-wide">
                {user?.role === 'admin' ? 'NEW ADMIN MESSAGE' : 'New Message'}
              </h3>
            </div>
            
            <div className="flex-1 p-6">
              <div className="space-y-6">
                {/* Department Selection - Only for Admin */}
                {user?.role === 'admin' && (
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
                )}

                {/* Recipient Selection - Only for Admin */}
                {user?.role === 'admin' && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                      SELECT RECIPIENT
                    </label>
                    <div className="max-h-48 overflow-y-auto border border-gray-300">
                      {getAllRecipients().map((recipient) => (
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
                              {recipient.type === 'governor' ? (
                                <p className="text-xs uppercase tracking-wide opacity-75">
                                  {recipient.title || 'MANAGEMENT TEAM'}
                                </p>
                              ) : (
                                <>
                                  <p className="text-xs uppercase tracking-wide opacity-75">
                                    INVESTOR - {recipient.country}
                                  </p>
                                  {recipient.accountStatus && (
                                    <p className="text-xs uppercase tracking-wide opacity-60">
                                      STATUS: {recipient.accountStatus}
                                    </p>
                                  )}
                                </>
                              )}
                            </div>
                            <div className="text-right">
                              {recipient.type === 'governor' ? (
                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                              ) : (
                                <>
                                  <p className="font-bold text-sm">${recipient.currentBalance?.toLocaleString() || '0'}</p>
                                  <p className="text-xs opacity-75">BALANCE</p>
                                </>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

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
                    disabled={!newMessageContent.trim() || isLoading || (user?.role === 'admin' && !selectedRecipient)}
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
                {user?.role === 'admin' ? 'ADMIN COMMUNICATION CENTER' : 'Admin Communication'}
              </h3>
              <p className="text-gray-600 mb-6 uppercase tracking-wide text-sm">
                {user?.role === 'admin' 
                  ? 'SEND MESSAGES TO ANY INVESTOR WITH DEPARTMENT CONTEXT'
                  : 'Start a conversation with the admin team'
                }
              </p>
              <button
                onClick={() => setShowNewMessageForm(true)}
                className="px-6 py-3 bg-gray-900 text-white font-bold hover:bg-gray-800 transition-colors uppercase tracking-wide border border-gray-700"
              >
                <Send size={18} className="mr-2 inline" />
                {user?.role === 'admin' ? 'START NEW COMMUNICATION' : 'Start New Conversation'}
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MessagesPage;