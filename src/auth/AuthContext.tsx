import React, { createContext, useContext, useEffect, useState } from 'react'
import client from '../api/client'

export interface AuthUser {
  id?: string
  email?: string
  name?: string
  role?: string
}

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  token: string | null
  refreshToken: string | null
  user: AuthUser | null
  login: (token: string, user?: AuthUser | null, refreshToken?: string | null) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState<string | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const bootstrap = async () => {
      const storedToken = localStorage.getItem('token')
      const storedRefreshToken = localStorage.getItem('refreshToken')
      const storedUser = localStorage.getItem('user')

      if (!storedToken) {
        if (!cancelled) setIsLoading(false)
        return
      }

      let parsedUser: AuthUser | null = null
      if (storedUser) {
        try {
          parsedUser = JSON.parse(storedUser)
        } catch (_err) {
          localStorage.removeItem('user')
        }
      }

      // Fast deny if role already known and not admin
      if (parsedUser?.role && parsedUser.role !== 'admin') {
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        if (!cancelled) {
          setToken(null)
          setRefreshToken(null)
          setUser(null)
          setIsLoading(false)
        }
        return
      }

      // Validate token + admin permission by pinging an admin-only endpoint
      try {
        await client.get('/users')
        if (cancelled) return
        setToken(storedToken)
        setRefreshToken(storedRefreshToken)
        setUser(parsedUser)
      } catch (_err) {
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        if (!cancelled) {
          setToken(null)
          setRefreshToken(null)
          setUser(null)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    bootstrap()
    return () => {
      cancelled = true
    }
  }, [])

  const login = (newToken: string, newUser?: AuthUser | null, newRefreshToken?: string | null) => {
    setToken(newToken)
    localStorage.setItem('token', newToken)
    if (newRefreshToken) {
      setRefreshToken(newRefreshToken)
      localStorage.setItem('refreshToken', newRefreshToken)
    }
    if (newUser) {
      setUser(newUser)
      localStorage.setItem('user', JSON.stringify(newUser))
    }
  }

  const logout = () => {
    setToken(null)
    setRefreshToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: Boolean(token),
        isLoading,
        token,
        refreshToken,
        user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
