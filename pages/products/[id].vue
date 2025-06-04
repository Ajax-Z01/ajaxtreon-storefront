<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProducts } from '~/composables/useProducts'
import { useCategories } from '~/composables/useCategories'
import { useCart } from '~/composables/useCart'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import type { Product } from '~/types/Product'
import type { Category } from '~/types/Category'

const route = useRoute()
const router = useRouter()
const productId = route.params.id as string

const { getProductById } = useProducts()
const { getCategories } = useCategories()
const { addToCart } = useCart()
const { addToast } = useToast()

// State untuk auth status
const isLoggedIn = ref(false)
const isAuthReady = ref(false)

// Setup Firebase Auth listener
const auth = getAuth()
onAuthStateChanged(auth, (user) => {
  isLoggedIn.value = !!user
  isAuthReady.value = true
})

// Fetch kategori dan buat map id->name
const { data: categories, pending: loadingCategories, error: categoriesError } = await useAsyncData<Category[]>(
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

// Fetch produk by id
const { data: product, pending: loadingProduct, error: productError } = await useAsyncData<Product | null>(
  `product-${productId}`,
  () => getProductById(productId)
)

// Gabungkan loading state
const loading = computed(() => loadingCategories.value || loadingProduct.value)

// Jika produk tidak ditemukan atau error, redirect ke homepage
if ((productError.value || product.value === null) && !loading.value) {
  alert('Product not found.')
  router.push('/')
}

// Handle add to cart
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
  <div class="max-w-5xl mx-auto py-16 px-6">
    <div v-if="loading" class="text-center text-gray-500">Loading product...</div>

    <div v-else-if="product" class="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
      <!-- Gambar Produk -->
      <div class="w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
        <img
          :src="product.imageUrl"
          :alt="product.name"
          class="w-full h-full object-cover"
        />
      </div>

      <!-- Detail Produk -->
      <div>
        <h1 class="text-3xl font-bold text-gray-800 mb-2">{{ product.name }}</h1>
        <p class="text-sm text-gray-500 mb-4">
          Kategori: {{ categoryMap[product.categoryId] || 'Uncategorized' }}
        </p>
        <p class="text-lg text-gray-700 mb-4">{{ product.description || 'No description available.' }}</p>

        <p class="text-2xl text-blue-600 font-bold mb-4">Rp {{ product.price?.toLocaleString() }}</p>

        <div class="mb-6">
          <span
            class="inline-block px-3 py-1 rounded-full text-sm font-semibold"
            :class="product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
          >
            {{ product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock' }}
          </span>
        </div>

        <button
          v-if="isAuthReady"
          :disabled="product.stock <= 0"
          @click="handleAddToCart"
          class="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {{ product.stock > 0 ? 'Add to Cart' : 'Out of Stock' }}
        </button>
      </div>
    </div>
  </div>
</template>
