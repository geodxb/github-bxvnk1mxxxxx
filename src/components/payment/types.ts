export interface CardDetails {
  number: string;
  name: string;
  expiry: string;
  cvv: string;
}

export interface PaymentData extends CardDetails {
  amount?: number;
  currency?: string;
}

export type CardType = 'visa' | 'mastercard' | 'amex' | 'discover' | 'diners' | 'jcb' | 'unionpay' | 'unknown';

export interface ValidationErrors {
  number?: string;
  name?: string;
  expiry?: string;
  cvv?: string;
}

export interface PaymentScreenProps {
  amount?: number;
  currency?: string;
  onSubmit: (data: PaymentData) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

export interface PaymentDetails {
  description: string;
  amount: number;
  currency: string;
  reference?: string;
}