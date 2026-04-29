'use client'

import { usePathname, useRouter } from 'next/navigation'
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import api, { clearAccessToken, getAccessToken, setAccessToken } from '@/lib/api'
import type { User } from '@/lib/types'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<User>
  logout: () => Promise<void>
  getCurrentUser: () => Promise<User | null>
  refetchUser: () => Promise<User | null>
  /** Optimistic local merge; useful for updating tour/preference flags without a round-trip */
  patchUser: (partial: Partial<User>) => void
  markPatientTourSeen: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const PROTECTED_ROUTES = ['/dashboard']

function isProtectedRoute(pathname: string | null): boolean {
  if (!pathname) return false
  return PROTECTED_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}

export function landingForRole(user: Pick<User, 'role'>): string {
  return user.role === 'PATIENT' ? '/' : '/dashboard'
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const getCurrentUser = useCallback(async (): Promise<User | null> => {
    try {
      const { data } = await api.get<{ success: boolean; data: { user: User } }>('/auth/me')
      if (data.success && data.data.user) {
        setUser(data.data.user)
        return data.data.user
      }
      return null
    } catch {
      clearAccessToken()
      setUser(null)
      return null
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<{
      success: boolean
      data: { accessToken: string; user: User }
    }>('/auth/login', { email, password })
    const payload = data?.data
    if (!payload?.accessToken || !payload?.user) {
      throw new Error((data as { message?: string })?.message || 'Invalid response from server')
    }
    setAccessToken(payload.accessToken)
    setUser(payload.user)
    return payload.user
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      clearAccessToken()
      setUser(null)
      // If the user is currently on a clinic site, drop them back to the
      // clinic landing — never bounce them to the Medoflow marketing root.
      const onClinicSite = pathname?.startsWith('/clinic/')
      const target = onClinicSite ? pathname! : '/'
      router.push(target)
    }
  }, [pathname, router])

  const markPatientTourSeen = useCallback(async () => {
    try {
      await api.post('/auth/patient-tour-seen')
      setUser((prev) => (prev ? { ...prev, hasSeenPatientTour: true } : prev))
    } catch (err) {
      console.error('Failed to mark tour as seen', err)
    }
  }, [])

  useEffect(() => {
    const initAuth = async () => {
      if (user) {
        setIsLoading(false)
        return
      }

      try {
        const restoredUser = await getCurrentUser()
        // If on a protected route and no user found, redirect to landing
        // with the auth modal open (set by ?auth=login).
        if (!restoredUser && isProtectedRoute(pathname)) {
          router.push(`/?auth=login&returnUrl=${encodeURIComponent(pathname || '/')}`)
        }
      } catch (err) {
        console.error('Auth initialization error:', err)
        if (isProtectedRoute(pathname)) {
          router.push(`/?auth=login&returnUrl=${encodeURIComponent(pathname || '/')}`)
        }
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
    // We want to run this when the app mounts and when pathname changes
    // to enforce protection, but getCurrentUser is memoized.
  }, [pathname, getCurrentUser, router])

  const patchUser = useCallback((partial: Partial<User>) => {
    setUser((current) => (current ? { ...current, ...partial } : current))
  }, [])

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    getCurrentUser,
    refetchUser: getCurrentUser,
    patchUser,
    markPatientTourSeen,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
