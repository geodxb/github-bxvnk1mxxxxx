import React from 'react';
import type { CardType } from './types';

interface CardBrandIconProps {
  cardType: CardType;
  className?: string;
}

export const CardBrandIcon: React.FC<CardBrandIconProps> = ({ cardType, className = "w-8 h-5" }) => {
  const getCardColor = (type: CardType): string => {
    switch (type) {
      case 'visa':
        return 'text-blue-600';
      case 'mastercard':
        return 'text-red-500';
      case 'amex':
        return 'text-blue-800';
      case 'discover':
        return 'text-orange-500';
      case 'diners':
        return 'text-purple-600';
      case 'jcb':
        return 'text-green-600';
      case 'unionpay':
        return 'text-red-600';
      default:
        return 'text-gray-400';
    }
  };

  const getCardName = (type: CardType): string => {
    switch (type) {
      case 'visa':
        return 'VISA';
      case 'mastercard':
        return 'MC';
      case 'amex':
        return 'AMEX';
      case 'discover':
        return 'DISC';
      case 'diners':
        return 'DINERS';
      case 'jcb':
        return 'JCB';
      case 'unionpay':
        return 'UP';
      default:
        return '';
    }
  };

  if (cardType === 'unknown') {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 rounded border text-gray-400 font-bold text-xs`}>
        CARD
      </div>
    );
  }

  return (
    <div className={`${className} flex items-center justify-center bg-white rounded border ${getCardColor(cardType)} font-bold text-xs`}>
      {getCardName(cardType)}
    </div>
  );
};