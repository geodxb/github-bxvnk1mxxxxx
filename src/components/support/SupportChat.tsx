import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageCircle, User, Mail, CreditCard, Loader2, HelpCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useInvestor, useTransactions } from '../../hooks/useFirestore';
import { SupportService } from '../../services/supportService';

interface Message {
  id: string;
  type: 'user' | 'support';
  content: string;
  timestamp: Date;
}

interface SupportChatProps {
  isOpen: boolean;
  onClose: () => void;
}

const SupportChat = ({ isOpen, onClose }: SupportChatProps) => {
  const { user } = useAuth();
  const { investor } = useInvestor(user?.id || '');
  const { transactions } = useTransactions(user?.id);
  
  const [isIdentified, setIsIdentified] = useState(false);
  const [identificationData, setIdentificationData] = useState({
    name: '',
    email: '',
    clientId: ''
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const supportOptions = [
    { id: 'account', label: 'Account Information', icon: <User size={16} /> },
    { id: 'balance', label: 'Balance & Transactions', icon: <CreditCard size={16} /> },
    { id: 'withdrawal', label: 'Withdrawal Support', icon: <Mail size={16} /> },
    { id: 'general', label: 'General Inquiry', icon: <HelpCircle size={16} /> }
  ];

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isIdentified) {
      // Reset state when opening
      setIdentificationData({
        name: user?.name || '',
        email: user?.email || '',
        clientId: user?.id?.slice(-8) || ''
      });
      setSelectedOption(null);
      setMessages([{
        id: Date.now().toString(),
        type: 'support',
        content: 'Welcome to Interactive Brokers Support. How can I assist you today?',
        timestamp: new Date()
      }]);
      
      // Auto-identify if user is logged in
      if (user?.name && user?.email && user?.id) {
        setTimeout(() => {
          setIsIdentified(true);
          setMessages(prev => [...prev, 
            {
              id: (Date.now() + 1).toString(),
              type: 'support',
              content: `Thank you ${user.name}. How can I assist you today? Please select from the options below or type your question directly.`,
              timestamp: new Date()
            }
          ]);
        }, 500);
      }
    }
  }, [isOpen, isIdentified, user]);

  const handleIdentification = () => {
    if (!identificationData.name || !identificationData.email || !identificationData.clientId) {
      return;
    }

    setIsLoading(true);
    
    // Auto-verify credentials for now
    setTimeout(() => {
      setIsIdentified(true);
      setMessages(prev => [...prev, 
        {
          id: Date.now().toString(),
          type: 'user',
          content: `Name: ${identificationData.name}, Email: ${identificationData.email}, Client ID: ${identificationData.clientId}`,
          timestamp: new Date()
        },
        {
          id: (Date.now() + 1).toString(),
          type: 'support',
          content: `Thank you ${identificationData.name}. How can I assist you today? Please select from the options below or type your question directly.`,
          timestamp: new Date()
        }
      ]);
      setIsLoading(false);
    }, 1000);
  };

  const handleOptionSelect = async (optionId: string) => {
    setSelectedOption(optionId);
    const option = supportOptions.find(opt => opt.id === optionId);
    
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      type: 'user',
      content: `I need help with: ${option?.label}`,
      timestamp: new Date()
    }]);

    setIsLoading(true);

    try {
      // Prepare context for AI
      const context = {
        investor: investor,
        transactions: transactions,
        selectedOption: optionId,
        conversationHistory: messages.slice(-10), // Last 10 messages for context
        userRole: user?.role || 'investor',
        hasSystemAccess: true
      };

      // Get response based on selected option
      const response = await SupportService.generateQuickResponse(optionId, context);

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'support',
        content: response,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Error generating response:', error);
      
      // Fallback response
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'support',
        content: 'I apologize, but I encountered an issue generating a response. How can I help you today?',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    // Add user message
    const newUserMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMessage]);

    try {
      // Prepare context for AI
      const context = {
        investor: investor,
        transactions: transactions,
        selectedOption: selectedOption,
        conversationHistory: messages.slice(-10), // Last 10 messages for context
        userRole: user?.role || 'investor',
        hasSystemAccess: true
      };

      // Get AI response
      const aiResponse = await SupportService.getChatResponse(userMessage, context);

      // Add AI response
      const supportMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'support',
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, supportMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      // Fallback response
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'support',
        content: 'I apologize, but I encountered an issue processing your request. Please try asking in a different way, or ask about a specific investor by name, such as "Tell me about Pamela Medina".',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (isIdentified) {
        handleSendMessage();
      } else {
        handleIdentification();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, x: 400 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 400 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src="/Screenshot 2025-06-07 024813.png" 
                alt="Interactive Brokers" 
                className="h-8 w-auto object-contain"
              />
              <div>
                <h3 className="font-semibold">Support</h3>
                <p className="text-gray-300 text-sm">How can we help?</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <div className="text-sm whitespace-pre-line">{message.content}</div>
                  <p className={`text-xs mt-1 ${
                    message.type === 'user' ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {/* Support Options */}
            {isIdentified && !selectedOption && messages.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600 font-medium">Quick Options:</p>
                <div className="grid grid-cols-2 gap-2">
                  {supportOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleOptionSelect(option.id)}
                      className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        {option.icon}
                        <span className="text-xs font-medium text-gray-800">{option.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-gray-800 text-xs font-medium mb-1">Pro Tip:</p>
                  <p className="text-gray-700 text-xs">
                    Ask about any investor by name! For example: "Tell me about Pamela Medina" or "Show me Omar Ehab's withdrawal history"
                  </p>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Loader2 size={16} className="animate-spin text-gray-600" />
                    <span className="text-sm text-gray-600">Support is typing...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4">
            {!isIdentified ? (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={identificationData.name}
                  onChange={(e) => setIdentificationData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-sm"
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={identificationData.email}
                  onChange={(e) => setIdentificationData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-sm"
                />
                <input
                  type="text"
                  placeholder="Client ID"
                  value={identificationData.clientId}
                  onChange={(e) => setIdentificationData(prev => ({ ...prev, clientId: e.target.value }))}
                  onKeyPress={handleKeyPress}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-sm"
                />
                <button
                  onClick={handleIdentification}
                  disabled={!identificationData.name || !identificationData.email || !identificationData.clientId || isLoading}
                  className="w-full bg-gray-900 text-white py-2 px-4 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin mr-2" />
                      Verifying...
                    </>
                  ) : (
                    'Verify Identity'
                  )}
                </button>
              </div>
            ) : (
              <div className="flex space-x-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your question or ask about any investor..."
                  disabled={isLoading}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-sm disabled:opacity-50"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="bg-gray-900 text-white p-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={16} />
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SupportChat;