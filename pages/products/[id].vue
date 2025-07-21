<script setup lang="ts">
import { ref, computed, watchEffect, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { format } from 'date-fns'
import { useProducts } from '~/composables/useProducts'
import { useCategories } from '~/composables/useCategories'
import { useCart } from '~/composables/useCart'
import { useSellers } from '~/composables/useSellers'
import { getAuth, onAuthStateChanged } from 'firebase/auth'

import type { Seller } from '~/types/Seller'

import {
  LoaderCircle,
  ArrowLeft,
  Info,
  Layers,
  Tag,
  PackageCheck,
  Barcode,
  Calendar,
  Clock,
  ShoppingCart,
  Store,
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const productId = route.params.id as string

const { getProductById } = useProducts()
const { getCategories } = useCategories()
const { addToCart } = useCart()
const { getSellerByFirebaseUid } = useSellers()
const { addToast } = useToast()

// Auth state (client-only)
const isLoggedIn = ref(false)
const isAuthReady = ref(false)

const addingToCart = ref(false)

const auth = getAuth()
onAuthStateChanged(auth, (user) => {
  isLoggedIn.value = !!user
  isAuthReady.value = true
})

// Fetch product + categories with useAsyncData (SSR friendly)
const { data: product, pending: loadingProduct, error: productError } = await useAsyncData(
  `product-${productId}`,
  () => getProductById(productId)
)

const { data: categories, pending: loadingCategories } = await useAsyncData(
  'categories',
  () => getCategories()
)

// Map category id to name
const categoryMap = computed(() => {
  const map: Record<string, string> = {}
  categories.value?.forEach(c => {
    map[c.id] = c.name
  })
  return map
})

// Loading flags combined (except seller)
const loadingBasic = computed(() => loadingProduct.value || loadingCategories.value)

// Seller state & loading
const seller = ref<Seller | null>(null)
const loadingSeller = ref(false)

// Fetch seller only after product ready
watchEffect(async () => {
  if (product.value?.createdBy) {
    loadingSeller.value = true
    try {
      seller.value = await getSellerByFirebaseUid(product.value.createdBy)
    } catch (e) {
      console.error('Gagal mengambil data seller:', e)
      seller.value = null
    } finally {
      loadingSeller.value = false
    }
  } else {
    seller.value = null
    loadingSeller.value = false
  }
})

// Full loading flag including seller
const loading = computed(() => loadingBasic.value || loadingSeller.value)

// Error handling: redirect jika produk tidak ditemukan
if ((productError.value || product.value === null) && !loadingBasic.value) {
  alert('Produk tidak ditemukan.')
  router.push('/')
}

// Format timestamp dengan aman
const formatTimestamp = (value: unknown): string => {
  if (!value) return '-'
  if (
    typeof value === 'object' &&
    value !== null &&
    '_seconds' in value &&
    typeof (value as any)._seconds === 'number'
  ) {
    return format(new Date((value as any)._seconds * 1000), 'dd/MM/yyyy, HH:mm:ss')
  }
  const date = value instanceof Date ? value : new Date(String(value))
  if (isNaN(date.getTime())) return '-'
  return format(date, 'dd/MM/yyyy, HH:mm:ss')
}

// Add to cart handler
const handleAddToCart = async () => {
  if (!isLoggedIn.value) {
    router.push('/auth/login')
    return
  }
  if (!product.value) return

  addingToCart.value = true
  try {
    await addToCart(product.value.id, 1)
    addToast('Produk berhasil ditambahkan ke keranjang.', 'success')
  } catch (err) {
    console.error(err)
    addToast('Gagal menambahkan ke keranjang.', 'error')
  } finally {
    addingToCart.value = false
  }
}
</script>

<template>
  <div class="max-w-6xl mx-auto py-16 px-4 sm:px-6">
    <!-- Back -->
    <button
      @click="router.back()"
      class="mb-8 inline-flex items-center text-gray-500 hover:text-blue-600 transition gap-2"
    >
      <ArrowLeft class="w-5 h-5" />
      <span>Kembali ke katalog</span>
    </button>

    <!-- Loading -->
    <div v-if="loading" class="text-center text-gray-500 flex flex-col items-center justify-center py-16">
      <LoaderCircle class="w-6 h-6 animate-spin mb-2" />
      <span>Memuat produk...</span>
    </div>

    <!-- Product Detail -->
    <div v-else-if="product" class="grid grid-cols-1 md:grid-cols-2 gap-12">
      <!-- Image -->
      <div class="w-full h-[400px] bg-gray-100 rounded-lg shadow overflow-hidden">
        <img
          :src="product.imageUrl"
          :alt="product.name"
          class="w-full h-full object-cover object-center"
        />
      </div>

      <!-- Info -->
      <div class="space-y-4 text-gray-800">
        <h1 class="text-4xl font-bold">{{ product.name }}</h1>

        <!-- Kategori -->
        <div class="flex items-center gap-2 text-sm text-gray-600">
          <Layers class="w-4 h-4" />
          <span>Kategori: {{ categoryMap[product.categoryId] || 'Uncategorized' }}</span>
        </div>

        <!-- Seller -->
        <div v-if="loadingSeller" class="flex items-center gap-2 text-sm text-gray-500">
          <LoaderCircle class="w-4 h-4 animate-spin" />
          <span>Memuat penjual...</span>
        </div>
        <div
          v-else-if="seller"
          class="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition cursor-pointer"
          @click="router.push(`/sellers/${seller.firebaseUid}`)"
        >
          <Store class="w-4 h-4" />
          <span>
            Dijual oleh:
            <span class="font-medium text-gray-800 underline">
              {{ seller.storeName || seller.name }}
            </span>
          </span>
        </div>

        <!-- Deskripsi -->
        <p class="text-base text-gray-700">
          {{ product.description || 'Tidak ada deskripsi.' }}
        </p>

        <!-- Harga -->
        <div class="text-3xl font-bold text-blue-600 flex items-center gap-2 mt-4">
          <Tag class="w-6 h-6" />
          Rp {{ product.price?.toLocaleString() }}
        </div>

        <!-- Stok -->
        <div>
          <span
            class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium"
            :class="product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
          >
            <PackageCheck class="w-4 h-4" />
            {{ product.stock > 0 ? `Stok tersedia (${product.stock})` : 'Stok habis' }}
          </span>
        </div>

        <!-- SKU + Tanggal -->
        <div class="text-sm text-gray-600 space-y-1">
          <div class="flex items-center gap-2">
            <Barcode class="w-4 h-4" />
            <span>SKU: {{ product.sku || '-' }}</span>
          </div>
          <div class="flex items-center gap-2">
            <Calendar class="w-4 h-4" />
            <span>Created: {{ formatTimestamp(product.createdAt) }}</span>
          </div>
          <div class="flex items-center gap-2">
            <Clock class="w-4 h-4" />
            <span>Updated: {{ formatTimestamp(product.updatedAt) }}</span>
          </div>
        </div>

        <!-- Tombol Add to Cart -->
        <button
          v-if="isAuthReady"
          @click="handleAddToCart"
          :disabled="product.stock <= 0 || addingToCart"
          class="mt-6 w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <svg
            v-if="addingToCart"
            class="w-5 h-5 animate-spin"
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
          <ShoppingCart v-else class="w-5 h-5" />
          <span>
            {{ addingToCart ? 'Menambahkan...' : (product.stock > 0 ? 'Tambah ke Keranjang' : 'Stok Habis') }}
          </span>
        </button>
      </div>
    </div>
  </div>
</template>
