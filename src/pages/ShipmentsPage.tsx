import { useState } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  IconButton,
  Typography,
  Chip,
  LinearProgress,
  MenuItem,
  Stack,
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material'
import { useForm } from 'react-hook-form'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'

interface Shipment {
  _id: string
  orderId: string
  carrier: string
  trackingNumber: string
  status: string
  statusHistory?: { status: string; at?: string }[]
  expectedDelivery?: string
  createdAt?: string | Date
  updatedAt?: string | Date
  paymentMethod?: string
  paymentStatus?: string
}

interface ShipmentFormValues {
  orderId: string
  carrier: string
  trackingNumber: string
  status: string
  paymentMethod: string
  paymentStatus: string
  expectedDelivery: string
}

const ShipmentsPage = () => {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<Shipment | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const { register, handleSubmit, reset, setValue } = useForm<ShipmentFormValues>()
  const queryClient = useQueryClient()

  const fetchShipments = async () => {
    const res = await client.get('/shipments')
    return (res.data || []).map((s: Shipment) => ({
      ...s,
      expectedDelivery: s.expectedDelivery || null,
      createdAt: s.createdAt || s.updatedAt || null,
      updatedAt: s.updatedAt || null,
    })) as Shipment[]
  }

  const {
    data: shipments = [],
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ['shipments'],
    queryFn: fetchShipments,
  })

  const statusOptions = [
    { value: 'in_transit', label: 'Đang vận chuyển' },
    { value: 'out_for_delivery', label: 'Đang giao hàng' },
    { value: 'delivered', label: 'Đã nhận hàng' },
  ]

  const paymentStatusOptions = [
    { value: 'pending', label: 'Chờ thu COD' },
    { value: 'paid', label: 'Đã thanh toán' },
  ]

  const getStatusChip = (status?: string) => {
    if (!status) return <Chip label="Chưa rõ" size="small" variant="outlined" />
    const map: Record<string, { label: string; color: 'info' | 'primary' | 'success' | 'default' }> = {
      in_transit: { label: 'Đang vận chuyển', color: 'info' },
      out_for_delivery: { label: 'Đang giao hàng', color: 'primary' },
      delivered: { label: 'Đã nhận hàng', color: 'success' },
    }
    const mapped = map[status] || { label: status, color: 'default' }
    return <Chip label={mapped.label} color={mapped.color} size="small" variant="outlined" />
  }

  const getPaymentChip = (shipment: Shipment) => {
    const method = (shipment.paymentMethod || '').toLowerCase()
    const status = (shipment.paymentStatus || '').toLowerCase()
    if (method === 'cod') {
      if (status === 'paid') return <Chip label="COD: Đã thu" size="small" color="success" variant="outlined" />
      return <Chip label="COD: Chưa thu" size="small" color="warning" variant="outlined" />
    }
    return <Chip label="Đã thanh toán" size="small" color="success" variant="outlined" />
  }

  const handleOpen = (shipment: Shipment | null = null) => {
    setEditing(shipment)
    if (shipment) {
      setValue('orderId', shipment.orderId)
      setValue('carrier', shipment.carrier)
      setValue('trackingNumber', shipment.trackingNumber)
      setValue('status', shipment.status)
      setValue('paymentMethod', shipment.paymentMethod || 'cod')
      setValue('paymentStatus', shipment.paymentStatus || (shipment.paymentMethod === 'cod' ? 'pending' : 'paid'))
      setValue('expectedDelivery', shipment.expectedDelivery ? new Date(shipment.expectedDelivery).toISOString().slice(0, 16) : '')
    } else {
      reset({
        paymentMethod: 'cod',
        paymentStatus: 'pending',
      })
    }
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setEditing(null)
    reset()
  }

  const onSubmit = async (data: ShipmentFormValues) => {
    const payload = {
      orderId: data.orderId,
      carrier: data.carrier,
      trackingNumber: data.trackingNumber,
      status: data.status,
      expectedDelivery: data.expectedDelivery || undefined,
      paymentMethod: data.paymentMethod,
      paymentStatus: data.paymentStatus,
    }
    try {
      setSaving(true)
      if (editing) {
        await client.patch(`/shipments/${editing._id}`, payload)
      } else {
        await client.post('/shipments', payload)
      }
      await queryClient.invalidateQueries({ queryKey: ['shipments'] })
      handleClose()
    } catch (error) {
      console.error('Error saving shipment:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa vận đơn này?')) {
      try {
        await client.delete(`/shipments/${id}`)
        await queryClient.invalidateQueries({ queryKey: ['shipments'] })
      } catch (error) {
        console.error('Error deleting shipment:', error)
      }
    }
  }

  const quickUpdateStatus = async (shipment: Shipment, status: string) => {
    try {
      setUpdatingId(shipment._id)
      await client.patch(`/shipments/${shipment._id}`, { status })
      await queryClient.invalidateQueries({ queryKey: ['shipments'] })
    } catch (error) {
      console.error('Error updating shipment status:', error)
    } finally {
      setUpdatingId(null)
    }
  }

  const quickUpdatePayment = async (shipment: Shipment, status: string) => {
    try {
      setUpdatingId(shipment._id)
      await client.patch(`/shipments/${shipment._id}`, { paymentStatus: status })
      await queryClient.invalidateQueries({ queryKey: ['shipments'] })
    } catch (error) {
      console.error('Error updating shipment payment:', error)
    } finally {
      setUpdatingId(null)
    }
  }

  const columns: GridColDef<Shipment>[] = [
    { field: 'orderId', headerName: 'Order ID', flex: 1, minWidth: 200 },
    { field: 'carrier', headerName: 'Hãng VC', width: 140 },
    { field: 'trackingNumber', headerName: 'Mã vận đơn', width: 180 },
    {
      field: 'status',
      headerName: 'Trạng thái',
      width: 150,
      renderCell: (params: GridRenderCellParams<Shipment>) => getStatusChip(params.row.status),
    },
    {
      field: 'paymentStatus',
      headerName: 'Thanh toán',
      width: 160,
      renderCell: (params: GridRenderCellParams<Shipment>) => getPaymentChip(params.row),
    },
    {
      field: 'expectedDelivery',
      headerName: 'Dự kiến giao',
      width: 200,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<Shipment>) => {
        const value = params.row.expectedDelivery || null
        if (!value)
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>
              <Typography variant="body2" color="text.secondary">
                —
              </Typography>
            </Box>
          )
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>
            <Typography variant="body2">{new Date(value).toLocaleString('vi-VN')}</Typography>
          </Box>
        )
      },
    },
    {
      field: 'createdAt',
      headerName: 'Tạo lúc',
      width: 180,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<Shipment>) => {
        const value = params.row.createdAt || params.row.updatedAt || null
        if (!value)
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>
              <Typography variant="body2" color="text.secondary">
                —
              </Typography>
            </Box>
          )
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>
            <Typography variant="body2">{new Date(value).toLocaleString('vi-VN')}</Typography>
          </Box>
        )
      },
    },
    {
      field: 'actions',
      headerName: 'Hành động',
      width: 340,
      renderCell: (params: GridRenderCellParams<Shipment>) => {
        const shipment = params.row
        const disabled = updatingId === shipment._id
        const actionHeight = 36
        const actionWidth = 110
        const iconBox = 32
        const nextStatus =
          shipment.status === 'in_transit'
            ? { label: 'Đang giao', value: 'out_for_delivery' }
            : shipment.status === 'out_for_delivery'
              ? { label: 'Đã nhận', value: 'delivered' }
              : null
        const canCollectCod =
          (shipment.paymentMethod || '').toLowerCase() === 'cod' &&
          (shipment.paymentStatus || '').toLowerCase() !== 'paid'
        return (
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ width: '100%', minHeight: actionHeight, height: '100%', justifyContent: 'center' }}
          >
            {nextStatus ? (
              <Button
                size="small"
                variant="contained"
                color="primary"
                sx={{ minWidth: actionWidth, height: actionHeight, minHeight: actionHeight }}
                onClick={() => quickUpdateStatus(shipment, nextStatus.value)}
                disabled={disabled}
              >
                {nextStatus.label}
              </Button>
            ) : (
              <Chip
                label="Đã hoàn tất"
                size="small"
                color="success"
                variant="outlined"
                sx={{ minWidth: actionWidth, height: actionHeight, '& .MuiChip-label': { lineHeight: `${actionHeight}px` } }}
              />
            )}
            {canCollectCod && (
              <Button
                size="small"
                variant="contained"
                color="success"
                sx={{ minWidth: actionWidth, height: actionHeight, minHeight: actionHeight }}
                onClick={() => quickUpdatePayment(shipment, 'paid')}
                disabled={disabled}
              >
                {nextStatus ? 'Thu COD' : 'Thu COD'}
              </Button>
            )}
            <IconButton
              onClick={() => handleOpen(params.row)}
              color="primary"
              disabled={disabled}
              sx={{ width: iconBox, height: iconBox }}
            >
              <EditIcon />
            </IconButton>
            <IconButton
              onClick={() => handleDelete(params.row._id)}
              color="error"
              disabled={disabled}
              sx={{ width: iconBox, height: iconBox }}
            >
              <DeleteIcon />
            </IconButton>
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
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Vận chuyển
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
          Tạo vận đơn
        </Button>
      </Box>

      {(isLoading || isFetching) && <LinearProgress />}

      <DataGrid
        rows={shipments}
        columns={columns}
        getRowId={(row) => row._id}
        autoHeight
        initialState={{ pagination: { paginationModel: { page: 0, pageSize: 10 } } }}
        pageSizeOptions={[5, 10, 25]}
        disableRowSelectionOnClick
      />

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editing ? 'Cập nhật vận đơn' : 'Tạo vận đơn'}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 1, minWidth: 440 }}>
            <TextField margin="normal" fullWidth label="Order ID" required {...register('orderId')} />
            <TextField margin="normal" fullWidth label="Hãng vận chuyển" required {...register('carrier')} />
            <TextField margin="normal" fullWidth label="Mã vận đơn" required {...register('trackingNumber')} />
            <TextField margin="normal" fullWidth label="Trạng thái" required select {...register('status')}>
              {statusOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField margin="normal" fullWidth label="Hình thức thanh toán" required select {...register('paymentMethod')}>
              <MenuItem value="cod">COD</MenuItem>
              <MenuItem value="vnpay">VNPAY</MenuItem>
            </TextField>
            <TextField margin="normal" fullWidth label="Trạng thái thanh toán" required select {...register('paymentStatus')}>
              {paymentStatusOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              margin="normal"
              fullWidth
              label="Ngày giao dự kiến"
              type="datetime-local"
              InputLabelProps={{ shrink: true }}
              {...register('expectedDelivery')}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Hủy</Button>
          <Button onClick={handleSubmit(onSubmit)} variant="contained" disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ShipmentsPage
