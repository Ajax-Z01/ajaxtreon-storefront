<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'

const props = defineProps<{
  item: {
    product: { id: string; name: string; price: number }
    quantity: number
  }
}>()

const emit = defineEmits<{
  (e: 'increase', productId: string): void
  (e: 'decrease', productId: string): void
  (e: 'remove', productId: string): void
}>()

const formatPrice = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
  }).format(value)

const onIncrease = () => emit('increase', props.item.product.id)
const onDecrease = () => emit('decrease', props.item.product.id)
const onRemove = () => emit('remove', props.item.product.id)
</script>

<template>
  <div class="flex items-center justify-between bg-white shadow p-4 rounded-lg">
    <div>
      <h2 class="font-semibold">{{ item.product.name }}</h2>
      <p class="text-sm text-gray-500">Price: {{ formatPrice(item.product.price || 0) }}</p>
    </div>
    <div class="flex items-center space-x-2">
      <button @click="onDecrease" class="px-2 py-1 bg-gray-200 rounded">-</button>
      <span>{{ item.quantity }}</span>
      <button @click="onIncrease" class="px-2 py-1 bg-gray-200 rounded">+</button>
    </div>
    <div class="text-right">
      <p>{{ formatPrice((item.product.price || 0) * item.quantity) }}</p>
      <button @click="onRemove" class="text-red-500 text-sm hover:underline">Remove</button>
    </div>
  </div>
</template>
