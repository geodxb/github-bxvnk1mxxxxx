import React, { useState } from 'react';
import type { PaymentDetails } from './types';

interface PaymentLinkGeneratorProps {
  paymentDetails: PaymentDetails;
  onProceedDirectly: () => void;
  onBackToDetails: () => void;
  className?: string;
}

export const PaymentLinkGenerator: React.FC<PaymentLinkGeneratorProps> = ({
  paymentDetails,
  onProceedDirectly,
  onBackToDetails,
  className = ''
}) => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isLinkSent, setIsLinkSent] = useState(false);
  const [sendMethod, setSendMethod] = useState<'email' | 'sms' | 'copy'>('email');
  const [isLoading, setIsLoading] = useState(false);

  // Generate payment link with encoded details
  const generatePaymentLink = (): string => {
    const encodedDetails = btoa(JSON.stringify(paymentDetails));
    return `${window.location.origin}${window.location.pathname}?payment=${encodedDetails}`;
  };

  const paymentLink = generatePaymentLink();

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const handleSendLink = async () => {
    setIsLoading(true);
    
    try {
      // Simulate sending link
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (sendMethod === 'email') {
        console.log(`Sending payment link to email: ${email}`);
        console.log(`Payment link: ${paymentLink}`);
      } else if (sendMethod === 'sms') {
        console.log(`Sending payment link to phone: ${phone}`);
        console.log(`Payment link: ${paymentLink}`);
      }
      
      setIsLinkSent(true);
    } catch (error) {
      console.error('Error sending payment link:', error);
      alert('Failed to send payment link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(paymentLink);
      alert('Payment link copied to clipboard');
    } catch (error) {
      console.error('Failed to copy link:', error);
      alert('Failed to copy link. Please try again.');
    }
  };

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    return /^\+?[\d\s-()]{10,}$/.test(phone.trim());
  };

  const isFormValid = (): boolean => {
    if (sendMethod === 'email') {
      return validateEmail(email);
    } else if (sendMethod === 'sms') {
      return validatePhone(phone);
    }
    return true; // For copy method
  };

  if (isLinkSent) {
    return (
      <div className={`max-w-md mx-auto bg-white rounded-2xl shadow-2xl p-8 ${className}`}>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 text-green-600 mb-4 text-2xl">
            ✓
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Link Sent</h1>
          <p className="text-gray-600">
            The payment link has been sent successfully
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Payment Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium">{formatAmount(paymentDetails.amount, paymentDetails.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Description:</span>
                <span className="font-medium text-right max-w-48 break-words">{paymentDetails.description}</span>
              </div>
              {paymentDetails.reference && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Reference:</span>
                  <span className="font-medium">{paymentDetails.reference}</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={onProceedDirectly}
              className="w-full py-3 px-6 rounded-lg font-semibold text-white bg-black hover:bg-gray-800 transition-all duration-200"
            >
              Proceed to Payment
            </button>
            
            <button
              onClick={onBackToDetails}
              className="w-full py-3 px-6 rounded-lg font-semibold text-black bg-gray-100 hover:bg-gray-200 transition-all duration-200"
            >
              Back to Details
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-md mx-auto bg-white rounded-2xl shadow-2xl p-8 ${className}`}>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Send Payment Link</h1>
        <p className="text-gray-600">Share the payment link or proceed directly</p>
      </div>

      {/* Payment Summary */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">Payment Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Amount:</span>
            <span className="font-bold text-black text-lg">
              {formatAmount(paymentDetails.amount, paymentDetails.currency)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Description:</span>
            <span className="font-medium text-right max-w-48 break-words">{paymentDetails.description}</span>
          </div>
          {paymentDetails.reference && (
            <div className="flex justify-between">
              <span className="text-gray-600">Reference:</span>
              <span className="font-medium">{paymentDetails.reference}</span>
            </div>
          )}
        </div>
      </div>

      {/* Send Method Selection */}
      <div className="space-y-4 mb-6">
        <h3 className="font-semibold text-gray-900">Send Payment Link</h3>
        
        <div className="space-y-3">
          {/* Email Option */}
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="radio"
              name="sendMethod"
              value="email"
              checked={sendMethod === 'email'}
              onChange={(e) => setSendMethod(e.target.value as 'email')}
              className="w-4 h-4"
            />
            <span className="font-medium">Send via Email</span>
          </label>
          
          {sendMethod === 'email' && (
            <input
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-black focus:ring-4 focus:ring-gray-100 transition-all duration-200"
            />
          )}

          {/* SMS Option */}
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="radio"
              name="sendMethod"
              value="sms"
              checked={sendMethod === 'sms'}
              onChange={(e) => setSendMethod(e.target.value as 'sms')}
              className="w-4 h-4"
            />
            <span className="font-medium">Send via SMS</span>
          </label>
          
          {sendMethod === 'sms' && (
            <input
              type="tel"
              placeholder="Enter phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-black focus:ring-4 focus:ring-gray-100 transition-all duration-200"
            />
          )}

          {/* Copy Link Option */}
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="radio"
              name="sendMethod"
              value="copy"
              checked={sendMethod === 'copy'}
              onChange={(e) => setSendMethod(e.target.value as 'copy')}
              className="w-4 h-4"
            />
            <span className="font-medium">Copy Link</span>
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {sendMethod === 'copy' ? (
          <button
            onClick={handleCopyLink}
            className="w-full py-3 px-6 rounded-lg font-semibold text-white bg-black hover:bg-gray-800 transition-all duration-200"
          >
            Copy Payment Link
          </button>
        ) : (
          <button
            onClick={handleSendLink}
            disabled={!isFormValid() || isLoading}
            className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200 ${
              !isFormValid() || isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-black hover:bg-gray-800'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Sending...
              </div>
            ) : (
              `Send Payment Link`
            )}
          </button>
        )}

        <button
          onClick={onProceedDirectly}
          className="w-full py-3 px-6 rounded-lg font-semibold text-black bg-gray-100 hover:bg-gray-200 transition-all duration-200"
        >
          Proceed Directly to Payment
        </button>

        <button
          onClick={onBackToDetails}
          className="w-full py-3 px-6 rounded-lg font-semibold text-gray-600 hover:text-black transition-all duration-200"
        >
          Back to Payment Details
        </button>
      </div>

      {/* Security Notice */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          Payment links are secure and expire after 24 hours
        </p>
      </div>
    </div>
  );
};