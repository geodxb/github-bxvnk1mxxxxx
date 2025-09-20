import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import GovernorLayout from '../../components/layout/GovernorLayout';
import { useInvestor, useTransactions, useInvestorWithdrawalRequests } from '../../hooks/useFirestore';
import { FirestoreService } from '../../services/firestoreService';
import { UserRole } from '../../types/user';
import { useAuth } from '../../contexts/AuthContext';
import { 
  ChevronLeft,
  Edit,
  Save,
  Ban,
  CheckCircle,
  Database,
  Eye,
  DollarSign,
  AlertTriangle,
  Shield,
  UserCheck,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

const GovernorInvestorProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { investor, loading, error } = useInvestor(id || '');
  const { transactions } = useTransactions(id || '');
  const { withdrawalRequests } = useInvestorWithdrawalRequests(id || '');
  
  const [isEditing, setIsEditing] = useState(false);
  const [showRawData, setShowRawData] = useState(false);
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  
  // Financial Adjustment State
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);
  
  // Role Change State
  const [newRole, setNewRole] = useState<UserRole>('investor');
  const [roleChangeReason, setRoleChangeReason] = useState('');
  const [isChangingRole, setIsChangingRole] = useState(false);

  useEffect(() => {
    if (investor) {
      setFormData({
        name: investor.name,
        email: investor.email || '',
        phone: investor.phone || '',
        country: investor.country,
        location: investor.location || '',
        currentBalance: investor.currentBalance,
        initialDeposit: investor.initialDeposit,
        accountStatus: investor.accountStatus || 'Active',
        accountType: investor.accountType || 'Standard'
      });
      setNewRole(investor.role);
    }
  }, [investor]);

  const handleSave = async () => {
    if (!investor) return;
    
    setIsLoading(true);
    try {
      await FirestoreService.updateInvestor(investor.id, {
        ...formData,
        updatedAt: new Date()
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating investor:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!investor) return;
    
    if (!confirm(`SUSPEND ACCOUNT: ${investor.name}?\n\nThis will immediately restrict all account access.`)) {
      return;
    }

    try {
      await FirestoreService.updateInvestor(investor.id, {
        accountStatus: 'SUSPENDED BY GOVERNOR',
        isActive: false,
        accountFlags: {
          ...investor.accountFlags,
          governorSuspended: true,
          suspendedAt: new Date().toISOString(),
          suspendedBy: 'GOVERNOR'
        }
      });
    } catch (error) {
      console.error('Error suspending account:', error);
    }
  };

  const handleBalanceAdjustment = async () => {
    if (!investor || !user || !adjustmentAmount || !adjustmentReason.trim()) {
      return;
    }
    
    const amount = parseFloat(adjustmentAmount);
    if (isNaN(amount) || amount === 0) {
      alert('Please enter a valid adjustment amount');
      return;
    }
    
    if (!confirm(`ADJUST BALANCE: ${investor.name}\n\nCurrent: $${investor.currentBalance.toLocaleString()}\nAdjustment: ${amount >= 0 ? '+' : ''}$${amount.toLocaleString()}\nNew Balance: $${(investor.currentBalance + amount).toLocaleString()}\n\nReason: ${adjustmentReason}\n\nThis action will be permanently logged.`)) {
      return;
    }

    setIsAdjusting(true);
    try {
      await FirestoreService.adjustInvestorBalance(
        investor.id,
        amount,
        adjustmentReason,
        user.id,
        user.name
      );
      
      setAdjustmentAmount('');
      setAdjustmentReason('');
      alert('BALANCE ADJUSTMENT COMPLETED SUCCESSFULLY');
    } catch (error) {
      console.error('Error adjusting balance:', error);
      alert('Failed to adjust balance. Please try again.');
    } finally {
      setIsAdjusting(false);
    }
  };

  const handleRoleChange = async () => {
    if (!investor || !user || !roleChangeReason.trim()) {
      return;
    }
    
    if (newRole === investor.role) {
      alert('User already has this role');
      return;
    }
    
    if (!confirm(`CHANGE USER ROLE: ${investor.name}\n\nCurrent Role: ${investor.role.toUpperCase()}\nNew Role: ${newRole.toUpperCase()}\n\nReason: ${roleChangeReason}\n\nThis action will be permanently logged and may affect user access.`)) {
      return;
    }

    setIsChangingRole(true);
    try {
      await FirestoreService.changeUserRole(
        investor.id,
        newRole,
        roleChangeReason,
        user.id,
        user.name
      );
      
      setRoleChangeReason('');
      alert('USER ROLE CHANGED SUCCESSFULLY');
    } catch (error) {
      console.error('Error changing user role:', error);
      alert('Failed to change user role. Please try again.');
    } finally {
      setIsChangingRole(false);
    }
  };

  if (loading) {
    return (
      <GovernorLayout title="LOADING...">
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-gray-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 font-bold uppercase tracking-wide">LOADING ACCOUNT DATA...</p>
        </div>
      </GovernorLayout>
    );
  }

  if (error || !investor) {
    return (
      <GovernorLayout title="ERROR">
        <div className="bg-white border border-gray-300 p-8 text-center">
          <p className="text-red-600 font-bold uppercase tracking-wide">{error || 'ACCOUNT NOT FOUND'}</p>
          <button
            onClick={() => navigate('/governor/investors')}
            className="mt-4 px-4 py-2 bg-gray-900 text-white font-bold hover:bg-gray-800 transition-colors uppercase tracking-wide"
          >
            BACK TO ACCOUNTS
          </button>
        </div>
      </GovernorLayout>
    );
  }

  return (
    <GovernorLayout title={`ACCOUNT: ${investor.name.toUpperCase()}`}>
      <button
        onClick={() => navigate('/governor/investors')}
        className="mb-6 px-3 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-bold hover:bg-gray-50 transition-colors uppercase tracking-wide"
      >
        <ChevronLeft size={16} className="mr-1 inline" />
        BACK TO ACCOUNTS
      </button>

      {/* Account Control Header */}
      <div className="bg-white border border-gray-300 p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">{investor.name}</h1>
            <p className="text-gray-600 uppercase tracking-wide text-sm font-medium">
              ACCOUNT ID: {investor.id} | STATUS: {investor.accountStatus || 'ACTIVE'}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowRawData(!showRawData)}
              className="px-4 py-2 bg-gray-900 text-white font-bold hover:bg-gray-800 transition-colors uppercase tracking-wide"
            >
              <Database size={16} className="mr-2 inline" />
              {showRawData ? 'HIDE' : 'SHOW'} RAW DATA
            </button>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors uppercase tracking-wide"
            >
              <Edit size={16} className="mr-2 inline" />
              {isEditing ? 'CANCEL' : 'EDIT'}
            </button>
            <button
              onClick={handleSuspend}
              className="px-4 py-2 bg-red-600 text-white font-bold hover:bg-red-700 transition-colors uppercase tracking-wide"
            >
              <Ban size={16} className="mr-2 inline" />
              SUSPEND
            </button>
          </div>
        </div>
      </div>

      {/* Raw Data Display */}
      {showRawData && (
        <div className="bg-gray-900 text-green-400 p-6 mb-8 border border-gray-700 font-mono text-xs">
          <div className="mb-4">
            <h3 className="text-white font-bold uppercase tracking-wide">RAW ACCOUNT DATA - {investor.name.toUpperCase()}</h3>
          </div>
          <pre className="whitespace-pre-wrap overflow-x-auto max-h-96">
{JSON.stringify({
  accountData: investor,
  transactionHistory: transactions,
  withdrawalHistory: withdrawalRequests,
  systemMetadata: {
    governorAccess: true,
    lastAccessed: new Date().toISOString(),
    accessLevel: 'FULL_CONTROL',
    dataIntegrity: 'VERIFIED'
  }
}, null, 2)}
          </pre>
        </div>
      )}

      {/* Enhanced Governor Powers Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Financial Adjustments */}
        <div className="bg-white border border-gray-300">
          <div className="px-6 py-4 border-b border-gray-300 bg-gray-50">
            <div className="flex items-center space-x-2">
              <DollarSign size={20} className="text-gray-700" />
              <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">FINANCIAL ADJUSTMENTS</h3>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 border border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-gray-600 font-bold uppercase tracking-wide">CURRENT BALANCE</p>
                    <p className="text-gray-900 font-bold text-xl">${investor.currentBalance.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-bold uppercase tracking-wide">INITIAL DEPOSIT</p>
                    <p className="text-gray-900 font-bold text-xl">${investor.initialDeposit.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  ADJUSTMENT AMOUNT ($)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={adjustmentAmount}
                    onChange={(e) => setAdjustmentAmount(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 font-bold"
                    placeholder="Enter positive or negative amount"
                    step="0.01"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center space-x-2">
                    {adjustmentAmount && !isNaN(parseFloat(adjustmentAmount)) && (
                      <>
                        {parseFloat(adjustmentAmount) >= 0 ? (
                          <TrendingUp size={16} className="text-green-600" />
                        ) : (
                          <TrendingDown size={16} className="text-red-600" />
                        )}
                      </>
                    )}
                  </div>
                </div>
                {adjustmentAmount && !isNaN(parseFloat(adjustmentAmount)) && (
                  <p className="text-xs text-gray-600 mt-1 uppercase tracking-wide">
                    NEW BALANCE: ${(investor.currentBalance + parseFloat(adjustmentAmount)).toLocaleString()}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  REASON FOR ADJUSTMENT <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 font-medium"
                  rows={3}
                  placeholder="MANDATORY: Explain why this balance adjustment is necessary..."
                  required
                />
              </div>

              <button
                onClick={handleBalanceAdjustment}
                disabled={!adjustmentAmount || !adjustmentReason.trim() || isAdjusting}
                className="w-full px-4 py-3 bg-red-600 text-white font-bold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide border border-red-700"
              >
                {isAdjusting ? 'ADJUSTING BALANCE...' : 'ADJUST BALANCE'}
              </button>
            </div>
          </div>
        </div>

        {/* User Role Management */}
        <div className="bg-white border border-gray-300">
          <div className="px-6 py-4 border-b border-gray-300 bg-gray-50">
            <div className="flex items-center space-x-2">
              <UserCheck size={20} className="text-gray-700" />
              <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">USER ROLE MANAGEMENT</h3>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 border border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 font-bold uppercase tracking-wide">CURRENT ROLE</p>
                    <p className="text-gray-900 font-bold text-lg">{investor.role.toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-bold uppercase tracking-wide">USER TYPE</p>
                    <p className="text-gray-900 font-bold text-lg">{investor.accountType || 'STANDARD'}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  NEW ROLE
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full px-4 py-3 border border-gray-300 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 font-bold"
                >
                  <option value="investor">INVESTOR</option>
                  <option value="admin">ADMIN</option>
                  <option value="governor">GOVERNOR</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  REASON FOR ROLE CHANGE <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={roleChangeReason}
                  onChange={(e) => setRoleChangeReason(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 font-medium"
                  rows={3}
                  placeholder="MANDATORY: Explain why this role change is necessary..."
                  required
                />
              </div>

              <button
                onClick={handleRoleChange}
                disabled={newRole === investor.role || !roleChangeReason.trim() || isChangingRole}
                className="w-full px-4 py-3 bg-red-600 text-white font-bold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide border border-red-700"
              >
                {isChangingRole ? 'CHANGING ROLE...' : 'CHANGE USER ROLE'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Account Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white border border-gray-300">
          <div className="px-6 py-4 border-b border-gray-300 bg-gray-50">
            <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">ACCOUNT INFORMATION</h3>
          </div>
          <div className="p-6">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">NAME</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">EMAIL</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">CURRENT BALANCE</label>
                  <input
                    type="number"
                    value={formData.currentBalance}
                    onChange={(e) => setFormData(prev => ({ ...prev, currentBalance: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">ACCOUNT STATUS</label>
                  <select
                    value={formData.accountStatus}
                    onChange={(e) => setFormData(prev => ({ ...prev, accountStatus: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 font-medium"
                  >
                    <option value="Active">ACTIVE</option>
                    <option value="Restricted for withdrawals (policy violation)">RESTRICTED</option>
                    <option value="SUSPENDED BY GOVERNOR">SUSPENDED</option>
                    <option value="Account Closure Request Under Review">CLOSURE PENDING</option>
                  </select>
                </div>
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-gray-900 text-white font-bold hover:bg-gray-800 transition-colors disabled:opacity-50 uppercase tracking-wide"
                >
                  {isLoading ? 'SAVING...' : 'SAVE CHANGES'}
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600 font-bold uppercase tracking-wide">NAME</p>
                    <p className="text-gray-900 font-medium">{investor.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-bold uppercase tracking-wide">EMAIL</p>
                    <p className="text-gray-900 font-medium">{investor.email || 'NOT PROVIDED'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-bold uppercase tracking-wide">COUNTRY</p>
                    <p className="text-gray-900 font-medium">{investor.country}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-bold uppercase tracking-wide">JOIN DATE</p>
                    <p className="text-gray-900 font-medium">{investor.joinDate}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-bold uppercase tracking-wide">INITIAL DEPOSIT</p>
                    <p className="text-gray-900 font-bold">${investor.initialDeposit.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-bold uppercase tracking-wide">CURRENT BALANCE</p>
                    <p className="text-gray-900 font-bold">${investor.currentBalance.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white border border-gray-300">
          <div className="px-6 py-4 border-b border-gray-300 bg-gray-50">
            <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">
              TRANSACTION HISTORY ({transactions.length})
            </h3>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto max-h-64">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="text-left py-2 text-gray-700 font-bold uppercase tracking-wide">DATE</th>
                    <th className="text-left py-2 text-gray-700 font-bold uppercase tracking-wide">TYPE</th>
                    <th className="text-right py-2 text-gray-700 font-bold uppercase tracking-wide">AMOUNT</th>
                    <th className="text-left py-2 text-gray-700 font-bold uppercase tracking-wide">STATUS</th>
                    <th className="text-left py-2 text-gray-700 font-bold uppercase tracking-wide">DESCRIPTION</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-gray-200">
                      <td className="py-2 text-gray-900 font-medium">{tx.date}</td>
                      <td className="py-2 text-gray-900 font-medium">{tx.type}</td>
                      <td className="py-2 text-right text-gray-900 font-bold">
                        {tx.type === 'Withdrawal' ? '-' : '+'}${Math.abs(tx.amount).toLocaleString()}
                      </td>
                      <td className="py-2 text-gray-900 font-medium">{tx.status}</td>
                      <td className="py-2 text-gray-600">{tx.description || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Withdrawal Requests */}
      <div className="bg-white border border-gray-300 mb-8">
        <div className="px-6 py-4 border-b border-gray-300 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">
            WITHDRAWAL REQUESTS ({withdrawalRequests.length})
          </h3>
        </div>
        <div className="p-6">
          {withdrawalRequests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="text-left py-2 text-gray-700 font-bold uppercase tracking-wide">REQUEST ID</th>
                    <th className="text-right py-2 text-gray-700 font-bold uppercase tracking-wide">AMOUNT</th>
                    <th className="text-left py-2 text-gray-700 font-bold uppercase tracking-wide">DATE</th>
                    <th className="text-left py-2 text-gray-700 font-bold uppercase tracking-wide">STATUS</th>
                    <th className="text-left py-2 text-gray-700 font-bold uppercase tracking-wide">BANK STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawalRequests.map((req) => (
                    <tr key={req.id} className="border-b border-gray-200">
                      <td className="py-2 text-gray-900 font-medium">#{req.id.slice(-8)}</td>
                      <td className="py-2 text-right text-gray-900 font-bold">${req.amount.toLocaleString()}</td>
                      <td className="py-2 text-gray-900 font-medium">{req.date}</td>
                      <td className="py-2">
                        <span className={`px-2 py-1 text-xs font-bold border uppercase tracking-wide ${
                          req.status === 'Pending' ? 'bg-yellow-50 text-yellow-800 border-yellow-200' :
                          req.status === 'Approved' ? 'bg-green-50 text-green-800 border-green-200' :
                          req.status === 'Rejected' ? 'bg-red-50 text-red-800 border-red-200' :
                          'bg-gray-50 text-gray-800 border-gray-200'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="py-2">
                        <span className="px-2 py-1 text-xs font-bold bg-gray-100 text-gray-800 border border-gray-300 uppercase tracking-wide">
                          {req.status === 'Approved' ? 'TRANSFERRED' : 
                           req.status === 'Pending' ? 'PROCESSING' : 
                           'NOT PROCESSED'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8 font-bold uppercase tracking-wide">NO WITHDRAWAL REQUESTS</p>
          )}
        </div>
      </div>
    </GovernorLayout>
  );
};

export default GovernorInvestorProfile;