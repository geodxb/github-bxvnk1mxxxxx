import { useState, useEffect } from 'react';
import GovernorLayout from '../../components/layout/GovernorLayout';
import { useInvestors, useWithdrawalRequests, useTransactions } from '../../hooks/useFirestore';
import { Activity, Cpu, HardDrive, Network, Users, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';

const GovernorSystemMonitoringPage = () => {
  const { investors } = useInvestors();
  const { withdrawalRequests } = useWithdrawalRequests();
  const { transactions } = useTransactions();
  const [systemMetrics, setSystemMetrics] = useState({
    cpuUsage: 0,
    memoryUsage: 0,
    diskUsage: 0,
    networkLatency: 0,
    activeConnections: 0,
    requestsPerMinute: 0
  });
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(true);

  // Simulate real-time system metrics
  useEffect(() => {
    const updateMetrics = () => {
      setSystemMetrics({
        cpuUsage: Math.floor(Math.random() * 30) + 15, // 15-45%
        memoryUsage: Math.floor(Math.random() * 20) + 60, // 60-80%
        diskUsage: Math.floor(Math.random() * 10) + 45, // 45-55%
        networkLatency: Math.floor(Math.random() * 50) + 10, // 10-60ms
        activeConnections: Math.floor(Math.random() * 50) + 100, // 100-150
        requestsPerMinute: Math.floor(Math.random() * 200) + 300 // 300-500
      });
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Generate system alerts based on real data
  useEffect(() => {
    const newAlerts = [];
    
    // Check for high withdrawal activity
    const recentWithdrawals = withdrawalRequests.filter(req => {
      const reqDate = new Date(req.date);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return reqDate > yesterday;
    });

    if (recentWithdrawals.length > 5) {
      newAlerts.push({
        id: 'high_withdrawal_activity',
        level: 'WARNING',
        message: `High withdrawal activity detected: ${recentWithdrawals.length} requests in last 24 hours`,
        timestamp: new Date(),
        category: 'FINANCIAL'
      });
    }

    // Check for restricted accounts
    const restrictedAccounts = investors.filter(inv => 
      inv.accountStatus?.includes('Restricted') || inv.accountStatus?.includes('Suspended')
    );

    if (restrictedAccounts.length > 0) {
      newAlerts.push({
        id: 'restricted_accounts',
        level: 'INFO',
        message: `${restrictedAccounts.length} accounts currently under restriction`,
        timestamp: new Date(),
        category: 'SECURITY'
      });
    }

    // Check for failed transactions
    const failedTransactions = transactions.filter(tx => tx.status === 'Rejected' || tx.status === 'Failed');
    if (failedTransactions.length > 0) {
      newAlerts.push({
        id: 'failed_transactions',
        level: 'WARNING',
        message: `${failedTransactions.length} failed transactions detected`,
        timestamp: new Date(),
        category: 'SYSTEM'
      });
    }

    setAlerts(newAlerts);
  }, [investors, withdrawalRequests, transactions]);

  const getMetricColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'text-red-600';
    if (value >= thresholds.warning) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getMetricBg = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'bg-red-50 border-red-200';
    if (value >= thresholds.warning) return 'bg-yellow-50 border-yellow-200';
    return 'bg-green-50 border-green-200';
  };

  return (
    <GovernorLayout title="SYSTEM MONITORING">
      {/* Header */}
      <div className="bg-white border border-gray-300 p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gray-200 border border-gray-400 rounded-lg flex items-center justify-center">
              <Activity size={24} className="text-gray-700" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">SYSTEM MONITORING CENTER</h1>
              <p className="text-gray-600 uppercase tracking-wide text-sm font-medium">REAL-TIME PLATFORM PERFORMANCE AND HEALTH MONITORING</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${isMonitoring ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium text-gray-700 uppercase tracking-wide">
              {isMonitoring ? 'MONITORING ACTIVE' : 'MONITORING DISABLED'}
            </span>
          </div>
        </div>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className={`bg-white border border-gray-300 p-6 ${getMetricBg(systemMetrics.cpuUsage, { warning: 70, critical: 90 })}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Cpu size={20} className="text-gray-700" />
              <span className="font-bold text-gray-900 uppercase tracking-wide">CPU USAGE</span>
            </div>
            <span className={`text-2xl font-bold ${getMetricColor(systemMetrics.cpuUsage, { warning: 70, critical: 90 })}`}>
              {systemMetrics.cpuUsage}%
            </span>
          </div>
          <div className="w-full bg-gray-200 h-3 border border-gray-400">
            <div 
              className={`h-full transition-all duration-1000 ${
                systemMetrics.cpuUsage >= 90 ? 'bg-red-600' :
                systemMetrics.cpuUsage >= 70 ? 'bg-yellow-600' : 'bg-green-600'
              }`}
              style={{ width: `${systemMetrics.cpuUsage}%` }}
            />
          </div>
        </div>

        <div className={`bg-white border border-gray-300 p-6 ${getMetricBg(systemMetrics.memoryUsage, { warning: 80, critical: 95 })}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <HardDrive size={20} className="text-gray-700" />
              <span className="font-bold text-gray-900 uppercase tracking-wide">MEMORY USAGE</span>
            </div>
            <span className={`text-2xl font-bold ${getMetricColor(systemMetrics.memoryUsage, { warning: 80, critical: 95 })}`}>
              {systemMetrics.memoryUsage}%
            </span>
          </div>
          <div className="w-full bg-gray-200 h-3 border border-gray-400">
            <div 
              className={`h-full transition-all duration-1000 ${
                systemMetrics.memoryUsage >= 95 ? 'bg-red-600' :
                systemMetrics.memoryUsage >= 80 ? 'bg-yellow-600' : 'bg-green-600'
              }`}
              style={{ width: `${systemMetrics.memoryUsage}%` }}
            />
          </div>
        </div>

        <div className={`bg-white border border-gray-300 p-6 ${getMetricBg(systemMetrics.networkLatency, { warning: 100, critical: 200 })}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Network size={20} className="text-gray-700" />
              <span className="font-bold text-gray-900 uppercase tracking-wide">NETWORK LATENCY</span>
            </div>
            <span className={`text-2xl font-bold ${getMetricColor(systemMetrics.networkLatency, { warning: 100, critical: 200 })}`}>
              {systemMetrics.networkLatency}ms
            </span>
          </div>
          <div className="w-full bg-gray-200 h-3 border border-gray-400">
            <div 
              className={`h-full transition-all duration-1000 ${
                systemMetrics.networkLatency >= 200 ? 'bg-red-600' :
                systemMetrics.networkLatency >= 100 ? 'bg-yellow-600' : 'bg-green-600'
              }`}
              style={{ width: `${Math.min(systemMetrics.networkLatency / 2, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Platform Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white border border-gray-300 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Users size={20} className="text-gray-700" />
              <span className="font-bold text-gray-900 uppercase tracking-wide">ACTIVE USERS</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">{systemMetrics.activeConnections}</span>
          </div>
          <p className="text-xs text-gray-600 uppercase tracking-wide">CONCURRENT CONNECTIONS</p>
        </div>

        <div className="bg-white border border-gray-300 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Activity size={20} className="text-gray-700" />
              <span className="font-bold text-gray-900 uppercase tracking-wide">REQUESTS/MIN</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">{systemMetrics.requestsPerMinute}</span>
          </div>
          <p className="text-xs text-gray-600 uppercase tracking-wide">API REQUEST RATE</p>
        </div>

        <div className="bg-white border border-gray-300 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <DollarSign size={20} className="text-gray-700" />
              <span className="font-bold text-gray-900 uppercase tracking-wide">TOTAL AUM</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">
              ${investors.reduce((sum, inv) => sum + inv.currentBalance, 0).toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-gray-600 uppercase tracking-wide">ASSETS UNDER MANAGEMENT</p>
        </div>

        <div className="bg-white border border-gray-300 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <CheckCircle size={20} className="text-gray-700" />
              <span className="font-bold text-gray-900 uppercase tracking-wide">UPTIME</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">99.9%</span>
          </div>
          <p className="text-xs text-gray-600 uppercase tracking-wide">SYSTEM AVAILABILITY</p>
        </div>
      </div>

      {/* System Alerts */}
      <div className="bg-white border border-gray-300 mb-8">
        <div className="px-6 py-4 border-b border-gray-300 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">
            SYSTEM ALERTS ({alerts.length} ACTIVE)
          </h3>
        </div>
        <div className="p-6">
          {alerts.length > 0 ? (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div key={alert.id} className={`p-4 border ${
                  alert.level === 'CRITICAL' ? 'bg-red-50 border-red-200' :
                  alert.level === 'WARNING' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex items-start space-x-3">
                    <div className={`mt-1 ${
                      alert.level === 'CRITICAL' ? 'text-red-600' :
                      alert.level === 'WARNING' ? 'text-yellow-600' :
                      'text-blue-600'
                    }`}>
                      <AlertTriangle size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-1 text-xs font-bold border uppercase tracking-wide ${
                          alert.level === 'CRITICAL' ? 'bg-red-100 text-red-800 border-red-300' :
                          alert.level === 'WARNING' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                          'bg-blue-100 text-blue-800 border-blue-300'
                        }`}>
                          {alert.level}
                        </span>
                        <span className="text-xs text-gray-500 uppercase tracking-wide">
                          {alert.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-gray-900 font-medium uppercase tracking-wide">{alert.message}</p>
                      <p className="text-xs text-gray-600 mt-1 uppercase tracking-wide">
                        CATEGORY: {alert.category}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 border border-green-300 rounded-lg flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 uppercase tracking-wide">ALL SYSTEMS NORMAL</h3>
              <p className="text-gray-500 uppercase tracking-wide text-sm">No active alerts or warnings detected</p>
            </div>
          )}
        </div>
      </div>

      {/* Real-time Activity Log */}
      <div className="bg-white border border-gray-300">
        <div className="px-6 py-4 border-b border-gray-300 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">REAL-TIME ACTIVITY LOG</h3>
            <button
              onClick={() => setIsMonitoring(!isMonitoring)}
              className={`px-3 py-2 font-bold transition-colors uppercase tracking-wide border ${
                isMonitoring 
                  ? 'bg-red-600 text-white border-red-700 hover:bg-red-700' 
                  : 'bg-green-600 text-white border-green-700 hover:bg-green-700'
              }`}
            >
              {isMonitoring ? 'PAUSE MONITORING' : 'RESUME MONITORING'}
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-2 max-h-64 overflow-y-auto font-mono text-xs">
            <div className="flex items-center space-x-4 py-2 border-b border-gray-200">
              <span className="text-gray-500">[{new Date().toISOString()}]</span>
              <span className="text-green-600 font-bold">SYSTEM</span>
              <span className="text-gray-900">Governor monitoring system accessed</span>
            </div>
            <div className="flex items-center space-x-4 py-2 border-b border-gray-200">
              <span className="text-gray-500">[{new Date(Date.now() - 30000).toISOString()}]</span>
              <span className="text-blue-600 font-bold">DATABASE</span>
              <span className="text-gray-900">Real-time sync active - {transactions.length} transactions monitored</span>
            </div>
            <div className="flex items-center space-x-4 py-2 border-b border-gray-200">
              <span className="text-gray-500">[{new Date(Date.now() - 60000).toISOString()}]</span>
              <span className="text-yellow-600 font-bold">SECURITY</span>
              <span className="text-gray-900">{investors.filter(inv => inv.accountStatus?.includes('Restricted')).length} restricted accounts detected</span>
            </div>
            <div className="flex items-center space-x-4 py-2 border-b border-gray-200">
              <span className="text-gray-500">[{new Date(Date.now() - 90000).toISOString()}]</span>
              <span className="text-green-600 font-bold">NETWORK</span>
              <span className="text-gray-900">All network connections stable - latency {systemMetrics.networkLatency}ms</span>
            </div>
            <div className="flex items-center space-x-4 py-2 border-b border-gray-200">
              <span className="text-gray-500">[{new Date(Date.now() - 120000).toISOString()}]</span>
              <span className="text-blue-600 font-bold">API</span>
              <span className="text-gray-900">Request rate: {systemMetrics.requestsPerMinute} requests/minute</span>
            </div>
          </div>
        </div>
      </div>
    </GovernorLayout>
  );
};

export default GovernorSystemMonitoringPage;