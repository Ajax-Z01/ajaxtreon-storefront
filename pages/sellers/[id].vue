<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useSellers } from '~/composables/useSellers'
import type { Seller } from '~/types/Seller'
import {
  Globe,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Store,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  LoaderCircle,
  Star, 
  StarHalf, 
  StarOff
} from 'lucide-vue-next'

const route = useRoute()
const { getSellerByFirebaseUid } = useSellers()
const sellerId = route.params.id as string

const seller = ref<Seller | null>(null)
const loading = ref(true)

const platformIcons: Record<string, any> = {
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  linkedin: Linkedin,
}

function getStarIcons(rating: number) {
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating - fullStars >= 0.5
  const stars = []

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push('full')
    } else if (i === fullStars && hasHalfStar) {
      stars.push('half')
    } else {
      stars.push('empty')
    }
  }

  return stars
}

onMounted(async () => {
  try {
    seller.value = await getSellerByFirebaseUid(sellerId)
  } catch (e) {
    console.error('Failed to load seller:', e)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="max-w-5xl mx-auto py-10 px-4">
    <div v-if="loading" class="text-center text-gray-500 flex justify-center items-center gap-2">
      <LoaderCircle class="animate-spin w-4 h-4" />
      Loading seller...
    </div>

    <div v-else-if="seller" class="space-y-10">
      <!-- Banner & Logo -->
      <div class="relative h-48 sm:h-64 rounded-md overflow-hidden border">
        <img
          :src="seller.storeBannerUrl || 'https://via.placeholder.com/1024x300?text=No+Banner'"
          class="object-cover w-full h-full"
          alt="Store Banner"
        />
        <div class="absolute -bottom-10 left-6 z-10">
          <img
            :src="seller.storeLogoUrl || 'https://via.placeholder.com/100?text=Logo'"
            class="w-24 h-24 rounded-full border-4 border-white bg-white object-cover"
            alt="Store Logo"
          />
        </div>
      </div>

      <div class="mt-14">
        <h1 class="text-3xl font-bold">{{ seller.storeName || seller.name }}</h1>
        <div class="flex items-center gap-1 mt-2">
          <template v-for="(type, index) in getStarIcons(seller.ratingAverage || 0)" :key="index">
            <Star v-if="type === 'full'" class="w-4 h-4 text-yellow-400" />
            <StarHalf v-else-if="type === 'half'" class="w-4 h-4 text-yellow-400" />
            <StarOff v-else class="w-4 h-4 text-gray-300" />
          </template>
          <span class="ml-2 text-sm text-gray-600">({{ seller.ratingAverage?.toFixed(1) || '0.0' }} / 5)</span>
          <span class="text-xs text-gray-400">from {{ seller.ratingCount || 0 }} reviews</span>
        </div>
        <p class="text-gray-600">{{ seller.storeDescription || 'No description provided.' }}</p>

        <div class="mt-4 flex items-center gap-4 text-sm text-gray-500">
          <span class="flex items-center gap-1">
            <ShieldCheck class="w-4 h-4 text-green-500" />
            {{ seller.isVerified ? 'Verified' : 'Unverified' }}
          </span>
          <span class="capitalize">
            Status: <span class="font-medium">{{ seller.status || 'unknown' }}</span>
          </span>
        </div>
      </div>

      <!-- Contact & Social -->
      <div class="grid sm:grid-cols-2 gap-8">
        <div>
          <h2 class="text-lg font-semibold mb-2">Contact Information</h2>
          <div class="space-y-1 text-sm text-gray-700">
            <p v-if="seller.email"><Mail class="inline w-4 h-4 mr-1" /> {{ seller.email }}</p>
            <p v-if="seller.phone"><Phone class="inline w-4 h-4 mr-1" /> {{ seller.phone }}</p>
            <p v-if="seller.website"><Globe class="inline w-4 h-4 mr-1" /> <a :href="seller.website" target="_blank" class="text-blue-600 hover:underline break-all">{{ seller.website }}</a></p>
            <p v-if="seller.address"><MapPin class="inline w-4 h-4 mr-1" /> {{ seller.address }}</p>
          </div>

          <div class="mt-4">
            <h3 class="font-semibold mb-1 text-sm text-gray-600">Social Media</h3>
            <div class="flex flex-wrap gap-3">
              <a
                v-for="(link, key) in seller.socialMediaLinks"
                :key="key"
                :href="link"
                target="_blank"
                class="flex items-center gap-1 text-blue-600 hover:underline text-sm"
              >
                <component :is="platformIcons[key]" class="w-4 h-4" />
                {{ key }}
              </a>
            </div>
          </div>
        </div>

        <!-- Location & Policies -->
        <div>
          <h2 class="text-lg font-semibold mb-2">Store Details</h2>
          <div class="text-sm space-y-1 text-gray-700">
            <p v-if="seller.location?.province">Province: {{ seller.location.province }}</p>
            <p v-if="seller.location?.city">City: {{ seller.location.city }}</p>
            <p v-if="seller.location?.district">District: {{ seller.location.district }}</p>
            <p v-if="seller.location?.postalCode">Postal Code: {{ seller.location.postalCode }}</p>
          </div>

          <div class="mt-4 text-sm space-y-1 text-gray-700">
            <p v-if="seller.returnPolicy"><strong>Return Policy:</strong> {{ seller.returnPolicy }}</p>
            <p v-if="seller.shippingPolicy"><strong>Shipping Policy:</strong> {{ seller.shippingPolicy }}</p>
            <p v-if="seller.paymentMethods?.length"><strong>Payment Methods:</strong> {{ seller.paymentMethods.join(', ') }}</p>
          </div>
        </div>
      </div>

      <!-- Metadata -->
      <div class="text-xs text-gray-400 text-right">
        Last updated: {{ new Date(seller.updatedAt).toLocaleString() }}
      </div>
    </div>

    <div v-else class="text-center text-red-500">
      Seller not found.
    </div>
  </div>
</template>
