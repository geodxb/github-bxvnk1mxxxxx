import { useState } from 'react';
import { motion } from 'framer-motion';
import Button from '../common/Button';
import Modal from '../common/Modal';
import { GovernorService } from '../../services/governorService';
import { useAuth } from '../../contexts/AuthContext';
import { useInvestors } from '../../hooks/useFirestore';
import { useShadowBan } from '../../hooks/useGovernor';
import { 
  EyeOff, 
  Ban, 
  Shield, 
  AlertTriangle,
  Clock,
  CheckCircle,
  Search,
  Filter
} from 'lucide-react';

interface ShadowBanPanelProps {
  investorId?: string;
}

const ShadowBanPanel = ({ investorId }: ShadowBanPanelProps) => {
  const { user } = useAuth();
  const { investors } = useInvestors();
  const [showBanModal, setShowBanModal] = useState(false);
  const [selectedInvestor, setSelectedInvestor] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Ban form state
  const [banType, setBanType] = useState<'withdrawal_only' | 'trading_only' | 'full_platform'>('withdrawal_only');
  const [reason, setReason] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const banTypes = [
    { 
      id: 'withdrawal_only', 
      label: 'WITHDRAWAL ONLY', 
      description: 'Disable withdrawal functionality while keeping trading active',
      icon: <Ban size={16} />,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200'
    },
    { 
      id: 'trading_only', 
      label: 'TRADING ONLY', 
      description: 'Disable trading while keeping withdrawals active',
      icon: <Shield size={16} />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    { 
      id: 'full_platform', 
      label: 'FULL PLATFORM', 
      description: 'Complete platform access restriction',
      icon: <EyeOff size={16} />,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    }
  ];

  // Get investors with shadow bans
  const investorsWithBans = investors.filter(investor => {
    return investor.accountFlags?.shadowBanned;
  });

  const filteredInvestors = investors.filter(investor => {
    return investor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      investor.country.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleCreateShadowBan = async () => {
    if (!selectedInvestor || !user || !reason.trim()) return;

    setIsLoading(true);
    try {
      await GovernorService.createShadowBan(
        selectedInvestor.id,
        selectedInvestor.name,
        banType,
        reason,
        user.id,
        user.name,
        expiresAt ? new Date(expiresAt) : undefined
      );

      setShowBanModal(false);
      setSelectedInvestor(null);
      setReason('');
      setExpiresAt('');
    } catch (error) {
      console.error('Error creating shadow ban:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveShadowBan = async (investorId: string, investorName: string) => {
    if (!user) return;

    if (!confirm(`REMOVE SHADOW BAN: ${investorName}?\n\nThis will restore full platform access.`)) {
      return;
    }

    try {
      // Remove shadow ban logic would go here
      console.log('Removing shadow ban for:', investorName);
    } catch (error) {
      console.error('Error removing shadow ban:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-300 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">SHADOW BAN CONTROL</h1>
            <p className="text-gray-600 uppercase tracking-wide text-sm font-medium">INSTANT PLATFORM ACCESS RESTRICTIONS</p>
          </div>
          <button
            onClick={() => setShowBanModal(true)}
            className="px-4 py-2 bg-red-600 text-white font-bold hover:bg-red-700 transition-colors uppercase tracking-wide border border-red-700"
          >
            CREATE SHADOW BAN
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {banTypes.map((type) => {
          const count = investorsWithBans.filter(inv => 
            inv.accountFlags?.shadowBanType === type.id
          ).length;
          
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
                <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">{type.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Shadow Bans */}
      <div className="bg-white border border-gray-300">
        <div className="px-6 py-4 border-b border-gray-300 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">
            ACTIVE SHADOW BANS ({investorsWithBans.length} ACCOUNTS)
          </h3>
        </div>
        
        <div className="p-6">
          {investorsWithBans.length > 0 ? (
            <div className="space-y-4">
              {investorsWithBans.map((investor) => {
                const banTypeConfig = banTypes.find(type => type.id === investor.accountFlags?.shadowBanType);
                
                return (
                  <div key={investor.id} className="bg-gray-50 p-4 border border-gray-300">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-2">
                          <h4 className="font-bold text-gray-900 uppercase tracking-wide">{investor.name}</h4>
                          <div className={`flex items-center space-x-2 px-3 py-1 border ${banTypeConfig?.bgColor} ${banTypeConfig?.borderColor}`}>
                            {banTypeConfig?.icon}
                            <span className={`text-xs font-bold uppercase tracking-wide ${banTypeConfig?.color}`}>
                              {banTypeConfig?.label}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 uppercase tracking-wide">
                          REASON: {investor.accountFlags?.shadowBanReason || 'NO REASON PROVIDED'}
                        </p>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">
                          BANNED: {investor.accountFlags?.shadowBannedAt || 'UNKNOWN DATE'}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleRemoveShadowBan(investor.id, investor.name)}
                          className="px-3 py-2 bg-green-600 text-white text-sm font-bold hover:bg-green-700 transition-colors uppercase tracking-wide border border-green-700"
                        >
                          <CheckCircle size={14} className="mr-1 inline" />
                          REMOVE BAN
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 border border-gray-300 flex items-center justify-center mx-auto mb-4">
                <EyeOff size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 uppercase tracking-wide">NO ACTIVE SHADOW BANS</h3>
              <p className="text-gray-500 uppercase tracking-wide text-sm">All accounts have full platform access</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Shadow Ban Modal */}
      <Modal
        isOpen={showBanModal}
        onClose={() => {
          setShowBanModal(false);
          setSelectedInvestor(null);
          setReason('');
          setExpiresAt('');
        }}
        title="CREATE SHADOW BAN"
        size="lg"
      >
        <div className="space-y-6">
          {/* Investor Selection */}
          {!selectedInvestor ? (
            <div>
              <h4 className="font-bold text-gray-900 mb-4 uppercase tracking-wide">SELECT INVESTOR TO BAN</h4>
              <div className="relative mb-4">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="SEARCH INVESTORS..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 uppercase tracking-wide font-medium"
                />
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredInvestors.map(investor => (
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
              <div className="bg-red-50 p-4 border border-red-300">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-red-900 uppercase tracking-wide">SHADOW BANNING: {selectedInvestor.name}</h4>
                    <p className="text-sm text-red-700 uppercase tracking-wide">
                      {selectedInvestor.country} | BALANCE: ${selectedInvestor.currentBalance.toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedInvestor(null)}
                    className="px-3 py-1 bg-white border border-red-300 text-red-700 text-xs font-bold hover:bg-red-50 transition-colors uppercase tracking-wide"
                  >
                    CHANGE
                  </button>
                </div>
              </div>

              {/* Ban Type Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                  BAN TYPE
                </label>
                <div className="space-y-3">
                  {banTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setBanType(type.id as any)}
                      className={`w-full p-4 border transition-all text-left ${
                        banType === type.id
                          ? `${type.bgColor} ${type.borderColor} border-2`
                          : 'border-gray-300 hover:border-gray-400 bg-white'
                      }`}
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        {type.icon}
                        <span className={`font-bold text-sm uppercase tracking-wide ${
                          banType === type.id ? type.color : 'text-gray-700'
                        }`}>
                          {type.label}
                        </span>
                      </div>
                      <p className={`text-xs uppercase tracking-wide ${
                        banType === type.id ? type.color : 'text-gray-600'
                      }`}>
                        {type.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Expiration Date */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  EXPIRATION DATE (OPTIONAL)
                </label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 font-medium"
                  min={new Date().toISOString().slice(0, 16)}
                />
                <p className="text-xs text-gray-600 mt-1 uppercase tracking-wide">
                  LEAVE EMPTY FOR PERMANENT BAN UNTIL MANUALLY REMOVED
                </p>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  BAN REASON <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 font-medium"
                  rows={4}
                  placeholder="PROVIDE DETAILED EXPLANATION FOR THIS SHADOW BAN..."
                  required
                />
              </div>

              {/* Warning */}
              <div className="bg-red-50 border border-red-300 p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle size={20} className="text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-red-800 uppercase tracking-wide">SHADOW BAN WARNING</h4>
                    <p className="text-red-700 text-sm mt-1 uppercase tracking-wide">
                      This action will immediately restrict platform access for the selected investor. 
                      The restrictions will take effect instantly and the user will not be notified.
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setShowBanModal(false);
                    setSelectedInvestor(null);
                    setReason('');
                    setExpiresAt('');
                  }}
                  className="flex-1 px-4 py-3 bg-white border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors uppercase tracking-wide"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleCreateShadowBan}
                  disabled={!reason.trim() || isLoading}
                  className="flex-1 px-4 py-3 bg-red-600 text-white font-bold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide border border-red-700"
                >
                  {isLoading ? 'CREATING BAN...' : 'CREATE SHADOW BAN'}
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default ShadowBanPanel;