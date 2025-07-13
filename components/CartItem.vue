<script setup lang="ts">
const props = defineProps<{
  item: {
    product: { id: string; name: string; price: number; imageUrl?: string }
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
  <div class="flex flex-col sm:flex-row items-center gap-4 bg-white border rounded-xl p-4 shadow-sm transition hover:shadow-md">
    <!-- Optional image if available -->
    <img
      v-if="item.product.imageUrl"
      :src="item.product.imageUrl"
      alt="Product Image"
      class="w-24 h-24 object-cover rounded-lg border"
    />

    <div class="flex-1 w-full">
      <div class="flex flex-col sm:flex-row justify-between sm:items-center w-full">
        <div>
          <h2 class="text-lg font-semibold text-gray-800">{{ item.product.name }}</h2>
          <p class="text-sm text-gray-500">Unit Price: {{ formatPrice(item.product.price) }}</p>
        </div>
        <div class="flex items-center gap-2 mt-2 sm:mt-0">
          <button
            @click="onDecrease"
            class="w-8 h-8 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full font-bold"
          >
            -
          </button>
          <span class="min-w-[24px] text-center">{{ item.quantity }}</span>
          <button
            @click="onIncrease"
            class="w-8 h-8 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full font-bold"
          >
            +
          </button>
        </div>
      </div>

      <div class="flex justify-between items-center mt-4">
        <p class="font-semibold text-blue-600 text-base">
          Total: {{ formatPrice(item.product.price * item.quantity) }}
        </p>
        <button
          @click="onRemove"
          class="text-sm text-red-500 hover:underline"
        >
          🗑️ Remove
        </button>
      </div>
    </div>
  </div>
</template>
