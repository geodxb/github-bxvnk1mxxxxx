import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageService } from '../../services/messageService';
import { useAuth } from '../../contexts/AuthContext';
import { useMessages } from '../../hooks/useMessages';
import { AffiliateMessage } from '../../types/message';
import { 
  Send, 
  Paperclip, 
  MoreVertical, 
  Reply,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  Upload,
  FileText,
  X,
  Eye,
  Download,
  Image
} from 'lucide-react';

interface MessageThreadProps {
  conversationId: string;
  recipientName?: string;
}

interface UploadedDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: Date;
}

const MessageThread = ({ conversationId, recipientName }: MessageThreadProps) => {
  const { user } = useAuth();
  const { messages, loading } = useMessages(conversationId);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<AffiliateMessage | null>(null);
  const [attachedDocuments, setAttachedDocuments] = useState<UploadedDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) return;

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      const maxSize = 10 * 1024 * 1024; // 10MB
      return validTypes.includes(file.type) && file.size <= maxSize;
    });

    if (validFiles.length !== files.length) {
      setUploadError('Please upload only PDF, JPG, PNG, TXT, DOC, or DOCX files under 10MB');
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      // Simulate file upload (in real implementation, upload to Firebase Storage)
      for (const file of validFiles) {
        const mockUrl = `https://firebasestorage.googleapis.com/messages/${Date.now()}_${file.name}`;
        
        const uploadedDoc: UploadedDocument = {
          id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          type: file.type,
          size: file.size,
          url: mockUrl,
          uploadedAt: new Date()
        };

        setAttachedDocuments(prev => [...prev, uploadedDoc]);
      }
    } catch (error) {
      console.error('Error uploading documents:', error);
      setUploadError('Failed to upload documents. Please try again.');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeDocument = (documentId: string) => {
    setAttachedDocuments(prev => prev.filter(doc => doc.id !== documentId));
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) {
      return <FileText size={16} className="text-red-600" />;
    } else if (fileType.includes('image')) {
      return <FileText size={16} className="text-blue-600" />;
    } else if (fileType.includes('word') || fileType.includes('document')) {
      return <FileText size={16} className="text-blue-800" />;
    }
    return <FileText size={16} className="text-gray-600" />;
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && attachedDocuments.length === 0) || !user || isLoading) return;

    setIsLoading(true);
    
    try {
      console.log('🔄 Sending regular message:', {
        conversationId,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        messageLength: newMessage.trim().length
      });

      const messageRole = user.role === 'admin' ? 'admin' : 'affiliate';
      
      await MessageService.sendMessage(
        user.id,
        user.name,
        messageRole,
        newMessage.trim(),
        conversationId,
        replyingTo?.id
      );
      
      console.log('✅ Regular message sent successfully');
      setNewMessage('');
      setAttachedDocuments([]);
      setReplyingTo(null);
      setUploadError('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

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
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-amber-500';
      case 'low': return 'border-l-gray-400';
      default: return 'border-l-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium uppercase tracking-wide">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 uppercase tracking-wide">
              {user?.role === 'admin' ? 'AFFILIATE COMMUNICATION' : 'ADMIN COMMUNICATION'}
            </h3>
            <p className="text-sm text-gray-600 uppercase tracking-wide">
              {recipientName ? `Conversation with ${recipientName}` : 'Real-time messaging'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-600 font-medium uppercase tracking-wide">Online</span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 min-h-0">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2 uppercase tracking-wide">
              Start the conversation
            </h3>
            <p className="text-gray-500 uppercase tracking-wide text-sm">
              Send your first message to begin communicating
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[95%] min-w-[300px] ${
                    message.senderId === user?.id
                      ? 'bg-gray-900 text-white'
                      : 'bg-white text-gray-800 border border-gray-200'
                  } rounded-lg p-6 shadow-sm border-l-4 ${getPriorityColor(message.priority)} break-words`}
                >
                  {/* Reply indicator */}
                  {message.replyTo && (
                    <div className="mb-2 pb-2 border-b border-gray-300 opacity-75">
                      <div className="flex items-center space-x-1 text-xs">
                        <Reply size={12} />
                        <span>Replying to message</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Message header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs font-medium uppercase tracking-wide ${
                        message.senderId === user?.id ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        {message.senderName}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full font-medium uppercase tracking-wide ${
                        message.senderRole === 'admin' 
                          ? 'bg-gray-100 text-gray-800' 
                          : message.senderRole === 'governor'
                          ? 'bg-gray-800 text-white'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {message.senderRole === 'governor' ? 'SUPPORT' : message.senderRole}
                      </span>
                      {message.department && (
                        <span className="px-2 py-1 text-xs rounded-full font-medium uppercase tracking-wide bg-gray-200 text-gray-800">
                          {message.department}
                        </span>
                      )}
                    </div>
                    
                    {message.senderId !== user?.id && (
                      <button
                        onClick={() => setReplyingTo(message)}
                        className={`p-1 rounded hover:bg-gray-100 transition-colors ${
                          message.senderId === user?.id ? 'text-gray-300' : 'text-gray-500'
                        }`}
                      >
                        <Reply size={14} />
                      </button>
                    )}
                  </div>
                  
                  {/* Message content */}
                  <div className="text-base leading-relaxed whitespace-pre-wrap mb-4 word-wrap break-word max-w-full overflow-wrap-anywhere">
                    {message.content}
                  </div>
                  
                  {/* Message Attachments */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-4 space-y-3">
                      <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                        ATTACHMENTS ({message.attachments.length}):
                      </p>
                      {message.attachments.map((attachment, index) => {
                        const attachmentData = typeof attachment === 'string' 
                          ? { url: attachment, name: `Attachment ${index + 1}`, type: 'unknown', size: 0 }
                          : attachment;
                        
                        const isImage = attachmentData.type?.includes('image') || 
                                      attachmentData.name?.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i) ||
                                      attachmentData.url?.startsWith('data:image/');
                        
                        const isPDF = attachmentData.type?.includes('pdf') || 
                                    attachmentData.name?.toLowerCase().endsWith('.pdf');
                        
                        if (isImage) {
                          return (
                            <>
                              <div key={index} className="space-y-2">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <Image size={16} className="text-blue-600" />
                                  <span className="text-sm font-medium text-gray-900">{attachmentData.name}</span>
                                  {attachmentData.size > 0 && (
                                    <span className="text-xs text-gray-500">
                                      {(attachmentData.size / 1024 / 1024).toFixed(2)} MB
                                    </span>
                                  )}
                                </div>
                                <button
                                  onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = attachmentData.url;
                                    link.download = attachmentData.name;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                  }}
                                  className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
                                  title="Download image"
                                >
                                  <Download size={14} />
                                </button>
                              </div>
                              <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                                <img 
                                  src={attachmentData.url} 
                                  alt={attachmentData.name}
                                  className="w-full h-auto max-h-64 object-contain cursor-pointer"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    if (target.parentElement) {
                                      target.parentElement.innerHTML = '<div class="p-4 text-center text-gray-500">Image could not be displayed</div>';
                                    }
                                  }}
                                />
                              </div>
                              </div>
                            </>
                          );
                        } else {
                          return (
                            <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded border">
                              <div className="flex items-center space-x-2">
                                <FileText size={16} className="text-gray-600" />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{attachmentData.name}</p>
                                  <p className="text-xs text-gray-500">
                                    {attachmentData.size > 0 ? (attachmentData.size / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown size'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-1">
                                {isPDF && (
                                  <button
                                    onClick={() => window.open(attachmentData.url, '_blank')}
                                    className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
                                    title="View document"
                                  >
                                    <Eye size={14} />
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = attachmentData.url;
                                    link.download = attachmentData.name;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                  }}
                                  className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
                                  title="Download document"
                                >
                                  <Download size={14} />
                                </button>
                              </div>
                            </div>
                          );
                        }
                      })}
                    </div>
                  )}
                  
                  {/* Message footer */}
                  <div className="flex items-center justify-between text-xs">
                    <span className={`${
                      message.senderId === user?.id ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply indicator */}
      {replyingTo && (
        <div className="px-6 py-3 bg-gray-100 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Reply size={16} className="text-gray-600" />
              <span className="text-sm text-gray-700 font-medium uppercase tracking-wide">
                Replying to {replyingTo.senderName}
              </span>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1 truncate">
            {replyingTo.content.substring(0, 100)}...
          </p>
        </div>
      )}

      {/* Attached Documents */}
      {attachedDocuments.length > 0 && (
        <div className="px-6 py-3 bg-gray-100 border-t border-gray-200">
          <div className="mb-3 space-y-2">
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              ATTACHED DOCUMENTS ({attachedDocuments.length}):
            </p>
            {attachedDocuments.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between bg-gray-50 p-2 rounded border">
                <div className="flex items-center space-x-2">
                  {getFileIcon(doc.type)}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                    <p className="text-xs text-gray-500">
                      {(doc.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeDocument(doc.id)}
                  className="p-1 text-red-600 hover:text-red-800"
                  title="Remove document"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Error */}
      {uploadError && (
        <div className="px-6 py-3 bg-red-50 border-t border-red-200">
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
            <div className="flex items-center space-x-2">
              <AlertTriangle size={14} />
              <span className="font-medium uppercase tracking-wide">{uploadError}</span>
            </div>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="px-6 py-4 bg-white border-t border-gray-200">
        <div className="flex items-end space-x-3">
          {/* File Upload Button */}
          <div className="flex-shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.txt,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isUploading}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="p-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Attach documents"
            >
              {isUploading ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Upload size={20} />
              )}
            </button>
          </div>

          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={attachedDocuments.length > 0 ? "Add a message (optional)..." : "Type your message..."}
              disabled={isLoading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 resize-none font-medium"
              rows={3}
            />
          </div>
          
          <div className="flex flex-col space-y-2">
            <button
              onClick={handleSendMessage}
              disabled={(!newMessage.trim() && attachedDocuments.length === 0) || isLoading || isUploading}
              className="p-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
          <span className="uppercase tracking-wide">Press Enter to send, Shift+Enter for new line</span>
          <span className="uppercase tracking-wide">{newMessage.length}/1000</span>
        </div>
        
        <p className="text-xs text-gray-500 mt-2 uppercase tracking-wide">
          SUPPORTED FILES: PDF, JPG, PNG, TXT, DOC, DOCX (MAX 10MB EACH)
        </p>
      </div>
    </div>
  );
};

export default MessageThread;