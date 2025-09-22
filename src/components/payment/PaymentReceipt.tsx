import React from 'react';
import { CheckCircle, Download, Mail, ArrowLeft } from 'lucide-react';

interface PaymentReceiptProps {
  paymentData: any;
  onNewPayment: () => void;
}

const PaymentReceipt: React.FC<PaymentReceiptProps> = ({ paymentData, onNewPayment }) => {
  const handleDownloadReceipt = () => {
    // Create a simple receipt content
    const receiptContent = `
PAYMENT RECEIPT
===============

Transaction ID: ${paymentData.transactionId}
Date: ${new Date(paymentData.timestamp).toLocaleString()}
Amount: ${paymentData.currency} ${paymentData.amount.toLocaleString()}
Description: ${paymentData.description}
Payment Method: **** **** **** ${paymentData.cardNumber.slice(-4)}
Cardholder: ${paymentData.cardHolderName}

Status: COMPLETED
    `;

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${paymentData.transactionId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleEmailReceipt = () => {
    const subject = `Payment Receipt - ${paymentData.transactionId}`;
    const body = `Your payment of ${paymentData.currency} ${paymentData.amount.toLocaleString()} has been processed successfully.\n\nTransaction ID: ${paymentData.transactionId}\nDate: ${new Date(paymentData.timestamp).toLocaleString()}`;
    
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        {/* Success Header */}
        <div className="px-6 py-8 text-center bg-green-50 border-b border-green-200">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-green-800 mb-2">Payment Successful!</h2>
          <p className="text-green-600">Your payment has been processed successfully.</p>
        </div>

        {/* Receipt Details */}
        <div className="p-6">
          <div className="space-y-6">
            {/* Transaction Summary */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">Transaction Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Transaction ID:</span>
                  <span className="font-mono font-semibold ml-2 block md:inline">
                    {paymentData.transactionId}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Date & Time:</span>
                  <span className="font-semibold ml-2 block md:inline">
                    {new Date(paymentData.timestamp).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-bold text-lg text-green-600 ml-2">
                    {paymentData.currency} {paymentData.amount.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <span className="font-semibold text-green-600 ml-2">COMPLETED</span>
                </div>
                <div className="md:col-span-2">
                  <span className="text-gray-600">Description:</span>
                  <span className="font-semibold ml-2 block md:inline">
                    {paymentData.description}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">Payment Method</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Card Number:</span>
                  <span className="font-mono font-semibold ml-2">
                    **** **** **** {paymentData.cardNumber.replace(/\s/g, '').slice(-4)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Cardholder:</span>
                  <span className="font-semibold ml-2">{paymentData.cardHolderName}</span>
                </div>
              </div>
            </div>

            {/* Billing Address */}
            {paymentData.billingAddress && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">Billing Address</h3>
                <div className="text-sm text-gray-700">
                  <p>{paymentData.billingAddress.street}</p>
                  <p>
                    {paymentData.billingAddress.city}, {paymentData.billingAddress.state} {paymentData.billingAddress.zipCode}
                  </p>
                  <p>{paymentData.billingAddress.country}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleDownloadReceipt}
                className="flex-1 px-4 py-3 bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors rounded-lg flex items-center justify-center"
              >
                <Download size={16} className="mr-2" />
                Download Receipt
              </button>
              <button
                onClick={handleEmailReceipt}
                className="flex-1 px-4 py-3 bg-gray-600 text-white font-medium hover:bg-gray-700 transition-colors rounded-lg flex items-center justify-center"
              >
                <Mail size={16} className="mr-2" />
                Email Receipt
              </button>
            </div>

            <div className="text-center pt-4 border-t border-gray-200">
              <button
                onClick={onNewPayment}
                className="px-6 py-2 text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center mx-auto"
              >
                <ArrowLeft size={16} className="mr-2" />
                Make Another Payment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentReceipt;