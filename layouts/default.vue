<script setup lang="ts">
import { watch, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from '~/composables/useAuth'
import { useCart } from '~/composables/useCart'
import ToastContainer from '~/components/ToastContainer.vue'
import AppHeader from '~/components/AppHeader.vue'
import AppFooter from '~/components/AppFooter.vue'

const route = useRoute()
const { initAuth, authReady, currentUser } = useAuth()
const { subscribeCartItems, cartCount } = useCart()

await initAuth()

let unsubscribe: (() => void) | null = null

watch(
  () => currentUser.value,
  (user) => {
    if (user) {
      unsubscribe = subscribeCartItems()
    } else {
      if (unsubscribe) {
        unsubscribe()
        unsubscribe = null
      }
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
})
</script>

<template>
  <div v-if="authReady">
    <div class="flex flex-col min-h-screen">
      <client-only>
        <AppHeader :route="route" :isAuthenticated="!!currentUser" :cartCount="cartCount" />
      </client-only>
      <main class="flex-grow bg-gray-50">
        <NuxtPage />
      </main>
      <AppFooter />
    </div>
  </div>

  <div v-else class="flex justify-center items-center h-screen">
    <p>Loading authentication...</p>
  </div>
  
  <ToastContainer />
</template>
