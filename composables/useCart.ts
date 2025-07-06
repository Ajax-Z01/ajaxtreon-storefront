import { useState, createError } from '#app'
import {
  doc, setDoc, getDoc, updateDoc, deleteDoc,
  collection, getDocs, increment, onSnapshot
} from 'firebase/firestore'
import { getCurrentUserWithToken } from '~/composables/getCurrentUser'
import type { Product } from '~/types/Product'
import type { CartItem, PopulatedCartItem } from '~/types/Cart'
import { computed } from 'vue'

export const useCart = () => {
  const { $db } = useNuxtApp() as { $db: import('firebase/firestore').Firestore }
  const cartItemsState = useState<PopulatedCartItem[]>('cartItems', () => [])

  let cachedUser: { uid: string } | null = null
  const ensureUser = async () => {
    if (cachedUser) return cachedUser
    const { user } = await getCurrentUserWithToken()
    if (!user) throw createError({ statusCode: 401, message: 'User must be logged in' })
    cachedUser = user
    return user
  }

  const addToCart = async (productId: string, quantity = 1) => {
    const user = await ensureUser()
    const cartItemRef = doc($db, 'carts', user.uid, 'items', productId)

    try {
      await updateDoc(cartItemRef, {
        quantity: increment(quantity),
      })
    } catch (err: any) {
      if (err.code === 'not-found') {
        const productSnap = await getDoc(doc($db, 'products', productId))
        if (!productSnap.exists()) throw createError({ statusCode: 404, message: 'Product not found' })

        const product = productSnap.data() as Product
        const cartItem: CartItem = {
          productId,
          quantity,
          createdAt: new Date(),
          productSnapshot: {
            name: product.name,
            imageUrl: product.imageUrl,
            price: product.price,
          },
        }

        await setDoc(cartItemRef, cartItem)
      } else {
        throw createError({ statusCode: 500, message: 'Failed to add to cart' })
      }
    }
  }

  const getCartItems = async (): Promise<PopulatedCartItem[]> => {
    const user = await ensureUser()
    const cartRef = collection($db, 'carts', user.uid, 'items')
    const cartSnap = await getDocs(cartRef)

    const populatedCart: PopulatedCartItem[] = cartSnap.docs.map(docSnap => {
      const data = docSnap.data() as CartItem
      return {
        product: {
          id: data.productId,
          ...data.productSnapshot,
        },
        quantity: data.quantity,
      }
    })

    cartItemsState.value = populatedCart
    return populatedCart
  }

  const removeFromCart = async (productId: string) => {
    const user = await ensureUser()
    await deleteDoc(doc($db, 'carts', user.uid, 'items', productId))
  }

  const updateCartItem = async (productId: string, quantity: number) => {
    const user = await ensureUser()
    const cartItemRef = doc($db, 'carts', user.uid, 'items', productId)

    if (quantity <= 0) {
      await deleteDoc(cartItemRef)
    } else {
      await updateDoc(cartItemRef, { quantity })
    }
  }

  const clearCart = async () => {
    const user = await ensureUser()
    const cartRef = collection($db, 'carts', user.uid, 'items')
    const snap = await getDocs(cartRef)
    await Promise.all(snap.docs.map(docSnap => deleteDoc(docSnap.ref)))
    cartItemsState.value = []
  }

  const subscribeCartItems = (callback?: (items: PopulatedCartItem[]) => void) => {
    let unsubscribe = () => {}

    ensureUser().then(user => {
      const cartRef = collection($db, 'carts', user.uid, 'items')
      unsubscribe = onSnapshot(cartRef, async (snap) => {
        const items: PopulatedCartItem[] = snap.docs.map(doc => {
          const data = doc.data() as CartItem
          return {
            product: {
              id: data.productId,
              ...data.productSnapshot,
            },
            quantity: data.quantity,
          }
        })
        cartItemsState.value = items
        if (callback) callback(items)
      })
    })

    return () => unsubscribe()
  }

  const cartCount = computed(() => {
    return cartItemsState.value.reduce((total, item) => total + item.quantity, 0)
  })

  return {
    cartItemsState,
    addToCart,
    getCartItems,
    removeFromCart,
    updateCartItem,
    clearCart,
    subscribeCartItems,
    cartCount,
  }
}
