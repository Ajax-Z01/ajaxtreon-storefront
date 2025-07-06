<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { LogOut, User, Menu, ShoppingCart, Bell } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useAuth } from '~/composables/useAuth'
import { useToast } from '~/composables/useToast'
import { useCart } from '~/composables/useCart'
import { useNotifications } from '~/composables/useNotifications'

const props = defineProps<{
  route: any
  isAuthenticated: boolean
}>()

const showMobileMenu = ref(false)
const router = useRouter()
const { logout } = useAuth()
const { addToast } = useToast()
const { cartCount, subscribeCartItems } = useCart()

const { getNotifications } = useNotifications()
const unreadCount = ref(0)

const fetchNotifications = async () => {
  try {
    const notifications = await getNotifications()
    unreadCount.value = notifications.filter(n => !n.read).length
  } catch (error) {
    console.error('Failed to fetch notifications:', error)
  }
}

const logoutUser = async () => {
  await logout()
  router.push('/auth/login')
  showMobileMenu.value = false
}

const handleCartClick = () => {
  if (!props.isAuthenticated) {
    addToast('Please login to access your cart.', 'warning')
    return
  }
  router.push('/cart')
  showMobileMenu.value = false
}

const handleNotificationClick = () => {
  router.push('/notifications')
  showMobileMenu.value = false
}

let unsubscribe: (() => void) | null = null

onMounted(() => {
  if (props.isAuthenticated) {
    fetchNotifications()
    unsubscribe = subscribeCartItems()
  }
})

onUnmounted(() => {
  unsubscribe?.()
})
</script>

<template>
  <header class="bg-white shadow-md sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
      <!-- Logo -->
      <NuxtLink to="/" class="text-2xl font-bold text-blue-700 hover:opacity-80">
        Ajaxtreon
      </NuxtLink>

      <!-- Desktop Nav -->
      <nav class="hidden md:flex items-center space-x-6 text-sm font-medium text-gray-700">
        <NuxtLink
          to="/"
          class="hover:text-blue-600 transition"
          :class="{ 'text-blue-700 font-semibold': props.route.path === '/' }"
        >
          Home
        </NuxtLink>

        <NuxtLink
          to="/products"
          class="hover:text-blue-600 transition"
          :class="{ 'text-blue-700 font-semibold': props.route.path === '/products' }"
        >
          Products
        </NuxtLink>

        <button
          @click="handleCartClick"
          class="relative hover:text-blue-600 transition"
          :class="{ 'text-blue-700 font-semibold': props.route.path === '/cart' }"
        >
          <ShoppingCart class="inline-block w-5 h-5" />
          <span
            v-if="cartCount > 0"
            class="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
          >
            {{ cartCount }}
          </span>
        </button>
        
        <button
          @click="handleNotificationClick"
          class="relative hover:text-blue-600 transition"
          :class="{ 'text-blue-700 font-semibold': props.route.path === '/notifications' }"
        >
          <Bell class="inline-block w-5 h-5" />
          <span
            v-if="unreadCount > 0"
            class="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
          >
            {{ unreadCount }}
          </span>
        </button>

        <template v-if="!props.isAuthenticated">
          <NuxtLink
            to="/auth/login"
            class="px-4 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            Login
          </NuxtLink>
        </template>

        <template v-else>
          <NuxtLink
            to="/profile"
            class="flex items-center gap-2 hover:text-blue-600 transition"
          >
            <User class="w-4 h-4" />
            <span>My Account</span>
          </NuxtLink>

          <button @click="logoutUser" class="text-red-500 hover:text-red-600 flex items-center gap-1">
            <LogOut class="w-4 h-4" />
            Logout
          </button>
        </template>
      </nav>

      <!-- Mobile Menu Button -->
      <button @click="showMobileMenu = !showMobileMenu" class="md:hidden text-gray-700">
        <Menu class="w-6 h-6" />
      </button>
    </div>

    <!-- Mobile Menu -->
    <div v-if="showMobileMenu" class="md:hidden px-6 py-4 bg-gray-50 border-t space-y-3">
      <NuxtLink to="/" class="block hover:text-blue-600" @click="() => (showMobileMenu = false)">
        Home
      </NuxtLink>
      <NuxtLink to="/products" class="block hover:text-blue-600" @click="() => (showMobileMenu = false)">
        Products
      </NuxtLink>
      <button
        class="block hover:text-blue-600 text-left w-full"
        @click="() => { showMobileMenu = false; handleCartClick() }"
      >
        Cart
      </button>
      <button
        class="block hover:text-blue-600 text-left w-full"
        @click="() => { showMobileMenu = false; handleNotificationClick() }"
      >
        Notifications
        <span v-if="unreadCount > 0" class="ml-2 text-sm bg-red-500 text-white px-2 rounded-full">
          {{ unreadCount }}
        </span>
      </button>
      <template v-if="!props.isAuthenticated">
        <NuxtLink to="/auth/login" class="block text-blue-600 font-semibold" @click="() => (showMobileMenu = false)">
          Login
        </NuxtLink>
      </template>
      <template v-else>
        <NuxtLink to="/profile" class="block hover:text-blue-600" @click="() => (showMobileMenu = false)">
          My Account
        </NuxtLink>
        <button
          class="text-red-500 hover:text-red-600 block"
          @click="logoutUser"
        >
          Logout
        </button>
      </template>
    </div>
  </header>
</template>
