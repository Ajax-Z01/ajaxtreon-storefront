import type { PaymentData, PaymentStatus, CreatePaymentResponse, UpdateStatusResponse } from '~/types/Payment'

export const usePayment = () => {
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
    
    if (!userToken.value) {
      throw createError({ statusCode: 401, message: 'Unauthorized' });
    }

    if (userToken.value) {
      headers['Authorization'] = `Bearer ${userToken.value}`
    }

    return headers
  }

  // Create payment
  const createPayment = async (paymentData: PaymentData): Promise<CreatePaymentResponse> => {
    const { data, error } = await useFetch<CreatePaymentResponse>(`${baseUrl}/payment`, {
      method: 'POST',
      body: JSON.stringify(paymentData),
      headers: getHeaders(),
    });

    if (error.value) {
      throw createError({ statusCode: 500, message: 'Error creating payment' });
    }

    return data.value!;
  }

  // Get all payments
  const getAllPayments = async (): Promise<PaymentData[]> => {
    const { data, error } = await useFetch<PaymentData[]>(`${baseUrl}/payment`, {
      method: 'GET',
      headers: getHeaders(),
    })

    if (error.value) {
      throw createError({ statusCode: 500, message: 'Error fetching payments' })
    }

    return data.value || []
  }

  // Get payment by ID
  const getPaymentById = async (id: string): Promise<PaymentData | void> => {
    const { data, error } = await useFetch<PaymentData>(`${baseUrl}/payment/${id}`, {
      method: 'GET',
      headers: getHeaders(),
    })

    if (error.value) {
      throw createError({ statusCode: 500, message: 'Error fetching payment' })
    }

    return data.value || undefined
  }

  // Update payment status
  const updatePaymentStatus = async (id: string, status: PaymentStatus): Promise<UpdateStatusResponse> => {
    const { data, error } = await useFetch<UpdateStatusResponse>(`${baseUrl}/payment/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
      headers: getHeaders(),
    });

    if (error.value) {
      throw createError({ statusCode: 500, message: 'Error updating payment status' });
    }

    return data.value!;
  };

  // Delete payment
  const deletePayment = async (id: string): Promise<void> => {
    const { error } = await useFetch(`${baseUrl}/payment/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    })

    if (error.value) {
      throw createError({ statusCode: 500, message: 'Error deleting payment' })
    }
  }

  return {
    createPayment,
    getAllPayments,
    getPaymentById,
    updatePaymentStatus,
    deletePayment,
  }
}