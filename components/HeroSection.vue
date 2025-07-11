<script setup lang="ts">
import { Boxes } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

const router = useRouter()
defineProps<{ isLoggedIn: boolean; isAuthReady: boolean }>()
</script>

<template>
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
</template>
