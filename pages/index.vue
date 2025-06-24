<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { useRouter } from 'vue-router'
import { useProducts } from '~/composables/useProducts'
import { useCategories } from '~/composables/useCategories'
import { useCart } from '~/composables/useCart'
import type { Product } from '~/types/Product'
import type { Category } from '~/types/Category'
import { ShoppingCart, Tag, Loader, AlertCircle, Package, CircleDollarSign, Boxes } from 'lucide-vue-next'

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

const router = useRouter()
const isLoggedIn = ref(false)
const isAuthReady = ref(false)
const { addToast } = useToast()
const selectedCategoryId = ref<string | null>(null)

const filteredProducts = computed(() => {
  if (!selectedCategoryId.value) return products.value || []
  return (products.value || []).filter(p => p.categoryId === selectedCategoryId.value)
})

const selectCategory = (categoryId: string | null) => {
  selectedCategoryId.value = categoryId
}

const handleAddToCart = async (productId: string) => {
  try {
    await addToCart(productId, 1)
    addToast('Added to cart!', 'success')
  } catch (error) {
    console.error('Failed to add to cart:', error)
    addToast('You must be logged in to add items to cart.', 'error')
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
    <!-- Hero Section -->
    <section class="bg-gradient-to-r from-blue-700 to-indigo-800 text-white py-20 px-6">
      <div class="max-w-7xl mx-auto text-center">
        <h1 class="text-5xl font-extrabold mb-4 flex justify-center items-center gap-2">
          <Boxes class="w-8 h-8" /> Ajaxtreon Store
        </h1>
        <p class="text-xl text-blue-100 mb-8">Find and manage your business inventory with ease.</p>
        <div v-if="isAuthReady" class="flex justify-center gap-4 flex-wrap">
          <button
            v-if="isLoggedIn"
            @click="router.push('/orders')"
            class="bg-white text-blue-700 font-semibold py-2 px-6 rounded-full hover:bg-blue-100 transition"
          >
            My Orders
          </button>
          <template v-else>
            <button
              @click="router.push('/auth/login')"
              class="bg-white text-blue-700 font-semibold py-2 px-6 rounded-full hover:bg-blue-100 transition"
            >
              Login
            </button>
            <button
              @click="router.push('/auth/register')"
              class="border-2 border-white text-white font-semibold py-2 px-6 rounded-full hover:bg-white hover:text-blue-700 transition"
            >
              Register
            </button>
          </template>
        </div>
      </div>
    </section>
    
    <!-- Category Section -->
    <section class="max-w-7xl mx-auto py-16 px-6">
      <h2 class="text-3xl font-bold text-gray-800 mb-8 text-center flex justify-center items-center gap-2">
        <Tag class="w-6 h-6" /> Category
      </h2>

      <div v-if="loadingCategories" class="text-center text-gray-500 py-10 flex justify-center items-center gap-2">
        <Loader class="w-5 h-5 animate-spin" /> Loading categories...
      </div>

      <div v-else class="flex flex-wrap justify-center gap-4">
        <button
          @click="selectCategory(null)"
          :class="[
            'px-4 py-2 rounded-full border transition',
            selectedCategoryId === null ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
          ]"
        >
          All
        </button>

        <button
          v-for="category in categories"
          :key="category.id"
          @click="selectCategory(category.id)"
          :class="[
            'px-4 py-2 rounded-full border transition',
            selectedCategoryId === category.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
          ]"
        >
          {{ category.name }}
        </button>
        
      </div>
    </section>

    <!-- Product Section -->
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
      
      <div v-if="filteredProducts.length === 0 && !loading" class="text-center text-gray-500 py-10 flex justify-center items-center gap-2">
        <AlertCircle class="w-5 h-5" /> No products available in this category.
      </div>

      <div v-else class="grid gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        <div
          v-for="product in filteredProducts"
          :key="product.id"
          class="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition relative"
        >
          <NuxtLink
            :to="`/products/${product.id}`"
            class="block"
          >
            <div class="h-48 bg-gray-100 overflow-hidden">
              <img
                :src="product.imageUrl"
                :alt="product.name"
                class="w-full h-full object-cover product-image"
              />
            </div>
            <div class="p-5">
              <h3 class="text-lg font-semibold text-gray-800 mb-1 truncate">
                {{ product.name }}
              </h3>
              <p class="text-sm text-gray-500 mb-1">
                {{ categoryMap[product.categoryId] || 'Uncategorized' }}
              </p>
              <p class="text-sm text-gray-600 mb-2 truncate">
                {{ product.description || 'No description available.' }}
              </p>
              <p class="text-blue-600 font-bold text-lg mb-3 flex items-center gap-1">
                <CircleDollarSign class="w-4 h-4" /> Rp {{ product.price?.toLocaleString() }}
              </p>

              <div
                v-if="product.stock <= 0"
                class="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded"
              >
                Out of Stock
              </div>
            </div>
          </NuxtLink>

          <div class="px-5 pb-5">
            <button
              :disabled="product.stock <= 0"
              @click.stop="handleAddToCart(product.id)"
              class="mt-2 w-full inline-flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-full hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <ShoppingCart class="w-4 h-4" />
              {{ product.stock > 0 ? 'Add to Cart' : 'Out of Stock' }}
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.product-image {
  transition: transform 0.3s ease;
}
.product-image:hover {
  transform: scale(1.05);
}
</style>
