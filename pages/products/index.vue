<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { useProducts } from '~/composables/useProducts'
import { useCategories } from '~/composables/useCategories'
import { useCart } from '~/composables/useCart'
import type { Product } from '~/types/Product'
import type { Category } from '~/types/Category'
import ProductCard from '~/components/ProductCard.vue'

const { getProducts } = useProducts()
const { getCategories } = useCategories()
const { addToCart } = useCart()
const { addToast } = useToast()

const { data: products, pending: loading } = await useAsyncData<Product[]>('all-products', () => getProducts())
const { data: categories } = await useAsyncData<Category[]>('all-categories', () => getCategories())

const searchTerm = ref('')
const loadingProductIds = ref<Set<string>>(new Set())

// Firebase Auth Check
const isLoggedIn = ref(false)
const isAuthReady = ref(false)

onMounted(() => {
  const auth = getAuth()
  onAuthStateChanged(auth, user => {
    isLoggedIn.value = !!user
    isAuthReady.value = true
  })
})

// Helper: category name
const categoryMap = computed(() => {
  const map: Record<string, string> = {}
  categories.value?.forEach(category => {
    map[category.id] = category.name
  })
  return map
})

// Search filter
const filteredProducts = computed(() => {
  if (!searchTerm.value.trim()) return products.value || []
  return (products.value || []).filter(product =>
    product.name.toLowerCase().includes(searchTerm.value.toLowerCase())
  )
})

// Add to cart handler with auth + loading indicator
const handleAddToCart = async (productId: string) => {
  if (!isAuthReady.value || !isLoggedIn.value) {
    addToast('You must be logged in to add items to cart.', 'error')
    return
  }

  if (loadingProductIds.value.has(productId)) return
  loadingProductIds.value.add(productId)

  try {
    await addToCart(productId, 1)
    addToast('Added to cart!', 'success')
  } catch (error) {
    console.error('Failed to add to cart:', error)
    addToast('Failed to add to cart.', 'error')
  } finally {
    loadingProductIds.value.delete(productId)
  }
}

const isProductLoading = (id: string) => loadingProductIds.value.has(id)
</script>

<template>
  <div class="min-h-screen bg-white">
    <section class="max-w-7xl mx-auto py-16 px-6">
      <h1 class="text-4xl font-bold text-gray-800 mb-10 text-center">🛍️ All Products</h1>

      <!-- Search -->
      <div class="max-w-md mx-auto mb-8">
        <input
          v-model="searchTerm"
          type="text"
          placeholder="🔍 Search products by name..."
          class="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="grid gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        <div v-for="i in 8" :key="i" class="animate-pulse bg-white rounded-2xl p-5 border">
          <div class="h-48 bg-gray-200 rounded mb-4"></div>
          <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div class="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div class="h-4 bg-gray-200 rounded w-full"></div>
        </div>
      </div>

      <!-- No Products -->
      <div v-else-if="!products?.length" class="text-center text-gray-400">
        No products available.
      </div>

      <!-- Product Grid -->
      <div v-else class="grid gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        <ProductCard
          v-for="product in filteredProducts"
          :key="product.id"
          :product="product"
          :categoryName="categoryMap[product.categoryId] || 'Uncategorized'"
          :isLoading="isProductLoading(product.id)"
          @addToCart="handleAddToCart"
        />
      </div>
    </section>
  </div>
</template>
