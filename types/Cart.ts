import type { Product } from './Product'

export interface ProductSnapshot {
  name: string
  imageUrl?: string
  price: number
}

export interface CartItem {
  productId: string
  quantity: number
  createdAt?: Date
  productSnapshot: ProductSnapshot
}

export interface PopulatedCartItem {
  product: ProductSnapshot & { id: string }
  quantity: number
}