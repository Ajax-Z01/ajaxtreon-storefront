<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCustomers } from '~/composables/useCustomers'
import { getCurrentUserWithToken } from '~/composables/getCurrentUser'
import type { Customer, CustomerUpdatePayload } from '~/types/Customer'
import { User, ShoppingCart, Loader, AlertCircle, Mail, Phone, MapPin, CreditCard, BadgePercent, StickyNote, Calendar, Clock, Pencil, Save, X } from 'lucide-vue-next'

const { getCustomerByFirebaseUid, updateCustomer, ensureToken } = useCustomers()
const { addToast } = useToast() 

const customer = ref<Customer | null>(null)
const isEditing = ref(false)
const isLoading = ref(true)
const isSaving = ref(false)
const errorMessage = ref('')

const form = ref<CustomerUpdatePayload>({
  name: '',
  email: '',
  phone: '',
  address: '',
})

onMounted(async () => {
  try {
    await ensureToken()
    const { user } = await getCurrentUserWithToken()

    if (!user || !user.uid) {
    throw new Error('User is not authenticated')
    }

    const customerData = await getCustomerByFirebaseUid(user.uid)
    if (customerData) {
      customer.value = customerData
      form.value = {
        name: customerData.name,
        email: customerData.email || '',
        phone: customerData.phone || '',
        address: customerData.address || '',
      }
    }
  } catch (err) {
    console.error(err)
    errorMessage.value = 'Failed to load profile.'
  } finally {
    isLoading.value = false
  }
})

const saveChanges = async () => {
  if (!customer.value) return
  isSaving.value = true
  try {
    const updated = await updateCustomer(customer.value.id, form.value)
    customer.value = updated
    isEditing.value = false
    addToast('Profile updated successfully.', 'success')
  } catch (err) {
    console.error(err)
    errorMessage.value = 'Failed to update profile.'
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto py-12 px-4">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-3xl font-bold flex items-center gap-2">
        <User class="w-6 h-6 text-blue-600" /> My Profile
      </h1>
      <NuxtLink
        to="/orders"
        class="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded focus:outline-none focus:ring focus:ring-indigo-300"
      >
        <ShoppingCart class="w-4 h-4" />
        View Orders
      </NuxtLink>
    </div>

    <!-- Loading & Error State -->
    <div v-if="isLoading" class="text-gray-500 flex items-center gap-2">
      <Loader class="w-4 h-4 animate-spin" />
      Loading...
    </div>
    <div v-else-if="errorMessage" class="text-red-500 flex items-center gap-2">
      <AlertCircle class="w-4 h-4" />
      {{ errorMessage }}
    </div>

    <!-- Form Content -->
    <div v-else class="space-y-6">
      <!-- Editable Form -->
      <div class="bg-white shadow rounded-lg p-6 grid gap-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label class="block">
            <span class="text-sm font-semibold text-gray-700 flex items-center gap-1">
              <User class="w-4 h-4" /> Name
            </span>
            <input
              v-model="form.name"
              :disabled="!isEditing"
              class="mt-1 w-full border rounded px-3 py-2 focus:ring focus:ring-blue-200 disabled:bg-gray-100"
            />
          </label>

          <label class="block">
            <span class="text-sm font-semibold text-gray-700 flex items-center gap-1">
              <Mail class="w-4 h-4" /> Email
            </span>
            <input
              v-model="form.email"
              :disabled="!isEditing"
              class="mt-1 w-full border rounded px-3 py-2 focus:ring focus:ring-blue-200 disabled:bg-gray-100"
            />
          </label>

          <label class="block">
            <span class="text-sm font-semibold text-gray-700 flex items-center gap-1">
              <Phone class="w-4 h-4" /> Phone
            </span>
            <input
              v-model="form.phone"
              :disabled="!isEditing"
              class="mt-1 w-full border rounded px-3 py-2 focus:ring focus:ring-blue-200 disabled:bg-gray-100"
            />
          </label>

          <label class="block md:col-span-2">
            <span class="text-sm font-semibold text-gray-700 flex items-center gap-1">
              <MapPin class="w-4 h-4" /> Address
            </span>
            <textarea
              v-model="form.address"
              :disabled="!isEditing"
              rows="2"
              class="mt-1 w-full border rounded px-3 py-2 focus:ring focus:ring-blue-200 disabled:bg-gray-100"
            />
          </label>
        </div>
      </div>

      <!-- Additional Info -->
      <div class="bg-white shadow rounded-lg p-6 text-sm text-gray-700 space-y-2">
        <div class="flex items-center gap-2">
          <CreditCard class="w-4 h-4" />
          <strong>Billing Address:</strong> {{ customer?.billingAddress || '-' }}
        </div>
        <div class="flex items-center gap-2">
          <BadgePercent class="w-4 h-4" />
          <strong>Loyalty Member ID:</strong> {{ customer?.loyaltyMemberId || '-' }}
        </div>
        <div class="flex items-center gap-2">
          <StickyNote class="w-4 h-4" />
          <strong>Notes:</strong> {{ customer?.notes || '-' }}
        </div>
        <div class="flex items-center gap-2">
          <Calendar class="w-4 h-4" />
          <strong>Created At:</strong> {{ new Date(customer?.createdAt || '').toLocaleString() }}
        </div>
        <div class="flex items-center gap-2">
          <Clock class="w-4 h-4" />
          <strong>Updated At:</strong> {{ new Date(customer?.updatedAt || '').toLocaleString() }}
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-4">
        <button
          v-if="!isEditing"
          @click="isEditing = true"
          class="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-300"
        >
          <Pencil class="w-4 h-4" />
          Edit Profile
        </button>

        <template v-else>
          <button
            @click="saveChanges"
            :disabled="isSaving"
            class="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 focus:outline-none focus:ring focus:ring-green-300 disabled:opacity-60"
          >
            <Save class="w-4 h-4" />
            {{ isSaving ? 'Saving...' : 'Save' }}
          </button>
          <button
            @click="isEditing = false"
            class="inline-flex items-center gap-2 bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 focus:outline-none focus:ring focus:ring-gray-300"
          >
            <X class="w-4 h-4" />
            Cancel
          </button>
        </template>
      </div>
    </div>
  </div>
</template>
