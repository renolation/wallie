'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface User {
  id: number
  email: string
  firstName?: string
  lastName?: string
  roles?: string[]
}

const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password']

export function useAuth(requireAuth = true) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/users/me', { credentials: 'include' })

      if (res.ok) {
        const data = await res.json()
        setUser(data.user)

        // If on login/register page and already logged in, redirect to dashboard
        if (PUBLIC_ROUTES.includes(pathname)) {
          router.push('/dashboard')
        }
      } else {
        setUser(null)

        // If auth is required and not on public route, redirect to login
        if (requireAuth && !PUBLIC_ROUTES.includes(pathname)) {
          router.push('/login')
        }
      }
    } catch (err) {
      console.error('Auth check failed:', err)
      setUser(null)

      if (requireAuth && !PUBLIC_ROUTES.includes(pathname)) {
        router.push('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/users/logout', {
        method: 'POST',
        credentials: 'include',
      })
      setUser(null)
      router.push('/login')
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  return { user, loading, logout, isAuthenticated: !!user }
}
