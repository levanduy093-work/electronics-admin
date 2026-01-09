import React, { createContext, useContext, useEffect, useState } from 'react'

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
  user: AuthUser | null
  login: (token: string, user?: AuthUser | null) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    if (storedToken) {
      setToken(storedToken)
    }
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (_err) {
        localStorage.removeItem('user')
      }
    }
    setIsLoading(false)
  }, [])

  const login = (newToken: string, newUser?: AuthUser | null) => {
    setToken(newToken)
    localStorage.setItem('token', newToken)
    if (newUser) {
      setUser(newUser)
      localStorage.setItem('user', JSON.stringify(newUser))
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: Boolean(token),
        isLoading,
        token,
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
