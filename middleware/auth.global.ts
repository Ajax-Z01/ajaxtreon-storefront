import { defineNuxtRouteMiddleware, useCookie } from 'nuxt/app'
import { getAuth, onAuthStateChanged, type User } from 'firebase/auth'

function waitForUser(auth: ReturnType<typeof getAuth>): Promise<User | null> {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe()
      resolve(user)
    })
  })
}

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return

  const guestOnlyRoutes = ['/auth/login', '/auth/register']

  if (!guestOnlyRoutes.some(path => to.path.startsWith(path))) {
    return
  }

  const auth = getAuth()
  const tokenCookie = useCookie('authToken', { sameSite: 'lax', path: '/' })

  const token = tokenCookie.value
  if (!token) {
    return
  }

  const user = await waitForUser(auth)

  if (user) {
    window.location.replace('/profile')
  }
})
