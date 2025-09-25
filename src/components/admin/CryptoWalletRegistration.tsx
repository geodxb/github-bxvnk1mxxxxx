import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { FirestoreService } from '../../services/firestoreService';
import { useAuth } from '../../contexts/AuthContext';
import { Investor, CryptoWallet } from '../../types/user';
import {
  Wallet,
  Plus,
  Edit3,
  Trash2,
  CheckCircle,
  AlertTriangle,
  QrCode,
  Network,
  Coins,
  X,
  Eye,
  Download,
  Shield,
  Clock,
  Save
} from 'lucide-react';

interface CryptoWalletRegistrationProps {
  investor: Investor;
  onUpdate: () => void;
}

const CryptoWalletRegistration = ({ investor, onUpdate }: CryptoWalletRegistrationProps) => {
  const { user } = useAuth();
  const [cryptoWallets, setCryptoWallets] = useState<CryptoWallet[]>(investor.cryptoWallets || []);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingWallet, setEditingWallet] = useState<CryptoWallet | null>(null);
  const [walletFormData, setWalletFormData] = useState({
    walletAddress: '',
    networkType: '',
    coinType: '',
    qrCodeData: '',
    isPrimary: false,
  });
  const [qrCodeFile, setQrCodeFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    setCryptoWallets(investor.cryptoWallets || []);
  }, [investor.cryptoWallets]);

  const networkTypes = ['Bitcoin', 'Ethereum', 'Polygon', 'Solana', 'Binance Smart Chain'];
  const coinTypes: { [key: string]: string[] } = {
    'Bitcoin': ['BTC'],
    'Ethereum': ['ETH', 'USDT', 'USDC'],
    'Polygon': ['MATIC', 'USDT', 'USDC'],
    'Solana': ['SOL', 'USDT', 'USDC'],
    'Binance Smart Chain': ['BNB', 'USDT', 'BUSD'],
  };

  const handleWalletFormChange = (fieldName: string, value: string | boolean) => {
    setWalletFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleQrCodeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file for the QR code.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) { // Max 2MB
      setError('QR code image size must be less than 2MB.');
      return;
    }

    setQrCodeFile(file);
    setError('');

    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      setWalletFormData(prev => ({ ...prev, qrCodeData: base64Data }));
    } catch (err) {
      console.error('Error converting QR code to base64:', err);
      setError('Failed to process QR code image.');
    }
  };

  const validateWalletAddress = (address: string, network: string, coin: string): boolean => {
    // Basic validation, can be expanded with more robust regex or external libraries
    if (!address) return false;

    switch (network) {
      case 'Bitcoin':
        return /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$/.test(address);
      case 'Ethereum':
      case 'Polygon':
      case 'Binance Smart Chain':
        return /^0x[a-fA-F0-9]{40}$/.test(address);
      case 'Solana':
        return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
      default:
        return address.length > 10; // Generic length check for unknown networks
    }
  };

  const validateForm = () => {
    if (!walletFormData.walletAddress.trim()) {
      setError('Wallet address is required.');
      return false;
    }
    if (!walletFormData.networkType) {
      setError('Network type is required.');
      return false;
    }
    if (!walletFormData.coinType) {
      setError('Coin type is required.');
      return false;
    }
    if (!validateWalletAddress(walletFormData.walletAddress, walletFormData.networkType, walletFormData.coinType)) {
      setError('Invalid wallet address for the selected network/coin type.');
      return false;
    }
    setError('');
    return true;
  };

  const handleSaveCryptoWallet = async () => {
    if (!validateForm() || !user) return;

    setIsLoading(true);
    try {
      const newWalletData: Omit<CryptoWallet, 'id' | 'createdAt' | 'updatedAt' | 'verificationStatus' | 'rejectionReason'> = {
        walletAddress: walletFormData.walletAddress.trim(),
        networkType: walletFormData.networkType,
        coinType: walletFormData.coinType,
        qrCodeData: walletFormData.qrCodeData,
        isPrimary: walletFormData.isPrimary,
      };

      if (editingWallet) {
        await FirestoreService.updateCryptoWallet(
          investor.id,
          editingWallet.id,
          newWalletData,
          user.id,
          user.name
        );
      } else {
        await FirestoreService.addCryptoWallet(
          investor.id,
          newWalletData,
          user.id,
          user.name
        );
      }

      setIsSuccess(true);
      resetForm();
      onUpdate(); // Trigger refetch of investor data
      setTimeout(() => setIsSuccess(false), 2000);
    } catch (err: any) {
      console.error('Error saving crypto wallet:', err);
      setError(\`Failed to save crypto wallet: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditWallet = (wallet: CryptoWallet) => {
    setEditingWallet(wallet);
    setWalletFormData({
      walletAddress: wallet.walletAddress,
      networkType: wallet.networkType,
      coinType: wallet.coinType,
      qrCodeData: wallet.qrCodeData || '',
      isPrimary: wallet.isPrimary,
    });
    setQrCodeFile(null); // Clear file input for edit
    setShowAddModal(true);
  };

  const handleSetPrimary = async (walletId: string) => {
    if (!user) return;
    try {
      const updatedWallets = cryptoWallets.map(wallet => ({
        ...wallet,
        isPrimary: wallet.id === walletId
      }));
      await FirestoreService.updateInvestor(investor.id, { cryptoWallets: updatedWallets });
      onUpdate();
    } catch (err) {
      console.error('Error setting primary wallet:', err);
      setError('Failed to set primary wallet.');
    }
  };

  const handleRemoveWallet = async (walletId: string, walletAddress: string) => {
    if (!user || !confirm(`Are you sure you want to request deletion of wallet ${walletAddress}? This requires Governor approval.`)) return;
    try {
      await FirestoreService.deleteCryptoWallet(investor.id, walletId, user.id, user.name);
      onUpdate();
    } catch (err) {
      console.error('Error requesting wallet deletion:', err);
      setError('Failed to request wallet deletion.');
    }
  };

  const resetForm = () => {
    setEditingWallet(null);
    setWalletFormData({
      walletAddress: '',
      networkType: '',
      coinType: '',
      qrCodeData: '',
      isPrimary: false,
    });
    setQrCodeFile(null);
    setError('');
  };

  return (
    <div className="space-y-6">
      <Card title="REGISTERED CRYPTOCURRENCY WALLETS">
        <div className="space-y-4">
          {cryptoWallets.length > 0 ? (
            cryptoWallets.map((wallet) => (
              <div key={wallet.id} className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <Wallet size={20} className="text-gray-600" />
                      <h4 className="font-bold text-gray-900 uppercase tracking-wide">{wallet.coinType} ({wallet.networkType})</h4>
                      {wallet.isPrimary && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium uppercase tracking-wide">
                          PRIMARY
                        </span>
                      )}
                      <span className={`px-2 py-1 text-xs rounded-full font-medium uppercase tracking-wide ${
                        wallet.verificationStatus === 'approved' ? 'bg-green-100 text-green-800' :
                        wallet.verificationStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {wallet.verificationStatus.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 font-medium uppercase tracking-wide">WALLET ADDRESS</p>
                        <p className="font-medium text-gray-900 break-all">{wallet.walletAddress}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 font-medium uppercase tracking-wide">NETWORK TYPE</p>
                        <p className="font-medium text-gray-900">{wallet.networkType}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 font-medium uppercase tracking-wide">COIN TYPE</p>
                        <p className="font-medium text-gray-900">{wallet.coinType}</p>
                      </div>
                      {wallet.rejectionReason && (
                        <div>
                          <p className="text-gray-600 font-medium uppercase tracking-wide">REJECTION REASON</p>
                          <p className="font-medium text-red-600">{wallet.rejectionReason}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2">
                    {wallet.qrCodeData && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(wallet.qrCodeData, '_blank')}
                      >
                        <QrCode size={14} className="mr-1" />
                        View QR
                      </Button>
                    )}
                    {wallet.verificationStatus === 'approved' && !wallet.isPrimary && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleSetPrimary(wallet.id)}
                      >
                        Set Primary
                      </Button>
                    )}
                    {wallet.verificationStatus !== 'pending_deletion' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditWallet(wallet)}
                      >
                        <Edit3 size={14} className="mr-1" />
                        Edit
                      </Button>
                    )}
                    {wallet.verificationStatus !== 'pending_deletion' && (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleRemoveWallet(wallet.id, wallet.walletAddress)}
                      >
                        <Trash2 size={14} className="mr-1" />
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2 uppercase tracking-wide">
                NO CRYPTOCURRENCY WALLETS REGISTERED
              </h3>
              <p className="text-gray-500 mb-6 uppercase tracking-wide text-sm">
                Add crypto wallet information for this investor
              </p>
            </div>
          )}

          <div className="pt-4 border-t border-gray-200">
            <Button
              variant="primary"
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="w-full md:w-auto"
            >
              <Plus size={18} className="mr-2" />
              {editingWallet ? 'Edit Crypto Wallet' : 'Add Crypto Wallet'}
            </Button>
          </div>
        </div>
      </Card>

      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title={editingWallet ? "EDIT CRYPTOCURRENCY WALLET" : "ADD CRYPTOCURRENCY WALLET"}
        size="lg"
      >
        {!isSuccess ? (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <Shield size={20} className="text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800 uppercase tracking-wide">GOVERNOR VERIFICATION REQUIRED</h4>
                  <p className="text-blue-700 text-sm mt-1 uppercase tracking-wide">
                    All new or updated crypto wallets require Governor approval before they can be used for withdrawals.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                <Wallet size={16} className="inline mr-1" />
                WALLET ADDRESS *
              </label>
              <input
                type="text"
                value={walletFormData.walletAddress}
                onChange={(e) => handleWalletFormChange('walletAddress', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
                placeholder="Enter wallet address"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                <Network size={16} className="inline mr-1" />
                NETWORK TYPE *
              </label>
              <select
                value={walletFormData.networkType}
                onChange={(e) => {
                  handleWalletFormChange('networkType', e.target.value);
                  setWalletFormData(prev => ({ ...prev, coinType: '' })); // Reset coin type on network change
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
                required
              >
                <option value="">Select network...</option>
                {networkTypes.map(network => (
                  <option key={network} value={network}>{network}</option>
                ))}
              </select>
            </div>

            {walletFormData.networkType && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                  <Coins size={16} className="inline mr-1" />
                  COIN/TOKEN TYPE *
                </label>
                <select
                  value={walletFormData.coinType}
                  onChange={(e) => handleWalletFormChange('coinType', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 font-medium"
                  required
                >
                  <option value="">Select coin...</option>
                  {coinTypes[walletFormData.networkType]?.map(coin => (
                    <option key={coin} value={coin}>{coin}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                <QrCode size={16} className="inline mr-1" />
                QR CODE (OPTIONAL)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleQrCodeUpload}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 bg-white"
              />
              <p className="text-xs text-gray-600 mt-1 uppercase tracking-wide">
                Upload an image of the wallet's QR code (Max 2MB)
              </p>
              {walletFormData.qrCodeData && (
                <div className="mt-3 flex items-center justify-between bg-gray-100 p-3 rounded border border-gray-300">
                  <div className="flex items-center space-x-3">
                    <QrCode size={16} className="text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">QR Code Uploaded</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => window.open(walletFormData.qrCodeData, '_blank')}
                      className="p-1 text-gray-600 hover:text-gray-800"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setWalletFormData(prev => ({ ...prev, qrCodeData: '' }))}
                      className="p-1 text-red-600 hover:text-red-800"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={walletFormData.isPrimary}
                onChange={(e) => handleWalletFormChange('isPrimary', e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-gray-700 uppercase tracking-wide">
                SET AS PRIMARY WALLET
              </span>
            </label>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle size={16} />
                  <span className="font-medium uppercase tracking-wide">{error}</span>
                </div>
              </div>
            )}

            <div className="flex space-x-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                disabled={isLoading}
                className="flex-1"
              >
                CANCEL
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveCryptoWallet}
                isLoading={isLoading}
                disabled={isLoading || !walletFormData.networkType || !walletFormData.coinType}
                className="flex-1"
              >
                <Save size={16} className="mr-2" />
                {isLoading ? 'SAVING...' : editingWallet ? 'UPDATE WALLET' : 'ADD WALLET'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wide">
              WALLET {editingWallet ? 'UPDATED' : 'ADDED'} SUCCESSFULLY
            </h3>
            <p className="text-gray-700 mb-6 font-medium uppercase tracking-wide">
              The crypto wallet has been {editingWallet ? 'updated' : 'registered'} for {investor.name} and is awaiting Governor approval.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CryptoWalletRegistration;
```