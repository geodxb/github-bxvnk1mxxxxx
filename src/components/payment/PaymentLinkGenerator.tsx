import React, { useState } from 'react';
import { PaymentDetails } from './types';
import { Link as LinkIcon, Copy, Send, Globe } from 'lucide-react';

interface PaymentLinkGeneratorProps {
  paymentDetails: PaymentDetails;
  onLinkGenerated?: (link: string) => void;
}

const PaymentLinkGenerator: React.FC<PaymentLinkGeneratorProps> = ({ 
  paymentDetails, 
  onLinkGenerated 
}) => {
  const [generatedLink, setGeneratedLink] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const generatePaymentLink = async () => {
    setIsGenerating(true);
    
    try {
      // Simulate payment link generation
      const paymentId = `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const encodedDetails = btoa(JSON.stringify(paymentDetails));
      const link = `${window.location.origin}/payment?id=${paymentId}&data=${encodedDetails}`;
      
      setGeneratedLink(link);
      
      if (onLinkGenerated) {
        onLinkGenerated(link);
      }
    } catch (error) {
      console.error('Error generating payment link:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Generate Payment Link</h2>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Payment Summary */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">Payment Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Amount:</span>
                <span className="font-semibold ml-2">{paymentDetails.amount} {paymentDetails.currency}</span>
              </div>
              <div>
                <span className="text-gray-600">Currency:</span>
                <span className="font-semibold ml-2">{paymentDetails.currency}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-600">Description:</span>
                <span className="font-semibold ml-2">{paymentDetails.description}</span>
              </div>
              {paymentDetails.recipientName && (
                <div>
                  <span className="text-gray-600">Recipient:</span>
                  <span className="font-semibold ml-2">{paymentDetails.recipientName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Generate Link Button */}
          {!generatedLink && (
            <button
              onClick={generatePaymentLink}
              disabled={isGenerating}
              className="w-full px-6 py-3 bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors rounded-lg disabled:opacity-50 flex items-center justify-center"
            >
              {isGenerating ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Generating Link...
                </div>
              ) : (
                <>
                  <LinkIcon size={16} className="mr-2" />
                  Generate Payment Link
                </>
              )}
            </button>
          )}

          {/* Generated Link Display */}
          {generatedLink && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Globe size={16} className="text-green-600" />
                  <span className="font-semibold text-green-800">Payment Link Generated</span>
                </div>
                <div className="bg-white p-3 border border-green-300 rounded font-mono text-sm break-all">
                  {generatedLink}
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={copyToClipboard}
                  className="flex-1 px-4 py-2 bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors rounded-lg flex items-center justify-center"
                >
                  <Copy size={16} className="mr-2" />
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
                <button
                  onClick={() => window.open(generatedLink, '_blank')}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors rounded-lg flex items-center justify-center"
                >
                  <Send size={16} className="mr-2" />
                  Test Payment
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentLinkGenerator;