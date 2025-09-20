import { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { useAuth } from '../../contexts/AuthContext';
import { 
  User, 
  Bell, 
  Shield, 
  Database, 
  Mail, 
  Globe, 
  DollarSign,
  Clock,
  Save,
  RefreshCw,
  Building,
  Lock,
  AlertTriangle,
  Info
} from 'lucide-react';

const SettingsPage = () => {
  const { user, setGlobalLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  // Form states
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '+1 (555) 123-4567',
    timezone: 'UTC-5 (Eastern Time)',
  });
  
  // Platform settings are now read-only
  const platformSettings = {
    minWithdrawal: 100,
    maxWithdrawal: 50000,
    withdrawalFee: 2.5,
    processingTime: '1-3 business days',
    maintenanceMode: false,
  };
  
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    withdrawalAlerts: true,
    newInvestorAlerts: true,
    systemAlerts: true,
    weeklyReports: true,
  });

  const handleSave = async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    }, 1000);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="bg-white rounded-lg border border-gray-300 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 uppercase tracking-wide">ADMIN PROFILE</h3>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div className="flex items-center space-x-6">
                  <div className="w-20 h-20 rounded-lg bg-gray-200 border border-gray-300 flex items-center justify-center">
                    <User size={32} className="text-gray-500" />
                  </div>
                  <div>
                    <button
                      disabled
                      className="px-4 py-2 bg-gray-100 text-gray-500 text-sm font-medium rounded-lg cursor-not-allowed border border-gray-200 uppercase tracking-wide"
                    >
                      CHANGE PHOTO
                    </button>
                    <p className="text-sm text-gray-500 mt-1 uppercase tracking-wide">Profile picture disabled</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">FULL NAME</label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">EMAIL ADDRESS</label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">PHONE NUMBER</label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">TIMEZONE</label>
                    <select
                      value={profileData.timezone}
                      onChange={(e) => setProfileData({...profileData, timezone: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
                    >
                      <option>UTC-5 (Eastern Time)</option>
                      <option>UTC-6 (Central Time)</option>
                      <option>UTC-7 (Mountain Time)</option>
                      <option>UTC-8 (Pacific Time)</option>
                    </select>
                  </div>
                </div>

                {/* Bank Information Section */}
                <div className="border-t border-gray-300 pt-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center uppercase tracking-wide">
                    <Building size={20} className="mr-2" />
                    BANK INFORMATION
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 uppercase tracking-wide">BANK NAME</label>
                        <p className="text-gray-800 font-medium">ADCB (Abu Dhabi Commercial Bank)</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 uppercase tracking-wide">BANK ACCOUNT NUMBER</label>
                        <p className="text-gray-800 font-medium">13*********0001</p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1 uppercase tracking-wide">IBAN</label>
                        <p className="text-gray-800 font-medium">AE68003001*********0001</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'platform':
        return (
          <div className="bg-white rounded-lg border border-gray-300 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 uppercase tracking-wide">PLATFORM SETTINGS</h3>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {/* Security Notice */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <Lock size={20} className="text-gray-600 mt-0.5" />
                    <div>
                      <h3 className="text-gray-800 font-semibold uppercase tracking-wide">SETTINGS LOCKED</h3>
                      <p className="text-gray-700 text-sm mt-1">
                        Platform settings are locked for security and stability. These critical system parameters 
                        cannot be modified through the interface to prevent unauthorized changes that could affect 
                        platform operations.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                      MINIMUM WITHDRAWAL ($)
                      <Lock size={14} className="inline ml-2 text-gray-400" />
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={platformSettings.minWithdrawal}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed font-medium"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <Lock size={16} className="text-gray-400" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">System-controlled setting</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                      MAXIMUM WITHDRAWAL ($)
                      <Lock size={14} className="inline ml-2 text-gray-400" />
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={platformSettings.maxWithdrawal}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed font-medium"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <Lock size={16} className="text-gray-400" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">System-controlled setting</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                      WITHDRAWAL FEE (%)
                      <Lock size={14} className="inline ml-2 text-gray-400" />
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={platformSettings.withdrawalFee}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed font-medium"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <Lock size={16} className="text-gray-400" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">System-controlled setting</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                      PROCESSING TIME
                      <Lock size={14} className="inline ml-2 text-gray-400" />
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={platformSettings.processingTime}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed font-medium"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <Lock size={16} className="text-gray-400" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">System-controlled setting</p>
                  </div>
                </div>
                
                <div className="border-t border-gray-300 pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-800 flex items-center uppercase tracking-wide">
                        MAINTENANCE MODE
                        <Lock size={16} className="ml-2 text-gray-400" />
                      </h3>
                      <p className="text-sm text-gray-600 uppercase tracking-wide">System maintenance controls are locked for security</p>
                    </div>
                    <div className="relative">
                      <label className="relative inline-flex items-center cursor-not-allowed opacity-50">
                        <input
                          type="checkbox"
                          checked={platformSettings.maintenanceMode}
                          disabled
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-600"></div>
                      </label>
                      <Lock size={14} className="absolute -top-1 -right-1 text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Additional Security Information */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="text-gray-800 font-semibold mb-2 uppercase tracking-wide">SECURITY INFORMATION</h4>
                  <ul className="text-gray-700 text-sm space-y-1">
                    <li>• Platform settings are protected against unauthorized modifications</li>
                    <li>• Changes to these settings require system administrator access</li>
                    <li>• All settings are monitored and logged for security purposes</li>
                    <li>• Contact system administrator for any required changes</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'notifications':
        return (
          <div className="bg-white rounded-lg border border-gray-300 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 uppercase tracking-wide">NOTIFICATION SETTINGS</h3>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {Object.entries(notifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div>
                      <h3 className="font-medium text-gray-800 uppercase tracking-wide">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {key === 'emailNotifications' && 'Receive email notifications for important events'}
                        {key === 'withdrawalAlerts' && 'Get notified when withdrawal requests are submitted'}
                        {key === 'newInvestorAlerts' && 'Receive alerts when new investors register'}
                        {key === 'systemAlerts' && 'Get notified about system issues and maintenance'}
                        {key === 'weeklyReports' && 'Receive weekly performance and activity reports'}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setNotifications({...notifications, [key]: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
        
      case 'security':
        return (
          <div className="bg-white rounded-lg border border-gray-300 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 uppercase tracking-wide">SECURITY SETTINGS</h3>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-4 uppercase tracking-wide">CHANGE PASSWORD</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">CURRENT PASSWORD</label>
                      <input
                        type="password"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
                        placeholder="Enter current password"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">NEW PASSWORD</label>
                      <input
                        type="password"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
                        placeholder="Enter new password"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">CONFIRM NEW PASSWORD</label>
                      <input
                        type="password"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
                        placeholder="Confirm new password"
                      />
                    </div>
                    <button className="px-4 py-2 bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors rounded-lg uppercase tracking-wide">
                      UPDATE PASSWORD
                    </button>
                  </div>
                </div>
                
                <div className="border-t border-gray-300 pt-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-4 uppercase tracking-wide">TWO-FACTOR AUTHENTICATION</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600">Add an extra layer of security to your account</p>
                      <p className="text-sm text-gray-500 uppercase tracking-wide">Status: <span className="text-red-600">DISABLED</span></p>
                    </div>
                    <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors rounded-lg uppercase tracking-wide">
                      ENABLE 2FA
                    </button>
                  </div>
                </div>
                
                <div className="border-t border-gray-300 pt-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-4 uppercase tracking-wide">LOGIN SESSIONS</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-3 border border-gray-200 rounded-lg px-4">
                      <div>
                        <p className="font-medium uppercase tracking-wide">CURRENT SESSION</p>
                        <p className="text-sm text-gray-500">Chrome on Windows • New York, NY</p>
                      </div>
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full font-medium uppercase tracking-wide">ACTIVE</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border border-gray-200 rounded-lg px-4">
                      <div>
                        <p className="font-medium uppercase tracking-wide">MOBILE APP</p>
                        <p className="text-sm text-gray-500">iPhone • Last seen 2 hours ago</p>
                      </div>
                      <button className="px-3 py-1 bg-white border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors rounded uppercase tracking-wide">
                        REVOKE
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  const tabs = [
    { id: 'profile', label: 'PROFILE', icon: <User size={18} /> },
    { id: 'platform', label: 'PLATFORM', icon: <Globe size={18} /> },
    { id: 'notifications', label: 'NOTIFICATIONS', icon: <Bell size={18} /> },
    { id: 'security', label: 'SECURITY', icon: <Shield size={18} /> },
  ];

  return (
    <DashboardLayout title="Settings">
      <div className="mb-6">
        <div className="bg-white rounded-lg border border-gray-300 shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">ADMIN SETTINGS</h2>
          <p className="text-gray-600 uppercase tracking-wide text-sm">Manage your account and platform configuration</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-300 shadow-sm p-0">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-4 py-3 text-left transition-colors font-medium uppercase tracking-wide ${
                    activeTab === tab.id
                      ? 'bg-gray-100 text-gray-900 border-r-2 border-gray-900'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-3">{tab.icon}</span>
                  {tab.label}
                  {tab.id === 'platform' && (
                    <Lock size={14} className="ml-auto text-gray-400" />
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="lg:col-span-3">
          {renderTabContent()}
          
          {/* Save Button - Only show for editable sections */}
          {activeTab !== 'platform' && (
            <div className="mt-6 flex justify-end space-x-4">
              <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors rounded-lg uppercase tracking-wide">
                RESET
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="px-4 py-2 bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors rounded-lg uppercase tracking-wide disabled:opacity-50"
              >
                {isSaved ? 'SAVED!' : 'SAVE CHANGES'}
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;