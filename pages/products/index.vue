<script setup lang="ts">
import { ref, computed } from 'vue'
import { useProducts } from '~/composables/useProducts'
import { useCategories } from '~/composables/useCategories'
import { useCart } from '~/composables/useCart'
import type { Product } from '~/types/Product'
import type { Category } from '~/types/Category'

const { getProducts } = useProducts()
const { getCategories } = useCategories()
const { addToCart } = useCart()
const { addToast } = useToast()

const { data: products, pending: loading } = await useAsyncData<Product[]>('all-products', () => getProducts())
const { data: categories } = await useAsyncData<Category[]>('all-categories', () => getCategories())

const searchTerm = ref('')

const categoryMap = computed(() => {
  const map: Record<string, string> = {}
  categories.value?.forEach(category => {
    map[category.id] = category.name
  })
  return map
})

const filteredProducts = computed(() => {
  if (!searchTerm.value.trim()) return products.value || []

  return (products.value || []).filter(product =>
    product.name.toLowerCase().includes(searchTerm.value.toLowerCase())
  )
})

const handleAddToCart = async (productId: string) => {
  try {
    await addToCart(productId, 1)
    addToast('Added to cart!', 'success')
  } catch (error) {
    console.error('Failed to add to cart:', error)
    addToast('You must be logged in to add items to cart.', 'error')
  }
}
</script>

<template>
  <div class="min-h-screen bg-white">
    <section class="max-w-7xl mx-auto py-16 px-6">
      <h1 class="text-4xl font-bold text-gray-800 mb-10 text-center">🛍️ All Products</h1>
      
      <div class="max-w-md mx-auto mb-8">
        <input
            v-model="searchTerm"
            type="text"
            placeholder="🔍 Search products by name..."
            class="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div v-if="loading" class="text-center text-gray-500">Loading products...</div>

      <div v-else-if="!products?.length" class="text-center text-gray-400">No products found.</div>

      <div v-else class="grid gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        <div
          v-for="product in filteredProducts"
          :key="product.id"
          class="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition relative"
        >
          <NuxtLink :to="`/products/${product.id}`" class="block">
            <div class="h-48 bg-gray-100 overflow-hidden">
              <img :src="product.imageUrl" :alt="product.name" class="w-full h-full object-cover" />
            </div>
            <div class="p-5">
              <h3 class="text-lg font-semibold text-gray-800 mb-1 truncate">
                {{ product.name }}
              </h3>
              <p class="text-sm text-gray-500 mb-1">
                {{ categoryMap[product.categoryId] || 'Uncategorized' }}
              </p>
              <p class="text-sm text-gray-600 mb-2 truncate">
                {{ product.description || 'No description.' }}
              </p>
              <p class="text-blue-600 font-bold text-lg mb-2">
                Rp {{ product.price?.toLocaleString() }}
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
              class="mt-2 w-full bg-blue-600 text-white py-2 rounded-full hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {{ product.stock > 0 ? 'Add to Cart' : 'Out of Stock' }}
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
