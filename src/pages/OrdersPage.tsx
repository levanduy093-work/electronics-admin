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
import { Visibility as VisibilityIcon, Cancel as CancelIcon, Delete as DeleteIcon } from '@mui/icons-material'
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

interface Shipment {
  _id: string
  orderId: string
  status: string
  paymentMethod?: string
  paymentStatus?: string
  carrier?: string
  trackingNumber?: string
}

const OrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

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

  const fetchShipments = async () => {
    try {
      const response = await client.get('/shipments')
      const data = response.data || []
      setShipments(data)
      return data
    } catch (error) {
      console.error('Error fetching shipments:', error)
      return []
    }
  }

  useEffect(() => {
    fetchOrders()
    fetchShipments()
  }, [])

  const handleOpen = (order: Order) => {
    setSelectedOrder(order)
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setSelectedOrder(null)
  }

  const updateStatus = async (statusField: keyof OrderStatus, order?: Order) => {
    const target = order || selectedOrder
    if (!target) return
    try {
      setUpdating(true)
      setUpdatingId(target._id)
      const payload = {
        status: {
          ...(target.status || {}),
          [statusField]: new Date().toISOString(),
        },
      }
      await client.patch(`/orders/${target._id}`, payload)
      await Promise.all([fetchOrders(), fetchShipments()])
      if (!order) handleClose()
    } catch (error) {
      console.error('Error updating order status:', error)
    } finally {
      setUpdating(false)
      setUpdatingId(null)
    }
  }

  const cancelOrder = async (order?: Order) => {
    const target = order || selectedOrder
    if (!target) return
    try {
      setUpdating(true)
      setUpdatingId(target._id)
      await client.patch(`/orders/${target._id}`, { isCancelled: true })
      await fetchOrders()
      if (!order) handleClose()
    } catch (error) {
      console.error('Error cancelling order:', error)
    } finally {
      setUpdating(false)
      setUpdatingId(null)
    }
  }

  const ensureShipmentForOrder = async (order: Order) => {
    const existing = getShipmentForOrder(order._id)
    if (existing) return existing
    const latest = await fetchShipments()
    const found = latest.find((s: Shipment) => s.orderId === order._id)
    if (found) return found

    const paymentMethod = normalizePaymentMethod(order.payment)
    const payload = {
      orderId: order._id,
      carrier: 'Nội bộ',
      trackingNumber: order.code,
      status: 'in_transit',
      statusHistory: [{ status: 'in_transit', at: new Date().toISOString() }],
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
    }
    const res = await client.post('/shipments', payload)
    await fetchShipments()
    return res.data as Shipment
  }

  const updateShipmentStatus = async (order: Order, nextStatus: string) => {
    try {
      setUpdating(true)
      setUpdatingId(order._id)
      const shipment = await ensureShipmentForOrder(order)
      if (!shipment?._id) return
      await client.patch(`/shipments/${shipment._id}`, { status: nextStatus })
      await fetchShipments()
      await fetchOrders()
    } catch (error) {
      console.error('Error updating shipment status:', error)
    } finally {
      setUpdating(false)
      setUpdatingId(null)
    }
  }

  const updateShipmentPaymentStatus = async (order: Order, paymentStatus: string) => {
    try {
      setUpdating(true)
      setUpdatingId(order._id)
      const shipment = await ensureShipmentForOrder(order)
      if (!shipment?._id) return
      await client.patch(`/shipments/${shipment._id}`, { paymentStatus })
      await Promise.all([fetchShipments(), fetchOrders()])
    } catch (error) {
      console.error('Error updating shipment payment status:', error)
    } finally {
      setUpdating(false)
      setUpdatingId(null)
    }
  }

  const quickCreateShipment = async (order: Order) => {
    try {
      setUpdating(true)
      setUpdatingId(order._id)
      await ensureShipmentForOrder(order)
    } catch (error) {
      console.error('Error creating shipment:', error)
    } finally {
      setUpdating(false)
      setUpdatingId(null)
    }
  }

  const rollbackOrder = async (order: Order) => {
    try {
      setUpdating(true)
      setUpdatingId(order._id)
      await client.patch(`/orders/${order._id}`, { status: {}, isCancelled: false })
      await fetchOrders()
    } catch (error) {
      console.error('Error rolling back order:', error)
    } finally {
      setUpdating(false)
      setUpdatingId(null)
    }
  }

  const deleteOrder = async (order: Order) => {
    const ok = window.confirm(`Bạn có chắc muốn xóa đơn ${order.code}?`)
    if (!ok) return
    try {
      setUpdating(true)
      setUpdatingId(order._id)
      await client.delete(`/orders/${order._id}`)
      setOrders((prev) => prev.filter((o) => o._id !== order._id))
    } catch (error) {
      console.error('Error deleting order:', error)
      await fetchOrders()
    } finally {
      setUpdating(false)
      setUpdatingId(null)
      if (selectedOrder?._id === order._id) {
        handleClose()
      }
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

  const formatCurrency = (value?: number) => Number(value || 0).toLocaleString('vi-VN') + ' đ'

  const getPaymentChip = (payment?: string) => {
    if (!payment) return <Chip label="Không rõ" size="small" variant="outlined" color="default" />
    return (
      <Chip
        label={payment.toUpperCase()}
        size="small"
        variant="outlined"
        color="info"
        sx={{ fontWeight: 600 }}
      />
    )
  }

  const getPaymentStatusChip = (status?: string) => {
    const normalized = status?.toLowerCase()
    if (!normalized) return <Chip label="Chờ" size="small" variant="outlined" color="default" />
    if (normalized === 'paid' || normalized === 'done')
      return <Chip label="Đã thanh toán" size="small" color="success" variant="outlined" />
    if (normalized === 'pending') return <Chip label="Đang chờ" size="small" color="warning" variant="outlined" />
    return <Chip label={status} size="small" color="default" variant="outlined" />
  }

  const normalizePaymentMethod = (payment?: string | null) => (payment || '').trim().toLowerCase()
  const getShipmentForOrder = (orderId: string) => shipments.find((s) => s.orderId === orderId)

  const shipmentStatusMap: Record<
    string,
    { label: string; color: 'default' | 'warning' | 'info' | 'primary' | 'success' }
  > = {
    in_transit: { label: 'Đang vận chuyển', color: 'info' },
    out_for_delivery: { label: 'Đang giao hàng', color: 'primary' },
    delivered: { label: 'Đã nhận hàng', color: 'success' },
  }

  const getShipmentStatusChip = (shipment?: Shipment) => {
    if (!shipment) return <Chip label="Chưa tạo" size="small" variant="outlined" color="default" />
    const mapped = shipmentStatusMap[shipment.status] || { label: shipment.status, color: 'default' as const }
    return <Chip label={mapped.label} size="small" color={mapped.color} variant="outlined" />
  }

  const getShipmentPaymentChip = (shipment?: Shipment, order?: Order) => {
    const paymentMethod = normalizePaymentMethod(shipment?.paymentMethod || order?.payment)
    if (!paymentMethod) return <Chip label="Thanh toán" size="small" variant="outlined" color="default" />
    const paymentStatus = (shipment?.paymentStatus || order?.paymentStatus || '').toLowerCase()
    if (paymentMethod === 'cod') {
      if (paymentStatus === 'paid') return <Chip label="COD: Đã thu" size="small" color="success" variant="outlined" />
      return <Chip label="COD: Chưa thu" size="small" color="warning" variant="outlined" />
    }
    return <Chip label="Đã thanh toán" size="small" color="success" variant="outlined" />
  }

  const formatDateTime = (value?: string) =>
    value ? new Date(value).toLocaleString('vi-VN', { hour12: false }) : '--'

  const columns: GridColDef<Order>[] = [
    {
      field: 'code',
      headerName: 'Mã đơn',
      minWidth: 160,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Typography variant="body2" fontWeight={700} noWrap>
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'totalPrice',
      headerName: 'Tổng tiền',
      headerAlign: 'center',
      align: 'center',
      minWidth: 140,
      valueFormatter: (params) => formatCurrency((params as any).value as number),
    },
    {
      field: 'payment',
      headerName: 'Thanh toán',
      headerAlign: 'center',
      align: 'center',
      minWidth: 140,
      renderCell: (params) => getPaymentChip(params.row.payment),
      sortable: false,
      filterable: false,
    },
    {
      field: 'paymentStatus',
      headerName: 'Trạng thái TT',
      headerAlign: 'center',
      align: 'center',
      minWidth: 150,
      renderCell: (params) => getPaymentStatusChip(params.row.paymentStatus),
      sortable: false,
      filterable: false,
    },
    {
      field: 'status',
      headerName: 'Trạng thái đơn',
      headerAlign: 'center',
      align: 'center',
      minWidth: 160,
      renderCell: (params: GridRenderCellParams<Order>) =>
        getStatusChip(params.row.status || {}, params.row.isCancelled),
      sortable: false,
      filterable: false,
    },
    {
      field: 'shipmentStatus',
      headerName: 'Vận chuyển',
      headerAlign: 'center',
      align: 'center',
      minWidth: 220,
      renderCell: (params: GridRenderCellParams<Order>) => {
        const shipment = getShipmentForOrder(params.row._id)
        return (
          <Stack spacing={0.5} sx={{ width: '100%', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            {getShipmentStatusChip(shipment)}
            {getShipmentPaymentChip(shipment, params.row)}
            {shipment?.trackingNumber && (
              <Typography variant="caption" color="text.secondary" noWrap>
                Mã: {shipment.trackingNumber}
              </Typography>
            )}
          </Stack>
        )
      },
      sortable: false,
      filterable: false,
    },
    {
      field: 'createdAt',
      headerName: 'Ngày tạo',
      headerAlign: 'center',
      align: 'center',
      minWidth: 180,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>
          <Typography variant="body2" noWrap>
            {formatDateTime((params as any).value as string)}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'actions',
      headerName: 'Thao tác',
      minWidth: 520,
      flex: 1,
      renderCell: (params: GridRenderCellParams<Order>) => {
        const order = params.row
        const disabled = updatingId === order._id
        const actionHeight = 36

        const nextActions = [
          !order.status?.confirmed && !order.isCancelled
            ? { label: 'Xác nhận', action: () => updateStatus('confirmed', order), color: 'primary' as const }
            : null,
          order.status?.confirmed && !order.status?.packaged && !order.isCancelled
            ? { label: 'Đóng gói', action: () => updateStatus('packaged', order), color: 'primary' as const }
            : null,
          order.status?.packaged && !order.status?.shipped && !order.isCancelled
            ? { label: 'Giao hàng', action: () => updateStatus('shipped', order), color: 'primary' as const }
            : null,
        ].filter(Boolean) as { label: string; action: () => void; color: 'primary' | 'secondary' }[]

        const shipment = getShipmentForOrder(order._id)
        const shippingActions =
          order.status?.shipped && !order.isCancelled
            ? shipment
              ? [
                  shipment.status === 'in_transit'
                    ? { label: 'Đang giao', action: () => updateShipmentStatus(order, 'out_for_delivery'), color: 'secondary' as const }
                    : null,
                  shipment.status === 'out_for_delivery'
                    ? { label: 'Đã nhận', action: () => updateShipmentStatus(order, 'delivered'), color: 'secondary' as const }
                    : null,
                ].filter(Boolean) as { label: string; action: () => void; color: 'primary' | 'secondary' }[]
              : [{ label: 'Tạo vận đơn', action: () => quickCreateShipment(order), color: 'secondary' as const }]
            : []

        const canConfirmCod =
          shipment &&
          normalizePaymentMethod(shipment.paymentMethod || order.payment) === 'cod' &&
          (shipment.paymentStatus || order.paymentStatus)?.toLowerCase() !== 'paid'

        const hasAnyStatus = Boolean(
          order.status?.ordered || order.status?.confirmed || order.status?.packaged || order.status?.shipped
        )
        const showRollback = order.isCancelled || hasAnyStatus
        const showCancel = !order.isCancelled
        const canDelete = true

        return (
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ width: '100%', height: '100%', minHeight: 48, justifyContent: 'flex-start', flexWrap: 'wrap' }}
          >
            <Box sx={{ flex: '0 0 32px', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <IconButton
                onClick={() => handleOpen(order)}
                color="primary"
                size="small"
                aria-label="Xem chi tiết"
              >
                <VisibilityIcon />
              </IconButton>
            </Box>

            <Box sx={{ flex: '1 1 200px', display: 'flex', gap: 0.75, alignItems: 'center', minHeight: 36, height: '100%' }}>
              {nextActions.length > 0 ? (
                nextActions.map((btn, idx) => (
                  <Button
                    key={idx}
                    color={btn.color}
                    size="small"
                    variant="contained"
                    sx={{ height: actionHeight, minHeight: actionHeight, px: 1.25, minWidth: 92 }}
                    onClick={(e) => {
                      e.stopPropagation()
                      btn.action()
                    }}
                    disabled={disabled}
                  >
                    {btn.label}
                  </Button>
                ))
              ) : (
                <Chip
                  size="small"
                  label="Hoàn tất"
                  color="success"
                  variant="outlined"
                  sx={{
                    minWidth: 100,
                    height: actionHeight,
                    '& .MuiChip-label': { px: 1.5, lineHeight: `${actionHeight}px` },
                  }}
                />
              )}
            </Box>

            <Box
              sx={{
                flex: '0 0 auto',
                display: 'flex',
                gap: 0.75,
                alignItems: 'center',
                minHeight: 36,
                height: '100%',
                justifyContent: 'flex-start',
              }}
            >
              {order.status?.shipped && shippingActions.length > 0 ? (
                shippingActions.map((btn, idx) => (
                  <Button
                    key={idx}
                    color={btn.color}
                    size="small"
                    variant="outlined"
                    sx={{ height: actionHeight, minHeight: actionHeight, px: 1.1, minWidth: 110 }}
                    onClick={(e) => {
                      e.stopPropagation()
                      btn.action()
                    }}
                    disabled={disabled}
                  >
                    {btn.label}
                  </Button>
                ))
              ) : (
                <Box sx={{ height: actionHeight, minHeight: actionHeight, minWidth: 120 }} />
              )}
            </Box>

            <Box sx={{ flex: '0 0 120px', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              {canConfirmCod ? (
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  sx={{ height: actionHeight, minHeight: actionHeight, minWidth: 110 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    updateShipmentPaymentStatus(order, 'paid')
                  }}
                  disabled={disabled}
                >
                  Thu COD
                </Button>
              ) : (
                <Box sx={{ height: actionHeight, minHeight: actionHeight, minWidth: 120 }} />
              )}
            </Box>

            <Box
              sx={{
                flex: '1 1 220px',
                display: 'flex',
                gap: 0.75,
                alignItems: 'center',
                minHeight: 36,
                height: '100%',
                justifyContent: 'flex-start',
              }}
            >
              {showRollback ? (
                <Button
                  size="small"
                  variant="outlined"
                  sx={{ height: actionHeight, minHeight: actionHeight, minWidth: 96 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    rollbackOrder(order)
                  }}
                  disabled={disabled}
                >
                  Hoàn tác
                </Button>
              ) : (
                <Box sx={{ height: actionHeight, minHeight: actionHeight, minWidth: 100 }} />
              )}
              {showCancel ? (
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  sx={{ height: actionHeight, minHeight: actionHeight, minWidth: 96 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    cancelOrder(order)
                  }}
                  disabled={disabled}
                >
                  Hủy đơn
                </Button>
              ) : (
                <Box sx={{ height: actionHeight, minHeight: actionHeight, minWidth: 100 }} />
              )}
            </Box>

            <Box sx={{ flex: '0 0 32px', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              {canDelete ? (
                <IconButton
                  color="error"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteOrder(order)
                  }}
                  disabled={disabled}
                >
                  <DeleteIcon />
                </IconButton>
              ) : (
                <Box sx={{ width: 32 }} />
              )}
            </Box>
          </Stack>
        )
      },
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

      <Paper sx={{ mt: 2, p: 2, borderRadius: 2, boxShadow: 3 }}>
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        <DataGrid
          rows={orders}
        columns={columns}
        getRowId={(row) => row._id}
        autoHeight
        rowHeight={88}
        getRowHeight={() => 96}
        columnHeaderHeight={56}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 10 },
            },
          }}
          pageSizeOptions={[5, 10, 25]}
          disableRowSelectionOnClick
          disableColumnMenu
          loading={loading}
          sx={{
            '& .MuiDataGrid-columnHeaders': { backgroundColor: 'grey.50', borderBottomColor: 'grey.200' },
            '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 700 },
            '& .MuiDataGrid-cell': { alignItems: 'center' },
            '& .MuiDataGrid-row': { borderBottomColor: 'grey.100' },
            '& .MuiDataGrid-footerContainer': { borderTopColor: 'grey.200' },
          }}
        />
      </Paper>

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
                        onClick={() => cancelOrder()}
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
