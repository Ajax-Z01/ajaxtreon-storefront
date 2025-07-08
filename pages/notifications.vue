<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useNotifications } from '~/composables/useNotifications'
import { LoaderCircle, CheckCircle2, Trash2, CheckCircle, Info, AlertTriangle, XCircle } from 'lucide-vue-next'
import type { Notification } from '~/types/Notification'
import { formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'

const { getNotifications, markAsRead, deleteNotification } = useNotifications()

const notifications = ref<Notification[]>([])
const loading = ref(false)

const loadNotifications = async () => {
  loading.value = true
  try {
    notifications.value = await getNotifications()
  } catch (error) {
    console.error('Failed to load notifications:', error)
  } finally {
    loading.value = false
  }
}

const handleMarkAsRead = async (id: string) => {
  const notif = notifications.value.find(n => n.id === id)
  if (!notif) return

  notif.read = true
  try {
    await markAsRead(id)
  } catch (error) {
    console.error('Failed to mark as read:', error)
    notif.read = false
  }
}

const handleDelete = async (id: string) => {
  if (!confirm('Yakin ingin menghapus notifikasi ini?')) return

  const index = notifications.value.findIndex(n => n.id === id)
  if (index === -1) return

  const removed = notifications.value.splice(index, 1)[0]
  try {
    await deleteNotification(id)
  } catch (error) {
    console.error('Failed to delete notification:', error)
    notifications.value.splice(index, 0, removed)
  }
}

function formatRelativeDate(date: any): string {
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
}

const iconByType = {
  success: CheckCircle,
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
}

onMounted(() => {
  loadNotifications()
})
</script>

<template>
  <div class="p-4 sm:p-6 max-w-3xl mx-auto">
    <h1 class="text-xl font-bold mb-4 flex items-center gap-2">
      Notifikasi
      <span
        v-if="notifications.some(n => !n.read)"
        class="text-xs bg-red-600 text-white rounded-full px-2 py-0.5"
      >
        {{ notifications.filter(n => !n.read).length }} belum dibaca
      </span>
    </h1>

    <div v-if="loading" class="flex justify-center items-center h-40">
      <LoaderCircle class="animate-spin w-8 h-8 text-gray-400" />
    </div>

    <div v-else-if="notifications.length === 0" class="text-center text-gray-500 mt-10">
      Tidak ada notifikasi.
    </div>

    <transition-group name="fade" tag="div" class="space-y-4">
      <div
        v-for="notif in notifications"
        :key="notif.id"
        :class="[
          'bg-white rounded-xl shadow p-4 border flex justify-between items-start',
          notif.read ? 'border-gray-200' : 'border-blue-500 bg-blue-50'
        ]"
      >
        <div class="flex gap-3 max-w-[calc(100%-100px)]">
          <component
            :is="iconByType[notif.type] || Info"
            class="w-6 h-6 flex-shrink-0"
            :class="{
              'text-green-600': notif.type === 'success',
              'text-blue-600': notif.type === 'info',
              'text-yellow-500': notif.type === 'warning',
              'text-red-600': notif.type === 'error',
            }"
            aria-hidden="true"
          />
          <div>
            <h2 class="font-semibold text-base text-gray-900 truncate" :title="notif.title">{{ notif.title }}</h2>
            <p class="text-sm text-gray-700 mb-1 truncate" :title="notif.message">{{ notif.message }}</p>
            <span class="text-xs uppercase font-medium text-gray-500">{{ notif.type }}</span>
          </div>
        </div>

        <div class="flex flex-col items-end gap-2 mt-1">
          <span class="text-xs text-gray-400 select-none whitespace-nowrap">
            {{ formatRelativeDate(notif.createdAt) }}
          </span>

          <div class="flex gap-2">
            <button
              v-if="!notif.read"
              @click="handleMarkAsRead(notif.id)"
              class="text-sm flex items-center gap-1 text-blue-600 hover:underline"
              title="Tandai sebagai dibaca"
            >
              <CheckCircle2 class="w-4 h-4" /> Tandai dibaca
            </button>
            <button
              @click="handleDelete(notif.id)"
              class="text-sm flex items-center gap-1 text-red-500 hover:underline"
              title="Hapus notifikasi"
            >
              <Trash2 class="w-4 h-4" /> Hapus
            </button>
          </div>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
