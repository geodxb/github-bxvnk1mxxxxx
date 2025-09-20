import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../common/Card';
import { useSupportTickets } from '../../hooks/useSupportTickets';
import { SupportTicket } from '../../types/supportTicket';
import { 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  User,
  Flag,
  Eye,
  ChevronDown,
  ChevronUp,
  Shield,
  DollarSign,
  FileText,
  ArrowUp
} from 'lucide-react';

interface CurrentTicketsDisplayProps {
  investorId: string;
}

const CurrentTicketsDisplay = ({ investorId }: CurrentTicketsDisplayProps) => {
  const { tickets, loading, error } = useSupportTickets();
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);

  // Filter tickets for this specific investor
  const investorTickets = tickets.filter(ticket => ticket.investorId === investorId);

  const getTicketTypeIcon = (type: string) => {
    switch (type) {
      case 'suspicious_activity': return <Eye size={16} className="text-gray-600" />;
      case 'information_modification': return <User size={16} className="text-gray-600" />;
      case 'policy_violation': return <Shield size={16} className="text-gray-600" />;
      case 'account_issue': return <DollarSign size={16} className="text-gray-600" />;
      default: return <FileText size={16} className="text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-gray-800 bg-gray-100 border-gray-200';
      case 'high': return 'text-gray-800 bg-gray-100 border-gray-200';
      case 'medium': return 'text-gray-800 bg-gray-100 border-gray-200';
      case 'low': return 'text-gray-800 bg-gray-100 border-gray-200';
      default: return 'text-gray-800 bg-gray-100 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-gray-800 bg-gray-100 border-gray-200';
      case 'in_progress': return 'text-gray-800 bg-gray-100 border-gray-200';
      case 'pending_approval': return 'text-gray-800 bg-gray-100 border-gray-200';
      case 'resolved': return 'text-gray-800 bg-gray-100 border-gray-200';
      case 'closed': return 'text-gray-800 bg-gray-100 border-gray-200';
      default: return 'text-gray-800 bg-gray-100 border-gray-200';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card title="CURRENT SUPPORT TICKETS">
        <div className="text-center py-8">
          <div className="w-6 h-6 border-2 border-gray-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 font-bold uppercase tracking-wide">LOADING TICKETS...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card title="CURRENT SUPPORT TICKETS">
        <div className="text-center py-8">
          <p className="text-gray-600 font-bold uppercase tracking-wide">ERROR LOADING TICKETS</p>
        </div>
      </Card>
    );
  }

  return (
    <Card title={`CURRENT SUPPORT TICKETS (${investorTickets.length})`}>
      {investorTickets.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 border border-gray-300 rounded-lg flex items-center justify-center mx-auto mb-4">
            <MessageSquare size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2 uppercase tracking-wide">NO SUPPORT TICKETS</h3>
          <p className="text-gray-500 uppercase tracking-wide text-sm">No support tickets have been submitted for this investor</p>
        </div>
      ) : (
        <div className="space-y-4">
          {investorTickets.map((ticket) => (
            <div key={ticket.id} className="bg-white border border-gray-300">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {getTicketTypeIcon(ticket.ticketType)}
                      <h4 className="font-bold text-gray-900 uppercase tracking-wide">
                        TICKET #{ticket.id.slice(-8)}
                      </h4>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 text-xs font-bold border uppercase tracking-wide ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority.toUpperCase()}
                      </span>
                      <span className={`px-3 py-1 text-xs font-bold border uppercase tracking-wide ${getStatusColor(ticket.status)}`}>
                        {ticket.status.replace('_', ' ').toUpperCase()}
                      </span>
                      {ticket.escalated && (
                        <span className="px-2 py-1 text-xs font-bold bg-gray-100 text-gray-800 border border-gray-200 uppercase tracking-wide">
                          <ArrowUp size={10} className="mr-1 inline" />
                          ESCALATED
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setExpandedTicket(expandedTicket === ticket.id ? null : ticket.id)}
                    className="p-2 hover:bg-gray-200 transition-colors border border-gray-300"
                  >
                    {expandedTicket === ticket.id ? 
                      <ChevronUp size={16} className="text-gray-500" /> : 
                      <ChevronDown size={16} className="text-gray-500" />
                    }
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-gray-600 text-xs font-bold uppercase tracking-wide">SUBJECT</p>
                    <p className="font-bold text-gray-900">{ticket.subject}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs font-bold uppercase tracking-wide">SUBMITTED BY</p>
                    <p className="font-bold text-gray-900">{ticket.submittedByName}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs font-bold uppercase tracking-wide">SUBMITTED</p>
                    <p className="font-bold text-gray-900">{formatDate(ticket.submittedAt)}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-gray-600 text-xs font-bold uppercase tracking-wide mb-2">DESCRIPTION</p>
                  <p className="text-gray-900 text-sm">{ticket.description}</p>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {expandedTicket === ticket.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-gray-200 pt-4"
                    >
                      {/* Ticket Timeline */}
                      <div className="mb-6">
                        <h5 className="font-bold text-gray-900 mb-3 uppercase tracking-wide">TICKET TIMELINE</h5>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3 p-3 bg-gray-50 border border-gray-200">
                            <div className="w-8 h-8 bg-gray-200 border border-gray-300 rounded-lg flex items-center justify-center">
                              <FileText size={14} className="text-gray-600" />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 uppercase tracking-wide">TICKET CREATED</p>
                              <p className="text-gray-600 text-sm uppercase tracking-wide">
                                {formatDate(ticket.submittedAt)} by {ticket.submittedByName}
                              </p>
                            </div>
                          </div>

                          {ticket.assignedAt && (
                            <div className="flex items-center space-x-3 p-3 bg-gray-50 border border-gray-200">
                              <div className="w-8 h-8 bg-gray-200 border border-gray-300 rounded-lg flex items-center justify-center">
                                <User size={14} className="text-gray-600" />
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 uppercase tracking-wide">ASSIGNED</p>
                                <p className="text-gray-600 text-sm uppercase tracking-wide">
                                  {formatDate(ticket.assignedAt)} to {ticket.assignedToName}
                                </p>
                              </div>
                            </div>
                          )}

                          {ticket.escalated && ticket.escalatedAt && (
                            <div className="flex items-center space-x-3 p-3 bg-gray-50 border border-gray-200">
                              <div className="w-8 h-8 bg-gray-200 border border-gray-300 rounded-lg flex items-center justify-center">
                                <ArrowUp size={14} className="text-gray-600" />
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 uppercase tracking-wide">ESCALATED</p>
                                <p className="text-gray-600 text-sm uppercase tracking-wide">
                                  {formatDate(ticket.escalatedAt)}
                                </p>
                                {ticket.escalatedReason && (
                                  <p className="text-gray-700 text-xs mt-1">
                                    Reason: {ticket.escalatedReason}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {ticket.resolvedAt && (
                            <div className="flex items-center space-x-3 p-3 bg-gray-50 border border-gray-200">
                              <div className="w-8 h-8 bg-gray-200 border border-gray-300 rounded-lg flex items-center justify-center">
                                <CheckCircle size={14} className="text-gray-600" />
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 uppercase tracking-wide">RESOLVED</p>
                                <p className="text-gray-600 text-sm uppercase tracking-wide">
                                  {formatDate(ticket.resolvedAt)} by {ticket.resolvedBy}
                                </p>
                                {ticket.resolution && (
                                  <p className="text-gray-700 text-sm mt-1">
                                    Resolution: {ticket.resolution}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {ticket.closedAt && (
                            <div className="flex items-center space-x-3 p-3 bg-gray-50 border border-gray-200">
                              <div className="w-8 h-8 bg-gray-200 border border-gray-300 rounded-lg flex items-center justify-center">
                                <CheckCircle size={14} className="text-gray-600" />
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 uppercase tracking-wide">CLOSED</p>
                                <p className="text-gray-600 text-sm uppercase tracking-wide">
                                  {formatDate(ticket.closedAt)} by {ticket.closedBy}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Responses */}
                      {ticket.responses && ticket.responses.length > 0 && (
                        <div>
                          <h5 className="font-bold text-gray-900 mb-3 uppercase tracking-wide">
                            RESPONSES ({ticket.responses.length})
                          </h5>
                          <div className="space-y-3 max-h-64 overflow-y-auto">
                            {ticket.responses.map((response) => (
                              <div key={response.id} className={`p-4 border ${
                                response.responderRole === 'governor' 
                                  ? 'bg-gray-50 border-gray-300' 
                                  : 'bg-gray-50 border-gray-300'
                              }`}>
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-bold text-gray-900 uppercase tracking-wide">
                                      {response.responderName}
                                    </span>
                                    <span className={`px-2 py-1 text-xs font-bold border uppercase tracking-wide ${
                                      response.responderRole === 'governor' 
                                        ? 'bg-gray-800 text-white border-gray-900' 
                                        : 'bg-gray-100 text-gray-800 border-gray-200'
                                    }`}>
                                      {response.responderRole.toUpperCase()}
                                    </span>
                                    {response.isInternal && (
                                      <span className="px-2 py-1 text-xs font-bold bg-gray-100 text-gray-800 border border-gray-200 uppercase tracking-wide">
                                        INTERNAL
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-xs text-gray-500 uppercase tracking-wide">
                                    {formatDate(response.timestamp)}
                                  </span>
                                </div>
                                <p className="text-gray-800 whitespace-pre-wrap text-sm">{response.content}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default CurrentTicketsDisplay;