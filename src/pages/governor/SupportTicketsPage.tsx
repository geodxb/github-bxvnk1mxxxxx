import { useState } from 'react';
import { motion } from 'framer-motion';
import GovernorLayout from '../../components/layout/GovernorLayout';
import { useSupportTickets } from '../../hooks/useSupportTickets';
import { SupportTicketService } from '../../services/supportTicketService';
import { useAuth } from '../../contexts/AuthContext';
import { SupportTicket } from '../../types/supportTicket';
import { 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  User,
  Flag,
  Eye,
  Send,
  X,
  ArrowUp,
  FileText,
  Shield,
  DollarSign,
  Search,
  Filter
} from 'lucide-react';

const GovernorSupportTicketsPage = () => {
  const { user } = useAuth();
  const { tickets, loading, error } = useSupportTickets();
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [responseContent, setResponseContent] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'pending_approval' | 'resolved' | 'closed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'urgent'>('all');

  // Filter tickets
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.investorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleAddResponse = async () => {
    if (!selectedTicket || !user || !responseContent.trim()) return;

    setIsLoading(true);
    try {
      await SupportTicketService.addTicketResponse(
        selectedTicket.id,
        user.id,
        user.name,
        'governor',
        responseContent.trim(),
        isInternal
      );
      
      setResponseContent('');
      setIsInternal(false);
    } catch (error) {
      console.error('Error adding response:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (ticketId: string, newStatus: SupportTicket['status'], resolution?: string) => {
    if (!user) return;

    try {
      await SupportTicketService.updateTicketStatus(ticketId, newStatus, user.id, user.name, resolution);
      
      if (selectedTicket?.id === ticketId) {
        setShowTicketModal(false);
        setSelectedTicket(null);
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
    }
  };

  const handleAssignTicket = async (ticketId: string) => {
    if (!user) return;

    try {
      await SupportTicketService.assignTicket(ticketId, user.id, user.name, user.id, user.name);
    } catch (error) {
      console.error('Error assigning ticket:', error);
    }
  };

  const handleEscalateTicket = async (ticketId: string) => {
    if (!user) return;

    const reason = prompt('ESCALATION REASON:\n\nEnter reason for escalating this ticket:');
    if (!reason) return;

    try {
      await SupportTicketService.escalateTicket(ticketId, reason, user.id, user.name);
    } catch (error) {
      console.error('Error escalating ticket:', error);
    }
  };

  const getTicketTypeIcon = (type: string) => {
    switch (type) {
      case 'suspicious_activity': return <Eye size={16} className="text-red-600" />;
      case 'information_modification': return <User size={16} className="text-blue-600" />;
      case 'policy_violation': return <Shield size={16} className="text-amber-600" />;
      case 'account_issue': return <DollarSign size={16} className="text-purple-600" />;
      default: return <FileText size={16} className="text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-gray-600 bg-gray-100 border-gray-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'in_progress': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'pending_approval': return 'text-purple-600 bg-purple-100 border-purple-200';
      case 'resolved': return 'text-green-600 bg-green-100 border-green-200';
      case 'closed': return 'text-gray-600 bg-gray-100 border-gray-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const openTicketDetails = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setShowTicketModal(true);
  };

  // Calculate statistics
  const openTickets = tickets.filter(t => t.status === 'open').length;
  const inProgressTickets = tickets.filter(t => t.status === 'in_progress').length;
  const urgentTickets = tickets.filter(t => t.priority === 'urgent').length;
  const escalatedTickets = tickets.filter(t => t.escalated).length;

  if (error) {
    return (
      <GovernorLayout title="SUPPORT TICKETS">
        <div className="bg-white border border-gray-300 p-8 text-center">
          <p className="text-red-600 font-bold uppercase tracking-wide">{error}</p>
        </div>
      </GovernorLayout>
    );
  }

  return (
    <GovernorLayout title="SUPPORT TICKETS">
      {/* Header */}
      <div className="bg-white border border-gray-300 p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">SUPPORT TICKET MANAGEMENT</h1>
            <p className="text-gray-600 uppercase tracking-wide text-sm font-medium">COMPREHENSIVE TICKET TRACKING AND RESOLUTION SYSTEM</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700 uppercase tracking-wide">TICKET SYSTEM ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white border border-gray-300 p-6">
          <div className="border-b border-gray-300 pb-3 mb-4">
            <p className="text-gray-600 font-medium text-sm uppercase tracking-wider">OPEN TICKETS</p>
          </div>
          <div>
            <p className="text-gray-900 text-3xl font-bold">{openTickets}</p>
            <p className="text-gray-500 text-xs mt-1">Awaiting Response</p>
          </div>
        </div>

        <div className="bg-white border border-gray-300 p-6 bg-yellow-50 border-yellow-200">
          <div className="border-b border-yellow-300 pb-3 mb-4">
            <p className="text-yellow-600 font-medium text-sm uppercase tracking-wider">IN PROGRESS</p>
          </div>
          <div>
            <p className="text-yellow-900 text-3xl font-bold">{inProgressTickets}</p>
            <p className="text-yellow-600 text-xs mt-1">Being Processed</p>
          </div>
        </div>

        <div className="bg-white border border-gray-300 p-6 bg-red-50 border-red-200">
          <div className="border-b border-red-300 pb-3 mb-4">
            <p className="text-red-600 font-medium text-sm uppercase tracking-wider">URGENT TICKETS</p>
          </div>
          <div>
            <p className="text-red-900 text-3xl font-bold">{urgentTickets}</p>
            <p className="text-red-600 text-xs mt-1">Immediate Attention</p>
          </div>
        </div>

        <div className="bg-white border border-gray-300 p-6">
          <div className="border-b border-gray-300 pb-3 mb-4">
            <p className="text-gray-600 font-medium text-sm uppercase tracking-wider">ESCALATED</p>
          </div>
          <div>
            <p className="text-gray-900 text-3xl font-bold">{escalatedTickets}</p>
            <p className="text-gray-500 text-xs mt-1">Escalated Issues</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-300 p-6 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter size={16} className="text-gray-500" />
                <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">STATUS:</span>
              </div>
              <div className="flex space-x-2">
                {[
                  { key: 'all', label: 'ALL' },
                  { key: 'open', label: 'OPEN' },
                  { key: 'in_progress', label: 'IN PROGRESS' },
                  { key: 'resolved', label: 'RESOLVED' },
                  { key: 'closed', label: 'CLOSED' }
                ].map(filter => (
                  <button
                    key={filter.key}
                    onClick={() => setStatusFilter(filter.key as any)}
                    className={`px-3 py-2 text-sm font-bold border transition-colors uppercase tracking-wide ${
                      statusFilter === filter.key
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">PRIORITY:</span>
              <div className="flex space-x-2">
                {[
                  { key: 'all', label: 'ALL' },
                  { key: 'urgent', label: 'URGENT' },
                  { key: 'high', label: 'HIGH' },
                  { key: 'medium', label: 'MEDIUM' },
                  { key: 'low', label: 'LOW' }
                ].map(filter => (
                  <button
                    key={filter.key}
                    onClick={() => setPriorityFilter(filter.key as any)}
                    className={`px-3 py-2 text-sm font-bold border transition-colors uppercase tracking-wide ${
                      priorityFilter === filter.key
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="SEARCH TICKETS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 text-sm focus:ring-1 focus:ring-gray-500 focus:border-gray-500 w-80 uppercase tracking-wide font-medium"
            />
          </div>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white border border-gray-300">
        <div className="px-6 py-4 border-b border-gray-300 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">
            SUPPORT TICKETS ({filteredTickets.length} RECORDS)
          </h3>
        </div>
        
        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-gray-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-700 font-bold uppercase tracking-wide">LOADING SUPPORT TICKETS...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-300 bg-gray-100">
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wide">TICKET</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wide">INVESTOR</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wide">TYPE</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wide">PRIORITY</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wide">STATUS</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wide">SUBMITTED BY</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wide">LAST ACTIVITY</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wide">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-gray-900 uppercase tracking-wide">#{ticket.id.slice(-8)}</p>
                        <p className="text-sm text-gray-900 font-medium max-w-xs truncate">{ticket.subject}</p>
                        <p className="text-xs text-gray-600 uppercase tracking-wide">
                          {ticket.submittedAt.toLocaleDateString()}
                        </p>
                        {ticket.escalated && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-bold bg-red-100 text-red-800 border border-red-200 uppercase tracking-wide mt-1">
                            <ArrowUp size={10} className="mr-1" />
                            ESCALATED
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-gray-900 uppercase tracking-wide">{ticket.investorName}</p>
                        <p className="text-xs text-gray-600 uppercase tracking-wide">ID: {ticket.investorId.slice(-8)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {getTicketTypeIcon(ticket.ticketType)}
                        <span className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                          {ticket.ticketType.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 text-xs font-bold border uppercase tracking-wide ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 text-xs font-bold border uppercase tracking-wide ${getStatusColor(ticket.status)}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-gray-900 uppercase tracking-wide">{ticket.submittedByName}</p>
                        <p className="text-xs text-gray-600 uppercase tracking-wide">ADMIN</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <p className="text-sm font-bold text-gray-900">
                        {ticket.lastActivity.toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-600 uppercase tracking-wide">
                        {ticket.lastActivity.toLocaleTimeString()}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-1">
                        <button
                          onClick={() => openTicketDetails(ticket)}
                          className="px-2 py-1 bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 transition-colors uppercase tracking-wide border border-gray-700"
                        >
                          <Eye size={12} className="mr-1 inline" />
                          OPEN
                        </button>
                        {ticket.status === 'open' && !ticket.assignedTo && (
                          <button
                            onClick={() => handleAssignTicket(ticket.id)}
                            className="px-2 py-1 bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors uppercase tracking-wide border border-blue-700"
                          >
                            ASSIGN TO ME
                          </button>
                        )}
                        {ticket.status !== 'closed' && ticket.status !== 'resolved' && (
                          <button
                            onClick={() => handleEscalateTicket(ticket.id)}
                            className="px-2 py-1 bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors uppercase tracking-wide border border-red-700"
                          >
                            <ArrowUp size={12} className="mr-1 inline" />
                            ESCALATE
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ticket Details Modal */}
      {showTicketModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto" onClick={() => setShowTicketModal(false)}>
          <div className="flex min-h-screen items-start justify-center p-4 py-8">
            <div 
              className="relative w-full max-w-4xl bg-white border border-gray-300 shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-gray-300 bg-gray-50 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900 uppercase tracking-wide">
                  TICKET #{selectedTicket.id.slice(-8)} - {selectedTicket.subject}
                </h3>
                <button
                  onClick={() => setShowTicketModal(false)}
                  className="p-2 hover:bg-gray-200 transition-colors border border-gray-300"
                >
                  <X size={18} className="text-gray-500" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto">
                <div className="space-y-6">
                  {/* Ticket Information */}
                  <div className="bg-gray-50 p-6 border border-gray-300">
                    <h4 className="font-bold text-gray-900 mb-4 uppercase tracking-wide">TICKET INFORMATION</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-gray-600 font-bold uppercase tracking-wide mb-1">INVESTOR</p>
                        <p className="text-gray-900 font-medium">{selectedTicket.investorName}</p>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">ID: {selectedTicket.investorId.slice(-8)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 font-bold uppercase tracking-wide mb-1">SUBMITTED BY</p>
                        <p className="text-gray-900 font-medium">{selectedTicket.submittedByName}</p>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">ADMIN USER</p>
                      </div>
                      <div>
                        <p className="text-gray-600 font-bold uppercase tracking-wide mb-1">TYPE</p>
                        <div className="flex items-center space-x-2">
                          {getTicketTypeIcon(selectedTicket.ticketType)}
                          <span className="text-gray-900 font-medium uppercase tracking-wide">
                            {selectedTicket.ticketType.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-600 font-bold uppercase tracking-wide mb-1">PRIORITY</p>
                        <span className={`px-3 py-1 text-xs font-bold border uppercase tracking-wide ${getPriorityColor(selectedTicket.priority)}`}>
                          {selectedTicket.priority}
                        </span>
                      </div>
                      <div>
                        <p className="text-gray-600 font-bold uppercase tracking-wide mb-1">STATUS</p>
                        <span className={`px-3 py-1 text-xs font-bold border uppercase tracking-wide ${getStatusColor(selectedTicket.status)}`}>
                          {selectedTicket.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div>
                        <p className="text-gray-600 font-bold uppercase tracking-wide mb-1">SUBMITTED</p>
                        <p className="text-gray-900 font-medium">{selectedTicket.submittedAt.toLocaleDateString()}</p>
                        <p className="text-xs text-gray-500">{selectedTicket.submittedAt.toLocaleTimeString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Ticket Description */}
                  <div className="bg-white p-6 border border-gray-300">
                    <h4 className="font-bold text-gray-900 mb-3 uppercase tracking-wide">ISSUE DESCRIPTION</h4>
                    <p className="text-gray-800 whitespace-pre-wrap">{selectedTicket.description}</p>
                  </div>

                  {/* Responses */}
                  <div className="bg-white border border-gray-300">
                    <div className="px-6 py-4 border-b border-gray-300 bg-gray-50">
                      <h4 className="font-bold text-gray-900 uppercase tracking-wide">
                        RESPONSES ({selectedTicket.responses.length})
                      </h4>
                    </div>
                    <div className="p-6">
                      {selectedTicket.responses.length > 0 ? (
                        <div className="space-y-4 max-h-64 overflow-y-auto">
                          {selectedTicket.responses.map((response) => (
                            <div key={response.id} className={`p-4 border ${
                              response.responderRole === 'governor' 
                                ? 'bg-gray-50 border-gray-300' 
                                : 'bg-blue-50 border-blue-200'
                            }`}>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <span className="font-bold text-gray-900 uppercase tracking-wide">
                                    {response.responderName}
                                  </span>
                                  <span className={`px-2 py-1 text-xs font-bold border uppercase tracking-wide ${
                                    response.responderRole === 'governor' 
                                      ? 'bg-gray-800 text-white border-gray-900' 
                                      : 'bg-blue-100 text-blue-800 border-blue-200'
                                  }`}>
                                    {response.responderRole}
                                  </span>
                                  {response.isInternal && (
                                    <span className="px-2 py-1 text-xs font-bold bg-red-100 text-red-800 border border-red-200 uppercase tracking-wide">
                                      INTERNAL
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-gray-500 uppercase tracking-wide">
                                  {response.timestamp.toLocaleDateString()} {response.timestamp.toLocaleTimeString()}
                                </span>
                              </div>
                              <p className="text-gray-800 whitespace-pre-wrap">{response.content}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-8 font-bold uppercase tracking-wide">NO RESPONSES YET</p>
                      )}
                    </div>
                  </div>

                  {/* Add Response */}
                  <div className="bg-white border border-gray-300">
                    <div className="px-6 py-4 border-b border-gray-300 bg-gray-50">
                      <h4 className="font-bold text-gray-900 uppercase tracking-wide">ADD RESPONSE</h4>
                    </div>
                    <div className="p-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                            RESPONSE CONTENT
                          </label>
                          <textarea
                            value={responseContent}
                            onChange={(e) => setResponseContent(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 font-medium"
                            rows={6}
                            placeholder="TYPE YOUR RESPONSE HERE..."
                          />
                        </div>

                        <div className="flex items-center space-x-4">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={isInternal}
                              onChange={(e) => setIsInternal(e.target.checked)}
                              className="w-4 h-4"
                            />
                            <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                              INTERNAL NOTE (NOT VISIBLE TO ADMIN)
                            </span>
                          </label>
                        </div>

                        <div className="flex space-x-4">
                          <button
                            onClick={handleAddResponse}
                            disabled={!responseContent.trim() || isLoading}
                            className="px-4 py-3 bg-gray-900 text-white font-bold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide border border-gray-700"
                          >
                            <Send size={16} className="mr-2 inline" />
                            {isLoading ? 'SENDING...' : 'SEND RESPONSE'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ticket Actions */}
                  <div className="bg-white border border-gray-300">
                    <div className="px-6 py-4 border-b border-gray-300 bg-gray-50">
                      <h4 className="font-bold text-gray-900 uppercase tracking-wide">TICKET ACTIONS</h4>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {selectedTicket.status !== 'resolved' && selectedTicket.status !== 'closed' && (
                          <button
                            onClick={() => {
                              const resolution = prompt('RESOLUTION NOTES:\n\nEnter resolution details:');
                              if (resolution) {
                                handleUpdateStatus(selectedTicket.id, 'resolved', resolution);
                              }
                            }}
                            className="px-4 py-3 bg-green-600 text-white font-bold hover:bg-green-700 transition-colors uppercase tracking-wide border border-green-700"
                          >
                            <CheckCircle size={16} className="mr-2 inline" />
                            RESOLVE
                          </button>
                        )}
                        
                        {selectedTicket.status !== 'closed' && (
                          <button
                            onClick={() => handleUpdateStatus(selectedTicket.id, 'closed')}
                            className="px-4 py-3 bg-gray-600 text-white font-bold hover:bg-gray-700 transition-colors uppercase tracking-wide border border-gray-700"
                          >
                            <X size={16} className="mr-2 inline" />
                            CLOSE
                          </button>
                        )}
                        
                        {selectedTicket.status === 'open' && (
                          <button
                            onClick={() => handleUpdateStatus(selectedTicket.id, 'in_progress')}
                            className="px-4 py-3 bg-yellow-600 text-white font-bold hover:bg-yellow-700 transition-colors uppercase tracking-wide border border-yellow-700"
                          >
                            <Clock size={16} className="mr-2 inline" />
                            START WORK
                          </button>
                        )}
                        
                        {!selectedTicket.escalated && selectedTicket.status !== 'closed' && (
                          <button
                            onClick={() => handleEscalateTicket(selectedTicket.id)}
                            className="px-4 py-3 bg-red-600 text-white font-bold hover:bg-red-700 transition-colors uppercase tracking-wide border border-red-700"
                          >
                            <ArrowUp size={16} className="mr-2 inline" />
                            ESCALATE
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </GovernorLayout>
  );
};

export default GovernorSupportTicketsPage;