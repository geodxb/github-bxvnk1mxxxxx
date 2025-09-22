import React from 'react';
import type { PaymentData } from './types';

interface PaymentReceiptProps {
  paymentData: PaymentData & {
    description: string;
    reference?: string;
    transactionId: string;
    timestamp: string;
  };
  onNewPayment: () => void;
  className?: string;
}

export const PaymentReceipt: React.FC<PaymentReceiptProps> = ({
  paymentData,
  onNewPayment,
  className = ''
}) => {
  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatCardNumber = (number: string) => {
    const cleanNumber = number.replace(/\s/g, '');
    return `**** **** **** ${cleanNumber.slice(-4)}`;
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className={`max-w-md mx-auto bg-white rounded-2xl shadow-2xl p-8 ${className}`}>
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 text-green-600 mb-4">
          ✓
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful</h1>
        <p className="text-gray-600">Your payment has been processed successfully</p>
      </div>

      {/* Receipt Details */}
      <div className="space-y-6">
        {/* Transaction ID */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Transaction ID</p>
            <p className="font-mono text-lg font-semibold text-black">{paymentData.transactionId}</p>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Payment Summary</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Description:</span>
              <span className="font-medium text-black text-right max-w-48 break-words">
                {paymentData.description}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Amount:</span>
              <span className="font-bold text-black text-xl">
                {formatAmount(paymentData.amount || 0, paymentData.currency || 'USD')}
              </span>
            </div>
            
            {paymentData.reference && (
              <div className="flex justify-between">
                <span className="text-gray-600">Reference:</span>
                <span className="font-medium text-black">{paymentData.reference}</span>
              </div>
            )}
            
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Method:</span>
              <span className="font-medium text-black">{formatCardNumber(paymentData.number)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Date & Time:</span>
              <span className="font-medium text-black text-right text-sm">
                {formatDate(paymentData.timestamp)}
              </span>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-green-800 font-medium">Status:</span>
            <span className="text-green-800 font-bold">COMPLETED</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 space-y-3">
        <button
          onClick={onNewPayment}
          className="w-full py-3 px-6 rounded-lg font-semibold text-white bg-black hover:bg-gray-800 transition-all duration-200"
        >
          Make Another Payment
        </button>
        
        <button
          onClick={() => window.print()}
          className="w-full py-3 px-6 rounded-lg font-semibold text-black bg-gray-100 hover:bg-gray-200 transition-all duration-200"
        >
          Print Receipt
        </button>
      </div>

      {/* Footer */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          Keep this receipt for your records
        </p>
      </div>
    </div>
  );
};