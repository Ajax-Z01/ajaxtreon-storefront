<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProducts } from '~/composables/useProducts'
import { useCategories } from '~/composables/useCategories'
import { useCart } from '~/composables/useCart'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import type { Product } from '~/types/Product'

const route = useRoute()
const router = useRouter()
const productId = route.params.id as string

const { getProductById } = useProducts()
const { getCategories } = useCategories()
const { addToCart } = useCart()

const product = ref<Product | null>(null)
const categoryMap = ref<Record<string, string>>({})
const isLoggedIn = ref(false)
const isAuthReady = ref(false)
const loading = ref(true)

const fetchProduct = async () => {
  try {
    const result = await getProductById(productId)
    if (!result) {
      alert('Product not found.')
      router.push('/')
      return
    }
    product.value = result
  } catch (error) {
    console.error('Error fetching product:', error)
    router.push('/')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  const auth = getAuth()
  onAuthStateChanged(auth, user => {
    isLoggedIn.value = !!user
    isAuthReady.value = true
  })

  const categories = await getCategories()
  categoryMap.value = Object.fromEntries(categories.map(c => [c.id, c.name]))

  await fetchProduct()
})

const handleAddToCart = async () => {
  try {
    if (!isLoggedIn.value) {
      alert('You must be logged in to add items to cart.')
      return
    }

    await addToCart(productId, 1)
    alert('Added to cart!')
  } catch (error) {
    console.error('Failed to add to cart:', error)
    alert('Failed to add item to cart.')
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
          :disabled="product.stock <= 0 || !isLoggedIn"
          @click="handleAddToCart"
          class="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {{ product.stock > 0 ? (isLoggedIn ? 'Add to Cart' : 'Login to Add to Cart') : 'Out of Stock' }}
        </button>
      </div>
    </div>
  </div>
</template>
