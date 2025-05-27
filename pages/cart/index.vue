<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue'
import { useCart } from '~/composables/useCart'
import CartItem from '~/components/CartItem.vue'

const {
  cartItemsState,
  updateCartItem,
  removeFromCart,
  clearCart,
  subscribeCartItems
} = useCart()

const loading = ref(true)

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

const checkout = () => {
  console.log('Checkout with items:', cartItems.value)
}
</script>

<template>
  <div class="max-w-4xl mx-auto p-6">
    <h1 class="text-2xl font-bold mb-4">Shopping Cart</h1>

    <div v-if="loading">Loading...</div>
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
  </div>
</template>
