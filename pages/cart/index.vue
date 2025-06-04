<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue'
import { useCart } from '~/composables/useCart'
import { useOrders } from '~/composables/useOrders'
import type { CreateOrderPayload, ItemDetails } from '~/types/Order'
import CartItem from '~/components/CartItem.vue'
import { useCustomers } from '~/composables/useCustomers'
import { getCurrentUserWithToken } from '~/composables/getCurrentUser'
import type { Customer } from '~/types/Customer'

const { getCustomerByFirebaseUid, ensureToken } = useCustomers()
const { addOrder } = useOrders()
const {
  cartItemsState,
  updateCartItem,
  removeFromCart,
  clearCart,
  subscribeCartItems
} = useCart()
const { addToast } = useToast() 

const customer = ref<Customer | null>(null)
const isCartReady = ref(false)
const loading = ref(true)

onMounted(async () => {
  try {
    await ensureToken()
    const { user } = await getCurrentUserWithToken()
    if (!user || !user.uid) throw new Error('User is not authenticated')

    const customerData = await getCustomerByFirebaseUid(user.uid)
    if (!customerData) throw new Error('Customer not found')

    customer.value = customerData
    isCartReady.value = true
  } catch (err: any) {
    console.error('Gagal mengambil data customer:', err)
    addToast('Gagal mengambil data customer. Silakan login ulang.', 'error')
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
const handleIncrease = (productId: string) => increaseQty(productId)
const handleDecrease = (productId: string) => decreaseQty(productId)
const handleRemove = (productId: string) => removeItem(productId)

const increaseQty = (productId: string) => {
  if (!productId) return
  const item = cartItems.value.find(i => i.product?.id === productId)
  if (item) updateCartItem(productId, item.quantity + 1)
}

const decreaseQty = (productId: string) => {
  if (!productId) return
  const item = cartItems.value.find(i => i.product?.id === productId)
  if (!item) return

  if (item.quantity > 1) {
    updateCartItem(productId, item.quantity - 1)
  } else {
    removeFromCart(productId)
  }
}

const removeItem = (productId: string) => {
  if (!productId) return
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
  if (cartItems.value.length === 0) {
    addToast('Keranjang kosong.', 'warning')
    return
  }

  if (!customer.value) {
    addToast('Data pelanggan belum tersedia.', 'error')
    return
  }

  const customerId = customer.value?.id

  if (!customerId) {
    addToast('Customer ID tidak tersedia', 'error')
    return
  }

  try {
    const orderItems: ItemDetails[] = cartItems.value.map((item) => ({
      id: item.product?.id ?? '',
      name: item.product?.name ?? '',
      price: item.product?.price ?? 0,
      quantity: item.quantity,
    }))

    const payload: CreateOrderPayload = {
      customerId: customerId,
      createdBy: customerId,
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

    console.log('Creating order with payload:', payload)

    const result = await addOrder(payload)

    if (result?.paymentInfo?.redirect_url) {
      await clearCart()
      window.open(result.paymentInfo.redirect_url, '_blank')
      addToast('Pesanan berhasil dibuat. Mengarahkan ke pembayaran...', 'success')
    } else {
      addToast('Pesanan berhasil dibuat, tetapi tidak ada link pembayaran.', 'info')
      console.log('Payment Info:', result.paymentInfo)
    }

  } catch (error: any) {
    console.error('Checkout error:', error)
    if (error?.message && error.message.includes('E_INSUFFICIENT_STOCK')) {
      addToast('Jumlah pesanan melebihi stok produk yang tersedia.', 'error')
    }
    else {
      addToast(error.message || 'Gagal membuat pesanan.', 'error')
    }
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto p-6">
    <h1 class="text-2xl font-bold mb-4">Shopping Cart</h1>

    <div v-if="!isCartReady">Loading customer data...</div>
    <div v-else-if="cartItems.length === 0">Your cart is empty.</div>
    <div v-else class="space-y-4">
      <CartItem
        v-for="item in cartItems"
        :key="item.product?.id"
        :item="item"
        @increase="handleIncrease"
        @decrease="handleDecrease"
        @remove="handleRemove"
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
        class="bg-blue-600 text-white px-6 py-3 mt-4 rounded-lg hover:bg-blue-700 w-full"
      >
        Proceed to Checkout
      </button>
      
    </div>
    <NuxtLink
      to="/orders"
      class="block text-center bg-gray-200 text-gray-800 px-6 py-3 mt-2 rounded-lg hover:bg-gray-300 w-full"
    >
      View My Orders
    </NuxtLink>
  </div>
</template>
