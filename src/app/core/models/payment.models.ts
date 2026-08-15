export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export type OrderStatus = 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELED';

export interface CreatePaymentRequest {
  orderId: number;
  paymentMethodId: number;
}

export interface PaymentResponse {
  id: number;
  amount: number;
  status: PaymentStatus;
  transactionId?: string;
  orderId: number;
  userId: number;
  paymentMethodId: number;
  checkoutUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type Payment = PaymentResponse;
