import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { Box, CircularProgress, CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import { AuthProvider, useAuth } from './auth/AuthContext'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ProductsPage from './pages/ProductsPage'
import OrdersPage from './pages/OrdersPage'
import UsersPage from './pages/UsersPage'
import VouchersPage from './pages/VouchersPage'
import ReviewsPage from './pages/ReviewsPage'
import ShipmentsPage from './pages/ShipmentsPage'
import InventoryMovementsPage from './pages/InventoryMovementsPage'
import TransactionsPage from './pages/TransactionsPage'
import NotificationsPage from './pages/NotificationsPage'
import BannersPage from './pages/BannersPage'
import './App.css'

const theme = createTheme({
  palette: {
    primary: { main: '#2563eb' },
    secondary: { main: '#10b981' },
    background: { default: '#f3f4f6' },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 14,
        },
      },
    },
  },
})

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading, user } = useAuth()

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  const isAdmin = user?.role ? user.role === 'admin' : true
  return isAuthenticated && isAdmin ? <Outlet /> : <Navigate to="/login" replace />
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/shipments" element={<ShipmentsPage />} />
                <Route path="/inventory" element={<InventoryMovementsPage />} />
                <Route path="/transactions" element={<TransactionsPage />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/vouchers" element={<VouchersPage />} />
                <Route path="/reviews" element={<ReviewsPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/banners" element={<BannersPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
