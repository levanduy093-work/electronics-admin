import { useEffect, useState } from 'react'
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  LinearProgress,
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { Visibility as VisibilityIcon, Cancel as CancelIcon } from '@mui/icons-material'
import client from '../api/client'

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

const OrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState(false)

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const response = await client.get('/orders')
      setOrders(response.data)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const handleOpen = (order: Order) => {
    setSelectedOrder(order)
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setSelectedOrder(null)
  }

  const updateStatus = async (statusField: keyof OrderStatus) => {
    if (!selectedOrder) return
    try {
      setUpdating(true)
      const payload = {
        status: {
          ...(selectedOrder.status || {}),
          [statusField]: new Date().toISOString(),
        },
      }
      await client.patch(`/orders/${selectedOrder._id}`, payload)
      await fetchOrders()
      handleClose()
    } catch (error) {
      console.error('Error updating order status:', error)
    } finally {
      setUpdating(false)
    }
  }

  const cancelOrder = async () => {
    if (!selectedOrder) return
    try {
      setUpdating(true)
      await client.patch(`/orders/${selectedOrder._id}`, { isCancelled: true })
      await fetchOrders()
      handleClose()
    } catch (error) {
      console.error('Error cancelling order:', error)
    } finally {
      setUpdating(false)
    }
  }

  const getStatusChip = (status: OrderStatus, isCancelled: boolean) => {
    if (isCancelled) return <Chip label="Đã hủy" color="error" size="small" />
    if (status?.shipped) return <Chip label="Đã giao" color="success" size="small" />
    if (status?.packaged) return <Chip label="Đóng gói" color="info" size="small" />
    if (status?.confirmed) return <Chip label="Đã xác nhận" color="primary" size="small" />
    if (status?.ordered) return <Chip label="Đã đặt" color="warning" size="small" />
    return <Chip label="Mới" size="small" />
  }

  const columns: GridColDef<Order>[] = [
    { field: 'code', headerName: 'Mã đơn', width: 150 },
    {
      field: 'totalPrice',
      headerName: 'Tổng tiền',
      width: 150,
      valueFormatter: (params) => Number((params as any).value || 0).toLocaleString('vi-VN') + ' đ',
    },
    { field: 'payment', headerName: 'Thanh toán', width: 140 },
    { field: 'paymentStatus', headerName: 'Trạng thái TT', width: 140 },
    {
      field: 'status',
      headerName: 'Trạng thái đơn',
      width: 180,
      renderCell: (params: GridRenderCellParams<Order>) =>
        getStatusChip(params.row.status || {}, params.row.isCancelled),
      sortable: false,
      filterable: false,
    },
    {
      field: 'createdAt',
      headerName: 'Ngày tạo',
      width: 180,
      valueFormatter: (params) =>
        (params as any).value ? new Date((params as any).value as string).toLocaleString('vi-VN') : '',
    },
    {
      field: 'actions',
      headerName: 'Chi tiết',
      width: 120,
      renderCell: (params: GridRenderCellParams<Order>) => (
        <IconButton onClick={() => handleOpen(params.row)} color="primary">
          <VisibilityIcon />
        </IconButton>
      ),
      sortable: false,
      filterable: false,
    },
  ]

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }} gutterBottom>
            Đơn hàng
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Theo dõi, cập nhật tiến độ và quản lý thanh toán của đơn hàng.
          </Typography>
        </Box>
      </Box>

      {loading && <LinearProgress />}

      <DataGrid
        rows={orders}
        columns={columns}
        getRowId={(row) => row._id}
        autoHeight
        initialState={{
          pagination: {
            paginationModel: { page: 0, pageSize: 10 },
          },
        }}
        pageSizeOptions={[5, 10, 25]}
        disableRowSelectionOnClick
      />

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Chi tiết đơn hàng - {selectedOrder?.code}</DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box sx={{ mt: 2 }}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                  gap: 3,
                }}
              >
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6">Khách hàng</Typography>
                  <Typography>Tên: {selectedOrder.shippingAddress?.name}</Typography>
                  <Typography>Điện thoại: {selectedOrder.shippingAddress?.phone}</Typography>
                  <Typography>
                    Địa chỉ: {selectedOrder.shippingAddress?.street}, {selectedOrder.shippingAddress?.ward},{' '}
                    {selectedOrder.shippingAddress?.district}, {selectedOrder.shippingAddress?.city}
                  </Typography>
                </Paper>

                <Paper sx={{ p: 2 }}>
                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                    <Typography variant="h6">Trạng thái</Typography>
                    <Chip
                      label={selectedOrder.isCancelled ? 'Đã hủy' : 'Đang xử lý'}
                      color={selectedOrder.isCancelled ? 'error' : 'primary'}
                      size="small"
                    />
                  </Stack>
                  <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {!selectedOrder.status?.confirmed && !selectedOrder.isCancelled && (
                      <Button variant="contained" size="small" onClick={() => updateStatus('confirmed')} disabled={updating}>
                        Xác nhận
                      </Button>
                    )}
                    {selectedOrder.status?.confirmed && !selectedOrder.status?.packaged && !selectedOrder.isCancelled && (
                      <Button variant="contained" size="small" onClick={() => updateStatus('packaged')} disabled={updating}>
                        Đóng gói
                      </Button>
                    )}
                    {selectedOrder.status?.packaged && !selectedOrder.status?.shipped && !selectedOrder.isCancelled && (
                      <Button variant="contained" size="small" onClick={() => updateStatus('shipped')} disabled={updating}>
                        Giao hàng
                      </Button>
                    )}
                    {!selectedOrder.isCancelled && (
                      <Button
                        variant="outlined"
                        size="small"
                        color="error"
                        startIcon={<CancelIcon />}
                        onClick={cancelOrder}
                        disabled={updating}
                      >
                        Hủy đơn
                      </Button>
                    )}
                  </Box>
                </Paper>

                <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
                  <Typography variant="h6" sx={{ mt: 2 }}>
                    Sản phẩm
                  </Typography>
                  <TableContainer component={Paper} sx={{ mt: 1 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Sản phẩm</TableCell>
                          <TableCell align="right">SL</TableCell>
                          <TableCell align="right">Giá</TableCell>
                          <TableCell align="right">Tổng</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedOrder.items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell align="right">{item.quantity}</TableCell>
                            <TableCell align="right">{item.price?.toLocaleString('vi-VN')} đ</TableCell>
                            <TableCell align="right">
                              {(item.totalPrice || item.subTotal || 0).toLocaleString('vi-VN')} đ
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default OrdersPage
