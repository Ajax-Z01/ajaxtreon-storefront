<script setup lang="ts">
import { CircleDollarSign, ShoppingCart } from 'lucide-vue-next'
import type { Product } from '~/types/Product'

defineProps<{
  product: Product
  categoryName: string
}>()

defineEmits(['addToCart'])
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
        :disabled="product.stock <= 0"
        @click.stop="$emit('addToCart', product.id)"
        class="mt-2 w-full inline-flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-full hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        <ShoppingCart class="w-4 h-4" />
        {{ product.stock > 0 ? 'Add to Cart' : 'Out of Stock' }}
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