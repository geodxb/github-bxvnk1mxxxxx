import { useState, useEffect } from 'react';
import GovernorLayout from '../../components/layout/GovernorLayout';
import ConversationList from '../../components/messaging/ConversationList';
import MessageThread from '../../components/messaging/MessageThread';
import { MessageService } from '../../services/messageService';
import { useAuth } from '../../contexts/AuthContext';
import { useInvestors } from '../../hooks/useFirestore';
import { MessageSquare, Send, Users, Shield, Building, AlertTriangle, DollarSign, User } from 'lucide-react';

const GovernorMessagesPage = () => {
  const { user } = useAuth();
  const { investors } = useInvestors();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [showNewMessageForm, setShowNewMessageForm] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);
  const [selectedDepartment, setSelectedDepartment] = useState('general');
  const [newMessageContent, setNewMessageContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Department options for Governor
  const departments = [
    { id: 'general', label: 'GENERAL ASSISTANCE', icon: <User size={16} />, color: 'text-gray-700' },
    { id: 'finance', label: 'FINANCE SUPPORT', icon: <DollarSign size={16} />, color: 'text-green-700' },
    { id: 'account', label: 'ACCOUNT MANAGEMENT', icon: <Building size={16} />, color: 'text-blue-700' },
    { id: 'fraud', label: 'FRAUD & VIOLATIONS', icon: <AlertTriangle size={16} />, color: 'text-red-700' },
    { id: 'compliance', label: 'COMPLIANCE REVIEW', icon: <Shield size={16} />, color: 'text-purple-700' },
    { id: 'technical', label: 'TECHNICAL SUPPORT', icon: <Users size={16} />, color: 'text-indigo-700' }
  ];

  // Get all possible recipients (admin + all investors)
  const getAllRecipients = () => {
    const recipients = [
      {
        id: 'admin',
        name: 'Admin Team',
        type: 'admin',
        email: 'crisdoraodxb@gmail.com'
      }
    ];

    // Add all investors
    investors.forEach(investor => {
      recipients.push({
        id: investor.id,
        name: investor.name,
        type: 'investor',
        email: investor.email || '',
        country: investor.country,
        accountStatus: investor.accountStatus || 'Active'
      });
    });

    return recipients;
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
      
      console.log('🔄 Governor sending message to:', selectedRecipient.name, 'Department:', departmentLabel);
      
      // Create conversation with the selected recipient
      const conversationId = await MessageService.getOrCreateConversation(
        user.id,
        `Support - ${departmentLabel}`,
        'governor'
      );
      
      // Send message with department context
      await MessageService.sendMessage(
        user.id,
        `Support - ${departmentLabel}`,
        'governor',
        newMessageContent.trim(),
        conversationId,
        undefined,
        'medium',
        departmentLabel
      );
      
      console.log('✅ Governor message sent with department context');
      setSelectedConversationId(conversationId);
      setNewMessageContent('');
      setShowNewMessageForm(false);
      setSelectedRecipient(null);
    } catch (error) {
      console.error('Error sending governor message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GovernorLayout title="COMMUNICATION CONTROL">
      <div className="mb-6">
        <div className="bg-white border border-gray-300 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">COMMUNICATION CONTROL CENTER</h1>
              <p className="text-gray-600 uppercase tracking-wide text-sm font-medium">DIRECT COMMUNICATION WITH ALL SYSTEM USERS</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700 uppercase tracking-wide">COMMUNICATION ACTIVE</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white border border-gray-300 h-[calc(100vh-200px)] flex">
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
            recipientName="System User"
          />
        ) : showNewMessageForm ? (
          <div className="flex-1 flex flex-col">
            <div className="px-6 py-4 border-b border-gray-300 bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">
                NEW SUPPORT MESSAGE
              </h3>
            </div>
            
            <div className="flex-1 p-6 space-y-6">
              {/* Department Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                  SELECT SUPPORT DEPARTMENT
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

              {/* Recipient Selection */}
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
                          <p className="text-xs uppercase tracking-wide opacity-75">
                            {recipient.type === 'admin' ? 'ADMIN USER' : `INVESTOR - ${recipient.country}`}
                          </p>
                          {recipient.type === 'investor' && recipient.accountStatus && (
                            <p className="text-xs uppercase tracking-wide opacity-60">
                              STATUS: {recipient.accountStatus}
                            </p>
                          )}
                        </div>
                        <div className={`w-3 h-3 rounded-full ${
                          recipient.type === 'admin' ? 'bg-blue-500' : 'bg-gray-500'
                        }`}></div>
                      </div>
                    </button>
                  ))}
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
                  placeholder="TYPE YOUR MESSAGE HERE..."
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
                SEND MESSAGES TO ANY ADMIN OR INVESTOR WITH DEPARTMENT CONTEXT
              </p>
              <button
                onClick={() => setShowNewMessageForm(true)}
                className="px-6 py-3 bg-gray-900 text-white font-bold hover:bg-gray-800 transition-colors uppercase tracking-wide"
              >
                <Send size={18} className="mr-2 inline" />
                START NEW COMMUNICATION
              </button>
            </div>
          </div>
        )}
      </div>
    </GovernorLayout>
  );
};

export default GovernorMessagesPage;