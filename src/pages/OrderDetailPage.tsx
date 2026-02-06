import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'
import { useDbChange } from '../hooks/useDbChange'

interface OrderStatus {
  ordered?: string
  confirmed?: string
  packaged?: string
  shipped?: string
}

interface OrderItem {
  name: string
  quantity: number
  price: number
  subTotal?: number
  totalPrice?: number
  shippingFee?: number
  discount?: number
}

interface Order {
  _id: string
  code: string
  userId: string
  status?: OrderStatus
  isCancelled: boolean
  totalPrice: number
  payment?: string
  paymentStatus?: string
  items: OrderItem[]
  shippingAddress?: {
    name?: string
    phone?: string
    city?: string
    district?: string
    ward?: string
    street?: string
  }
  createdAt?: string
}

const formatCurrency = (value?: number) =>
  `${(value ?? 0).toLocaleString('vi-VN')} đ`

const formatDateTime = (value?: string) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('vi-VN')
}

const statusLabels: Record<keyof OrderStatus, string> = {
  ordered: 'Đã đặt',
  confirmed: 'Đã xác nhận',
  packaged: 'Đóng gói',
  shipped: 'Giao hàng',
}

const OrderDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const orderId = id || ''

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ['orders', orderId],
    queryFn: async () => {
      const response = await client.get(`/orders/${orderId}`)
      return response.data as Order
    },
    enabled: Boolean(orderId),
    refetchInterval: 30000,
  })

  useDbChange(['orders'], () => {
    queryClient.invalidateQueries({ queryKey: ['orders', orderId] })
  })

  const statusTimeline = useMemo(() => {
    const status = order?.status || {}
    return (Object.keys(statusLabels) as (keyof OrderStatus)[])
      .filter((key) => status[key])
      .map((key) => ({
        key,
        label: statusLabels[key],
        time: formatDateTime(status[key]),
      }))
  }, [order?.status])

  if (!orderId) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Không tìm thấy đơn hàng
        </Typography>
        <Button variant="contained" onClick={() => navigate('/orders')}>
          Quay lại danh sách
        </Button>
      </Paper>
    )
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (isError || !order) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Không thể tải chi tiết đơn hàng
        </Typography>
        <Button variant="contained" onClick={() => navigate('/orders')}>
          Quay lại danh sách
        </Button>
      </Paper>
    )
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Đơn hàng #{order.code}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ID: {order._id}
          </Typography>
        </Box>
        <Button variant="outlined" onClick={() => navigate('/orders')}>
          Quay lại
        </Button>
      </Stack>

      <Paper sx={{ p: 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          {order.isCancelled ? (
            <Chip label="Đã hủy" color="error" />
          ) : (
            <Chip label="Đang xử lý" color="primary" />
          )}
          <Chip
            label={order.paymentStatus ? `Thanh toán: ${order.paymentStatus}` : 'Chưa có thanh toán'}
            color={order.paymentStatus?.toLowerCase() === 'paid' ? 'success' : 'warning'}
            variant="outlined"
          />
          <Chip label={`Phương thức: ${order.payment || 'N/A'}`} variant="outlined" />
          <Chip label={`Tổng: ${formatCurrency(order.totalPrice)}`} color="success" variant="outlined" />
        </Stack>

        <Divider sx={{ my: 2.5 }} />

        <Stack spacing={2}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Khách hàng
            </Typography>
            <Typography variant="body2">User ID: {order.userId || 'N/A'}</Typography>
            <Typography variant="body2">Thời gian: {formatDateTime(order.createdAt) || 'N/A'}</Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Địa chỉ giao hàng
            </Typography>
            <Typography variant="body2">
              {[
                order.shippingAddress?.name,
                order.shippingAddress?.phone,
                order.shippingAddress?.street,
                order.shippingAddress?.ward,
                order.shippingAddress?.district,
                order.shippingAddress?.city,
              ]
                .filter(Boolean)
                .join(' · ') || 'Chưa có địa chỉ'}
            </Typography>
          </Box>
        </Stack>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Trạng thái đơn hàng
        </Typography>
        {statusTimeline.length === 0 ? (
          <Typography variant="body2">Chưa cập nhật trạng thái</Typography>
        ) : (
          <Stack spacing={1}>
            {statusTimeline.map((step) => (
              <Stack key={step.key} direction="row" spacing={2} alignItems="center">
                <Chip label={step.label} color="primary" size="small" />
                <Typography variant="body2" color="text.secondary">
                  {step.time}
                </Typography>
              </Stack>
            ))}
          </Stack>
        )}
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Danh sách sản phẩm
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Tên sản phẩm</TableCell>
              <TableCell align="right">Số lượng</TableCell>
              <TableCell align="right">Đơn giá</TableCell>
              <TableCell align="right">Thành tiền</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {order.items.map((item, index) => {
              const total = item.totalPrice ?? item.subTotal ?? item.price * item.quantity
              return (
                <TableRow key={`${item.name}-${index}`}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell align="right">{item.quantity}</TableCell>
                  <TableCell align="right">{formatCurrency(item.price)}</TableCell>
                  <TableCell align="right">{formatCurrency(total)}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Paper>
    </Stack>
  )
}

export default OrderDetailPage
