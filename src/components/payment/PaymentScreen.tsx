import React, { useState, useCallback, useMemo } from 'react';
import { CardBrandIcon } from './CardBrandIcon';
import { 
  formatCardNumber, 
  formatExpiry, 
  detectCardType, 
  validateCard 
} from './utils/cardValidation';
import type { PaymentScreenProps, CardDetails, ValidationErrors } from './types';

export const PaymentScreen: React.FC<PaymentScreenProps> = ({
  amount = 0,
  currency = 'USD',
  onSubmit,
  isLoading = false,
  className = ''
}) => {
  const [cardDetails, setCardDetails] = useState<CardDetails>({
    number: '',
    name: '',
    expiry: '',
    cvv: ''
  });
  
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const cardType = useMemo(() => detectCardType(cardDetails.number), [cardDetails.number]);

  const handleInputChange = useCallback((field: keyof CardDetails) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    
    let formattedValue = value;
    let maxLength = 50;

    switch (field) {
      case 'number':
        formattedValue = formatCardNumber(value);
        maxLength = cardType === 'amex' ? 17 : 19; // Including spaces
        break;
      case 'expiry':
        formattedValue = formatExpiry(value);
        maxLength = 5; // MM/YY
        break;
      case 'cvv':
        formattedValue = value.replace(/\D/g, '');
        maxLength = cardType === 'amex' ? 4 : 3;
        break;
      case 'name':
        formattedValue = value.replace(/[^a-zA-Z\s]/g, '');
        maxLength = 50;
        break;
    }

    if (formattedValue.length <= maxLength) {
      setCardDetails(prev => ({
        ...prev,
        [field]: formattedValue
      }));

      // Clear error when user starts typing
      if (errors[field]) {
        setErrors(prev => ({
          ...prev,
          [field]: undefined
        }));
      }
    }
  }, [cardType, errors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateCard(cardDetails);
    setErrors(validationErrors);
    
    if (Object.keys(validationErrors).length === 0) {
      await onSubmit({
        ...cardDetails,
        amount,
        currency
      });
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
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Payment Information</h1>
        {amount > 0 && (
          <p className="text-3xl font-bold text-black">{formatAmount(amount, currency)}</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card Number */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Card Number
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="1234 5678 9012 3456"
              value={cardDetails.number}
              onChange={handleInputChange('number')}
              onFocus={() => setFocusedField('number')}
              onBlur={() => setFocusedField(null)}
              className={`w-full px-4 py-3 pr-12 border-2 rounded-lg transition-all duration-200 ${
                errors.number 
                  ? 'border-red-300 focus:border-red-500' 
                  : focusedField === 'number'
                    ? 'border-red-500 ring-4 ring-red-100'
                    : 'border-gray-200 focus:border-red-300'
              }`}
              disabled={isLoading}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <CardBrandIcon cardType={cardType} />
            </div>
          </div>
          {errors.number && (
            <p className="text-sm text-red-600 flex items-center">
              <span className="w-1 h-1 bg-black rounded-full mr-2"></span>
              {errors.number}
            </p>
          )}
        </div>

        {/* Cardholder Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Cardholder Name
          </label>
          <input
            type="text"
            placeholder="John Doe"
            value={cardDetails.name}
            onChange={handleInputChange('name')}
            onFocus={() => setFocusedField('name')}
            onBlur={() => setFocusedField(null)}
            className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 ${
              errors.name 
                ? 'border-gray-400 focus:border-black' 
                : focusedField === 'name'
                  ? 'border-black ring-4 ring-gray-100'
                  : 'border-gray-200 focus:border-gray-400'
            }`}
            disabled={isLoading}
          />
          {errors.name && (
            <p className="text-sm text-red-600 flex items-center">
              <span className="w-1 h-1 bg-black rounded-full mr-1"></span>
              {errors.name}
            </p>
          )}
        </div>

        {/* Expiry and CVV */}
        <div className="grid grid-cols-2 gap-4">
          {/* Expiry Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Expiry Date
            </label>
            <input
              type="text"
              placeholder="MM/YY"
              value={cardDetails.expiry}
              onChange={handleInputChange('expiry')}
              onFocus={() => setFocusedField('expiry')}
              onBlur={() => setFocusedField(null)}
              className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 ${
                errors.expiry 
                 ? 'border-gray-400 focus:border-black' 
                  : focusedField === 'expiry'
                   ? 'border-black ring-4 ring-gray-100'
                   : 'border-gray-200 focus:border-gray-400'
              }`}
              disabled={isLoading}
            />
            {errors.expiry && (
              <p className="text-xs text-red-600 flex items-center">
               <span className="w-1 h-1 bg-black rounded-full mr-1"></span>
                {errors.expiry}
              </p>
            )}
          </div>

          {/* CVV */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Security Code
            </label>
            <input
              type="text"
              placeholder={cardType === 'amex' ? '1234' : '123'}
              value={cardDetails.cvv}
              onChange={handleInputChange('cvv')}
              onFocus={() => setFocusedField('cvv')}
              onBlur={() => setFocusedField(null)}
              className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 ${
                errors.cvv 
                  ? 'border-red-300 focus:border-red-500' 
                  : focusedField === 'cvv'
                    ? 'border-red-500 ring-4 ring-red-100'
                    : 'border-gray-200 focus:border-red-300'
              }`}
              disabled={isLoading}
            />
            {errors.cvv && (
              <p className="text-xs text-red-600 flex items-center">
                <span className="w-1 h-1 bg-red-600 rounded-full mr-1"></span>
                {errors.cvv}
              </p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-all duration-200 ${
            isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-black hover:bg-gray-800 active:transform active:scale-95'
          } shadow-lg hover:shadow-xl`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Processing...
            </div>
          ) : (
            amount > 0 ? `Submit Payment ${formatAmount(amount, currency)}` : 'Submit Payment'
          )}
        </button>
      </form>

      {/* Security Notice */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          Your payment information is encrypted and secure
        </p>
      </div>
    </div>
  );
};