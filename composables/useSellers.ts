import { useRuntimeConfig, useFetch, createError, useState } from '#app'
import type { Seller } from '~/types/Seller'

export const useSellers = () => {
  const baseUrl = useRuntimeConfig().public.apiBaseUrl

  const userToken = useState<string | null>('userToken', () => {
    if (process.client) {
      return localStorage.getItem('userToken')
    }
    return null
  })
  
  const getHeaders = () => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (userToken.value) {
      headers['Authorization'] = `Bearer ${userToken.value}`
    }

    return headers
  }
  
  const getSellerByFirebaseUid = async (firebaseUid: string): Promise<Seller | null> => {
    try {
      const { data, error } = await useFetch<Seller>(`${baseUrl}/seller/firebase/${firebaseUid}`, {
        method: 'GET',
        headers: getHeaders(),
      })

      if (error.value) {
        throw createError({ statusCode: 500, message: 'Failed to fetch seller by Firebase UID' })
      }

      return data.value || null
    } catch (err) {
      console.error('Error fetching seller by Firebase UID:', err)
      throw createError({ statusCode: 500, message: 'Failed to fetch seller by Firebase UID' })
    }
  }

  return {
    getSellerByFirebaseUid,
  }
}
