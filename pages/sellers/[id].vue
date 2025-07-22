<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useSellers } from '~/composables/useSellers'
import { useProducts } from '~/composables/useProducts'
import { useCategories } from '~/composables/useCategories'
import type { Seller } from '~/types/Seller'
import type { Product } from '~/types/Product'
import type { Category } from '~/types/Category'
import ProductCard from '~/components/ProductCard.vue'
import {
  Globe, Mail, Phone, MapPin, ShieldCheck,
  Facebook, Instagram, Twitter, Linkedin,
  Star, StarHalf, StarOff, XCircle
} from 'lucide-vue-next'

const route = useRoute()
const { getSellerByFirebaseUid } = useSellers()
const { getProductsByCreatedBy } = useProducts()
const { getCategories } = useCategories()

const sellerId = route.params.id as string

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

const { data: seller, pending: loadingSeller } = await useAsyncData<Seller | null>('seller', () =>
  getSellerByFirebaseUid(sellerId)
)

const { data: products, pending: loadingProducts } = await useAsyncData<Product[]>('seller-products', () =>
  getProductsByCreatedBy(sellerId)
)

const { data: categories, pending: loadingCategories } = await useAsyncData<Category[]>('categories', () => getCategories())

const categoryMap = computed(() => {
  const map: Record<string, string> = {}
  categories.value?.forEach(category => {
    map[category.id] = category.name
  })
  return map
})

const lastUpdated = computed(() => {
  const updated = seller.value?.updatedAt as { _seconds: number } | undefined
  if (updated?._seconds) {
    return new Date(updated._seconds * 1000).toLocaleString()
  }
  return 'Unknown'
})
</script>

<template>
  <div class="max-w-5xl mx-auto py-10 px-4">
    <div v-if="loadingSeller" class="space-y-6 animate-pulse">
      <div class="h-48 sm:h-64 bg-gray-200 rounded-md"></div>
      <div class="h-6 bg-gray-300 w-1/2 rounded"></div>
      <div class="h-4 bg-gray-300 w-1/3 rounded"></div>
      <div class="h-4 bg-gray-300 w-3/4 rounded"></div>
    </div>

    <div v-if="seller" class="space-y-10 transition-opacity duration-300 ease-in-out" :class="{ 'opacity-0': loadingSeller, 'opacity-100': !loadingSeller }">
      <!-- Banner wrapper (NO overflow-hidden) -->
      <div class="relative">
        <!-- Banner -->
        <div class="h-48 sm:h-64 rounded-md border bg-gray-100 overflow-hidden">
          <img
            :src="seller.storeBannerUrl || 'https://via.placeholder.com/1024x300?text=No+Banner'"
            alt="Store Banner"
            class="w-full h-full object-cover"
          />
        </div>

        <!-- Logo (absolute and outside banner) -->
        <div class="absolute -bottom-12 left-6 sm:left-10 z-10">
          <img
            :src="seller.storeLogoUrl || 'https://via.placeholder.com/100?text=Logo'"
            alt="Store Logo"
            class="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white object-cover bg-white shadow-lg"
          />
        </div>
      </div>
      
      <div class="pt-4">
        <h1 class="text-3xl font-bold">{{ seller.storeName || seller.name }}</h1>
        <div class="flex flex-wrap items-center gap-1 mt-2">
          <template v-for="(type, index) in getStarIcons(seller.ratingAverage || 0)" :key="index">
            <Star v-if="type === 'full'" class="w-4 h-4 text-yellow-400" />
            <StarHalf v-else-if="type === 'half'" class="w-4 h-4 text-yellow-400" />
            <StarOff v-else class="w-4 h-4 text-gray-300" />
          </template>
          <span class="ml-2 text-sm text-gray-600">({{ seller.ratingAverage?.toFixed(1) || '0.0' }} / 5)</span>
          <span class="text-xs text-gray-400">from {{ seller.ratingCount || 0 }} reviews</span>
        </div>
        <p class="prose max-w-none text-gray-600 mt-4">{{ seller.storeDescription || 'No description provided' }}</p>

        <div class="mt-4 flex items-center gap-4 text-sm text-gray-500">
          <span class="flex items-center gap-1">
            <component
              :is="seller.isVerified ? ShieldCheck : XCircle"
              :class="seller.isVerified ? 'w-4 h-4 text-green-500' : 'w-4 h-4 text-red-500'"
            />
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
                <component v-if="platformIcons[key]" :is="platformIcons[key]" class="w-4 h-4" />
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
      
      <section class="mt-12">
        <h2 class="text-2xl font-semibold mb-6">Products by {{ seller.storeName || seller.name }}</h2>

        <div v-if="loadingProducts" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div v-for="i in 6" :key="i" class="animate-pulse bg-white rounded-2xl p-5 border h-72"></div>
        </div>

        <div v-else-if="products && products.length === 0" class="text-gray-500">
          No products found for this seller.
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <ProductCard
            v-for="product in products"
            :key="product.id"
            :product="product"
            :categoryName="categoryMap[product.categoryId] || 'Uncategorized'"
          />
        </div>
      </section>

      <!-- Metadata -->
      <div class="text-xs text-gray-400 text-right">
        Last updated: {{ lastUpdated }}
      </div>
    </div>

    <div v-else class="text-center text-red-500">
      Seller not found.
    </div>
  </div>
</template>
