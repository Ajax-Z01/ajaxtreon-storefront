import { defineNuxtRouteMiddleware, navigateTo, useCookie } from 'nuxt/app'
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

  const protectedRoutes = ['/dashboard', '/profile', '/orders', '/cart']
  const isProtected = protectedRoutes.some(path => to.path.startsWith(path))
  if (!isProtected) return

  const auth = getAuth()
  const tokenCookie = useCookie('authToken', { sameSite: 'lax', path: '/' })
  let token = tokenCookie.value

  if (!token) {
    return navigateTo('/auth/login')
  }

  const user = await waitForUser(auth)
  if (!user) {
    tokenCookie.value = null
    return navigateTo('/auth/login')
  }

  try {
    const freshToken = await user.getIdToken(true)
    if (token !== freshToken) {
      token = freshToken
      tokenCookie.value = freshToken
    }
  } catch {
    tokenCookie.value = null
    return navigateTo('/auth/login')
  }
})
