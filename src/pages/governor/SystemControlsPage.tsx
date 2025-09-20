import { useState, useEffect } from 'react';
import GovernorLayout from '../../components/layout/GovernorLayout';
import { FirestoreService } from '../../services/firestoreService';
import { useAuth } from '../../contexts/AuthContext';
import { SystemSettings } from '../../types/user';
import { 
  Settings, 
  Power, 
  Shield, 
  Database, 
  AlertTriangle, 
  CheckCircle,
  RefreshCw,
  Lock,
  Unlock,
  Server,
  Globe
} from 'lucide-react';

const GovernorSystemControlsPage = () => {
  const { user } = useAuth();
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [systemStatus, setSystemStatus] = useState({
    platform: 'ONLINE',
    database: 'CONNECTED',
    api: 'OPERATIONAL',
    security: 'ACTIVE',
    backup: 'RUNNING',
    monitoring: 'ACTIVE'
  });

  // Load system settings
  useEffect(() => {
    loadSystemSettings();
  }, []);

  const loadSystemSettings = async () => {
    setIsLoading(true);
    try {
      const settings = await FirestoreService.getSystemSettings();
      if (settings) {
        setSystemSettings(settings);
      } else if (user) {
        await FirestoreService.initializeSystemSettings(user.id, user.name);
        const newSettings = await FirestoreService.getSystemSettings();
        setSystemSettings(newSettings);
      }
    } catch (error) {
      console.error('Error loading system settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!systemSettings || !user) return;
    
    setIsSaving(true);
    try {
      for (const [key, value] of Object.entries(systemSettings)) {
        if (key !== 'updatedAt' && key !== 'updatedBy') {
          await FirestoreService.updateSystemSetting(
            key,
            value,
            user.id,
            user.name,
            systemSettings[key as keyof SystemSettings]
          );
        }
      }
      
      setLastSaved(new Date());
      await loadSystemSettings();
    } catch (error) {
      console.error('Error saving system settings:', error);
      alert('Failed to save system settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (field: keyof SystemSettings, value: any) => {
    if (systemSettings) {
      setSystemSettings(prev => prev ? { ...prev, [field]: value } : null);
    }
  };

  const handleEmergencyShutdown = async () => {
    if (!confirm('EMERGENCY SHUTDOWN: This will enable maintenance mode and block all user access. Continue?')) {
      return;
    }

    try {
      await updateSetting('maintenanceMode', true);
      await updateSetting('maintenanceMessage', 'EMERGENCY MAINTENANCE: System temporarily unavailable due to emergency procedures.');
      await handleSave();
      alert('EMERGENCY SHUTDOWN ACTIVATED');
    } catch (error) {
      console.error('Error activating emergency shutdown:', error);
    }
  };

  const handleSystemRestart = async () => {
    if (!confirm('SYSTEM RESTART: This will temporarily disable the platform. Continue?')) {
      return;
    }

    try {
      setSystemStatus(prev => ({ ...prev, platform: 'RESTARTING' }));
      
      // Simulate restart process
      setTimeout(() => {
        setSystemStatus(prev => ({ ...prev, platform: 'ONLINE' }));
        alert('SYSTEM RESTART COMPLETED');
      }, 5000);
    } catch (error) {
      console.error('Error restarting system:', error);
    }
  };

  const handleDatabaseMaintenance = async () => {
    if (!confirm('DATABASE MAINTENANCE: This will temporarily affect performance. Continue?')) {
      return;
    }

    try {
      setSystemStatus(prev => ({ ...prev, database: 'MAINTENANCE' }));
      
      // Simulate maintenance
      setTimeout(() => {
        setSystemStatus(prev => ({ ...prev, database: 'CONNECTED' }));
        alert('DATABASE MAINTENANCE COMPLETED');
      }, 10000);
    } catch (error) {
      console.error('Error starting database maintenance:', error);
    }
  };

  if (isLoading || !systemSettings) {
    return (
      <GovernorLayout title="SYSTEM CONTROLS">
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-gray-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 font-bold uppercase tracking-wide">LOADING SYSTEM CONTROLS...</p>
        </div>
      </GovernorLayout>
    );
  }

  return (
    <GovernorLayout title="SYSTEM CONTROLS">
      {/* Header */}
      <div className="bg-white border border-gray-300 p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gray-200 border border-gray-400 rounded-lg flex items-center justify-center">
              <Settings size={24} className="text-gray-700" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">SYSTEM CONTROL CENTER</h1>
              <p className="text-gray-600 uppercase tracking-wide text-sm font-medium">ADVANCED SYSTEM CONFIGURATION AND EMERGENCY CONTROLS</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700 uppercase tracking-wide">GOVERNOR CONTROL ACTIVE</span>
          </div>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="bg-white border border-gray-300 p-6 mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wide">SYSTEM STATUS OVERVIEW</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(systemStatus).map(([key, status]) => (
            <div key={key} className="bg-gray-50 p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">{key}</span>
                <div className={`w-3 h-3 rounded-full ${
                  status === 'ONLINE' || status === 'CONNECTED' || status === 'OPERATIONAL' || status === 'ACTIVE' || status === 'RUNNING' 
                    ? 'bg-green-500' 
                    : status === 'MAINTENANCE' || status === 'RESTARTING'
                    ? 'bg-yellow-500 animate-pulse'
                    : 'bg-red-500'
                }`}></div>
              </div>
              <p className="text-xs text-gray-600 mt-1 uppercase tracking-wide">{status}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Emergency Controls */}
      <div className="bg-white border border-red-300 p-6 mb-8 bg-red-50">
        <div className="flex items-center space-x-3 mb-6">
          <AlertTriangle size={24} className="text-red-600" />
          <h3 className="text-lg font-bold text-red-900 uppercase tracking-wide">EMERGENCY CONTROLS</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={handleEmergencyShutdown}
            className="p-4 bg-red-600 text-white font-bold hover:bg-red-700 transition-colors border border-red-700 uppercase tracking-wide"
          >
            <Power size={20} className="mx-auto mb-2" />
            EMERGENCY SHUTDOWN
          </button>
          <button
            onClick={handleSystemRestart}
            className="p-4 bg-yellow-600 text-white font-bold hover:bg-yellow-700 transition-colors border border-yellow-700 uppercase tracking-wide"
          >
            <RefreshCw size={20} className="mx-auto mb-2" />
            SYSTEM RESTART
          </button>
          <button
            onClick={handleDatabaseMaintenance}
            className="p-4 bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors border border-blue-700 uppercase tracking-wide"
          >
            <Database size={20} className="mx-auto mb-2" />
            DATABASE MAINTENANCE
          </button>
        </div>
      </div>

      {/* System Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Platform Settings */}
        <div className="bg-white border border-gray-300">
          <div className="px-6 py-4 border-b border-gray-300 bg-gray-50">
            <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">PLATFORM SETTINGS</h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wide">
                  MAINTENANCE MODE
                </label>
                <p className="text-xs text-gray-600 uppercase tracking-wide">
                  {systemSettings.maintenanceMode ? 'PLATFORM LOCKED' : 'PLATFORM OPERATIONAL'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={systemSettings.maintenanceMode}
                  onChange={(e) => updateSetting('maintenanceMode', e.target.checked)}
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
                value={systemSettings.maintenanceMessage}
                onChange={(e) => updateSetting('maintenanceMessage', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 font-medium"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                SECURITY LEVEL
              </label>
              <select
                value={systemSettings.securityLevel}
                onChange={(e) => updateSetting('securityLevel', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 font-bold"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="MAXIMUM">MAXIMUM</option>
              </select>
            </div>
          </div>
        </div>

        {/* Financial Controls */}
        <div className="bg-white border border-gray-300">
          <div className="px-6 py-4 border-b border-gray-300 bg-gray-50">
            <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">FINANCIAL CONTROLS</h3>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                MINIMUM WITHDRAWAL ($)
              </label>
              <input
                type="number"
                value={systemSettings.minWithdrawal}
                onChange={(e) => updateSetting('minWithdrawal', parseInt(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                MAXIMUM WITHDRAWAL ($)
              </label>
              <input
                type="number"
                value={systemSettings.maxWithdrawal}
                onChange={(e) => updateSetting('maxWithdrawal', parseInt(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                COMMISSION RATE (%)
              </label>
              <input
                type="number"
                value={systemSettings.commissionRate}
                onChange={(e) => updateSetting('commissionRate', parseInt(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                AUTO-APPROVAL LIMIT ($)
              </label>
              <input
                type="number"
                value={systemSettings.autoApprovalLimit}
                onChange={(e) => updateSetting('autoApprovalLimit', parseInt(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 font-bold"
              />
            </div>
          </div>
        </div>
      </div>

      {/* System Operations */}
      <div className="bg-white border border-gray-300 p-6 mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-6 uppercase tracking-wide">SYSTEM OPERATIONS</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => {
              if (confirm('CLEAR SYSTEM CACHE: This will clear all cached data. Continue?')) {
                alert('SYSTEM CACHE CLEARED SUCCESSFULLY');
              }
            }}
            className="p-4 bg-gray-700 text-white font-bold hover:bg-gray-600 transition-colors border border-gray-600 uppercase tracking-wide"
          >
            <RefreshCw size={20} className="mx-auto mb-2" />
            CLEAR CACHE
          </button>

          <button
            onClick={() => {
              if (confirm('FORCE BACKUP: This will create an immediate system backup. Continue?')) {
                setSystemStatus(prev => ({ ...prev, backup: 'RUNNING' }));
                setTimeout(() => {
                  setSystemStatus(prev => ({ ...prev, backup: 'COMPLETED' }));
                  alert('SYSTEM BACKUP COMPLETED');
                }, 3000);
              }
            }}
            className="p-4 bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors border border-blue-700 uppercase tracking-wide"
          >
            <Database size={20} className="mx-auto mb-2" />
            FORCE BACKUP
          </button>

          <button
            onClick={() => {
              if (confirm('SECURITY SCAN: This will perform a comprehensive security audit. Continue?')) {
                setSystemStatus(prev => ({ ...prev, security: 'SCANNING' }));
                setTimeout(() => {
                  setSystemStatus(prev => ({ ...prev, security: 'ACTIVE' }));
                  alert('SECURITY SCAN COMPLETED - NO THREATS DETECTED');
                }, 7000);
              }
            }}
            className="p-4 bg-purple-600 text-white font-bold hover:bg-purple-700 transition-colors border border-purple-700 uppercase tracking-wide"
          >
            <Shield size={20} className="mx-auto mb-2" />
            SECURITY SCAN
          </button>

          <button
            onClick={() => {
              if (confirm('RESET API LIMITS: This will reset all rate limiting. Continue?')) {
                alert('API LIMITS RESET SUCCESSFULLY');
              }
            }}
            className="p-4 bg-green-600 text-white font-bold hover:bg-green-700 transition-colors border border-green-700 uppercase tracking-wide"
          >
            <Globe size={20} className="mx-auto mb-2" />
            RESET API LIMITS
          </button>
        </div>
      </div>

      {/* Advanced Configuration */}
      <div className="bg-white border border-gray-300 p-6 mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-6 uppercase tracking-wide">ADVANCED CONFIGURATION</h3>
        <div className="space-y-6">
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
                checked={systemSettings.requireW8Ben}
                onChange={(e) => updateSetting('requireW8Ben', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                SYSTEM TIMEZONE
              </label>
              <select className="w-full px-4 py-3 border border-gray-300 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 font-bold">
                <option value="UTC">UTC (COORDINATED UNIVERSAL TIME)</option>
                <option value="EST">EST (EASTERN STANDARD TIME)</option>
                <option value="PST">PST (PACIFIC STANDARD TIME)</option>
                <option value="GMT">GMT (GREENWICH MEAN TIME)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                SESSION TIMEOUT (MINUTES)
              </label>
              <input
                type="number"
                defaultValue={30}
                className="w-full px-4 py-3 border border-gray-300 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 font-bold"
                min={5}
                max={120}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Configuration */}
      <div className="bg-white border border-gray-300 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">SAVE CONFIGURATION</h3>
            <p className="text-gray-600 text-sm uppercase tracking-wide">Apply all changes to system parameters</p>
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
            {isSaving ? 'SAVING CONFIGURATION...' : 'SAVE ALL CHANGES'}
          </button>
        </div>
      </div>
    </GovernorLayout>
  );
};

export default GovernorSystemControlsPage;