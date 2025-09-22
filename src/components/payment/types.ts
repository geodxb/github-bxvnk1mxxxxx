export interface PaymentDetails {
  amount: number;
  currency: string;
  description: string;
  recipientName?: string;
  recipientEmail?: string;
}

export interface PaymentData {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  cardHolderName: string;
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

export interface PaymentResult {
  transactionId: string;
  status: 'success' | 'failed' | 'pending';
  amount: number;
  currency: string;
  timestamp: string;
  paymentMethod: string;
  description: string;
}  description: string;
  amount: number;
  currency: string;
  reference?: string;
}