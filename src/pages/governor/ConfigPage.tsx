import { useState, useEffect } from 'react';
import GovernorLayout from '../../components/layout/GovernorLayout';
import AnnouncementManager from '../../components/governor/AnnouncementManager';
import { FirestoreService } from '../../services/firestoreService';
import { useAuth } from '../../contexts/AuthContext';
import { SystemSettings } from '../../types/user';
import { Settings, Megaphone } from 'lucide-react';

const GovernorConfigPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'settings' | 'announcements'>('settings');
  const [configData, setConfigData] = useState<SystemSettings | null>(null);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Load system settings on component mount
  useEffect(() => {
    loadSystemSettings();
  }, []);

  const loadSystemSettings = async () => {
    setIsLoading(true);
    try {
      const settings = await FirestoreService.getSystemSettings();
      if (settings) {
        setConfigData(settings);
        setMaintenanceMessage(settings.maintenanceMessage);
      } else if (user) {
        // Initialize default settings if none exist
        await FirestoreService.initializeSystemSettings(user.id, user.name);
        const newSettings = await FirestoreService.getSystemSettings();
        setConfigData(newSettings);
        setMaintenanceMessage(newSettings?.maintenanceMessage || '');
      }
    } catch (error) {
      console.error('Error loading system settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!configData || !user) return;
    
    setIsSaving(true);
    try {
      console.log('🔧 Saving system configuration:', configData);
      
      // Update the systemSettings document directly
      await FirestoreService.updateSystemSetting(
        'maintenanceMode',
        configData.maintenanceMode,
        user.id,
        user.name,
        configData.maintenanceMode
      );
      
      await FirestoreService.updateSystemSetting(
        'maintenanceMessage',
        maintenanceMessage,
        user.id,
        user.name,
        configData.maintenanceMessage
      );
      
      await FirestoreService.updateSystemSetting(
        'minWithdrawal',
        configData.minWithdrawal,
        user.id,
        user.name,
        configData.minWithdrawal
      );
      
      await FirestoreService.updateSystemSetting(
        'maxWithdrawal',
        configData.maxWithdrawal,
        user.id,
        user.name,
        configData.maxWithdrawal
      );
      
      await FirestoreService.updateSystemSetting(
        'commissionRate',
        configData.commissionRate,
        user.id,
        user.name,
        configData.commissionRate
      );
      
      await FirestoreService.updateSystemSetting(
        'autoApprovalLimit',
        configData.autoApprovalLimit,
        user.id,
        user.name,
        configData.autoApprovalLimit
      );
      
      await FirestoreService.updateSystemSetting(
        'securityLevel',
        configData.securityLevel,
        user.id,
        user.name,
        configData.securityLevel
      );
      
      await FirestoreService.updateSystemSetting(
        'requireW8Ben',
        configData.requireW8Ben,
        user.id,
        user.name,
        configData.requireW8Ben
      );
      
      console.log('✅ System settings updated successfully');
      
      setLastSaved(new Date());
      alert(`CONFIGURATION SAVED SUCCESSFULLY\n\nMaintenance Mode: ${configData.maintenanceMode ? 'ENABLED' : 'DISABLED'}`);
      
      // Reload settings to get updated data
      await loadSystemSettings();
    } catch (error) {
      console.error('Error saving configuration:', error);
      alert('Failed to save configuration. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateConfigField = (field: keyof SystemSettings, value: any) => {
    if (configData) {
      setConfigData(prev => prev ? { ...prev, [field]: value } : null);
    }
  };

  if (isLoading || !configData) {
    return (
      <GovernorLayout title="SYSTEM CONFIGURATION">
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-gray-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 font-bold uppercase tracking-wide">LOADING SYSTEM CONFIGURATION...</p>
        </div>
      </GovernorLayout>
    );
  }

  return (
    <GovernorLayout title="SYSTEM CONFIGURATION">
      <div className="bg-white border border-gray-300 p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">SYSTEM CONFIGURATION</h1>
            <p className="text-gray-600 uppercase tracking-wide text-sm font-medium">PLATFORM SETTINGS AND OPERATIONAL PARAMETERS</p>
            {lastSaved && (
              <p className="text-gray-500 text-xs mt-1 uppercase tracking-wide">
                LAST SAVED: {lastSaved.toLocaleString()}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${configData.maintenanceMode ? 'bg-red-500' : 'bg-green-500'}`}></div>
            <span className="text-sm font-medium text-gray-700 uppercase tracking-wide">
              {configData.maintenanceMode ? 'MAINTENANCE MODE ACTIVE' : 'SYSTEM OPERATIONAL'}
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border border-gray-300 mb-8">
        <div className="px-6 py-4 border-b border-gray-300 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">CONFIGURATION MODULES</h3>
        </div>
        <div className="p-6">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center space-x-2 px-4 py-3 font-bold transition-colors uppercase tracking-wide border ${
                activeTab === 'settings'
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Settings size={18} />
              <span>SYSTEM SETTINGS</span>
            </button>
            <button
              onClick={() => setActiveTab('announcements')}
              className={`flex items-center space-x-2 px-4 py-3 font-bold transition-colors uppercase tracking-wide border ${
                activeTab === 'announcements'
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Megaphone size={18} />
              <span>ANNOUNCEMENTS</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'settings' ? (
        <>
          {/* Maintenance Mode Control */}
          <div className="bg-white border border-gray-300 mb-8">
            <div className="px-6 py-4 border-b border-gray-300 bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">MAINTENANCE MODE CONTROL</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wide">
                      SYSTEM MAINTENANCE MODE
                    </label>
                    <p className="text-xs text-gray-600 uppercase tracking-wide">
                      {configData.maintenanceMode ? 'SYSTEM IS CURRENTLY IN MAINTENANCE MODE' : 'SYSTEM IS OPERATIONAL'}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={configData.maintenanceMode}
                      onChange={(e) => updateConfigField('maintenanceMode', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                    MAINTENANCE MESSAGE
                  </label>
                  <textarea
                    value={maintenanceMessage}
                    onChange={(e) => setMaintenanceMessage(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 font-medium"
                    rows={3}
                    placeholder="MESSAGE TO DISPLAY TO USERS DURING MAINTENANCE..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Configuration Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Financial Settings */}
            <div className="bg-white border border-gray-300">
              <div className="px-6 py-4 border-b border-gray-300 bg-gray-50">
                <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">FINANCIAL PARAMETERS</h3>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                    MINIMUM WITHDRAWAL ($)
                  </label>
                  <input
                    type="number"
                    value={configData.minWithdrawal}
                    onChange={(e) => updateConfigField('minWithdrawal', parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                    MAXIMUM WITHDRAWAL ($)
                  </label>
                  <input
                    type="number"
                    value={configData.maxWithdrawal}
                    onChange={(e) => updateConfigField('maxWithdrawal', parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                    COMMISSION RATE (%)
                  </label>
                  <input
                    type="number"
                    value={configData.commissionRate}
                    onChange={(e) => updateConfigField('commissionRate', parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                    AUTO-APPROVAL LIMIT ($)
                  </label>
                  <input
                    type="number"
                    value={configData.autoApprovalLimit}
                    onChange={(e) => updateConfigField('autoApprovalLimit', parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Security Settings */}
            <div className="bg-white border border-gray-300">
              <div className="px-6 py-4 border-b border-gray-300 bg-gray-50">
                <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">SECURITY PARAMETERS</h3>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                    SECURITY LEVEL
                  </label>
                  <select
                    value={configData.securityLevel}
                    onChange={(e) => updateConfigField('securityLevel', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 font-bold"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MAXIMUM">MAXIMUM</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wide">
                      REQUIRE W-8 BEN FORM
                    </label>
                    <p className="text-xs text-gray-600 uppercase tracking-wide">For withdrawals ≥ $1000</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={configData.requireW8Ben}
                      onChange={(e) => updateConfigField('requireW8Ben', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Save Configuration */}
          <div className="bg-white border border-gray-300 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">SAVE CONFIGURATION</h3>
                <p className="text-gray-600 text-sm uppercase tracking-wide">Apply changes to system parameters</p>
                {lastSaved && (
                  <p className="text-gray-500 text-xs mt-1 uppercase tracking-wide">
                    LAST SAVED: {lastSaved.toLocaleString()}
                  </p>
                )}
              </div>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-3 bg-red-600 text-white font-bold hover:bg-red-700 transition-colors disabled:opacity-50 uppercase tracking-wide border border-red-700"
              >
                {isSaving ? 'SAVING CONFIGURATION...' : 'SAVE CONFIGURATION'}
              </button>
            </div>
          </div>
        </>
      ) : (
        <AnnouncementManager />
      )}
    </GovernorLayout>
  );
};

export default GovernorConfigPage;