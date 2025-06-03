<script setup lang="ts">
import { useToast } from '~/composables/useToast'
const { toasts } = useToast()
</script>

<template>
  <div class="fixed bottom-4 right-4 z-50">
    <TransitionGroup name="toast" tag="div" class="flex flex-col items-end space-y-2">
        <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="[
            'rounded px-4 py-2 shadow-lg text-white animate-fade-in-up',
            toast.type === 'success' && 'bg-green-600',
            toast.type === 'error' && 'bg-red-600',
            toast.type === 'info' && 'bg-blue-600'
        ]"
        >
        {{ toast.message }}
        </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>