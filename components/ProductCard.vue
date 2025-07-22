<script setup lang="ts">
import { ref } from 'vue'
import { CircleDollarSign } from 'lucide-vue-next'
import type { Product } from '~/types/Product'
import { useCart } from '~/composables/useCart'
import { useToast } from '~/composables/useToast'

const props = defineProps<{
  product: Product
  categoryName: string
}>()

const isLoading = ref(false)
const { addToCart } = useCart()
const { addToast } = useToast()

const handleAddToCart = async () => {
  if (isLoading.value || props.product.stock <= 0) return

  isLoading.value = true
  try {
    await addToCart(props.product.id, 1)
    addToast('Added to cart!', 'success')
  } catch (error) {
    console.error('Failed to add to cart:', error)
    addToast('Failed to add to cart.', 'error')
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div
    class="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition relative"
  >
    <NuxtLink :to="`/products/${product.id}`" class="block">
      <div class="h-48 bg-gray-100 overflow-hidden">
        <img :src="product.imageUrl" :alt="product.name" class="w-full h-full object-cover product-image" />
      </div>
      <div class="p-5">
        <h3 class="text-lg font-semibold text-gray-800 mb-1 truncate">{{ product.name }}</h3>
        <p class="text-sm text-gray-500 mb-1">{{ categoryName }}</p>
        <p class="text-sm text-gray-600 mb-2 truncate">{{ product.description || 'No description available.' }}</p>
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
        :disabled="product.stock <= 0 || isLoading"
        @click.stop="handleAddToCart"
        class="mt-2 w-full bg-blue-600 text-white py-2 rounded-full hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex justify-center items-center gap-2"
      >
        <template v-if="isLoading">
          <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 4v1m0 14v1m8.66-8.66l-.7.7M5.34 5.34l-.7.7m13.72 0l.7.7M5.34 18.66l.7.7M4 12h1m14 0h1" />
          </svg>
          Loading...
        </template>
        <template v-else>
          {{ product.stock > 0 ? 'Add to Cart' : 'Out of Stock' }}
        </template>
      </button>
    </div>
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
