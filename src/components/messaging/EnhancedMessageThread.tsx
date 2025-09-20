import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EnhancedMessageService } from '../../services/enhancedMessageService';
import { MessageService } from '../../services/messageService';
import { useAuth } from '../../contexts/AuthContext';
import { useEnhancedMessages } from '../../hooks/useEnhancedMessages';
import { useMessages } from '../../hooks/useMessages';
import { EnhancedMessage, ConversationMetadata } from '../../types/conversation';
import { 
  Send, 
  Reply,
  Crown,
  Shield,
  Users,
  AlertTriangle,
  ArrowUp,
  Eye,
  CheckCircle,
  Clock,
  User,
  MessageSquare,
  Paperclip,
  Download,
  FileText,
  Image,
  File,
  X,
  ZoomIn
} from 'lucide-react';

// Interface for uploaded documents
interface UploadedDocument {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

interface EnhancedMessageThreadProps {
  conversationId: string;
  conversation?: ConversationMetadata;
  onEscalate?: (reason: string) => void;
  onJoinConversation?: () => void;
}

const EnhancedMessageThread = ({ 
  conversationId, 
  conversation,
  onEscalate,
  onJoinConversation
}: EnhancedMessageThreadProps) => {
  const { user } = useAuth();
  const { messages: enhancedMessages, loading: enhancedLoading } = useEnhancedMessages(conversationId);
  const { messages: regularMessages, loading: regularLoading } = useMessages(conversationId);
  const [allMessages, setAllMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<EnhancedMessage | null>(null);
  const [showEscalationModal, setShowEscalationModal] = useState(false);
  const [escalationReason, setEscalationReason] = useState('');
  const [attachedDocuments, setAttachedDocuments] = useState<UploadedDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');
  const [previewImageName, setPreviewImageName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Merge and sort messages from both collections
  useEffect(() => {
    if (!enhancedLoading && !regularLoading) {
      const allMessagesList = [];
      
      enhancedMessages.forEach(msg => {
        allMessagesList.push({
          ...msg,
          source: 'enhanced'
        });
      });
      
      regularMessages.forEach(msg => {
        const existsInEnhanced = enhancedMessages.some(eMsg => 
          eMsg.id === msg.id || 
          (Math.abs(new Date(eMsg.timestamp).getTime() - new Date(msg.timestamp).getTime()) < 1000 && 
           eMsg.content === msg.content)
        );
        
        if (!existsInEnhanced) {
          allMessagesList.push({
            ...msg,
            source: 'regular',
            senderRole: msg.senderRole || 'affiliate',
            priority: msg.priority || 'medium',
            status: msg.status || 'sent',
            readBy: [],
            messageType: 'text',
            isEscalation: false
          });
        }
      });
      
      const sorted = allMessagesList.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      setAllMessages(sorted);
      setLoading(false);
    } else {
      setLoading(true);
    }
  }, [enhancedMessages, regularMessages, enhancedLoading, regularLoading]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [allMessages]);

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) {
      return <FileText size={16} className="text-red-600" />;
    } else if (fileType.includes('image')) {
      return <Image size={16} className="text-blue-600" />;
    } else if (fileType.includes('document') || fileType.includes('word')) {
      return <FileText size={16} className="text-blue-800" />;
    } else if (fileType.includes('sheet') || fileType.includes('excel')) {
      return <FileText size={16} className="text-green-600" />;
    } else if (fileType.includes('presentation') || fileType.includes('powerpoint')) {
      return <FileText size={16} className="text-orange-600" />;
    } else {
      return <File size={16} className="text-gray-600" />;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const newDocuments: UploadedDocument[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        if (file.size > 10 * 1024 * 1024) {
          setUploadError(`File "${file.name}" is too large. Maximum size is 10MB.`);
          continue;
        }

        const allowedTypes = [
          'application/pdf',
          'image/jpeg',
          'image/jpg',
          'image/png',
          'text/plain',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        ];

        if (!allowedTypes.includes(file.type)) {
          setUploadError(`File type "${file.type}" is not supported.`);
          continue;
        }

        // Convert images to base64 for permanent storage and display
        let fileUrl: string;
        if (file.type.startsWith('image/')) {
          // Convert image to base64
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          fileUrl = base64;
        } else {
          // For non-images, use object URL (temporary)
          fileUrl = URL.createObjectURL(file);
        }
        
        const document: UploadedDocument = {
          id: `${Date.now()}-${i}`,
          name: file.name,
          size: file.size,
          type: file.type,
          url: fileUrl
        };

        newDocuments.push(document);
      }

      setAttachedDocuments(prev => [...prev, ...newDocuments]);
    } catch (error) {
      console.error('Error uploading files:', error);
      setUploadError('Failed to upload files. Please try again.');
    } finally {
      setIsUploading(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const removeDocument = (documentId: string) => {
    setAttachedDocuments(prev => {
      const updated = prev.filter(doc => doc.id !== documentId);
      // Only revoke object URLs, not base64 data URLs
      const removedDoc = prev.find(doc => doc.id === documentId);
      if (removedDoc && removedDoc.url.startsWith('blob:')) {
        URL.revokeObjectURL(removedDoc.url);
      }
      return updated;
    });
  };

  const handleImagePreview = (imageUrl: string, imageName: string) => {
    setPreviewImageUrl(imageUrl);
    setPreviewImageName(imageName);
    setShowImagePreview(true);
  };

  const handleFileDownload = (fileUrl: string, fileName: string) => {
    try {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
    }
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && attachedDocuments.length === 0) || !user || isLoading) return;

    setIsLoading(true);
    
    try {
      const messageRole = user.role === 'admin' ? 'admin' : 
                         user.role === 'governor' ? 'governor' : 'affiliate';

      const attachmentUrls = attachedDocuments.map(doc => ({
        url: doc.url,
        name: doc.name,
        type: doc.type,
        size: doc.size
      }));

      try {
        const messageId = await EnhancedMessageService.sendEnhancedMessage(
          conversationId,
          user.id,
          user.name,
          messageRole,
          newMessage.trim(),
          'medium',
          conversation?.department,
          replyingTo?.id,
          false,
          undefined,
          'text',
          attachmentUrls
        );
        console.log('✅ Enhanced message sent successfully:', messageId);
      } catch (enhancedError) {
        console.log('⚠️ Enhanced message failed, using regular message service:', enhancedError);
        
        const messageId = await MessageService.sendMessage(
          user.id,
          user.name,
          messageRole,
          newMessage.trim(),
          conversationId,
          replyingTo?.id,
          'medium',
          conversation?.department,
          attachmentUrls
        );
        console.log('✅ Regular message sent successfully:', messageId);
      }
      
      setNewMessage('');
      setReplyingTo(null);
      setAttachedDocuments([]);
    } catch (error) {
      console.error('Error sending enhanced message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEscalate = async () => {
    if (!escalationReason.trim() || !user || !onEscalate) return;

    try {
      onEscalate(escalationReason.trim());
      setShowEscalationModal(false);
      setEscalationReason('');
    } catch (error) {
      console.error('Error escalating conversation:', error);
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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'governor':
        return <Crown size={14} className="text-purple-600" />;
      case 'admin':
        return <Shield size={14} className="text-blue-600" />;
      case 'affiliate':
        return <Users size={14} className="text-green-600" />;
      default:
        return <User size={14} className="text-gray-600" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'governor':
        return 'MANAGEMENT';
      case 'admin':
        return 'ADMIN';
      case 'affiliate':
        return 'AFFILIATE';
      default:
        return role.toUpperCase();
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-l-red-500';
      case 'high': return 'border-l-orange-500';
      case 'medium': return 'border-l-blue-500';
      case 'low': return 'border-l-gray-400';
      default: return 'border-l-gray-400';
    }
  };

  const isParticipant = conversation?.participants.some(p => p.id === user?.id);
  const canEscalate = user?.role === 'admin' && !conversation?.isEscalated && 
                     !conversation?.participants.some(p => p.role === 'governor');

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
              {conversation?.title || 'Communication'}
            </h3>
            <div className="flex items-center space-x-4 mt-1">
              {conversation?.department && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium uppercase tracking-wide">
                  {conversation.department}
                </span>
              )}
              {conversation?.isEscalated && (
                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium uppercase tracking-wide">
                  <ArrowUp size={10} className="mr-1 inline" />
                  ESCALATED
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {canEscalate && (
              <button
                onClick={() => setShowEscalationModal(true)}
                className="px-3 py-2 bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition-colors uppercase tracking-wide border border-gray-700"
              >
                <ArrowUp size={14} className="mr-1 inline" />
                ESCALATE TO MANAGEMENT
              </button>
            )}
            
            {user?.role === 'governor' && !isParticipant && onJoinConversation && (
              <button
                onClick={onJoinConversation}
                className="px-3 py-2 bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition-colors uppercase tracking-wide border border-gray-700"
              >
                <Eye size={14} className="mr-1 inline" />
                JOIN CONVERSATION
              </button>
            )}
            
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-600 font-medium uppercase tracking-wide">Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area - FIXED SPACING */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50 min-h-0">
        {allMessages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2 uppercase tracking-wide">
              Start the conversation
            </h3>
            <p className="text-gray-500 uppercase tracking-wide text-sm">
              Send your first message to begin communicating
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Governor Join Banner */}
            {allMessages.some(msg => 
              msg.messageType === 'system' && 
              msg.content.includes('MANAGEMENT OVERSIGHT ACTIVATED')
            ) && (
              <div className="bg-gray-100 border border-gray-300 p-4 mb-6 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-200 border border-gray-400 flex items-center justify-center rounded-lg">
                    <User size={16} className="text-gray-700" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm uppercase tracking-wide">
                      SAM HAS JOINED THE CONVERSATION
                    </p>
                    <p className="text-gray-700 text-xs uppercase tracking-wide">
                      MANAGEMENT OVERSIGHT ACTIVATED FOR THIS COMMUNICATION
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <AnimatePresence initial={false}>
              {allMessages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'} mb-6`}
                >
                  <div
                    className={`max-w-[85%] ${
                      message.senderId === user?.id
                        ? 'bg-gray-900 text-white'
                        : message.messageType === 'escalation'
                        ? 'bg-gray-100 text-gray-800 border border-gray-300'
                        : message.messageType === 'system'
                        ? 'bg-gray-100 text-gray-800 border border-gray-300'
                        : 'bg-white text-gray-800 border border-gray-200'
                    } rounded-lg p-4 shadow-sm border-l-4 ${getPriorityColor(message.priority)} break-words`}
                  >
                    {/* Reply indicator */}
                    {message.replyTo && (
                      <div className="mb-3 pb-2 border-b border-gray-300 opacity-75">
                        <div className="flex items-center space-x-1 text-xs">
                          <Reply size={12} />
                          <span>Replying to message</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Message header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs font-medium uppercase tracking-wide ${
                          message.senderId === user?.id ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          {message.senderName}
                        </span>
                        <div className="flex items-center space-x-1">
                          {getRoleIcon(message.senderRole)}
                          <span className={`px-2 py-1 text-xs rounded-full font-medium uppercase tracking-wide ${
                            message.senderRole === 'governor' 
                              ? 'bg-gray-800 text-white' 
                              : message.senderRole === 'admin'
                              ? 'bg-gray-600 text-white'
                              : 'bg-gray-500 text-white'
                          }`}>
                            {getRoleLabel(message.senderRole)}
                          </span>
                        </div>
                        {message.department && (
                          <span className="px-2 py-1 text-xs rounded-full font-medium uppercase tracking-wide bg-gray-200 text-gray-800">
                            {message.department}
                          </span>
                        )}
                        {message.isEscalation && (
                          <span className="px-2 py-1 text-xs font-medium uppercase tracking-wide bg-gray-100 text-gray-800 border border-gray-300">
                            <ArrowUp size={10} className="mr-1 inline" />
                            ESCALATION
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
                    
                    {/* Escalation reason */}
                    {message.isEscalation && message.escalationReason && (
                      <div className="mb-3 p-2 bg-gray-100 border border-gray-300 rounded text-xs">
                        <strong>Escalation Reason:</strong> {message.escalationReason}
                      </div>
                    )}
                    
                    {/* Message content - FIXED LINE BREAKS */}
                    <div className="mb-4">
                      <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {message.content}
                      </div>
                    </div>
                    
                    {/* Message Attachments - FIXED IMAGE DISPLAY */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-4 space-y-3">
                        <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                          ATTACHMENTS ({message.attachments.length}):
                        </p>
                        {message.attachments.map((attachment, index) => {
                          // Handle both string URLs and attachment objects
                          let attachmentData;
                          if (typeof attachment === 'string') {
                            // Enhanced image detection for URLs and base64
                            const isImageUrl = attachment.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i) || 
                                             attachment.startsWith('data:image/') ||
                                             attachment.includes('image') ||
                                             attachment.includes('blob:') && attachment.includes('image');
                            attachmentData = { 
                              url: attachment, 
                              name: `Attachment ${index + 1}`, 
                              type: isImageUrl ? 'image/jpeg' : 'application/octet-stream', 
                              size: 0 
                            };
                          } else {
                            attachmentData = attachment;
                          }
                          
                          // Enhanced image detection
                          const isImage = attachmentData.type?.startsWith('image/') || 
                                        attachmentData.name?.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i) ||
                                        attachmentData.url?.startsWith('data:image/');
                          
                          const isPDF = attachmentData.type?.includes('pdf') || 
                                      attachmentData.name?.toLowerCase().endsWith('.pdf');

                          return (
                            <div key={index} className="space-y-2">
                              {isImage ? (
                                <>
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-2">
                                        <Image size={16} className="text-blue-600" />
                                        <span className="text-sm font-medium text-gray-900">{attachmentData.name}</span>
                                        {attachmentData.size > 0 && (
                                          <span className="text-xs text-gray-500">
                                            {(attachmentData.size / 1024 / 1024).toFixed(2)} MB
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <button
                                          onClick={() => handleImagePreview(attachmentData.url, attachmentData.name)}
                                          className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
                                          title="Preview image"
                                        >
                                          <ZoomIn size={14} />
                                        </button>
                                        <button
                                          onClick={() => handleFileDownload(attachmentData.url, attachmentData.name)}
                                          className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
                                          title="Download image"
                                        >
                                          <Download size={14} />
                                        </button>
                                      </div>
                                    </div>
                                    {/* INLINE IMAGE DISPLAY - IMPROVED */}
                                    <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 cursor-pointer max-w-xs mt-2"
                                         onClick={() => handleImagePreview(attachmentData.url, attachmentData.name)}>
                                      <img 
                                        src={attachmentData.url} 
                                        alt={attachmentData.name}
                                        className="w-full h-auto max-h-32 object-cover hover:scale-105 transition-transform duration-200"
                                        loading="lazy"
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          // Hide broken image and show fallback
                                          const parent = target.parentElement;
                                          if (parent) {
                                            parent.innerHTML = `
                                              <div class="p-3 text-center text-gray-500 bg-gray-100 border border-gray-300 rounded">
                                                <div class="flex items-center justify-center mb-2">
                                                  <div class="w-6 h-6 bg-gray-300 rounded flex items-center justify-center">
                                                    <span class="text-gray-600 text-xs">IMG</span>
                                                  </div>
                                                </div>
                                                <p class="text-xs font-medium text-gray-700">Image could not be displayed</p>
                                                <p class="text-xs text-gray-500 mt-1">${attachmentData.name}</p>
                                              </div>
                                            `;
                                          }
                                        }}
                                      />
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <>
                                  {/* NON-IMAGE ATTACHMENTS */}
                                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded border">
                                    <div className="flex items-center space-x-2">
                                      {getFileIcon(attachmentData.type)}
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
                                        onClick={() => handleFileDownload(attachmentData.url, attachmentData.name)}
                                        className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
                                        title="Download document"
                                      >
                                        <Download size={14} />
                                      </button>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {/* Message footer */}
                    <div className="flex items-center justify-between text-xs mt-3">
                      <span className={`${
                        message.senderId === user?.id ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        {formatTime(message.timestamp)}
                      </span>
                      
                      {message.readBy && message.readBy.length > 0 && (
                        <div className="flex items-center space-x-1">
                          <Eye size={10} />
                          <span className={`${
                            message.senderId === user?.id ? 'text-gray-300' : 'text-gray-500'
                          }`}>
                            Read by {message.readBy.length}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
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
      <div className="px-4 py-2 bg-white border-t border-gray-200">
        <div className="flex items-end space-x-3">
          <div className="flex-shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.txt,.doc,.docx,.xlsx,.ppt,.pptx"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isUploading}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Attach files"
            >
              {isUploading ? (
                <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Paperclip size={16} />
              )}
            </button>
          </div>

          <div className="flex-1">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={attachedDocuments.length > 0 ? "Add a message (optional)..." : "Type your message..."}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 resize-none font-medium text-sm"
              rows={2}
            />
          </div>
          
          <div className="flex flex-col space-y-2">
            <button
              onClick={handleSendMessage}
              disabled={(!newMessage.trim() && attachedDocuments.length === 0) || isLoading || isUploading}
              className="p-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Send size={16} />
              )}
            </button>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span className="uppercase tracking-wide">Press Enter to send, Shift+Enter for new line</span>
          <span className="uppercase tracking-wide">{newMessage.length}/1000</span>
        </div>
        
        <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">
          SUPPORTED FILES: PDF, JPG, PNG, TXT, DOC, DOCX, XLSX, PPT (MAX 10MB EACH)
        </p>
      </div>

      {/* IMAGE PREVIEW MODAL - NEW FEATURE */}
      {showImagePreview && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowImagePreview(false)}>
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 bg-white flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">{previewImageName}</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleFileDownload(previewImageUrl, previewImageName)}
                  className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
                  title="Download image"
                >
                  <Download size={18} />
                </button>
                <button
                  onClick={() => setShowImagePreview(false)}
                  className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
                  title="Close preview"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="p-6 max-h-[80vh] overflow-auto">
              <img 
                src={previewImageUrl} 
                alt={previewImageName}
                className="w-full h-auto max-w-full"
                style={{ maxHeight: '70vh' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Escalation Modal */}
      {showEscalationModal && (
        <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowEscalationModal(false)}>
          <div className="flex min-h-screen items-center justify-center p-4">
            <div 
              className="relative w-full max-w-md bg-white rounded-lg shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 uppercase tracking-wide">
                  ESCALATE TO MANAGEMENT
                </h3>
              </div>
              
              <div className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                    ESCALATION REASON
                  </label>
                  <textarea
                    value={escalationReason}
                    onChange={(e) => setEscalationReason(e.target.value)}
                    placeholder="Explain why this conversation needs management attention..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 resize-none"
                    rows={4}
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowEscalationModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium uppercase tracking-wide"
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={handleEscalate}
                    disabled={!escalationReason.trim()}
                    className="px-4 py-2 bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors font-medium uppercase tracking-wide"
                  >
                    <ArrowUp size={14} className="mr-1 inline" />
                    ESCALATE
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedMessageThread;
