import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { EnhancedMessageService } from '../../services/enhancedMessageService';
import { 
  CreditCard, 
  Send, 
  Copy, 
  CheckCircle, 
  DollarSign,
  MessageSquare,
  Link as LinkIcon,
  AlertTriangle,
  Globe,
  Clock
} from 'lucide-react';

// Import your payment components
import { 
  PaymentDetailsForm, 
  PaymentLinkGenerator, 
  PaymentScreen, 
  PaymentReceipt 
} from '../payment';

interface PaymentDetails {
  amount: number;
  currency: string;
  description: string;
  recipientName?: string;
  recipientEmail?: string;
}

interface PaymentLinkData {
  id: string;
  amount: number;
  currency: string;
  description: string;
  link: string;
  createdAt: Date;
  status: 'pending' | 'paid' | 'expired';
  recipientName?: string;
  recipientEmail?: string;
}

const PaymentLinkManager = () => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<'form' | 'generated' | 'sent'>('form');
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [generatedLink, setGeneratedLink] = useState<string>('');
  const [paymentLinks, setPaymentLinks] = useState<PaymentLinkData[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);
  const [showRecipientModal, setShowRecipientModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'USD',
    description: '',
    recipientName: '',
    recipientEmail: ''
  });

  const currencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
    { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' }
  ];

  const handleGeneratePaymentLink = async () => {
    if (!formData.amount || !formData.description.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      // Create payment details object
      const details: PaymentDetails = {
        amount: amount,
        currency: formData.currency,
        description: formData.description,
        recipientName: formData.recipientName || undefined,
        recipientEmail: formData.recipientEmail || undefined
      };

      setPaymentDetails(details);

      // Generate payment link (simulate your payment processor)
      const paymentId = `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const encodedDetails = btoa(JSON.stringify(details));
      const paymentLink = `${window.location.origin}/payment?id=${paymentId}&data=${encodedDetails}`;

      setGeneratedLink(paymentLink);

      // Store payment link data
      const linkData: PaymentLinkData = {
        id: paymentId,
        amount: details.amount,
        currency: details.currency,
        description: details.description,
        link: paymentLink,
        createdAt: new Date(),
        status: 'pending',
        recipientName: details.recipientName,
        recipientEmail: details.recipientEmail
      };

      setPaymentLinks(prev => [linkData, ...prev]);
      setCurrentStep('generated');
    } catch (error) {
      console.error('Error generating payment link:', error);
      setError('Failed to generate payment link. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      // Show success feedback
      const button = document.getElementById('copy-button');
      if (button) {
        button.textContent = 'COPIED!';
        setTimeout(() => {
          button.textContent = 'COPY LINK';
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleSendViaChat = async () => {
    if (!generatedLink || !paymentDetails || !user) return;

    setIsSending(true);
    try {
      // Create message content with payment link
      const messageContent = `💳 PAYMENT REQUEST\n\nAmount: ${paymentDetails.currency} ${paymentDetails.amount.toLocaleString()}\nReason: ${paymentDetails.description}\n\nPayment Link: ${generatedLink}\n\nClick the link above to complete the payment securely.`;

      // Get or create conversation with admin team
      const conversationId = await EnhancedMessageService.getOrCreateEnhancedConversation(
        user.id,
        user.name,
        'governor',
        undefined, // Let it auto-select admin
        undefined,
        undefined,
        'PAYMENT REQUEST'
      );

      // Send message with payment link
      await EnhancedMessageService.sendEnhancedMessage(
        conversationId,
        user.id,
        user.name,
        'governor',
        messageContent,
        'high',
        'PAYMENT REQUEST',
        undefined,
        false,
        undefined,
        'text'
      );

      setCurrentStep('sent');
    } catch (error) {
      console.error('Error sending payment link via chat:', error);
      setError('Failed to send payment link via chat. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleReset = () => {
    setCurrentStep('form');
    setPaymentDetails(null);
    setGeneratedLink('');
    setFormData({
      amount: '',
      currency: 'USD',
      description: '',
      recipientName: '',
      recipientEmail: ''
    });
    setError('');
  };

  const renderPaymentForm = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-300 p-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gray-200 border border-gray-400 rounded-lg flex items-center justify-center">
            <CreditCard size={24} className="text-gray-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">PAYMENT LINK GENERATOR</h1>
            <p className="text-gray-600 uppercase tracking-wide text-sm font-medium">CREATE SECURE PAYMENT LINKS FOR CREDIT/DEBIT CARD PROCESSING</p>
          </div>
        </div>
      </div>

      {/* Payment Form */}
      <div className="bg-white border border-gray-300">
        <div className="px-6 py-4 border-b border-gray-300 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">PAYMENT REQUEST DETAILS</h3>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            {/* Amount and Currency */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  PAYMENT AMOUNT <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <DollarSign size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full pl-9 pr-4 py-3 border border-gray-300 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 font-bold text-lg"
                    placeholder="0.00"
                    step="0.01"
                    min="0.01"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  CURRENCY <span className="text-red-600">*</span>
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 font-bold"
                >
                  {currencies.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.code} - {currency.name} ({currency.symbol})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Payment Description */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                PAYMENT REASON/DESCRIPTION <span className="text-red-600">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 font-medium"
                rows={4}
                placeholder="ENTER DETAILED PAYMENT REASON (E.G., COMMISSION PAYMENT, BONUS, REFUND, ETC.)"
                required
              />
            </div>

            {/* Optional Recipient Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  RECIPIENT NAME (OPTIONAL)
                </label>
                <input
                  type="text"
                  value={formData.recipientName}
                  onChange={(e) => setFormData(prev => ({ ...prev, recipientName: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 font-medium"
                  placeholder="ENTER RECIPIENT NAME"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  RECIPIENT EMAIL (OPTIONAL)
                </label>
                <input
                  type="email"
                  value={formData.recipientEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, recipientEmail: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 font-medium"
                  placeholder="ENTER RECIPIENT EMAIL"
                />
              </div>
            </div>

            {/* Preview */}
            {formData.amount && formData.description && (
              <div className="bg-gray-50 p-6 border border-gray-300">
                <h4 className="font-bold text-gray-900 mb-4 uppercase tracking-wide">PAYMENT REQUEST PREVIEW</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 font-bold uppercase tracking-wide">AMOUNT</p>
                    <p className="text-gray-900 font-bold text-lg">
                      {currencies.find(c => c.code === formData.currency)?.symbol}{parseFloat(formData.amount || '0').toLocaleString()} {formData.currency}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-bold uppercase tracking-wide">DESCRIPTION</p>
                    <p className="text-gray-900 font-medium">{formData.description}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-bold uppercase tracking-wide">RECIPIENT</p>
                    <p className="text-gray-900 font-medium">
                      {formData.recipientName || 'Not specified'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle size={16} />
                  <span className="font-medium uppercase tracking-wide">{error}</span>
                </div>
              </div>
            )}

            {/* Generate Button */}
            <div className="flex justify-end">
              <button
                onClick={handleGeneratePaymentLink}
                disabled={!formData.amount || !formData.description.trim() || isGenerating}
                className="px-6 py-3 bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide border border-blue-700"
              >
                {isGenerating ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    GENERATING LINK...
                  </div>
                ) : (
                  <>
                    <LinkIcon size={16} className="mr-2 inline" />
                    GENERATE PAYMENT LINK
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGeneratedLink = () => (
    <div className="space-y-6">
      {/* Success Header */}
      <div className="bg-white border border-gray-300 p-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-green-100 border border-green-300 rounded-lg flex items-center justify-center">
            <CheckCircle size={24} className="text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">PAYMENT LINK GENERATED</h1>
            <p className="text-gray-600 uppercase tracking-wide text-sm font-medium">SECURE PAYMENT LINK READY FOR DISTRIBUTION</p>
          </div>
        </div>
      </div>

      {/* Payment Details Summary */}
      <div className="bg-white border border-gray-300">
        <div className="px-6 py-4 border-b border-gray-300 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">PAYMENT REQUEST SUMMARY</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 p-4 border border-gray-200">
              <p className="text-gray-600 font-bold uppercase tracking-wide mb-2">AMOUNT</p>
              <p className="text-gray-900 font-bold text-2xl">
                {currencies.find(c => c.code === paymentDetails?.currency)?.symbol}{paymentDetails?.amount.toLocaleString()} {paymentDetails?.currency}
              </p>
            </div>
            <div className="bg-gray-50 p-4 border border-gray-200">
              <p className="text-gray-600 font-bold uppercase tracking-wide mb-2">DESCRIPTION</p>
              <p className="text-gray-900 font-medium">{paymentDetails?.description}</p>
            </div>
            <div className="bg-gray-50 p-4 border border-gray-200">
              <p className="text-gray-600 font-bold uppercase tracking-wide mb-2">RECIPIENT</p>
              <p className="text-gray-900 font-medium">
                {paymentDetails?.recipientName || 'Not specified'}
              </p>
              {paymentDetails?.recipientEmail && (
                <p className="text-gray-600 text-sm">{paymentDetails.recipientEmail}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Generated Link Display */}
      <div className="bg-white border border-gray-300">
        <div className="px-6 py-4 border-b border-gray-300 bg-blue-50">
          <h3 className="text-lg font-bold text-blue-900 uppercase tracking-wide">GENERATED PAYMENT LINK</h3>
        </div>
        <div className="p-6">
          <div className="bg-gray-50 p-4 border border-gray-300 mb-6">
            <div className="flex items-center space-x-3 mb-3">
              <Globe size={16} className="text-gray-600" />
              <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">SECURE PAYMENT URL</span>
            </div>
            <div className="bg-white p-3 border border-gray-300 font-mono text-sm break-all">
              {generatedLink}
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              id="copy-button"
              onClick={handleCopyLink}
              className="flex-1 px-4 py-3 bg-gray-900 text-white font-bold hover:bg-gray-800 transition-colors uppercase tracking-wide border border-gray-700"
            >
              <Copy size={16} className="mr-2 inline" />
              COPY LINK
            </button>
            <button
              onClick={handleSendViaChat}
              disabled={isSending}
              className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 uppercase tracking-wide border border-blue-700"
            >
              {isSending ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  SENDING VIA CHAT...
                </div>
              ) : (
                <>
                  <MessageSquare size={16} className="mr-2 inline" />
                  SEND VIA CHAT
                </>
              )}
            </button>
          </div>

          <div className="mt-4 bg-blue-50 border border-blue-200 p-4">
            <p className="text-blue-800 text-sm font-medium uppercase tracking-wide">
              <strong>SECURITY NOTE:</strong> This payment link is secure and can be safely shared. 
              The recipient will be directed to a secure payment gateway to complete the transaction.
            </p>
          </div>
        </div>
      </div>

      {/* Reset Button */}
      <div className="flex justify-center">
        <button
          onClick={handleReset}
          className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors uppercase tracking-wide"
        >
          CREATE ANOTHER PAYMENT LINK
        </button>
      </div>
    </div>
  );

  const renderSentConfirmation = () => (
    <div className="space-y-6">
      {/* Success Header */}
      <div className="bg-white border border-gray-300 p-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-green-100 border border-green-300 rounded-lg flex items-center justify-center">
            <Send size={24} className="text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">PAYMENT LINK SENT</h1>
            <p className="text-gray-600 uppercase tracking-wide text-sm font-medium">PAYMENT REQUEST SUCCESSFULLY DISTRIBUTED VIA CHAT</p>
          </div>
        </div>
      </div>

      {/* Confirmation Details */}
      <div className="bg-white border border-gray-300">
        <div className="px-6 py-4 border-b border-gray-300 bg-green-50">
          <h3 className="text-lg font-bold text-green-900 uppercase tracking-wide">DISTRIBUTION CONFIRMATION</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="bg-green-50 p-4 border border-green-200">
              <div className="flex items-start space-x-3">
                <CheckCircle size={20} className="text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-bold text-green-800 uppercase tracking-wide">PAYMENT LINK SENT SUCCESSFULLY</h4>
                  <p className="text-green-700 text-sm mt-1 uppercase tracking-wide">
                    The payment request for {currencies.find(c => c.code === paymentDetails?.currency)?.symbol}{paymentDetails?.amount.toLocaleString()} {paymentDetails?.currency} 
                    has been sent via the chat system.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 border border-gray-200">
              <h4 className="font-bold text-gray-900 mb-3 uppercase tracking-wide">NEXT STEPS</h4>
              <ul className="text-gray-700 text-sm space-y-2 font-medium">
                <li className="uppercase tracking-wide">• The recipient will receive the payment link via chat</li>
                <li className="uppercase tracking-wide">• They can click the link to access the secure payment gateway</li>
                <li className="uppercase tracking-wide">• Payment status will be tracked automatically</li>
                <li className="uppercase tracking-wide">• You will receive notifications about payment completion</li>
              </ul>
            </div>
          </div>

          <div className="flex space-x-4 mt-6">
            <button
              onClick={() => window.open('/governor/messages', '_blank')}
              className="flex-1 px-4 py-3 bg-gray-900 text-white font-bold hover:bg-gray-800 transition-colors uppercase tracking-wide border border-gray-700"
            >
              <MessageSquare size={16} className="mr-2 inline" />
              VIEW CHAT
            </button>
            <button
              onClick={handleReset}
              className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors uppercase tracking-wide border border-blue-700"
            >
              CREATE NEW PAYMENT LINK
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Render based on current step
  switch (currentStep) {
    case 'form':
      return renderPaymentForm();
    case 'generated':
      return renderGeneratedLink();
    case 'sent':
      return renderSentConfirmation();
    default:
      return renderPaymentForm();
  }
};

export default PaymentLinkManager;