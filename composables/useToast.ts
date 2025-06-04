type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: number    
  message: string
  type: ToastType
}

const toasts = ref<Toast[]>([])

export const useToast = () => {
  const addToast = (message: string, type: ToastType = 'info') => {
    const id = Date.now()
    toasts.value.push({ id, message, type })
    setTimeout(() => removeToast(id), 3000)
  }

  const removeToast = (id: number) => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  return { toasts, addToast, removeToast }
}
