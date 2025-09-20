import { useState } from 'react';
import { motion } from 'framer-motion';
import Button from '../common/Button';
import { Investor } from '../../types/user';
import { SupportTicketService } from '../../services/supportTicketService';
import { useAuth } from '../../contexts/AuthContext';
import { 
  AlertTriangle, 
  CheckCircle, 
  MessageSquare, 
  User, 
  Shield, 
  DollarSign, 
  Eye, 
  FileText,
  Clock,
  Send
} from 'lucide-react';

interface SubmitTicketPanelProps {
  investor: Investor;
}

type TicketType = 'suspicious_activity' | 'information_modification' | 'policy_violation' | 'account_issue' | 'other';
type Priority = 'low' | 'medium' | 'high' | 'urgent';

const SubmitTicketPanel = ({ investor }: SubmitTicketPanelProps) => {
  const { user } = useAuth();
  const [ticketType, setTicketType] = useState<TicketType>('suspicious_activity');
  const [priority, setPriority] = useState<Priority>('medium');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const ticketTypes = [
    {
      id: 'suspicious_activity' as TicketType,
      label: 'SUSPICIOUS ACTIVITY',
      icon: <Eye size={16} />,
      description: 'Report unusual trading patterns, login attempts, or account behavior',
      defaultSubject: `Suspicious Activity Report - ${investor.name}`
    },
    {
      id: 'information_modification' as TicketType,
      label: 'INFORMATION MODIFICATION',
      icon: <User size={16} />,
      description: 'Request changes to investor profile, bank details, or personal information',
      defaultSubject: `Information Modification Request - ${investor.name}`
    },
    {
      id: 'policy_violation' as TicketType,
      label: 'POLICY VIOLATION',
      icon: <Shield size={16} />,
      description: 'Report violations of platform policies or terms of service',
      defaultSubject: `Policy Violation Report - ${investor.name}`
    },
    {
      id: 'account_issue' as TicketType,
      label: 'ACCOUNT ISSUE',
      icon: <DollarSign size={16} />,
      description: 'Report account access issues, balance discrepancies, or technical problems',
      defaultSubject: `Account Issue Report - ${investor.name}`
    },
    {
      id: 'other' as TicketType,
      label: 'OTHER',
      icon: <FileText size={16} />,
      description: 'General inquiries or issues not covered by other categories',
      defaultSubject: `General Inquiry - ${investor.name}`
    }
  ];

  const priorityLevels = [
    { id: 'low' as Priority, label: 'LOW', color: 'text-gray-700', bgColor: 'bg-gray-100', borderColor: 'border-gray-200' },
    { id: 'medium' as Priority, label: 'MEDIUM', color: 'text-gray-700', bgColor: 'bg-gray-100', borderColor: 'border-gray-200' },
    { id: 'high' as Priority, label: 'HIGH', color: 'text-gray-700', bgColor: 'bg-gray-100', borderColor: 'border-gray-200' },
    { id: 'urgent' as Priority, label: 'URGENT', color: 'text-gray-700', bgColor: 'bg-gray-100', borderColor: 'border-gray-200' }
  ];

  const handleTicketTypeChange = (type: TicketType) => {
    setTicketType(type);
    const selectedType = ticketTypes.find(t => t.id === type);
    if (selectedType) {
      setSubject(selectedType.defaultSubject);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject.trim() || !description.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    if (!user) {
      setError('User authentication required');
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      // Create actual support ticket in Firebase
      await SupportTicketService.createTicket({
        investorId: investor.id,
        investorName: investor.name,
        submittedBy: user.id,
        submittedByName: user.name,
        ticketType,
        priority,
        subject,
        description,
        status: 'Open',
        responses: [],
        tags: [],
        attachments: [],
        escalated: false
      });
      
      setIsSuccess(true);
      
      // Reset form after success
      setTimeout(() => {
        setIsSuccess(false);
        setSubject('');
        setDescription('');
        setTicketType('suspicious_activity');
        setPriority('medium');
      }, 3000);

    } catch (error) {
      console.error('Error submitting ticket:', error);
      setError('Failed to submit ticket. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <CheckCircle size={20} className="text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900 uppercase tracking-wide">TICKET SUBMITTED SUCCESSFULLY</h3>
          </div>
        </div>
        <div className="p-6">
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4 border border-gray-200">
              <CheckCircle size={32} className="text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2 uppercase tracking-wide">SUPPORT TICKET CREATED</h3>
            <p className="text-gray-600 mb-4 uppercase tracking-wide text-sm">
              Your ticket regarding {investor.name} has been submitted to the support team.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-gray-800 text-sm font-medium uppercase tracking-wide">
                <strong>TICKET ID:</strong> #{Date.now().toString().slice(-6)}
              </p>
              <p className="text-gray-700 text-sm mt-1 uppercase tracking-wide">
                You will receive updates on this ticket via email and in your notifications panel.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center space-x-2">
          <MessageSquare size={20} className="text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900 uppercase tracking-wide">Submit Support Ticket</h3>
        </div>
      </div>
      <div className="p-6">
        <div className="mb-6">
          <p className="text-gray-600 mb-2 uppercase tracking-wide text-sm">
            Submit a support ticket for issues related to <span className="font-semibold">{investor.name}</span>'s account.
          </p>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600 font-medium uppercase tracking-wide">Investor ID</p>
                <p className="font-medium text-gray-900">{investor.id.slice(-8)}</p>
              </div>
              <div>
                <p className="text-gray-600 font-medium uppercase tracking-wide">Current Balance</p>
                <p className="font-medium text-gray-900">${investor.currentBalance.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-600 font-medium uppercase tracking-wide">Account Status</p>
                <p className="font-medium text-gray-900">{investor.accountStatus || 'Active'}</p>
              </div>
              <div>
                <p className="text-gray-600 font-medium uppercase tracking-wide">Country</p>
                <p className="font-medium text-gray-900">{investor.country}</p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Ticket Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 uppercase tracking-wide">
              Issue Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ticketTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => handleTicketTypeChange(type.id)}
                  className={`p-4 rounded-lg border transition-all text-left ${
                    ticketType === type.id
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    {type.icon}
                    <span className="font-medium text-gray-900 uppercase tracking-wide text-sm">{type.label.toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}</span>
                  </div>
                  <p className="text-sm text-gray-600 uppercase tracking-wide">{type.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Priority Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 uppercase tracking-wide">
              Priority Level
            </label>
            <div className="flex space-x-2">
              {priorityLevels.map((level) => (
                <button
                  key={level.id}
                  type="button"
                  onClick={() => setPriority(level.id)}
                  className={`px-4 py-2 rounded-lg border transition-all font-medium uppercase tracking-wide text-sm ${
                    priority === level.id
                      ? `border-gray-900 ${level.bgColor} ${level.color}`
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
                  }`}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
              placeholder="Brief description of the issue"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
              Detailed Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
              rows={6}
              placeholder="Provide detailed information about the issue, including any relevant dates, amounts, or circumstances..."
              required
            />
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">
              Be as specific as possible to help our support team resolve the issue quickly.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-gray-50 border border-gray-200 text-gray-700 px-4 py-3 rounded-lg flex items-center">
              <AlertTriangle size={16} className="mr-2" />
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading || !subject.trim() || !description.trim()}
              className="px-6 py-3 bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide"
            >
              <Send size={18} className="mr-2 inline" />
              {isLoading ? 'Submitting ticket...' : 'Submit Support Ticket'}
            </button>
          </div>
        </form>

        {/* Ticket Guidelines */}
        <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h4 className="font-medium text-gray-800 mb-2 flex items-center uppercase tracking-wide">
            <Clock size={16} className="mr-2" />
            Support Guidelines
          </h4>
          <ul className="text-gray-700 text-sm space-y-1">
            <li>• <strong>Urgent tickets</strong> are reviewed within 2 hours</li>
            <li>• <strong>High priority tickets</strong> are reviewed within 4 hours</li>
            <li>• <strong>Medium/low priority tickets</strong> are reviewed within 24 hours</li>
            <li>• Include specific details, dates, and amounts when relevant</li>
            <li>• Attach screenshots or documentation if available</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SubmitTicketPanel;