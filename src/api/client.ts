import axios from 'axios'

const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const client = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
})

type RefreshResponse = {
  accessToken: string
  refreshToken?: string
  user?: any
}

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status

    // Hard logout on forbidden: token valid but not allowed in admin
    if (status === 403) {
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      window.location.href = '/login'
      return Promise.reject(error)
    }

    // Try refresh once on 401
    if (status === 401) {
      const originalRequest = (error.config || {}) as any
      if (originalRequest._retry) {
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        window.location.href = '/login'
        return Promise.reject(error)
      }
      originalRequest._retry = true

      const refreshToken = localStorage.getItem('refreshToken')
      if (!refreshToken) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        const res = await axios.post<RefreshResponse>(`${apiBaseUrl}/auth/refresh`, { refreshToken })
        const nextAccessToken = res.data?.accessToken
        const nextRefreshToken = res.data?.refreshToken
        const nextUser = res.data?.user

        if (!nextAccessToken) {
          throw new Error('Missing accessToken from refresh')
        }

        localStorage.setItem('token', nextAccessToken)
        if (nextRefreshToken) localStorage.setItem('refreshToken', nextRefreshToken)
        if (nextUser) localStorage.setItem('user', JSON.stringify(nextUser))

        originalRequest.headers = originalRequest.headers || {}
        originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`

        return client.request(originalRequest)
      } catch (refreshErr) {
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        window.location.href = '/login'
        return Promise.reject(refreshErr)
      }
    }

    return Promise.reject(error)
  },
)

export default client
