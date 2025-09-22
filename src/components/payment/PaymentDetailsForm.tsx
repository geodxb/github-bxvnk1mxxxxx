import React, { useState } from 'react';

interface PaymentDetails {
  description: string;
  amount: number;
  currency: string;
  reference?: string;
}

interface PaymentDetailsFormProps {
  onSubmit: (details: PaymentDetails) => void;
  className?: string;
}

export const PaymentDetailsForm: React.FC<PaymentDetailsFormProps> = ({
  onSubmit,
  className = ''
}) => {
  const [details, setDetails] = useState<PaymentDetails>({
    description: '',
    amount: 0,
    currency: 'USD',
    reference: ''
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const handleInputChange = (field: keyof PaymentDetails) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const value = field === 'amount' ? parseFloat(e.target.value) || 0 : e.target.value;
    
    setDetails(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!details.description.trim()) {
      newErrors.description = 'Payment description is required';
    }

    if (details.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (details.amount > 999999.99) {
      newErrors.amount = 'Amount cannot exceed 999,999.99';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(details);
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <div className={`max-w-md mx-auto bg-white rounded-2xl shadow-2xl p-8 ${className}`}>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Details</h1>
        <p className="text-gray-600">Please provide payment information</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Payment Description */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Payment Description
          </label>
          <textarea
            placeholder="Enter payment reason or description"
            value={details.description}
            onChange={handleInputChange('description')}
            rows={3}
            className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 resize-none ${
              errors.description 
                ? 'border-red-300 focus:border-red-500' 
                : 'border-gray-200 focus:border-black focus:ring-4 focus:ring-gray-100'
            }`}
          />
          {errors.description && (
            <p className="text-sm text-red-600">{errors.description}</p>
          )}
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Amount
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              min="0.01"
              max="999999.99"
              placeholder="0.00"
              value={details.amount || ''}
              onChange={handleInputChange('amount')}
              className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 ${
                errors.amount 
                  ? 'border-red-300 focus:border-red-500' 
                  : 'border-gray-200 focus:border-black focus:ring-4 focus:ring-gray-100'
              }`}
            />
          </div>
          {errors.amount && (
            <p className="text-sm text-red-600">{errors.amount}</p>
          )}
        </div>

        {/* Currency */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Currency
          </label>
          <select
            value={details.currency}
            onChange={handleInputChange('currency')}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-black focus:ring-4 focus:ring-gray-100 transition-all duration-200"
          >
            <option value="USD">USD - US Dollar</option>
            <option value="EUR">EUR - Euro</option>
            <option value="GBP">GBP - British Pound</option>
            <option value="AED">AED - UAE Dirham</option>
            <option value="SAR">SAR - Saudi Riyal</option>
          </select>
        </div>

        {/* Reference Number */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Reference Number (Optional)
          </label>
          <input
            type="text"
            placeholder="Enter reference number"
            value={details.reference}
            onChange={handleInputChange('reference')}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-black focus:ring-4 focus:ring-gray-100 transition-all duration-200"
          />
        </div>

        {/* Amount Preview */}
        {details.amount > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Amount:</span>
              <span className="text-2xl font-bold text-black">
                {formatAmount(details.amount, details.currency)}
              </span>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full py-4 px-6 rounded-lg font-semibold text-white bg-black hover:bg-gray-800 active:transform active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          Proceed to Payment
        </button>
      </form>
    </div>
  );
};