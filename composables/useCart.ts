import { useState, createError } from '#app'
import {
  doc, setDoc, getDoc, updateDoc, deleteDoc,
  collection, getDocs, increment, onSnapshot
} from 'firebase/firestore'
import type { CartItem, PopulatedCartItem } from '~/types/Cart'
import type { Product } from '~/types/Product'
import { getCurrentUserWithToken } from '~/composables/getCurrentUser'

export const useCart = () => {
  const { $db } = useNuxtApp() as {
    $db: import('firebase/firestore').Firestore
  }

  const cartItemsState = useState<PopulatedCartItem[]>('cartItems', () => [])

  const ensureUser = async () => {
    const { user } = await getCurrentUserWithToken()
    if (!user) {
      throw createError({ statusCode: 401, message: 'User must be logged in' })
    }
    return user
  }

  const addToCart = async (productId: string, quantity = 1) => {
    try {
      const user = await ensureUser()
      console.log('Current User ID:', user.uid)

      const cartItemRef = doc($db, 'carts', user.uid, 'items', productId)
      const snapshot = await getDoc(cartItemRef)

      if (snapshot.exists()) {
        await updateDoc(cartItemRef, {
          quantity: increment(quantity),
        })
      } else {
        const cartItem: CartItem = {
          productId,
          quantity,
          createdAt: new Date(),
        }
        await setDoc(cartItemRef, cartItem)
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      throw createError({ statusCode: 500, message: 'Failed to add item to cart' })
    }
  }

  const getCartItems = async (): Promise<PopulatedCartItem[]> => {
    try {
      const user = await ensureUser()

      const cartRef = collection($db, 'carts', user.uid, 'items')
      const cartSnap = await getDocs(cartRef)

      const cartItems = cartSnap.docs.map(doc => doc.data() as CartItem)

      const productRefs = cartItems.map(item => doc($db, 'products', item.productId))
      const productSnaps = await Promise.all(productRefs.map(ref => getDoc(ref)))

      const populatedCart: PopulatedCartItem[] = []
      productSnaps.forEach((snap, i) => {
        if (snap.exists()) {
          const productData = snap.data() as Product
          populatedCart.push({
            product: {
              ...productData,
              id: snap.id,
            },
            quantity: cartItems[i].quantity,
          })
        }
      })

      cartItemsState.value = populatedCart
      return populatedCart
    } catch (error) {
      console.error('Error fetching cart items:', error)
      throw createError({ statusCode: 500, message: 'Failed to fetch cart items' })
    }
  }

  const removeFromCart = async (productId: string) => {
    try {
      const user = await ensureUser()

      const cartItemRef = doc($db, 'carts', user.uid, 'items', productId)
      await deleteDoc(cartItemRef)
    } catch (error) {
      console.error('Error removing from cart:', error)
      throw createError({ statusCode: 500, message: 'Failed to remove item from cart' })
    }
  }

  const updateCartItem = async (productId: string, quantity: number) => {
    try {
      const user = await ensureUser()

      const cartItemRef = doc($db, 'carts', user.uid, 'items', productId)
      if (quantity <= 0) {
        await deleteDoc(cartItemRef)
      } else {
        await updateDoc(cartItemRef, { quantity })
      }
    } catch (error) {
      console.error('Error updating cart item:', error)
      throw createError({
        statusCode: 500,
        message: `Failed to update cart item: ${(error as Error).message}`,
      })
    }
  }
  
  const clearCart = async () => {
    try {
      const user = await ensureUser()
      const cartRef = collection($db, 'carts', user.uid, 'items')
      const cartSnap = await getDocs(cartRef)

      const deletePromises = cartSnap.docs.map(docSnap => deleteDoc(docSnap.ref))
      await Promise.all(deletePromises)
      
      cartItemsState.value = []
    } catch (error) {
      console.error('Error clearing cart:', error)
      throw createError({ statusCode: 500, message: 'Failed to clear cart' })
    }
  }
  
  const subscribeCartItems = (callback: (items: PopulatedCartItem[]) => void) => {
    let unsubscribe = () => {}

    ensureUser()
      .then(user => {
        const cartRef = collection($db, 'carts', user.uid, 'items')
        unsubscribe = onSnapshot(cartRef, async (cartSnap) => {
                if (cartSnap.empty) {
          callback([])
          return
        }

        const cartItems = cartSnap.docs.map(doc => doc.data() as CartItem)

        const productRefs = cartItems.map(item => doc($db, 'products', item.productId))
        const productSnaps = await Promise.all(productRefs.map(ref => getDoc(ref)))

        const populatedCart: PopulatedCartItem[] = []
        productSnaps.forEach((snap, i) => {
          if (snap.exists()) {
            const productData = snap.data() as Product
            populatedCart.push({
              product: {
                ...productData,
                id: snap.id,
              },
              quantity: cartItems[i].quantity,
            })
          }
        })

          callback(populatedCart)
        })
      })
      .catch(err => {
        console.error('Subscribe cart failed:', err)
      })

    return () => unsubscribe()
  }

  return {
    cartItemsState,
    addToCart,
    getCartItems,
    removeFromCart,
    updateCartItem,
    clearCart,
    subscribeCartItems,
  }
}
