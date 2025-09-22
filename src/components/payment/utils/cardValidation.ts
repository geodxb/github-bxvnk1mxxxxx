import type { CardType, ValidationErrors, CardDetails } from '../types';

// Card type detection patterns
const cardPatterns: Record<CardType, RegExp> = {
  visa: /^4[0-9]{0,}$/,
  mastercard: /^5[1-5][0-9]{0,}|^2[2-7][0-9]{0,}$/,
  amex: /^3[47][0-9]{0,}$/,
  discover: /^6[0-9]{0,}$/,
  diners: /^3[0689][0-9]{0,}$/,
  jcb: /^35[0-9]{0,}$/,
  unionpay: /^62[0-9]{0,}$/,
  unknown: /^[0-9]+$/
};

export const detectCardType = (number: string): CardType => {
  const cleanNumber = number.replace(/\s/g, '');
  
  for (const [type, pattern] of Object.entries(cardPatterns)) {
    if (type !== 'unknown' && pattern.test(cleanNumber)) {
      return type as CardType;
    }
  }
  
  return 'unknown';
};

export const formatCardNumber = (value: string): string => {
  const cleanValue = value.replace(/\s/g, '').replace(/[^0-9]/g, '');
  const cardType = detectCardType(cleanValue);
  
  let formatted = '';
  
  switch (cardType) {
    case 'amex':
      // AMEX format: 4-6-5
      formatted = cleanValue.replace(/(\d{4})(\d{0,6})(\d{0,5})/, (match, p1, p2, p3) => {
        return [p1, p2, p3].filter(Boolean).join(' ');
      });
      break;
    case 'diners':
      // Diners format: 4-6-4
      formatted = cleanValue.replace(/(\d{4})(\d{0,6})(\d{0,4})/, (match, p1, p2, p3) => {
        return [p1, p2, p3].filter(Boolean).join(' ');
      });
      break;
    default:
      // Default format: 4-4-4-4
      formatted = cleanValue.replace(/(\d{4})(\d{0,4})(\d{0,4})(\d{0,4})/, (match, p1, p2, p3, p4) => {
        return [p1, p2, p3, p4].filter(Boolean).join(' ');
      });
  }
  
  return formatted;
};

export const formatExpiry = (value: string): string => {
  const cleanValue = value.replace(/\D/g, '');
  if (cleanValue.length >= 2) {
    return cleanValue.substring(0, 2) + '/' + cleanValue.substring(2, 4);
  }
  return cleanValue;
};

export const validateCardNumber = (number: string): boolean => {
  const cleanNumber = number.replace(/\s/g, '');
  
  // Basic length check
  if (cleanNumber.length < 13 || cleanNumber.length > 19) {
    return false;
  }
  
  // Luhn algorithm
  let sum = 0;
  let isEven = false;
  
  for (let i = cleanNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNumber.charAt(i), 10);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
};

export const validateExpiry = (expiry: string): boolean => {
  const cleanExpiry = expiry.replace(/\D/g, '');
  if (cleanExpiry.length !== 4) return false;
  
  const month = parseInt(cleanExpiry.substring(0, 2), 10);
  const year = parseInt(cleanExpiry.substring(2, 4), 10) + 2000;
  
  if (month < 1 || month > 12) return false;
  
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return false;
  }
  
  return true;
};

export const validateCVV = (cvv: string, cardType: CardType): boolean => {
  const cleanCVV = cvv.replace(/\D/g, '');
  const expectedLength = cardType === 'amex' ? 4 : 3;
  return cleanCVV.length === expectedLength;
};

export const validateName = (name: string): boolean => {
  return name.trim().length >= 2 && /^[a-zA-Z\s]+$/.test(name.trim());
};

export const validateCard = (card: CardDetails): ValidationErrors => {
  const errors: ValidationErrors = {};
  const cardType = detectCardType(card.number);
  
  if (!validateCardNumber(card.number)) {
    errors.number = 'Please enter a valid card number';
  }
  
  if (!validateName(card.name)) {
    errors.name = 'Please enter a valid cardholder name';
  }
  
  if (!validateExpiry(card.expiry)) {
    errors.expiry = 'Please enter a valid expiry date';
  }
  
  if (!validateCVV(card.cvv, cardType)) {
    errors.cvv = `Please enter a valid ${cardType === 'amex' ? '4' : '3'}-digit CVV`;
  }
  
  return errors;
};