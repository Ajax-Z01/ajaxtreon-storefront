<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProducts } from '~/composables/useProducts'
import { useCategories } from '~/composables/useCategories'
import { useCart } from '~/composables/useCart'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import type { Product } from '~/types/Product'
import type { Category } from '~/types/Category'

import {
  ShoppingCart,
  ArrowLeft,
  Info,
  Layers,
  Tag,
  Barcode,
  Calendar,
  Clock,
  PackageCheck,
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const productId = route.params.id as string

const { getProductById } = useProducts()
const { getCategories } = useCategories()
const { addToCart } = useCart()
const { addToast } = useToast()

const isLoggedIn = ref(false)
const isAuthReady = ref(false)

const auth = getAuth()
onAuthStateChanged(auth, (user) => {
  isLoggedIn.value = !!user
  isAuthReady.value = true
})

const { data: categories, pending: loadingCategories } = await useAsyncData<Category[]>(
  'categories',
  () => getCategories()
)

const categoryMap = computed(() => {
  const map: Record<string, string> = {}
  categories.value?.forEach(cat => {
    map[cat.id] = cat.name
  })
  return map
})

const { data: product, pending: loadingProduct, error: productError } = await useAsyncData<Product | null>(
  `product-${productId}`,
  () => getProductById(productId)
)

const loading = computed(() => loadingCategories.value || loadingProduct.value)

if ((productError.value || product.value === null) && !loading.value) {
  alert('Product not found.')
  router.push('/')
}

const formatTimestamp = (value: any): string => {
  if (!value) return '-'
  if ('_seconds' in value) return new Date(value._seconds * 1000).toLocaleString()
  if (typeof value === 'string' || value instanceof Date) return new Date(value).toLocaleString()
  return '-'
}

const handleAddToCart = async () => {
  try {
    if (!isLoggedIn.value) {
      router.push('/auth/login')
      return
    }

    if (!product.value) return

    await addToCart(product.value.id, 1)
    addToast('Added to cart!', 'success')
  } catch (error) {
    console.error('Failed to add to cart:', error)
    addToast('You must be logged in to add items to cart.', 'error')
  }
}
</script>

<template>
  <div class="max-w-6xl mx-auto py-16 px-6">
    <!-- Back -->
    <button
      @click="router.back()"
      class="mb-6 flex items-center gap-2 text-gray-600 hover:text-blue-600 transition"
    >
      <ArrowLeft class="w-5 h-5" />
      Kembali ke katalog
    </button>

    <!-- Loading -->
    <div v-if="loading" class="text-center text-gray-500 flex items-center justify-center gap-2">
      <Info class="w-4 h-4" />
      Loading product...
    </div>

    <!-- Product Found -->
    <div v-else-if="product" class="grid grid-cols-1 md:grid-cols-2 gap-12">
      <!-- Gambar -->
      <div class="w-full h-[400px] bg-gray-100 rounded-lg overflow-hidden shadow">
        <img
          :src="product.imageUrl"
          :alt="product.name"
          class="w-full h-full object-cover object-center"
        />
      </div>

      <!-- Detail -->
      <div>
        <h1 class="text-4xl font-bold text-gray-800 mb-2">{{ product.name }}</h1>

        <div class="text-sm text-gray-500 mb-4 flex items-center gap-2">
          <Layers class="w-4 h-4" />
          Kategori: {{ categoryMap[product.categoryId] || 'Uncategorized' }}
        </div>

        <p class="text-base text-gray-700 mb-4 flex items-start gap-2">
          <Info class="w-5 h-5 mt-0.5" />
          {{ product.description || 'No description available.' }}
        </p>

        <div class="text-3xl text-blue-600 font-bold mb-6 flex items-center gap-2">
          <Tag class="w-6 h-6" />
          Rp {{ product.price?.toLocaleString() }}
        </div>

        <div class="mb-4">
          <span
            class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium"
            :class="product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
          >
            <PackageCheck class="w-4 h-4" />
            {{ product.stock > 0 ? `Stok Tersedia (${product.stock})` : 'Stok Habis' }}
          </span>
        </div>

        <div class="mb-4 flex flex-col gap-2 text-sm text-gray-600">
          <div class="flex items-center gap-2">
            <Barcode class="w-4 h-4" />
            SKU: {{ product.sku || '-' }}
          </div>
          <div class="flex items-center gap-2">
            <Calendar class="w-4 h-4" />
            <strong>Created At:</strong> {{ formatTimestamp(product.createdAt) }}
          </div>
          <div class="flex items-center gap-2">
            <Clock class="w-4 h-4" />
            <strong>Updated At:</strong> {{ formatTimestamp(product.updatedAt) }}
          </div>
        </div>

        <!-- Tombol Add to Cart -->
        <button
          v-if="isAuthReady"
          :disabled="product.stock <= 0"
          @click="handleAddToCart"
          class="mt-6 w-full inline-flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <ShoppingCart class="w-5 h-5" />
          {{ product.stock > 0 ? 'Add to Cart' : 'Out of Stock' }}
        </button>
      </div>
    </div>
  </div>
</template>
