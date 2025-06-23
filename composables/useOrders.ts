import type { Order, CreateOrderPayload, AddOrderResponse } from '~/types/Order'
import { getCurrentUserWithToken } from '~/composables/getCurrentUser'

export const useOrders = () => {
  const config = useRuntimeConfig()
  const baseUrl = config.public.apiBaseUrl

  // Token handling
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

  const getHeaders = (): HeadersInit => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    if (userToken.value) {
      headers['Authorization'] = `Bearer ${userToken.value}`
    }
    return headers
  }
  
  const getOrders = async (): Promise<Order[]> => {
    try {
      await ensureToken()

      const data = await $fetch<Order[]>(`${baseUrl}/order`, {
        headers: getHeaders(),
      })

      return data
    } catch (err) {
      console.error('Error fetching orders:', err)
      throw createError({ statusCode: 500, message: 'Failed to fetch orders' })
    }
  }
  
  const addOrder = async (order: CreateOrderPayload): Promise<AddOrderResponse> => {
    await ensureToken()

    const { data, error, status } = await useFetch<AddOrderResponse>(`${baseUrl}/order`, {
      method: 'POST',
      body: JSON.stringify(order),
      headers: getHeaders(),
    })

    if (error.value) {
      const message = error.value?.data?.message || 'Failed to add order'
      throw createError({ statusCode: Number(status.value) || 500, message })
    }

    return data.value!
  }


  const getOrdersByCustomer = async (customerId: string): Promise<Order[]> => {
    const { data, error } = await useFetch<Order[]>(`${baseUrl}/order?customerId=${customerId}`, {
      method: 'GET',
      headers: getHeaders(),
    })

    if (error.value) {
      throw createError({ statusCode: 500, message: 'Failed to fetch customer orders' })
    }

    return data.value || []
  }

  return {
    getOrders,
    addOrder,
    getOrdersByCustomer,
  }
}
