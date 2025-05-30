import type { Order, CreateOrderPayload, AddOrderResponse } from '~/types/Order'

export const useOrders = () => {
  const baseUrl = useRuntimeConfig().public.apiBaseUrl
  const authToken = useCookie<string | null>('authToken')

  const getHeaders = () => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    if (authToken.value) {
      headers['Authorization'] = `Bearer ${authToken.value}`
    }
    return headers
  }

  const getOrders = async (): Promise<Order[]> => {
    const { data, error } = await useFetch<Order[]>(`${baseUrl}/order`, {
      method: 'GET',
      headers: getHeaders(),
    })

    if (error.value) {
      throw createError({ statusCode: 500, message: 'Failed to fetch orders' })
    }

    return data.value || []
  }

  const addOrder = async (order: CreateOrderPayload): Promise<AddOrderResponse> => {
    const { data, error, status } = await useFetch<AddOrderResponse>(`${baseUrl}/order`, {
      method: 'POST',
      body: JSON.stringify(order),
      headers: getHeaders(),
    });

    if (error.value) {
      const message = error.value?.data?.message || 'Failed to add order';
      throw createError({ statusCode: Number(status.value) || 500, message });
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
