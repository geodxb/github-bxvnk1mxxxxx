import { useState } from 'react';
import { motion } from 'framer-motion';
import Card from '../common/Card';
import Button from '../common/Button';
import Modal from '../common/Modal';
import ContractDownload from '../admin/ContractDownload';
import BankAccountManagement from './BankAccountManagement';
import ProfileEditForm from './ProfileEditForm';
import { Investor } from '../../types/user';
import { 
  User, 
  FileText, 
  Building, 
  Edit3, 
  Shield,
  Calendar,
  MapPin,
  DollarSign,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Clock
} from 'lucide-react';

interface InvestorProfileManagementProps {
  investor: Investor;
  onUpdate: () => void;
}

const InvestorProfileManagement = ({ investor, onUpdate }: InvestorProfileManagementProps) => {
  const [activeSection, setActiveSection] = useState<'overview' | 'contract' | 'banks' | 'edit'>('overview');
  const [showEditModal, setShowEditModal] = useState(false);

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Real-time Account Status */}
      <Card title="ACCOUNT STATUS">
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-gray-600 text-sm font-medium uppercase tracking-wide mb-2">CURRENT STATUS</p>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  investor.accountStatus?.includes('Active') || !investor.accountStatus
                    ? 'bg-green-500'
                    : investor.accountStatus?.includes('Restricted')
                    ? 'bg-amber-500'
                    : 'bg-red-500'
                }`}></div>
                <span className="font-bold text-gray-900 uppercase tracking-wide text-sm">
                  {investor.accountStatus || 'Active'}
                </span>
              </div>
            </div>
            <div>
              <p className="text-gray-600 text-sm font-medium uppercase tracking-wide mb-2">ACCOUNT TYPE</p>
              <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                investor.accountType === 'Pro' 
                  ? 'bg-gray-800 text-white' 
                  : 'bg-gray-600 text-white'
              }`}>
                {investor.accountType || 'Standard'}
              </span>
            </div>
            <div>
              <p className="text-gray-600 text-sm font-medium uppercase tracking-wide mb-2">WITHDRAWAL ACCESS</p>
              <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                investor.accountFlags?.withdrawalDisabled || investor.accountStatus?.includes('Restricted')
                  ? 'bg-red-100 text-red-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {investor.accountFlags?.withdrawalDisabled || investor.accountStatus?.includes('Restricted')
                  ? 'DISABLED'
                  : 'ENABLED'
                }
              </span>
            </div>
            <div>
              <p className="text-gray-600 text-sm font-medium uppercase tracking-wide mb-2">LAST UPDATE</p>
              <p className="font-medium text-gray-900 text-sm">
                {investor.updatedAt ? new Date(investor.updatedAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Profile Information */}
      <Card title="PROFILE INFORMATION">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 uppercase tracking-wide">BASIC INFORMATION</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 uppercase tracking-wide">
                  <User size={16} className="inline mr-1" />
                  FULL NAME
                </label>
                <p className="text-gray-900 font-medium">{investor.name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 uppercase tracking-wide">
                  <MapPin size={16} className="inline mr-1" />
                  COUNTRY
                </label>
                <p className="text-gray-900 font-medium">{investor.country}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 uppercase tracking-wide">
                  <Calendar size={16} className="inline mr-1" />
                  MEMBER SINCE
                </label>
                <p className="text-gray-900 font-medium">{investor.joinDate}</p>
              </div>

              {investor.email && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 uppercase tracking-wide">
                    EMAIL ADDRESS
                  </label>
                  <p className="text-gray-900 font-medium">{investor.email}</p>
                </div>
              )}

              {investor.phone && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 uppercase tracking-wide">
                    PHONE NUMBER
                  </label>
                  <p className="text-gray-900 font-medium">{investor.phone}</p>
                </div>
              )}
            </div>
          </div>

          {/* Financial Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 uppercase tracking-wide">FINANCIAL INFORMATION</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 uppercase tracking-wide">
                  <DollarSign size={16} className="inline mr-1" />
                  INITIAL DEPOSIT
                </label>
                <p className="text-gray-900 font-bold text-lg">${investor.initialDeposit.toLocaleString()}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 uppercase tracking-wide">
                  <TrendingUp size={16} className="inline mr-1" />
                  CURRENT BALANCE
                </label>
                <p className="text-gray-900 font-bold text-xl">${investor.currentBalance.toLocaleString()}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 uppercase tracking-wide">
                  TOTAL GAIN/LOSS
                </label>
                <p className={`font-bold text-lg ${
                  investor.currentBalance >= investor.initialDeposit ? 'text-green-600' : 'text-red-600'
                }`}>
                  {investor.currentBalance >= investor.initialDeposit ? '+' : ''}
                  ${(investor.currentBalance - investor.initialDeposit).toLocaleString()}
                  {' '}
                  ({(((investor.currentBalance - investor.initialDeposit) / investor.initialDeposit) * 100).toFixed(2)}%)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Profile Button */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={() => setShowEditModal(true)}
            className="w-full md:w-auto"
          >
            <Edit3 size={18} className="mr-2" />
            Edit Profile Information
          </Button>
        </div>
      </Card>

      {/* Trading Information */}
      <Card title="TRADING INFORMATION">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 uppercase tracking-wide">
              POSITIONS PER DAY
            </label>
            <p className="text-gray-900 font-medium">{investor.tradingData?.positionsPerDay || 0}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 uppercase tracking-wide">
              TRADING PAIRS
            </label>
            <p className="text-gray-900 font-medium">{investor.tradingData?.pairs?.join(', ') || 'N/A'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 uppercase tracking-wide">
              PLATFORM
            </label>
            <p className="text-gray-900 font-medium">{investor.tradingData?.platform || 'Interactive Brokers'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 uppercase tracking-wide">
              LEVERAGE
            </label>
            <p className="text-gray-900 font-medium">{investor.tradingData?.leverage || 100}:1</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 uppercase tracking-wide">
              CURRENCY
            </label>
            <p className="text-gray-900 font-medium">{investor.tradingData?.currency || 'USD'}</p>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'overview':
        return renderOverview();
      case 'contract':
        return <ContractDownload investor={investor} />;
      case 'banks':
        return <BankAccountManagement investor={investor} onUpdate={onUpdate} />;
      case 'edit':
        return <ProfileEditForm investor={investor} onUpdate={onUpdate} />;
      default:
        return renderOverview();
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Navigation */}
      <Card>
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'overview', label: 'Profile Overview', icon: <User size={16} /> },
            { key: 'contract', label: 'Investment Contract', icon: <FileText size={16} /> },
            { key: 'banks', label: 'Bank Accounts', icon: <Building size={16} /> },
            { key: 'edit', label: 'Edit Information', icon: <Edit3 size={16} /> }
          ].map(section => (
            <button
              key={section.key}
              onClick={() => setActiveSection(section.key as any)}
              className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeSection === section.key
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {section.icon}
              <span className="uppercase tracking-wide">{section.label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Section Content */}
      {renderSectionContent()}

      {/* Profile Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="EDIT PROFILE INFORMATION"
        size="lg"
      >
        <ProfileEditForm 
          investor={investor} 
          onUpdate={() => {
            onUpdate();
            setShowEditModal(false);
          }}
          isModal={true}
        />
      </Modal>
    </div>
  );
};

export default InvestorProfileManagement;