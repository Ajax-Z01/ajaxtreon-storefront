<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCustomers } from '~/composables/useCustomers'
import { getCurrentUserWithToken } from '~/composables/getCurrentUser'
import type { Customer, CustomerUpdatePayload } from '~/types/Customer'

const { getCustomerByFirebaseUid, updateCustomer, ensureToken } = useCustomers()

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
  } catch (err) {
    console.error(err)
    errorMessage.value = 'Failed to update profile.'
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto py-12 px-4">
    <h1 class="text-3xl font-bold mb-6">👤 My Profile</h1>

    <div v-if="isLoading" class="text-gray-500">Loading...</div>
    <div v-else-if="errorMessage" class="text-red-500">{{ errorMessage }}</div>

    <div v-else class="space-y-6">
      <div class="grid grid-cols-1 gap-4">
        <label class="block">
          <span class="text-sm font-medium text-gray-700">Name</span>
          <input v-model="form.name" :disabled="!isEditing" class="w-full mt-1 rounded border-gray-300" />
        </label>

        <label class="block">
          <span class="text-sm font-medium text-gray-700">Email</span>
          <input v-model="form.email" :disabled="!isEditing" class="w-full mt-1 rounded border-gray-300" />
        </label>

        <label class="block">
          <span class="text-sm font-medium text-gray-700">Phone</span>
          <input v-model="form.phone" :disabled="!isEditing" class="w-full mt-1 rounded border-gray-300" />
        </label>

        <label class="block">
          <span class="text-sm font-medium text-gray-700">Address</span>
          <textarea v-model="form.address" :disabled="!isEditing" rows="2" class="w-full mt-1 rounded border-gray-300" />
        </label>
      </div>

      <!-- Additional (Read-only) Info -->
      <div class="grid grid-cols-1 gap-4 text-sm text-gray-600">
        <div><strong>Billing Address:</strong> {{ customer?.billingAddress || '-' }}</div>
        <div><strong>Loyalty Member ID:</strong> {{ customer?.loyaltyMemberId || '-' }}</div>
        <div><strong>Notes:</strong> {{ customer?.notes || '-' }}</div>
        <div><strong>Created At:</strong> {{ new Date(customer?.createdAt || '').toLocaleString() }}</div>
        <div><strong>Updated At:</strong> {{ new Date(customer?.updatedAt || '').toLocaleString() }}</div>
      </div>

      <div class="flex gap-4 mt-4">
        <button
          v-if="!isEditing"
          @click="isEditing = true"
          class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Edit
        </button>

        <div v-else class="flex gap-4">
          <button
            @click="saveChanges"
            :disabled="isSaving"
            class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            {{ isSaving ? 'Saving...' : 'Save' }}
          </button>
          <button
            @click="isEditing = false"
            class="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
