import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Button from '../common/Button';
import Modal from '../common/Modal';
import { GovernorService } from '../../services/governorService';
import { useAuth } from '../../contexts/AuthContext';
import { useInvestors } from '../../hooks/useFirestore';
import { useAccountFlags } from '../../hooks/useGovernor';
import { 
  AlertTriangle, 
  Shield, 
  Ban, 
  FileX, 
  Flag,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle
} from 'lucide-react';

const AccountFlaggingPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { investors } = useInvestors();
  const { flags, loading, refetch } = useAccountFlags();
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [selectedInvestor, setSelectedInvestor] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'fraud' | 'policy_violation' | 'withdrawal_restriction' | 'kyc_document_issue'>('all');
  
  // Flag form state
  const [flagType, setFlagType] = useState<'fraud' | 'policy_violation' | 'withdrawal_restriction' | 'kyc_document_issue'>('policy_violation');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [description, setDescription] = useState('');
  const [autoRestrictions, setAutoRestrictions] = useState({
    withdrawalDisabled: false,
    accountSuspended: false,
    requiresApproval: false
  });
  const [isLoading, setIsLoading] = useState(false);

  const flagTypes = [
    { 
      id: 'fraud', 
      label: 'FRAUD DETECTION', 
      icon: <AlertTriangle size={16} />, 
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    { 
      id: 'policy_violation', 
      label: 'POLICY VIOLATION', 
      icon: <Shield size={16} />, 
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200'
    },
    { 
      id: 'withdrawal_restriction', 
      label: 'WITHDRAWAL RESTRICTION', 
      icon: <Ban size={16} />, 
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    { 
      id: 'kyc_document_issue', 
      label: 'KYC/DOCUMENT ISSUE', 
      icon: <FileX size={16} />, 
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    }
  ];

  const severityLevels = [
    { id: 'low', label: 'LOW', color: 'text-gray-600', bgColor: 'bg-gray-100' },
    { id: 'medium', label: 'MEDIUM', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
    { id: 'high', label: 'HIGH', color: 'text-orange-600', bgColor: 'bg-orange-100' },
    { id: 'critical', label: 'CRITICAL', color: 'text-red-600', bgColor: 'bg-red-100' }
  ];

  const filteredFlags = flags.filter(flag => {
    const matchesType = filterType === 'all' || flag.flagType === filterType;
    const matchesSearch = flag.investorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flag.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleCreateFlag = async () => {
    if (!selectedInvestor || !user || !description.trim()) return;

    setIsLoading(true);
    try {
      await GovernorService.createAccountFlag(
        selectedInvestor.id,
        selectedInvestor.name,
        flagType,
        severity,
        description,
        user.id,
        user.name,
        autoRestrictions
      );

      setShowFlagModal(false);
      setSelectedInvestor(null);
      setDescription('');
      setAutoRestrictions({
        withdrawalDisabled: false,
        accountSuspended: false,
        requiresApproval: false
      });
      refetch();
    } catch (error) {
      console.error('Error creating flag:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolveFlag = async (flagId: string, resolutionNotes: string) => {
    if (!user || !resolutionNotes.trim()) return;

    try {
      await GovernorService.resolveAccountFlag(
        flagId,
        resolutionNotes.trim(),
        user.id,
        user.name
      );
      
      console.log('✅ Flag resolved successfully');
      refetch();
    } catch (error) {
      console.error('Error resolving flag:', error);
      alert('Failed to resolve flag. Please try again.');
    }
  };

  const openResolveModal = (flag: any) => {
    const resolutionNotes = prompt(`RESOLVE FLAG: ${flag.investorName}\n\nEnter resolution notes:`);
    if (resolutionNotes) {
      handleResolveFlag(flag.id, resolutionNotes);
    }
  };
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-300 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">ACCOUNT FLAGGING SYSTEM</h1>
            <p className="text-gray-600 uppercase tracking-wide text-sm font-medium">COMPREHENSIVE ACCOUNT MONITORING AND RESTRICTION CONTROLS</p>
          </div>
          <button
            onClick={() => setShowFlagModal(true)}
            className="px-4 py-2 bg-red-600 text-white font-bold hover:bg-red-700 transition-colors uppercase tracking-wide border border-red-700"
          >
            <Flag size={16} className="mr-2 inline" />
            CREATE NEW FLAG
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {flagTypes.map((type) => {
          const count = flags.filter(flag => flag.flagType === type.id && flag.status === 'active').length;
          return (
            <div key={type.id} className={`bg-white border border-gray-300 p-6 ${type.bgColor} ${type.borderColor}`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 bg-white border border-gray-300 ${type.color}`}>
                  {type.icon}
                </div>
                <div className={`w-3 h-3 rounded-full ${count > 0 ? 'bg-red-500' : 'bg-gray-300'}`}></div>
              </div>
              <div>
                <p className="text-gray-600 text-sm font-medium uppercase tracking-wider">{type.label}</p>
                <p className="text-3xl font-bold text-gray-900">{count}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-300 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter size={16} className="text-gray-500" />
              <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">FLAG TYPE:</span>
            </div>
            <div className="flex space-x-2">
              {[
                { key: 'all', label: 'ALL' },
                ...flagTypes.map(type => ({ key: type.id, label: type.label.split(' ')[0] }))
              ].map(filter => (
                <button
                  key={filter.key}
                  onClick={() => setFilterType(filter.key as any)}
                  className={`px-3 py-2 text-sm font-bold border transition-colors uppercase tracking-wide ${
                    filterType === filter.key
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
            <input
              type="text"
              placeholder="SEARCH FLAGS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 text-sm focus:ring-1 focus:ring-gray-500 focus:border-gray-500 w-80 uppercase tracking-wide font-medium"
            />
          </div>
        </div>
      </div>

      {/* Flags Table */}
      <div className="bg-white border border-gray-300">
        <div className="px-6 py-4 border-b border-gray-300 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">
            ACTIVE FLAGS ({filteredFlags.length} RECORDS)
          </h3>
        </div>
        
        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-gray-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-700 font-bold uppercase tracking-wide">LOADING FLAG DATA...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-300 bg-gray-100">
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wide">INVESTOR</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wide">FLAG TYPE</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wide">SEVERITY</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wide">DESCRIPTION</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wide">RESTRICTIONS</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wide">STATUS</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wide">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredFlags.map((flag) => {
                  const flagTypeConfig = flagTypes.find(type => type.id === flag.flagType);
                  const severityConfig = severityLevels.find(level => level.id === flag.severity);

                  return (
                    <tr key={flag.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-gray-900 uppercase tracking-wide">{flag.investorName}</p>
                          <p className="text-xs text-gray-600 uppercase tracking-wide">ID: {flag.investorId.slice(-8)}</p>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">
                            FLAGGED: {flag.flaggedAt.toLocaleDateString()}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`flex items-center space-x-2 px-3 py-2 rounded border ${flagTypeConfig?.bgColor} ${flagTypeConfig?.borderColor}`}>
                          {flagTypeConfig?.icon}
                          <span className={`text-xs font-bold uppercase tracking-wide ${flagTypeConfig?.color}`}>
                            {flagTypeConfig?.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 text-xs font-bold border uppercase tracking-wide ${severityConfig?.bgColor} ${severityConfig?.color}`}>
                          {severityConfig?.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900 max-w-xs truncate">{flag.description}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="space-y-1">
                          {flag.autoRestrictions.withdrawalDisabled && (
                            <span className="block px-2 py-1 bg-red-100 text-red-800 text-xs font-bold border border-red-200 uppercase tracking-wide">
                              WITHDRAWAL DISABLED
                            </span>
                          )}
                          {flag.autoRestrictions.accountSuspended && (
                            <span className="block px-2 py-1 bg-red-100 text-red-800 text-xs font-bold border border-red-200 uppercase tracking-wide">
                              ACCOUNT SUSPENDED
                            </span>
                          )}
                          {flag.autoRestrictions.requiresApproval && (
                            <span className="block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold border border-yellow-200 uppercase tracking-wide">
                              REQUIRES APPROVAL
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 text-xs font-bold border uppercase tracking-wide ${
                          flag.status === 'active' ? 'bg-red-100 text-red-800 border-red-200' :
                          flag.status === 'resolved' ? 'bg-green-100 text-green-800 border-green-200' :
                          'bg-yellow-100 text-yellow-800 border-yellow-200'
                        }`}>
                          {flag.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col space-y-1">
                          <button
                            onClick={() => {
                              const investor = investors.find(inv => inv.id === flag.investorId);
                              if (investor) {
                                navigate(`/governor/investor/${investor.id}`);
                              }
                            }}
                            className="px-2 py-1 bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 transition-colors uppercase tracking-wide border border-gray-700"
                          >
                            <Eye size={12} className="mr-1 inline" />
                            VIEW
                          </button>
                          {flag.status === 'active' && (
                            <button
                              onClick={() => openResolveModal(flag)}
                              className="px-2 py-1 bg-green-600 text-white text-xs font-bold hover:bg-green-700 transition-colors uppercase tracking-wide border border-green-700"
                            >
                              <CheckCircle size={12} className="mr-1 inline" />
                              RESOLVE
                            </button>
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

      {/* Create Flag Modal */}
      <Modal
        isOpen={showFlagModal}
        onClose={() => {
          setShowFlagModal(false);
          setSelectedInvestor(null);
          setDescription('');
        }}
        title="CREATE ACCOUNT FLAG"
        size="lg"
      >
        <div className="space-y-6">
          {/* Investor Selection */}
          {!selectedInvestor ? (
            <div>
              <h4 className="font-bold text-gray-900 mb-4 uppercase tracking-wide">SELECT INVESTOR TO FLAG</h4>
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
                        <p className="text-xs text-gray-500 uppercase tracking-wide">
                          STATUS: {investor.accountStatus || 'ACTIVE'}
                        </p>
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
                    <h4 className="font-bold text-gray-900 uppercase tracking-wide">FLAGGING: {selectedInvestor.name}</h4>
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

              {/* Flag Type Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                  FLAG TYPE
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {flagTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setFlagType(type.id as any)}
                      className={`p-4 border transition-all text-left ${
                        flagType === type.id
                          ? `${type.bgColor} ${type.borderColor} border-2`
                          : 'border-gray-300 hover:border-gray-400 bg-white'
                      }`}
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        {type.icon}
                        <span className={`font-bold text-sm uppercase tracking-wide ${
                          flagType === type.id ? type.color : 'text-gray-700'
                        }`}>
                          {type.label}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Severity Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                  SEVERITY LEVEL
                </label>
                <div className="flex space-x-2">
                  {severityLevels.map((level) => (
                    <button
                      key={level.id}
                      onClick={() => setSeverity(level.id as any)}
                      className={`px-4 py-2 border transition-all font-bold uppercase tracking-wide text-sm ${
                        severity === level.id
                          ? `${level.bgColor} ${level.color} border-gray-900`
                          : 'border-gray-300 text-gray-600 hover:border-gray-400 bg-white'
                      }`}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Auto-Restrictions */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                  AUTOMATIC RESTRICTIONS
                </label>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={autoRestrictions.withdrawalDisabled}
                      onChange={(e) => setAutoRestrictions(prev => ({
                        ...prev,
                        withdrawalDisabled: e.target.checked
                      }))}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                      DISABLE WITHDRAWALS IMMEDIATELY
                    </span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={autoRestrictions.accountSuspended}
                      onChange={(e) => setAutoRestrictions(prev => ({
                        ...prev,
                        accountSuspended: e.target.checked
                      }))}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                      SUSPEND ACCOUNT ACCESS
                    </span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={autoRestrictions.requiresApproval}
                      onChange={(e) => setAutoRestrictions(prev => ({
                        ...prev,
                        requiresApproval: e.target.checked
                      }))}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                      REQUIRE GOVERNOR APPROVAL FOR ALL ACTIONS
                    </span>
                  </label>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  FLAG DESCRIPTION <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 font-medium"
                  rows={4}
                  placeholder="PROVIDE DETAILED EXPLANATION FOR THIS FLAG..."
                  required
                />
              </div>

              {/* Submit Button */}
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setShowFlagModal(false);
                    setSelectedInvestor(null);
                    setDescription('');
                  }}
                  className="flex-1 px-4 py-3 bg-white border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors uppercase tracking-wide"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleCreateFlag}
                  disabled={!description.trim() || isLoading}
                  className="flex-1 px-4 py-3 bg-red-600 text-white font-bold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide border border-red-700"
                >
                  {isLoading ? 'CREATING FLAG...' : 'CREATE FLAG'}
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default AccountFlaggingPanel;