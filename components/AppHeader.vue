<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { LogOut, User, Menu, ShoppingCart, Bell } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useAuth } from '~/composables/useAuth'
import { useToast } from '~/composables/useToast'
import { useCart } from '~/composables/useCart'
import { useNotifications } from '~/composables/useNotifications'
import type { Notification } from '~/types/Notification'
import { formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'

const props = defineProps<{
  route: any
  isAuthenticated: boolean
}>()

const showMobileMenu = ref(false)
const showNotificationDropdown = ref(false)
const unreadCount = ref(0)
const recentNotifications = ref<Notification[]>([])

const router = useRouter()
const { logout } = useAuth()
const { addToast } = useToast()
const { cartCount, subscribeCartItems } = useCart()
const { getNotifications, markAsRead } = useNotifications()

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

const fetchNotifications = async () => {
  try {
    const notifications = await getNotifications()
    unreadCount.value = notifications.filter(n => !n.read).length
    recentNotifications.value = notifications.slice(0, 5)
  } catch (err) {
    console.error('Failed to fetch notifications:', err)
  }
}

const toggleNotificationDropdown = async () => {
  if (!showNotificationDropdown.value) {
    await fetchNotifications()
  }
  showNotificationDropdown.value = !showNotificationDropdown.value
}

const handleClickOutside = (event: MouseEvent) => {
  const dropdown = document.querySelector('.notification-dropdown')
  if (dropdown && !dropdown.contains(event.target as Node)) {
    showNotificationDropdown.value = false
  }
}

const handleMarkAsRead = async (id: string) => {
  const notif = recentNotifications.value.find(n => n.id === id)
  if (!notif) return

  if (notif.read) {
    router.push('/notifications')
    showNotificationDropdown.value = false
    return
  }

  notif.read = true
  unreadCount.value = unreadCount.value > 0 ? unreadCount.value - 1 : 0

  try {
    await markAsRead(id)
  } catch (error) {
    console.error('Failed to mark as read:', error)
    notif.read = false
    unreadCount.value += 1
  }

  router.push('/notifications')
  showNotificationDropdown.value = false
}


function formatRelativeDate(date: any): string {
  try {
    if (!date) return '-'

    let d: Date

    if (typeof date?._seconds === 'number') {
      d = new Date(date._seconds * 1000)
    } else if (typeof date?.seconds === 'number') {
      d = new Date(date.seconds * 1000)
    } else if (typeof date === 'string' || typeof date === 'number') {
      d = new Date(date)
    } else if (date instanceof Date) {
      d = date
    } else {
      return '-'
    }

    if (isNaN(d.getTime())) return '-'

    return formatDistanceToNow(d, { addSuffix: true, locale: id })
  } catch (e) {
    console.warn('Invalid date in formatRelativeDate:', date)
    return '-'
  }
}

let unsubscribe: (() => void) | null = null

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  if (props.isAuthenticated) {
    fetchNotifications()
    unsubscribe = subscribeCartItems()
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
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
        <NuxtLink to="/" class="hover:text-blue-600" :class="{ 'text-blue-700 font-semibold': props.route.path === '/' }">Home</NuxtLink>
        <NuxtLink to="/products" class="hover:text-blue-600" :class="{ 'text-blue-700 font-semibold': props.route.path === '/products' }">Products</NuxtLink>

        <button @click="handleCartClick" class="relative hover:text-blue-600" :class="{ 'text-blue-700 font-semibold': props.route.path === '/cart' }">
          <ShoppingCart class="inline-block w-5 h-5" />
          <span v-if="cartCount > 0" class="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {{ cartCount }}
          </span>
        </button> 

        <!-- Auth Actions -->
        <template v-if="!props.isAuthenticated">
          <NuxtLink to="/auth/login" class="px-4 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition">
            Login
          </NuxtLink>
        </template>
        <template v-else>
          <!-- Notification Dropdown -->
          <div class="relative">
            <button @click.stop="toggleNotificationDropdown" class="relative hover:text-blue-600" :class="{ 'text-blue-700 font-semibold': props.route.path === '/notifications' }">
              <Bell class="inline-block w-5 h-5" />
              <span v-if="unreadCount > 0" class="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {{ unreadCount }}
              </span>
            </button>

            <!-- Dropdown Content -->
            <div
              v-if="showNotificationDropdown"
              class="notification-dropdown absolute right-0 mt-2 w-80 bg-white shadow-lg border rounded-lg z-50"
            >
              <div class="p-3 border-b font-semibold text-sm text-gray-700">Notifikasi Terbaru</div>
              <ul class="max-h-64 overflow-y-auto divide-y">
                <li
                  v-for="notif in recentNotifications"
                  :key="notif.id"
                  class="px-4 py-2 text-sm cursor-pointer hover:bg-gray-50"
                  :class="notif.read ? 'text-gray-600' : 'bg-blue-50 text-blue-800 font-semibold'"
                  @click="() => handleMarkAsRead(notif.id)"
                >
                  <div class="flex justify-between items-start">
                    <div>
                      <div>{{ notif.title }}</div>
                      <div class="text-xs text-gray-500">{{ formatRelativeDate(notif.createdAt) }}</div>
                    </div>
                    <span
                      v-if="!notif.read"
                      class="ml-2 mt-1 inline-block w-2 h-2 rounded-full bg-blue-500"
                      title="Belum dibaca"
                    />
                  </div>
                </li>

                <li
                  v-if="recentNotifications.length === 0"
                  class="px-4 py-3 text-center text-sm text-gray-500"
                >
                  Tidak ada notifikasi.
                </li>
              </ul>
              <div class="border-t px-4 py-2">
                <button class="text-sm text-blue-600 hover:underline w-full text-left" @click="() => { router.push('/notifications'); showNotificationDropdown = false }">
                  Lihat semua notifikasi →
                </button>
              </div>
            </div>
          </div>
          <NuxtLink to="/profile" class="flex items-center gap-2 hover:text-blue-600 transition">
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
      <NuxtLink to="/" class="block hover:text-blue-600" @click="() => (showMobileMenu = false)">Home</NuxtLink>
      <NuxtLink to="/products" class="block hover:text-blue-600" @click="() => (showMobileMenu = false)">Products</NuxtLink>
      <button class="block hover:text-blue-600 text-left w-full" @click="() => { showMobileMenu = false; handleCartClick() }">Cart</button>
      <button class="block hover:text-blue-600 text-left w-full" @click="() => { showMobileMenu = false; handleNotificationClick() }">
        Notifications
        <span v-if="unreadCount > 0" class="ml-2 text-sm bg-red-500 text-white px-2 rounded-full">
          {{ unreadCount }}
        </span>
      </button>
      <template v-if="!props.isAuthenticated">
        <NuxtLink to="/auth/login" class="block text-blue-600 font-semibold" @click="() => (showMobileMenu = false)">Login</NuxtLink>
      </template>
      <template v-else>
        <NuxtLink to="/profile" class="block hover:text-blue-600" @click="() => (showMobileMenu = false)">My Account</NuxtLink>
        <button class="text-red-500 hover:text-red-600 block" @click="logoutUser">Logout</button>
      </template>
    </div>
  </header>
</template>
