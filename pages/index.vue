<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { useProducts } from '~/composables/useProducts'
import { useCategories } from '~/composables/useCategories'
import { useCart } from '~/composables/useCart'
import type { Product } from '~/types/Product'
import type { Category } from '~/types/Category'
import { Package } from 'lucide-vue-next'
import HeroSection from '~/components/HeroSection.vue'
import CategoryFilter from '~/components/CategoryFilter.vue'
import ProductCard from '~/components/ProductCard.vue'

const { getProducts } = useProducts()
const { getCategories } = useCategories()
const { addToCart } = useCart()

const { data: products, pending: loading, refresh } = await useAsyncData<Product[]>('products', () => getProducts())
const { data: categories, pending: loadingCategories } = await useAsyncData<Category[]>('categories', () => getCategories())

const categoryMap = computed(() => {
  const map: Record<string, string> = {}
  categories.value?.forEach(category => {
    map[category.id] = category.name
  })
  return map
})

const isLoggedIn = ref(false)
const isAuthReady = ref(false)
const { addToast } = useToast()
const selectedCategoryId = ref<string | null>(null)
const loadingProductIds = ref<Set<string>>(new Set())

const filteredProducts = computed(() => {
  if (!selectedCategoryId.value) return products.value || []
  return (products.value || []).filter(p => p.categoryId === selectedCategoryId.value)
})

const selectCategory = (categoryId: string | null) => {
  selectedCategoryId.value = categoryId
}

const handleAddToCart = async (productId: string) => {
  if (!isLoggedIn.value || !isAuthReady.value) {
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

onMounted(() => {
  const auth = getAuth()
  onAuthStateChanged(auth, user => {
    isLoggedIn.value = !!user
    isAuthReady.value = true
  })
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <HeroSection :isLoggedIn="isLoggedIn" :isAuthReady="isAuthReady" />

    <CategoryFilter
      :categories="categories || []"
      :selectedCategoryId="selectedCategoryId"
      :loadingCategories="loadingCategories"
      @select="selectCategory"
    />

    <section class="max-w-7xl mx-auto py-16 px-6">
      <h2 class="text-3xl font-bold text-gray-800 mb-8 text-center flex justify-center items-center gap-2">
        <Package class="w-6 h-6" /> Featured Products
      </h2>
      
      <div v-if="loading" class="grid gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        <div v-for="i in 8" :key="i" class="animate-pulse bg-white rounded-2xl p-5 border">
          <div class="h-48 bg-gray-200 rounded mb-4"></div>
          <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div class="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div class="h-4 bg-gray-200 rounded w-full"></div>
        </div>
      </div>

      <div v-else-if="filteredProducts.length === 0" class="text-center text-gray-500 py-10">
        No products available in this category.
      </div>

      <div v-else class="grid gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        <ProductCard
          v-for="product in filteredProducts"
          :key="product.id"
          :product="product"
          :categoryName="categoryMap[product.categoryId] || 'Uncategorized'"
          :isLoading="loadingProductIds.has(product.id)"
          @addToCart="handleAddToCart"
        />
      </div>
    </section>
  </div>
</template>