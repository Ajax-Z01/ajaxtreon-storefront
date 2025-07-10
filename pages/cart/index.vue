<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCart } from '~/composables/useCart'
import { useOrders } from '~/composables/useOrders'
import { useCustomers } from '~/composables/useCustomers'
import { getCurrentUserWithToken } from '~/composables/getCurrentUser'
import { useToast } from '~/composables/useToast'

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
  <div class="max-w-4xl mx-auto p-6">
    <h1 class="text-2xl font-bold mb-4">Shopping Cart</h1>

    <div v-if="!isCartReady" class="text-gray-500">Loading customer data...</div>

    <div v-else-if="cartItems.length === 0" class="text-gray-600">
      Your cart is empty.
    </div>

    <div v-else class="space-y-4">
      <CartItem
        v-for="item in cartItems"
        :key="item.product?.id"
        :item="item"
        @increase="increaseQuantity"
        @decrease="decreaseQuantity"
        @remove="removeItem"
      />

      <div class="flex justify-between items-center mt-6">
        <button
          @click="clearCart"
          class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Clear Cart
        </button>
        <div class="text-xl font-semibold">Total: {{ formatPrice(totalPrice) }}</div>
      </div>

      <button
        @click="checkout"
        :disabled="checkoutLoading"
        class="w-full bg-blue-600 text-white px-6 py-3 mt-4 rounded-lg flex justify-center items-center gap-2 hover:bg-blue-700 transition-opacity"
        :class="{ 'opacity-70 cursor-not-allowed': checkoutLoading }"
      >
        <svg
          v-if="checkoutLoading"
          class="w-5 h-5 animate-spin text-white"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
        {{ checkoutLoading ? 'Processing...' : 'Proceed to Checkout' }}
      </button>

      <NuxtLink
        to="/orders"
        class="block text-center bg-gray-200 text-gray-800 px-6 py-3 mt-2 rounded-lg hover:bg-gray-300 w-full"
      >
        View My Orders
      </NuxtLink>
    </div>
  </div>
</template>
