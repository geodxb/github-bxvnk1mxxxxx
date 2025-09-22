import { useState } from 'react';
import GovernorLayout from '../../components/layout/GovernorLayout';
import AccountFlaggingPanel from '../../components/governor/AccountFlaggingPanel';
import DocumentRequestPanel from '../../components/governor/DocumentRequestPanel';
import ShadowBanPanel from '../../components/governor/ShadowBanPanel';
import MT103Generator from '../../components/governor/MT103Generator';
import { 
  Flag, 
  FileText, 
  EyeOff, 
  Download,
  Shield,
  AlertTriangle
} from 'lucide-react';

const GovernorAccountManagementPage = () => {
  const [activeTab, setActiveTab] = useState<'flags' | 'documents' | 'shadow-bans' | 'mt103'>('flags');

  const tabs = [
    { 
      id: 'flags', 
      label: 'ACCOUNT FLAGS', 
      icon: <Flag size={18} />,
      description: 'Flag accounts for fraud, policy violations, and restrictions'
    },
    { 
      id: 'documents', 
      label: 'DOCUMENT REQUESTS', 
      icon: <FileText size={18} />,
      description: 'Request and manage investor documentation'
    },
    { 
      id: 'shadow-bans', 
      label: 'SHADOW BANS', 
      icon: <EyeOff size={18} />,
      description: 'Instant platform access restrictions'
    },
    { 
      id: 'mt103', 
      label: 'MT103 GENERATOR', 
      icon: <Download size={18} />,
      description: 'Generate SWIFT wire transfer documents'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'flags':
        return <AccountFlaggingPanel />;
      case 'documents':
        return <DocumentRequestPanel />;
      case 'shadow-bans':
        return <ShadowBanPanel />;
      case 'mt103':
        return <MT103Generator />;
      default:
        return <AccountFlaggingPanel />;
    }
  };

  return (
    <GovernorLayout title="ACCOUNT MANAGEMENT">
      {/* System Header */}
      <div className="bg-white border border-gray-300 p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">SUPREME ACCOUNT MANAGEMENT</h1>
            <p className="text-gray-600 uppercase tracking-wide text-sm font-medium">COMPREHENSIVE INVESTOR CONTROL AND OVERSIGHT SYSTEM</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700 uppercase tracking-wide">GOVERNOR CONTROL ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border border-gray-300 mb-8">
        <div className="px-6 py-4 border-b border-gray-300 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">CONTROL MODULES</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`p-4 border transition-all text-left ${
                  activeTab === tab.id
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3 mb-2">
                  {tab.icon}
                  <span className="font-bold text-sm uppercase tracking-wide">{tab.label}</span>
                </div>
                <p className="text-xs uppercase tracking-wide opacity-75">
                  {tab.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </GovernorLayout>
  );
};

export default GovernorAccountManagementPage;