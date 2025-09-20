import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Button from '../common/Button';
import Modal from '../common/Modal';
import { GovernorService } from '../../services/governorService';
import { useAuth } from '../../contexts/AuthContext';
import { useInvestors } from '../../hooks/useFirestore';
import { useDocumentRequests } from '../../hooks/useGovernor';
import { 
  FileText, 
  Upload, 
  Calendar, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Download,
  Search,
  Filter
} from 'lucide-react';

const DocumentRequestPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { investors } = useInvestors();
  const { requests, loading, refetch } = useDocumentRequests();
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedInvestor, setSelectedInvestor] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'submitted' | 'approved' | 'rejected'>('all');
  
  // Request form state
  const [documentType, setDocumentType] = useState<'bank_statement' | 'tax_report' | 'salary_certificate' | 'proof_of_revenue' | 'proof_of_residency' | 'identity_document' | 'other'>('bank_statement');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const documentTypes = [
    { id: 'bank_statement', label: 'BANK STATEMENT', icon: <FileText size={16} /> },
    { id: 'tax_report', label: 'TAX REPORT', icon: <FileText size={16} /> },
    { id: 'salary_certificate', label: 'SALARY CERTIFICATE', icon: <FileText size={16} /> },
    { id: 'proof_of_revenue', label: 'PROOF OF REVENUE', icon: <FileText size={16} /> },
    { id: 'proof_of_residency', label: 'PROOF OF RESIDENCY', icon: <FileText size={16} /> },
    { id: 'identity_document', label: 'IDENTITY DOCUMENT', icon: <FileText size={16} /> },
    { id: 'other', label: 'OTHER DOCUMENT', icon: <FileText size={16} /> }
  ];

  const priorityLevels = [
    { id: 'low', label: 'LOW', color: 'text-gray-600', bgColor: 'bg-gray-100' },
    { id: 'medium', label: 'MEDIUM', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
    { id: 'high', label: 'HIGH', color: 'text-orange-600', bgColor: 'bg-orange-100' },
    { id: 'urgent', label: 'URGENT', color: 'text-red-600', bgColor: 'bg-red-100' }
  ];

  const filteredRequests = requests.filter(request => {
    const matchesStatus = filterStatus === 'all' || request.status === filterStatus;
    const matchesSearch = request.investorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleCreateRequest = async () => {
    if (!selectedInvestor || !user || !description.trim()) return;

    setIsLoading(true);
    try {
      await GovernorService.requestDocument(
        selectedInvestor.id,
        selectedInvestor.name,
        documentType,
        description,
        priority,
        user.id,
        user.name,
        dueDate ? new Date(dueDate) : undefined
      );

      setShowRequestModal(false);
      setSelectedInvestor(null);
      setDescription('');
      setDueDate('');
      refetch();
    } catch (error) {
      console.error('Error creating document request:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-300 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">DOCUMENT REQUEST SYSTEM</h1>
            <p className="text-gray-600 uppercase tracking-wide text-sm font-medium">REQUEST AND MANAGE INVESTOR DOCUMENTATION</p>
          </div>
          <button
            onClick={() => setShowRequestModal(true)}
            className="px-4 py-2 bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors uppercase tracking-wide border border-blue-700"
          >
            REQUEST DOCUMENT
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'PENDING REQUESTS', count: requests.filter(r => r.status === 'pending').length, color: 'text-yellow-600' },
          { label: 'SUBMITTED DOCUMENTS', count: requests.filter(r => r.status === 'submitted').length, color: 'text-blue-600' },
          { label: 'APPROVED DOCUMENTS', count: requests.filter(r => r.status === 'approved').length, color: 'text-green-600' },
          { label: 'REJECTED DOCUMENTS', count: requests.filter(r => r.status === 'rejected').length, color: 'text-red-600' }
        ].map((stat, index) => (
          <div key={index} className="bg-white border border-gray-300 p-6">
            <div className="border-b border-gray-300 pb-3 mb-4">
              <p className="text-gray-600 font-medium text-sm uppercase tracking-wider">{stat.label}</p>
            </div>
            <div>
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.count}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-300 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter size={16} className="text-gray-500" />
              <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">STATUS:</span>
            </div>
            <div className="flex space-x-2">
              {[
                { key: 'all', label: 'ALL' },
                { key: 'pending', label: 'PENDING' },
                { key: 'submitted', label: 'SUBMITTED' },
                { key: 'approved', label: 'APPROVED' },
                { key: 'rejected', label: 'REJECTED' }
              ].map(filter => (
                <button
                  key={filter.key}
                  onClick={() => setFilterStatus(filter.key as any)}
                  className={`px-3 py-2 text-sm font-bold border transition-colors uppercase tracking-wide ${
                    filterStatus === filter.key
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="SEARCH REQUESTS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 text-sm focus:ring-1 focus:ring-gray-500 focus:border-gray-500 w-80 uppercase tracking-wide font-medium"
            />
          </div>
        </div>
      </div>

      {/* Document Requests Table */}
      <div className="bg-white border border-gray-300">
        <div className="px-6 py-4 border-b border-gray-300 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">
            DOCUMENT REQUESTS ({filteredRequests.length} RECORDS)
          </h3>
        </div>
        
        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-gray-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-700 font-bold uppercase tracking-wide">LOADING DOCUMENT REQUESTS...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-300 bg-gray-100">
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wide">INVESTOR</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wide">DOCUMENT TYPE</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wide">PRIORITY</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wide">DESCRIPTION</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wide">STATUS</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wide">DUE DATE</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wide">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => {
                  const docTypeConfig = documentTypes.find(type => type.id === request.documentType);
                  const priorityConfig = priorityLevels.find(level => level.id === request.priority);

                  return (
                    <tr key={request.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-gray-900 uppercase tracking-wide">{request.investorName}</p>
                          <p className="text-xs text-gray-600 uppercase tracking-wide">ID: {request.investorId.slice(-8)}</p>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">
                            REQUESTED: {request.requestedAt.toLocaleDateString()}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {docTypeConfig?.icon}
                          <span className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                            {docTypeConfig?.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 text-xs font-bold border uppercase tracking-wide ${priorityConfig?.bgColor} ${priorityConfig?.color}`}>
                          {priorityConfig?.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900 max-w-xs truncate">{request.description}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 text-xs font-bold border uppercase tracking-wide ${
                          request.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                          request.status === 'submitted' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                          request.status === 'approved' ? 'bg-green-100 text-green-800 border-green-200' :
                          request.status === 'rejected' ? 'bg-red-100 text-red-800 border-red-200' :
                          'bg-gray-100 text-gray-800 border-gray-200'
                        }`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {request.dueDate ? (
                          <div>
                            <p className="text-sm font-bold text-gray-900">
                              {request.dueDate.toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">
                              {Math.ceil((request.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} DAYS
                            </p>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm uppercase tracking-wide">NO DEADLINE</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col space-y-1">
                          <button
                            onClick={() => {
                              // Find the investor and navigate to their profile
                              const investor = investors.find(inv => inv.id === request.investorId);
                              if (investor) {
                                navigate(`/governor/investor/${investor.id}`);
                              }
                            }}
                            className="px-2 py-1 bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 transition-colors uppercase tracking-wide border border-gray-700"
                          >
                            <Eye size={12} className="mr-1 inline" />
                            VIEW
                          </button>
                          {request.status === 'submitted' && (
                            <>
                              <button
                                onClick={() => {
                                  // Approve document
                                  console.log('Approve document:', request.id);
                                }}
                                className="px-2 py-1 bg-green-600 text-white text-xs font-bold hover:bg-green-700 transition-colors uppercase tracking-wide border border-green-700"
                              >
                                <CheckCircle size={12} className="mr-1 inline" />
                                APPROVE
                              </button>
                              <button
                                onClick={() => {
                                  // Reject document
                                  console.log('Reject document:', request.id);
                                }}
                                className="px-2 py-1 bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors uppercase tracking-wide border border-red-700"
                              >
                                <XCircle size={12} className="mr-1 inline" />
                                REJECT
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Document Request Modal */}
      <Modal
        isOpen={showRequestModal}
        onClose={() => {
          setShowRequestModal(false);
          setSelectedInvestor(null);
          setDescription('');
          setDueDate('');
        }}
        title="REQUEST DOCUMENT"
        size="lg"
      >
        <div className="space-y-6">
          {/* Investor Selection */}
          {!selectedInvestor ? (
            <div>
              <h4 className="font-bold text-gray-900 mb-4 uppercase tracking-wide">SELECT INVESTOR</h4>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {investors.map(investor => (
                  <button
                    key={investor.id}
                    onClick={() => setSelectedInvestor(investor)}
                    className="w-full text-left p-4 border border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-gray-900 uppercase tracking-wide">{investor.name}</p>
                        <p className="text-sm text-gray-600 uppercase tracking-wide">{investor.country}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">${investor.currentBalance.toLocaleString()}</p>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">BALANCE</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Selected Investor */}
              <div className="bg-gray-50 p-4 border border-gray-300">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-gray-900 uppercase tracking-wide">REQUESTING FROM: {selectedInvestor.name}</h4>
                    <p className="text-sm text-gray-600 uppercase tracking-wide">
                      {selectedInvestor.country} | BALANCE: ${selectedInvestor.currentBalance.toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedInvestor(null)}
                    className="px-3 py-1 bg-white border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50 transition-colors uppercase tracking-wide"
                  >
                    CHANGE
                  </button>
                </div>
              </div>

              {/* Document Type Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                  DOCUMENT TYPE
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {documentTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setDocumentType(type.id as any)}
                      className={`p-4 border transition-all text-left ${
                        documentType === type.id
                          ? 'bg-blue-50 border-blue-300 border-2'
                          : 'border-gray-300 hover:border-gray-400 bg-white'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {type.icon}
                        <span className={`font-bold text-sm uppercase tracking-wide ${
                          documentType === type.id ? 'text-blue-700' : 'text-gray-700'
                        }`}>
                          {type.label}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                  PRIORITY LEVEL
                </label>
                <div className="flex space-x-2">
                  {priorityLevels.map((level) => (
                    <button
                      key={level.id}
                      onClick={() => setPriority(level.id as any)}
                      className={`px-4 py-2 border transition-all font-bold uppercase tracking-wide text-sm ${
                        priority === level.id
                          ? `${level.bgColor} ${level.color} border-gray-900`
                          : 'border-gray-300 text-gray-600 hover:border-gray-400 bg-white'
                      }`}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  DUE DATE (OPTIONAL)
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 font-medium"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  REQUEST DESCRIPTION <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 font-medium"
                  rows={4}
                  placeholder="SPECIFY EXACTLY WHAT DOCUMENTS ARE REQUIRED AND WHY..."
                  required
                />
              </div>

              {/* Submit Button */}
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setShowRequestModal(false);
                    setSelectedInvestor(null);
                    setDescription('');
                    setDueDate('');
                  }}
                  className="flex-1 px-4 py-3 bg-white border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors uppercase tracking-wide"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleCreateRequest}
                  disabled={!description.trim() || isLoading}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide border border-blue-700"
                >
                  {isLoading ? 'CREATING REQUEST...' : 'CREATE REQUEST'}
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default DocumentRequestPanel;