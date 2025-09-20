import { useState, useEffect } from 'react';
import GovernorLayout from '../../components/layout/GovernorLayout';
import { useInvestors, useWithdrawalRequests, useTransactions } from '../../hooks/useFirestore';
import { FirestoreService } from '../../services/firestoreService';
import { AuditLog } from '../../types/user';

const GovernorLogsPage = () => {
  const { investors } = useInvestors();
  const { withdrawalRequests } = useWithdrawalRequests();
  const { transactions } = useTransactions();
  const [logFilter, setLogFilter] = useState('all');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState(true);
  const [showAuditLogs, setShowAuditLogs] = useState(false);

  // Load audit logs
  useEffect(() => {
    const loadAuditLogs = async () => {
      try {
        const logs = await FirestoreService.getAuditLogs(50);
        setAuditLogs(logs);
      } catch (error) {
        console.error('Error loading audit logs:', error);
      } finally {
        setIsLoadingAudit(false);
      }
    };

    loadAuditLogs();
  }, []);

  // Generate system logs from real data
  const generateSystemLogs = () => {
    const logs = [];
    
    // Recent transactions as logs
    transactions.slice(0, 20).forEach(tx => {
      logs.push({
        timestamp: new Date(tx.date),
        level: tx.status === 'Completed' ? 'INFO' : tx.status === 'Rejected' ? 'ERROR' : 'WARNING',
        category: 'TRANSACTION',
        message: `${tx.type} transaction ${tx.status.toLowerCase()} - Amount: $${Math.abs(tx.amount).toLocaleString()} - Investor: ${tx.investorId.slice(-8)}`
      });
    });
    
    // Withdrawal requests as logs
    withdrawalRequests.slice(0, 15).forEach(req => {
      logs.push({
        timestamp: new Date(req.date),
        level: req.status === 'Approved' ? 'INFO' : req.status === 'Rejected' ? 'ERROR' : 'WARNING',
        category: 'WITHDRAWAL',
        message: `Withdrawal request ${req.status.toLowerCase()} - Amount: $${req.amount.toLocaleString()} - Investor: ${req.investorName}`
      });
    });
    
    // Account status changes as logs
    investors.forEach(inv => {
      if (inv.accountStatus && inv.accountStatus !== 'Active') {
        logs.push({
          timestamp: inv.updatedAt,
          level: inv.accountStatus.includes('Restricted') ? 'WARNING' : 'ERROR',
          category: 'ACCOUNT',
          message: `Account status changed to ${inv.accountStatus} - Investor: ${inv.name}`
        });
      }
    });
    
    // Sort by timestamp (newest first)
    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  const systemLogs = generateSystemLogs();
  
  const filteredLogs = systemLogs.filter(log => {
    if (logFilter === 'all') return true;
    return log.level.toLowerCase() === logFilter.toLowerCase();
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR': return 'text-red-600';
      case 'WARNING': return 'text-yellow-600';
      case 'INFO': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <GovernorLayout title="SYSTEM LOGS">
      <div className="bg-white border border-gray-300 p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">SYSTEM ACTIVITY LOGS</h1>
            <p className="text-gray-600 uppercase tracking-wide text-sm font-medium">COMPREHENSIVE SYSTEM EVENT MONITORING AND AUDIT TRAIL</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowAuditLogs(!showAuditLogs)}
              className="px-4 py-2 bg-red-600 text-white font-bold hover:bg-red-700 transition-colors uppercase tracking-wide border border-red-700"
            >
              {showAuditLogs ? 'HIDE' : 'SHOW'} GOVERNOR AUDIT LOGS
            </button>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{filteredLogs.length}</div>
              <div className="text-sm text-gray-600 uppercase tracking-wide">LOG ENTRIES</div>
            </div>
          </div>
        </div>
      </div>

      {/* Governor Audit Logs */}
      {showAuditLogs && (
        <div className="bg-white border border-gray-300 mb-8">
          <div className="px-6 py-4 border-b border-gray-300 bg-red-50">
            <h3 className="text-lg font-bold text-red-900 uppercase tracking-wide">
              GOVERNOR AUDIT TRAIL ({auditLogs.length} RECORDS)
            </h3>
          </div>
          <div className="p-6">
            {isLoadingAudit ? (
              <div className="text-center py-8">
                <div className="w-6 h-6 border-2 border-gray-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-700 font-bold uppercase tracking-wide">LOADING AUDIT LOGS...</p>
              </div>
            ) : auditLogs.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto font-mono text-xs">
                {auditLogs.map((log, index) => (
                  <div key={index} className="flex items-start space-x-4 py-3 border-b border-gray-200 bg-red-50">
                    <span className="text-gray-500 w-48 flex-shrink-0">
                      [{log.timestamp.toISOString()}]
                    </span>
                    <span className="text-red-600 font-bold w-32 flex-shrink-0">
                      GOVERNOR
                    </span>
                    <span className="text-gray-700 font-bold w-32 flex-shrink-0">
                      {log.action.toUpperCase()}
                    </span>
                    <span className="text-gray-900 flex-1">
                      {log.governorName} performed {log.action.toLowerCase()} on {log.targetName}
                      {log.details.amount && ` - Amount: $${log.details.amount.toLocaleString()}`}
                      {log.details.reason && ` - Reason: ${log.details.reason}`}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8 font-bold uppercase tracking-wide">NO GOVERNOR AUDIT LOGS FOUND</p>
            )}
          </div>
        </div>
      )}

      {/* Log Filters */}
      <div className="bg-white border border-gray-300 p-6 mb-8">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">LOG LEVEL FILTER:</span>
          <div className="flex space-x-2">
            {[
              { key: 'all', label: 'ALL' },
              { key: 'error', label: 'ERRORS' },
              { key: 'warning', label: 'WARNINGS' },
              { key: 'info', label: 'INFO' }
            ].map(filter => (
              <button
                key={filter.key}
                onClick={() => setLogFilter(filter.key)}
                className={`px-3 py-2 text-sm font-bold border transition-colors uppercase tracking-wide ${
                  logFilter === filter.key
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* System Logs */}
      <div className="bg-white border border-gray-300">
        <div className="px-6 py-4 border-b border-gray-300 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">
            SYSTEM LOG ENTRIES ({filteredLogs.length} RECORDS)
          </h3>
        </div>
        <div className="p-6">
          <div className="space-y-2 max-h-96 overflow-y-auto font-mono text-xs">
            {filteredLogs.map((log, index) => (
              <div key={index} className="flex items-start space-x-4 py-2 border-b border-gray-200">
                <span className="text-gray-500 w-48 flex-shrink-0">
                  [{log.timestamp.toISOString()}]
                </span>
                <span className={`font-bold w-20 flex-shrink-0 ${getLevelColor(log.level)}`}>
                  {log.level}
                </span>
                <span className="text-gray-700 font-bold w-24 flex-shrink-0">
                  {log.category}
                </span>
                <span className="text-gray-900 flex-1">
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </GovernorLayout>
  );
};

export default GovernorLogsPage;