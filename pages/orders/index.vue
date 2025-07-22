<script setup lang="ts">
import { ref, computed } from 'vue'
import { useOrders } from '~/composables/useOrders'
import { useCustomers } from '~/composables/useCustomers'
import { getCurrentUserWithToken } from '~/composables/getCurrentUser'
import { usePayment } from '~/composables/usePayments'
import type { Order } from '~/types/Order'
import type { PaymentData } from '~/types/Payment'

import { FileText, CreditCard } from 'lucide-vue-next'

const { getCustomerByFirebaseUid, ensureToken } = useCustomers()
const { getOrdersByCustomer } = useOrders()
const { getPaymentById } = usePayment()

const expandedOrderId = ref<string | null>(null)
const paymentDetails = ref<Record<string, PaymentData | null>>({})
const paymentLoading = ref<Record<string, boolean>>({})
const paymentError = ref<Record<string, string | null>>({})

const fetchOrders = async (): Promise<Order[]> => {
  await ensureToken()
  const { user } = await getCurrentUserWithToken()
  if (!user || !user.uid) throw new Error('User not authenticated')

  const customer = await getCustomerByFirebaseUid(user.uid)
  if (!customer || !customer.id) throw new Error('Customer not found')

  const orders = await getOrdersByCustomer(customer.id)
  return orders
}

const { data: orders, pending: loading, error } = await useAsyncData<Order[]>(
  'orders',
  fetchOrders
)

const toggleDetails = async (orderId: string) => {
  if (expandedOrderId.value === orderId) {
    expandedOrderId.value = null
    return
  }

  expandedOrderId.value = orderId

  if (!paymentDetails.value[orderId]) {
    try {
      paymentLoading.value[orderId] = true
      paymentError.value[orderId] = null

      const order = orders.value?.find(o => o.id === orderId)
      if (!order || !order.paymentId) {
        paymentError.value[orderId] = 'Payment ID tidak ditemukan'
        paymentDetails.value[orderId] = null
        return
      }

      const payment = await getPaymentById(order.paymentId)
      paymentDetails.value[orderId] = payment || null
    } catch (err: any) {
      paymentError.value[orderId] = err.message || 'Gagal mengambil data pembayaran'
      paymentDetails.value[orderId] = null
    } finally {
      paymentLoading.value[orderId] = false
    }
  }
}

const formatPrice = (value: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value)

const formatDateSafe = (value: Date | null | undefined): string => {
  if (!value) return '-'
  return new Date(value).toLocaleString('id-ID')
}

const sortedOrders = computed(() => {
  if (!orders.value) return []
  return [...orders.value].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
})

const calculateTotal = (order: Order): number => {
  const subtotal = order.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  const afterDiscount = subtotal - (order.discount || 0)
  const afterTax = afterDiscount + (order.tax || 0)
  return afterTax
}

const continuePayment = (orderId: string) => {
  const payment = paymentDetails.value[orderId]

  if (!payment) {
    alert('Data pembayaran tidak ditemukan.')
    return
  }

  const redirectUrl = payment.redirectUrl

  if (redirectUrl) {
    window.open(redirectUrl, '_blank')
  } else {
    alert('Link pembayaran tidak tersedia.')
  }
}
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-10">
    <h1 class="text-3xl font-bold text-gray-800 mb-8 text-center flex items-center justify-center gap-2">
      <FileText class="w-6 h-6" />
      My Orders
    </h1>

    <div v-if="loading" class="text-center text-gray-500">Loading your orders...</div>
    <div v-else-if="error" class="text-center text-red-500">{{ error.message || error }}</div>
    <div v-else-if="orders?.length === 0" class="text-center text-gray-400">You have no orders yet.</div>

    <div v-else class="space-y-6">
      <div
        v-for="order in sortedOrders"
        :key="order.id"
        class="border border-gray-200 rounded-xl shadow-sm p-6 relative bg-white"
      >
        <!-- Order Summary -->
        <div class="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h2 class="text-lg font-semibold text-gray-800">Order #{{ order.id }}</h2>
            <p class="text-sm text-gray-500">Placed on {{ new Date(order.createdAt).toLocaleDateString('id-ID') }}</p>
          </div>

          <div class="flex flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-4">
            <span
              class="text-xs font-medium px-3 py-1 rounded-full"
              :class="{
                'bg-yellow-100 text-yellow-800': order.status === 'pending',
                'bg-green-100 text-green-800': order.status === 'completed' || order.status === 'paid',
                'bg-red-100 text-red-800': order.status === 'cancelled' || order.status === 'failed',
                'bg-gray-100 text-gray-800': true
              }"
            >
              {{ order.status.toUpperCase() }}
            </span>
            <div class="text-right font-semibold text-blue-600">
              {{ formatPrice(calculateTotal(order)) }}
            </div>
          </div>
        </div>

        <!-- Items -->
        <ul class="mt-4 text-sm text-gray-700 space-y-1 pl-4 list-disc">
          <li v-for="item in order.items" :key="item.productId">
            {{ item.productName || 'Unnamed Product' }} — {{ item.quantity }} x {{ formatPrice(item.unitPrice) }}
          </li>
        </ul>

        <!-- Toggle -->
        <button
          @click="toggleDetails(order.id)"
          class="mt-4 text-blue-600 hover:underline text-sm"
        >
          {{ expandedOrderId === order.id ? 'Hide Details' : 'View Details' }}
        </button>

        <!-- Details Section -->
        <div v-if="expandedOrderId === order.id" class="mt-6 border-t pt-4 text-sm space-y-2">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <p><strong>Payment Method:</strong> {{ order.paymentMethod || '-' }}</p>
            <p><strong>Payment ID:</strong> {{ order.paymentId || '-' }}</p>
            <p><strong>Created By:</strong> {{ order.createdBy || '-' }}</p>
            <p><strong>Discount:</strong> {{ formatPrice(order.discount || 0) }}</p>
            <p><strong>Tax:</strong> {{ formatPrice(order.tax || 0) }}</p>
            <p>
              <strong>Refund:</strong>
              {{ order.refundAmount ? `Refunded ${formatPrice(order.refundAmount)}` : 'No refund' }}
            </p>
          </div>

          <!-- Payment Details -->
          <div class="mt-4">
            <h3 class="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <CreditCard class="w-5 h-5" />
              Payment Info
            </h3>
            <div v-if="paymentLoading[order.id]" class="text-gray-500">Loading payment details...</div>
            <div v-else-if="paymentError[order.id]" class="text-red-500">{{ paymentError[order.id] }}</div>
            <div v-else-if="paymentDetails[order.id]">
              <p><strong>Status:</strong> {{ paymentDetails[order.id]?.status || '-' }}</p>
              <p><strong>Amount Paid:</strong> {{ formatPrice(paymentDetails[order.id]?.amount || 0) }}</p>
              <p><strong>Paid At:</strong> {{ formatDateSafe(paymentDetails[order.id]?.paidAt) }}</p>
              <p><strong>Method:</strong> {{ paymentDetails[order.id]?.method || '-' }}</p>
              <p><strong>Note:</strong> {{ paymentDetails[order.id]?.note || '-' }}</p>

              <button
                v-if="paymentDetails[order.id]?.status !== 'paid'"
                @click="continuePayment(order.id)"
                class="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                Continue Payment
              </button>
            </div>
            <div v-else class="text-gray-500">
              No payment details available.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
