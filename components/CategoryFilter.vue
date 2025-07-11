<script setup lang="ts">
import { Tag, Loader } from 'lucide-vue-next'
import type { Category } from '~/types/Category'

const props = defineProps<{
  categories: Category[]
  selectedCategoryId: string | null
  loadingCategories: boolean
}>()

const emit = defineEmits(['select'])

const buttonClass = (id: string | null) => {
  return [
    'px-4 py-2 rounded-full border transition',
    id === props.selectedCategoryId
      ? 'bg-blue-600 text-white border-blue-600'
      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
  ]
}
</script>

<template>
  <section class="max-w-7xl mx-auto py-16 px-6">
    <h2 class="text-3xl font-bold text-gray-800 mb-8 text-center flex justify-center items-center gap-2">
      <Tag class="w-6 h-6" /> Category
    </h2>

    <div v-if="loadingCategories" class="text-center text-gray-500 py-10 flex justify-center items-center gap-2">
      <Loader class="w-5 h-5 animate-spin" /> Loading categories...
    </div>

    <div v-else class="flex flex-wrap justify-center gap-4">
      <button
        @click="$emit('select', null)"
        :class="buttonClass(null)"
      >
        All
      </button>

      <button
        v-for="category in categories"
        :key="category.id"
        @click="$emit('select', category.id)"
        :class="buttonClass(category.id)"
      >
        {{ category.name }}
      </button>
    </div>
  </section>
</template>
