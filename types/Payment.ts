export type PaymentStatus = 'pending' | 'paid' | 'failed';

export interface Payment {
    id: string;
    orderId: string;
    amount: number;
    method: string;
    status: string;
    createdAt: string;
    updatedAt?: string;
}
  
export interface PaymentData {
    orderId: string;
    amount: number;
    method: string;
}
  
export type CreatePaymentResponse = {
  message: string;
  paymentId: string;
  midtransResult: any;
};

export type UpdateStatusResponse = { message: string };