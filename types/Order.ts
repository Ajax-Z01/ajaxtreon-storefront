import type { MidtransCustomerDetails } from './Payment'

export type OrderStatus = 'pending' | 'completed' | 'cancelled' | 'refunded' | 'failed' | 'processing' | 'on_hold' | 'paid';

export interface OrderItem {
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  tax?: number;
}

export interface Order {
  id: string;
  customerId: string;
  status: OrderStatus;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;

  items: OrderItem[];

  totalAmount: number;
  discount?: number;
  tax?: number;
  paymentMethod?: string;
  refundAmount?: number;
  paymentId?: string;
  createdBy?: string;
}

export interface AddOrderResponse {
  orderId: string
  paymentId: string
  paymentInfo: {
    redirect_url: string
    [key: string]: any
  }
}

export interface ItemDetails {
  id: string;
  price: number;
  quantity: number;
  name: string;
}

export interface CreateOrderPayload {
  items: ItemDetails[];
  customerId: string;
  createdBy: string;
  customer: MidtransCustomerDetails;
  paymentMethod?: string;
  discount?: number;
  tax?: number;
  refundAmount?: number;
  status?: OrderStatus;
}

export interface UpdateOrderPayload {
  status?: OrderStatus;
  items?: ItemDetails[];
  totalAmount?: number;
  discount?: number;
  tax?: number;
  paymentMethod?: string;
  refundAmount?: number;
}
