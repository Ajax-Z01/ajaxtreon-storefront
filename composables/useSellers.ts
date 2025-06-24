import { useRuntimeConfig, useFetch, createError, useState } from '#app'
import { getCurrentUserWithToken } from '~/composables/getCurrentUser'
import type { Seller } from '~/types/Seller'

export const useSellers = () => {
  const baseUrl = useRuntimeConfig().public.apiBaseUrl

  const userToken = useState<string | null>('userToken', () => {
    if (process.client) {
      return localStorage.getItem('userToken')
    }
    return null
  })

  const setUserToken = (token: string) => {
    userToken.value = token
    if (process.client) {
      localStorage.setItem('userToken', token)
    }
  }

  const getHeaders = () => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (userToken.value) {
      headers['Authorization'] = `Bearer ${userToken.value}`
    }

    return headers
  }

  const ensureToken = async () => {
    if (!userToken.value) {
      const { token } = await getCurrentUserWithToken()
      if (token) {
        setUserToken(token)
      } else {
        throw createError({ statusCode: 401, message: 'Unauthorized' })
      }
    }
  }

  const getSellers = async (): Promise<Seller[]> => {
    try {
      await ensureToken()

      const { data, error } = await useFetch<Seller[]>(`${baseUrl}/seller`, {
        method: 'GET',
        headers: getHeaders(),
      })

      if (error.value) {
        throw createError({ statusCode: 500, message: 'Failed to fetch sellers' })
      }

      return data.value || []
    } catch (err) {
      console.error('Error fetching sellers:', err)
      throw createError({ statusCode: 500, message: 'Failed to fetch sellers' })
    }
  }

  const getSellerById = async (id: string): Promise<Seller | null> => {
    try {
      await ensureToken()

      const { data, error } = await useFetch<Seller>(`${baseUrl}/seller/${id}`, {
        method: 'GET',
        headers: getHeaders(),
      })

      if (error.value) {
        throw createError({ statusCode: 500, message: 'Failed to fetch seller' })
      }

      return data.value || null
    } catch (err) {
      console.error('Error fetching seller by ID:', err)
      throw createError({ statusCode: 500, message: 'Failed to fetch seller' })
    }
  }

  return {
    ensureToken,
    getSellers,
    getSellerById,
  }
}
