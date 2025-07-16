<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCart } from '~/composables/useCart'
import { useOrders } from '~/composables/useOrders'
import { useCustomers } from '~/composables/useCustomers'
import { getCurrentUserWithToken } from '~/composables/getCurrentUser'
import { useToast } from '~/composables/useToast'

import { ShoppingCart, Trash2, LoaderCircle, ArrowRight } from 'lucide-vue-next'

import type { Customer } from '~/types/Customer'
import type { CreateOrderPayload, ItemDetails } from '~/types/Order'

import CartItem from '~/components/CartItem.vue'

const { getCustomerByFirebaseUid, ensureToken } = useCustomers()
const { addOrder } = useOrders()
const { addToast } = useToast()
const router = useRouter()

const {
  cartItemsState,
  updateCartItem,
  removeFromCart,
  clearCart,
  subscribeCartItems
} = useCart()

const customer = ref<Customer | null>(null)
const isCartReady = ref(false)
const loading = ref(true)
const checkoutLoading = ref(false)

onMounted(async () => {
  try {
    await ensureToken()
    const { user } = await getCurrentUserWithToken()
    if (!user?.uid) throw new Error('User not authenticated')

    const customerData = await getCustomerByFirebaseUid(user.uid)
    if (!customerData) throw new Error('Customer not found')

    customer.value = customerData
    isCartReady.value = true
  } catch (err: any) {
    console.error('Failed to fetch customer data:', err)
    addToast('Failed to fetch customer data. Please re-login.', 'error')
  }
})

onMounted(() => {
  const unsubscribe = subscribeCartItems((items) => {
    cartItemsState.value = items
    loading.value = false
  })
  onUnmounted(() => {
    unsubscribe()
  })
})

const cartItems = computed(() => cartItemsState.value)

const increaseQuantity = (productId: string) => {
  const item = cartItems.value.find(i => i.product?.id === productId)
  if (item) updateCartItem(productId, item.quantity + 1)
}

const decreaseQuantity = (productId: string) => {
  const item = cartItems.value.find(i => i.product?.id === productId)
  if (!item) return

  item.quantity > 1
    ? updateCartItem(productId, item.quantity - 1)
    : removeFromCart(productId)
}

const removeItem = (productId: string) => {
  removeFromCart(productId)
}

const totalPrice = computed(() =>
  cartItems.value.reduce(
    (sum, item) => sum + ((item.product?.price ?? 0) * item.quantity),
    0
  )
)

const formatPrice = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
  }).format(value)

const checkout = async () => {
  if (checkoutLoading.value) return

  if (cartItems.value.length === 0) {
    addToast('Your cart is empty.', 'warning')
    return
  }

  if (!customer.value?.id) {
    addToast('Customer data not found.', 'error')
    return
  }

  checkoutLoading.value = true

  try {
    const orderItems: ItemDetails[] = cartItems.value.map(item => ({
      id: item.product?.id ?? '',
      name: item.product?.name ?? '',
      price: item.product?.price ?? 0,
      quantity: item.quantity,
    }))

    const payload: CreateOrderPayload = {
      customerId: customer.value.id,
      userId: customer.value.firebaseUid,
      createdBy: customer.value.id,
      items: orderItems,
      discount: 0,
      tax: 0,
      paymentMethod: 'bank_transfer',
      status: 'pending',
      refundAmount: 0,
      customer: {
        first_name: customer.value.name ?? '',
        last_name: '',
        email: customer.value.email ?? '',
        phone: customer.value.phone ?? '',
      }
    }

    const result = await addOrder(payload)

    if (result?.paymentInfo?.redirect_url) {
      await clearCart()
      window.open(result.paymentInfo.redirect_url, '_blank')
      addToast('Order created. Redirecting to payment...', 'success')
    } else {
      addToast('Order created, but no payment link found.', 'info')
    }

    await router.push('/orders')

  } catch (error: any) {
    console.error('Checkout failed:', error)
    if (error?.message?.includes('E_INSUFFICIENT_STOCK')) {
      addToast('Some items exceed available stock.', 'error')
    } else {
      addToast(error.message || 'Failed to create order.', 'error')
    }
  } finally {
    checkoutLoading.value = false
  }
}
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-10">
    <h1 class="text-3xl font-bold text-gray-800 mb-6 text-center flex items-center justify-center gap-2">
      <ShoppingCart class="w-6 h-6" />
      Your Shopping Cart
    </h1>

    <div v-if="!isCartReady" class="text-gray-500 text-center py-10 animate-pulse">
      Loading customer data...
    </div>

    <div v-else-if="cartItems.length === 0" class="text-center text-gray-500 py-20">
      <p class="text-xl mb-4">Your cart is currently empty.</p>
      <NuxtLink
        to="/"
        class="inline-block bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition"
      >
        Continue Shopping
      </NuxtLink>
    </div>

    <div v-else>
      <div class="grid gap-6">
        <CartItem
          v-for="item in cartItems"
          :key="item.product?.id"
          :item="item"
          @increase="increaseQuantity"
          @decrease="decreaseQuantity"
          @remove="removeItem"
        />
      </div>

      <!-- Action Bar -->
      <div class="mt-10 border-t pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <button
          @click="clearCart"
          class="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-full text-sm transition"
        >
          <Trash2 class="w-4 h-4 inline-block mr-2" />
          Clear Cart
        </button>

        <div class="text-xl font-semibold text-gray-800">
          Total: {{ formatPrice(totalPrice) }}
        </div>
      </div>

      <!-- Checkout Button -->
      <div class="mt-6">
        <button
          @click="checkout"
          :disabled="checkoutLoading"
          class="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-full text-lg font-semibold flex justify-center items-center gap-2 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <LoaderCircle
            v-if="checkoutLoading"
            class="w-5 h-5 animate-spin"
          />
          <ArrowRight v-else class="w-5 h-5" />
          {{ checkoutLoading ? 'Processing...' : 'Proceed to Checkout' }}
        </button>

        <NuxtLink
          to="/orders"
          class="block text-center mt-3 text-blue-600 hover:underline text-sm"
        >
          View My Orders
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
