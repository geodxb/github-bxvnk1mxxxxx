import { useState, useEffect } from 'react';
import GovernorLayout from '../../components/layout/GovernorLayout';
import { useInvestors, useWithdrawalRequests, useTransactions } from '../../hooks/useFirestore';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Database, Search, Download, Eye, Trash2, RefreshCw } from 'lucide-react';

const GovernorDatabasePage = () => {
  const { investors } = useInvestors();
  const { withdrawalRequests } = useWithdrawalRequests();
  const { transactions } = useTransactions();
  const [selectedCollection, setSelectedCollection] = useState('users');
  const [rawData, setRawData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [showRawView, setShowRawView] = useState(false);

  const collections = [
    { id: 'users', label: 'USERS', description: 'All user accounts and profiles' },
    { id: 'transactions', label: 'TRANSACTIONS', description: 'All financial transactions' },
    { id: 'withdrawalRequests', label: 'WITHDRAWAL REQUESTS', description: 'All withdrawal requests' },
    { id: 'commissions', label: 'COMMISSIONS', description: 'Commission records' },
    { id: 'accountClosureRequests', label: 'ACCOUNT CLOSURES', description: 'Account deletion requests' },
    { id: 'auditLogs', label: 'AUDIT LOGS', description: 'System audit trail' },
    { id: 'systemSettings', label: 'SYSTEM SETTINGS', description: 'Platform configuration' },
    { id: 'conversations', label: 'CONVERSATIONS', description: 'Message conversations' },
    { id: 'affiliateMessages', label: 'MESSAGES', description: 'All platform messages' }
  ];

  const loadCollectionData = async (collectionName: string) => {
    setIsLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        _metadata: {
          collection: collectionName,
          documentId: doc.id,
          lastModified: doc.data().updatedAt?.toDate() || doc.data().createdAt?.toDate() || new Date()
        }
      }));
      setRawData(data);
    } catch (error) {
      console.error('Error loading collection data:', error);
      setRawData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCollectionData(selectedCollection);
  }, [selectedCollection]);

  const filteredData = rawData.filter(item => {
    if (!searchTerm) return true;
    const searchString = JSON.stringify(item).toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  const exportData = () => {
    const dataStr = JSON.stringify(filteredData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedCollection}_export_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getCollectionStats = () => {
    switch (selectedCollection) {
      case 'users':
        return {
          total: rawData.length,
          investors: rawData.filter(item => item.role === 'investor').length,
          admins: rawData.filter(item => item.role === 'admin').length,
          governors: rawData.filter(item => item.role === 'governor').length
        };
      case 'transactions':
        return {
          total: rawData.length,
          deposits: rawData.filter(item => item.type === 'Deposit').length,
          withdrawals: rawData.filter(item => item.type === 'Withdrawal').length,
          earnings: rawData.filter(item => item.type === 'Earnings').length
        };
      case 'withdrawalRequests':
        return {
          total: rawData.length,
          pending: rawData.filter(item => item.status === 'Pending').length,
          approved: rawData.filter(item => item.status === 'Approved').length,
          rejected: rawData.filter(item => item.status === 'Rejected').length
        };
      default:
        return { total: rawData.length };
    }
  };

  const stats = getCollectionStats();

  return (
    <GovernorLayout title="DATABASE ACCESS">
      {/* Header */}
      <div className="bg-white border border-gray-300 p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gray-200 border border-gray-400 rounded-lg flex items-center justify-center">
              <Database size={24} className="text-gray-700" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">DATABASE ACCESS CONTROL</h1>
              <p className="text-gray-600 uppercase tracking-wide text-sm font-medium">DIRECT ACCESS TO ALL SYSTEM DATA AND RECORDS</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700 uppercase tracking-wide">DATABASE CONNECTED</span>
          </div>
        </div>
      </div>

      {/* Collection Selection */}
      <div className="bg-white border border-gray-300 p-6 mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wide">SELECT DATABASE COLLECTION</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {collections.map((collection) => (
            <button
              key={collection.id}
              onClick={() => setSelectedCollection(collection.id)}
              className={`p-4 border text-left transition-all ${
                selectedCollection === collection.id
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-3 mb-2">
                <Database size={16} />
                <span className="font-bold text-sm uppercase tracking-wide">{collection.label}</span>
              </div>
              <p className="text-xs uppercase tracking-wide opacity-75">
                {collection.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Collection Statistics */}
      <div className="bg-white border border-gray-300 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">
            COLLECTION: {selectedCollection.toUpperCase()}
          </h3>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => loadCollectionData(selectedCollection)}
              disabled={isLoading}
              className="px-3 py-2 bg-gray-900 text-white font-bold hover:bg-gray-800 transition-colors disabled:opacity-50 uppercase tracking-wide border border-gray-700"
            >
              <RefreshCw size={14} className="mr-1 inline" />
              REFRESH
            </button>
            <button
              onClick={exportData}
              disabled={filteredData.length === 0}
              className="px-3 py-2 bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 uppercase tracking-wide border border-blue-700"
            >
              <Download size={14} className="mr-1 inline" />
              EXPORT
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(stats).map(([key, value]) => (
            <div key={key} className="bg-gray-50 p-4 border border-gray-200">
              <p className="text-gray-600 text-xs font-bold uppercase tracking-wide">{key}</p>
              <p className="text-gray-900 text-2xl font-bold">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Search and Controls */}
      <div className="bg-white border border-gray-300 p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="SEARCH DATABASE RECORDS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 uppercase tracking-wide font-medium"
            />
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowRawView(!showRawView)}
              className="px-3 py-2 bg-gray-700 text-white font-bold hover:bg-gray-600 transition-colors uppercase tracking-wide border border-gray-600"
            >
              <Eye size={14} className="mr-1 inline" />
              {showRawView ? 'HIDE' : 'SHOW'} RAW JSON
            </button>
          </div>
        </div>
      </div>

      {/* Data Display */}
      <div className="bg-white border border-gray-300">
        <div className="px-6 py-4 border-b border-gray-300 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">
            DATABASE RECORDS ({filteredData.length} FOUND)
          </h3>
        </div>
        
        {isLoading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-gray-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-700 font-bold uppercase tracking-wide">LOADING DATABASE RECORDS...</p>
          </div>
        ) : showRawView ? (
          <div className="p-6">
            <div className="bg-gray-900 text-green-400 p-6 border border-gray-700 font-mono text-xs max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap">
                {JSON.stringify(filteredData, null, 2)}
              </pre>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-300 bg-gray-100">
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wide">DOCUMENT ID</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wide">TYPE/NAME</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wide">KEY DATA</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wide">LAST MODIFIED</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wide">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, index) => (
                  <tr key={item.id || index} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-mono text-sm text-gray-900">{item.id}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-gray-900 uppercase tracking-wide">
                          {item.name || item.investorName || item.type || 'RECORD'}
                        </p>
                        <p className="text-xs text-gray-600 uppercase tracking-wide">
                          {item.role || item.status || selectedCollection.toUpperCase()}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs space-y-1">
                        {item.email && <p className="text-gray-600">EMAIL: {item.email}</p>}
                        {item.amount && <p className="text-gray-600">AMOUNT: ${item.amount.toLocaleString()}</p>}
                        {item.currentBalance && <p className="text-gray-600">BALANCE: ${item.currentBalance.toLocaleString()}</p>}
                        {item.country && <p className="text-gray-600">COUNTRY: {item.country}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <p className="text-xs text-gray-600">
                        {item._metadata?.lastModified?.toLocaleDateString() || 'N/A'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedDocument(item)}
                          className="px-2 py-1 bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 transition-colors uppercase tracking-wide border border-gray-700"
                        >
                          <Eye size={12} className="mr-1 inline" />
                          VIEW
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Document Inspector Modal */}
      {selectedDocument && (
        <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setSelectedDocument(null)}>
          <div className="flex min-h-screen items-start justify-center p-4 pt-8">
            <div 
              className="relative w-full max-w-4xl bg-white border border-gray-300 shadow-xl max-h-[85vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-gray-300 bg-gray-50 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900 uppercase tracking-wide">
                  DOCUMENT INSPECTOR - {selectedDocument.id}
                </h3>
                <button
                  onClick={() => setSelectedDocument(null)}
                  className="p-2 hover:bg-gray-200 transition-colors border border-gray-300"
                >
                  <span className="text-gray-500 text-lg">×</span>
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1">
                <div className="bg-gray-900 text-green-400 p-6 border border-gray-700 font-mono text-xs">
                  <pre className="whitespace-pre-wrap overflow-x-auto">
                    {JSON.stringify(selectedDocument, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </GovernorLayout>
  );
};

export default GovernorDatabasePage;