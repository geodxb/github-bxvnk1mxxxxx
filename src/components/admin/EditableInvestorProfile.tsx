import { useState } from 'react';
import Card from '../common/Card';
import Table from '../common/Table';
import Button from '../common/Button';
import Modal from '../common/Modal';
import { useWithdrawalRequests, useInvestors } from '../../hooks/useFirestore';
import { FirestoreService } from '../../services/firestoreService';
import ProofOfFundsForm from '../../components/investor/ProofOfFundsForm';
import ProofOfTransferGenerator from '../../components/admin/ProofOfTransferGenerator';
import { useAuth } from '../../contexts/AuthContext';
import WithdrawalProgressBar from '../../components/common/WithdrawalProgressBar';
import { Investor } from '../../types/user';
import { 
  CheckCircle, 
  XCircle, 
  Filter, 
  Search, 
  Calendar,
  DollarSign,
  User,
  Clock,
  AlertTriangle,
  X,
  FileText,
  Edit3,
  MapPin,
  Phone,
  Mail,
  TrendingUp,
  Building
} from 'lucide-react';

interface EditableInvestorProfileProps {
  investor: Investor;
  onUpdate: () => void;
}

const EditableInvestorProfile = ({ investor, onUpdate }: EditableInvestorProfileProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: investor.name,
    email: investor.email || '',
    phone: investor.phone || '',
    country: investor.country,
    location: investor.location || '',
    accountType: investor.accountType || 'Standard',
    accountStatus: investor.accountStatus || 'Active'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setIsLoading(true);
    setError('');

    try {
      await FirestoreService.updateInvestor(investor.id, {
        ...formData,
        updatedAt: new Date()
      });

      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating investor:', error);
      setError('Failed to update investor profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: investor.name,
      email: investor.email || '',
      phone: investor.phone || '',
      country: investor.country,
      location: investor.location || '',
      accountType: investor.accountType || 'Standard',
      accountStatus: investor.accountStatus || 'Active'
    });
    setIsEditing(false);
    setError('');
  };

  const performance = investor.currentBalance - investor.initialDeposit;
  const performancePercent = investor.initialDeposit > 0 ? (performance / investor.initialDeposit) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Profile Information Card */}
      <Card title="INVESTOR PROFILE">
        <div className="space-y-6">
          {/* Profile Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                <User size={32} className="text-gray-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{investor.name}</h2>
                <p className="text-gray-600">ID: {investor.id.slice(-8)}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                    investor.accountType === 'Pro' 
                      ? 'bg-gray-800 text-white' 
                      : 'bg-gray-600 text-white'
                  }`}>
                    {investor.accountType || 'Standard'}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                    investor.accountStatus?.includes('Active') || !investor.accountStatus
                      ? 'bg-green-100 text-green-800'
                      : investor.accountStatus?.includes('Restricted')
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {investor.accountStatus || 'Active'}
                  </span>
                </div>
              </div>
            </div>
            
            <Button
              variant="outline"
              onClick={() => setIsEditing(!isEditing)}
              disabled={isLoading}
            >
              <Edit3 size={16} className="mr-2" />
              {isEditing ? 'Cancel Edit' : 'Edit Profile'}
            </Button>
          </div>

          {/* Profile Form */}
          {isEditing ? (
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 uppercase tracking-wide">
                EDIT PROFILE INFORMATION
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                    FULL NAME
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                    EMAIL ADDRESS
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                    PHONE NUMBER
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                    COUNTRY
                  </label>
                  <select
                    value={formData.country}
                    onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
                  >
                    <option value="Mexico">Mexico</option>
                    <option value="France">France</option>
                    <option value="Switzerland">Switzerland</option>
                    <option value="Saudi Arabia">Saudi Arabia</option>
                    <option value="United Arab Emirates">United Arab Emirates</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                    LOCATION/CITY
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
                    placeholder="City or specific location"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                    ACCOUNT TYPE
                  </label>
                  <select
                    value={formData.accountType}
                    onChange={(e) => setFormData(prev => ({ ...prev, accountType: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
                  >
                    <option value="Standard">Standard</option>
                    <option value="Pro">Pro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                    ACCOUNT STATUS
                  </label>
                  <select
                    value={formData.accountStatus}
                    onChange={(e) => setFormData(prev => ({ ...prev, accountStatus: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
                  >
                    <option value="Active">Active</option>
                    <option value="Restricted for withdrawals (policy violation)">Restricted for withdrawals (policy violation)</option>
                    <option value="Account Closure Request Under Review">Account Closure Request Under Review</option>
                    <option value="Deletion Request Approved - 90 Day Countdown Active">Deletion Request Approved - 90 Day Countdown Active</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                    JOIN DATE
                  </label>
                  <input
                    type="date"
                    value={investor.joinDate}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed font-medium"
                  />
                </div>
              </div>

              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle size={16} />
                    <span className="font-medium uppercase tracking-wide">{error}</span>
                  </div>
                </div>
              )}

              <div className="flex space-x-4 mt-6">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="flex-1"
                >
                  CANCEL
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSave}
                  isLoading={isLoading}
                  disabled={isLoading}
                  className="flex-1"
                >
                  SAVE CHANGES
                </Button>
              </div>
            </div>
          ) : (
            /* Profile Display */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 uppercase tracking-wide">BASIC INFORMATION</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 uppercase tracking-wide">
                      FULL NAME
                    </label>
                    <p className="text-gray-900 font-medium">{investor.name}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 uppercase tracking-wide">
                      COUNTRY
                    </label>
                    <p className="text-gray-900 font-medium">{investor.country}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 uppercase tracking-wide">
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

                  {investor.location && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 uppercase tracking-wide">
                        LOCATION
                      </label>
                      <p className="text-gray-900 font-medium">{investor.location}</p>
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
                      INITIAL DEPOSIT
                    </label>
                    <p className="text-gray-900 font-bold text-lg">${investor.initialDeposit.toLocaleString()}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 uppercase tracking-wide">
                      CURRENT BALANCE
                    </label>
                    <p className="text-gray-900 font-bold text-xl">${investor.currentBalance.toLocaleString()}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 uppercase tracking-wide">
                      TOTAL GAIN/LOSS
                    </label>
                    <p className={`font-bold text-lg ${
                      performance >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {performance >= 0 ? '+' : ''}${performance.toLocaleString()}
                      {' '}
                      ({performancePercent.toFixed(2)}%)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 uppercase tracking-wide">
                      ACCOUNT TYPE
                    </label>
                    <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                      investor.accountType === 'Pro' 
                        ? 'bg-gray-800 text-white' 
                        : 'bg-gray-600 text-white'
                    }`}>
                      {investor.accountType || 'Standard'}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 uppercase tracking-wide">
                      ACCOUNT STATUS
                    </label>
                    <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                      investor.accountStatus?.includes('Active') || !investor.accountStatus
                        ? 'bg-green-100 text-green-800'
                        : investor.accountStatus?.includes('Restricted')
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {investor.accountStatus || 'Active'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
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

      {/* Bank Account Information */}
      {investor.bankDetails && investor.bankDetails.bankName && (
        <Card title="REGISTERED BANK ACCOUNT">
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              <Building size={20} className="text-gray-600" />
              <h4 className="font-bold text-gray-900 uppercase tracking-wide">{investor.bankDetails.bankName}</h4>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium uppercase tracking-wide">
                VERIFIED
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {investor.bankDetails.accountHolderName && (
                <div>
                  <p className="text-gray-600 font-medium uppercase tracking-wide">ACCOUNT HOLDER</p>
                  <p className="font-medium text-gray-900">{investor.bankDetails.accountHolderName}</p>
                </div>
              )}
              {investor.bankDetails.accountNumber && (
                <div>
                  <p className="text-gray-600 font-medium uppercase tracking-wide">ACCOUNT NUMBER</p>
                  <p className="font-medium text-gray-900">***{investor.bankDetails.accountNumber.slice(-4)}</p>
                </div>
              )}
              {investor.bankDetails.swiftCode && (
                <div>
                  <p className="text-gray-600 font-medium uppercase tracking-wide">SWIFT CODE</p>
                  <p className="font-medium text-gray-900">{investor.bankDetails.swiftCode}</p>
                </div>
              )}
              {investor.bankDetails.currency && (
                <div>
                  <p className="text-gray-600 font-medium uppercase tracking-wide">CURRENCY</p>
                  <p className="font-medium text-gray-900">{investor.bankDetails.currency}</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default EditableInvestorProfile;