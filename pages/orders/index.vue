<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useOrders } from '~/composables/useOrders'
import { useCustomers } from '~/composables/useCustomers'
import { getCurrentUserWithToken } from '~/composables/getCurrentUser'
import { usePayment } from '~/composables/usePayments'
import type { Order } from '~/types/Order'
import type { PaymentData } from '~/types/Payment'

const { getCustomerByFirebaseUid, ensureToken } = useCustomers()
const { getOrdersByCustomer } = useOrders()
const { getPaymentById } = usePayment()

const orders = ref<Order[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const expandedOrderId = ref<string | null>(null)
const paymentDetails = ref<Record<string, PaymentData | null>>({})
const paymentLoading = ref<Record<string, boolean>>({})
const paymentError = ref<Record<string, string | null>>({})


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

      const order = orders.value.find(o => o.id === orderId)
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


const formatPrice = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value)

const formatDateSafe = (value: Date | null | undefined): string => {
  if (!value) return '-'
  return new Date(value).toLocaleString('id-ID')
}

const calculateTotal = (order: Order): number => {
  const subtotal = order.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  const afterDiscount = subtotal - (order.discount || 0)
  const afterTax = afterDiscount + (order.tax || 0)
  return afterTax
}

const lanjutkanPembayaran = (paymentId: string) => {
    console.log(`Lanjutkan pembayaran untuk Payment ID: ${paymentId}`)
}

onMounted(async () => {
  try {
    await ensureToken()
    const { user } = await getCurrentUserWithToken()
    if (!user || !user.uid) throw new Error('User not authenticated')

    const customer = await getCustomerByFirebaseUid(user.uid)
    if (!customer || !customer.id) throw new Error('Customer not found')

    const result = await getOrdersByCustomer(customer.id)
    orders.value = result
  } catch (err: any) {
    error.value = err.message || 'Gagal mengambil pesanan.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="max-w-4xl mx-auto p-6">
    <h1 class="text-2xl font-bold mb-4">Daftar Pesanan</h1>

    <div v-if="loading">Memuat pesanan...</div>
    <div v-else-if="error" class="text-red-500">{{ error }}</div>
    <div v-else-if="orders.length === 0">Belum ada pesanan.</div>
    <div v-else class="space-y-4">
      <div
        v-for="order in orders"
        :key="order.id"
        class="border rounded p-4 shadow-sm"
        >
        <div class="flex justify-between items-center mb-2">
            <div>
            <h2 class="font-semibold">Pesanan ID: {{ order.id }}</h2>
            <div class="text-sm text-gray-500">
                Tanggal: {{ new Date(order.createdAt).toLocaleDateString('id-ID') }}
            </div>
            </div>
            <span class="text-sm bg-gray-200 rounded px-2 py-1">{{ order.status }}</span>
        </div>

        <ul class="text-sm pl-4 list-disc">
            <li
            v-for="item in order.items"
            :key="item.productId"
            >
            {{ item.productName || 'Produk' }} - {{ item.quantity }} x
            {{ formatPrice(item.unitPrice) }}
            </li>
        </ul>

        <div class="mt-2 font-semibold">Total: {{ formatPrice(calculateTotal(order)) }}</div>

        <button
            @click="toggleDetails(order.id)"
            class="mt-2 text-blue-600 hover:underline text-sm"
        >
            {{ expandedOrderId === order.id ? 'Sembunyikan Detail' : 'Lihat Detail' }}
        </button>

        <div
            v-if="expandedOrderId === order.id"
            class="mt-3 bg-gray-50 rounded p-3 text-sm"
            >
            <p><strong>Metode Pembayaran:</strong> {{ order.paymentMethod || '-' }}</p>
            <p><strong>Payment ID:</strong> {{ order.paymentId || '-' }}</p>
            <p><strong>Dibuat oleh:</strong> {{ order.createdBy || '-' }}</p>
            <p><strong>Diskon:</strong> {{ formatPrice(order.discount || 0) }}</p>
            <p><strong>Pajak:</strong> {{ formatPrice(order.tax || 0) }}</p>
            <p><strong>Status Refund:</strong> {{ order.refundAmount ? `Telah direfund ${formatPrice(order.refundAmount)}` : 'Tidak ada refund' }}</p>

            <div class="mt-2 border-t pt-2">
                <h3 class="font-semibold mb-1">Detail Pembayaran</h3>

                <div v-if="paymentLoading[order.id]">Memuat detail pembayaran...</div>
                <div v-else-if="paymentError[order.id]" class="text-red-500">{{ paymentError[order.id] }}</div>
                <div v-else-if="paymentDetails[order.id]">
                    <p><strong>Status:</strong> {{ paymentDetails[order.id]?.status || '-' }}</p>
                    <p><strong>Jumlah Dibayar:</strong> {{ formatPrice(paymentDetails[order.id]?.amount || 0) }}</p>
                    <p><strong>Tanggal Pembayaran:</strong> {{ formatDateSafe(paymentDetails[order.id]?.paidAt) }}</p>
                    <p><strong>Metode:</strong> {{ paymentDetails[order.id]?.method || '-' }}</p>
                    <p><strong>Catatan:</strong> {{ paymentDetails[order.id]?.note || '-' }}</p>

                    <button
                    v-if="paymentDetails[order.id]?.status !== 'paid'"
                    @click="lanjutkanPembayaran(order.paymentId || '')"
                    class="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                    Lanjutkan Pembayaran
                    </button>
                </div>
                <div v-else>
                    <p>Tidak ada detail pembayaran.</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  </div>
</template>
