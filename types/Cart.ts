import type { Product } from './Product'

export interface CartItem {
  productId: string
  quantity: number
  createdAt?: Date
}

export interface PopulatedCartItem {
  product: Product
  quantity: number
}