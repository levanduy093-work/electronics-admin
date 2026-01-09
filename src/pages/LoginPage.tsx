import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { TextField, Button, Box, Typography, Container, Paper, Alert, Stack } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'
import { useAuth } from '../auth/AuthContext'

interface LoginResponse {
  accessToken: string
  refreshToken?: string
  user?: {
    _id?: string
    id?: string
    email?: string
    name?: string
    role?: string
  }
}

const LoginPage = () => {
  const { register, handleSubmit } = useForm()
  const navigate = useNavigate()
  const { login } = useAuth()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (data: any) => {
    try {
      setError('')
      setLoading(true)
      const response = await client.post<LoginResponse>('/auth/login', data)
      const { accessToken, user } = response.data
      if (!accessToken) {
        setError('Hệ thống không trả về token. Vui lòng thử lại.')
        return
      }
      if (user && user.role !== 'admin') {
        setError('Chỉ tài khoản admin mới được phép đăng nhập trang này.')
        return
      }
      login(accessToken, {
        id: user?._id || user?.id,
        email: user?.email,
        name: user?.name,
        role: user?.role,
      })
      navigate('/')
    } catch (err: any) {
      const message = err.response?.data?.message || 'Đăng nhập thất bại. Kiểm tra lại thông tin.'
      setError(Array.isArray(message) ? message.join(', ') : message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6' }}>
      <Container component="main" maxWidth="xs">
        <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
          <Stack spacing={2}>
            <Box>
              <Typography component="h1" variant="h5" sx={{ fontWeight: 700 }}>
                Electronics Admin
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Đăng nhập bằng tài khoản admin để quản lý backend.
              </Typography>
            </Box>
            {error && <Alert severity="error">{error}</Alert>}
            <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email"
                autoComplete="email"
                autoFocus
                {...register('email')}
              />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Mật khẩu"
              type="password"
              id="password"
                autoComplete="current-password"
                {...register('password')}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </Button>
            </Box>
          </Stack>
        </Paper>
      </Container>
    </Box>
  )
}

export default LoginPage
