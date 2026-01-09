import { useEffect, useState } from 'react'
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
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material'
import { useForm } from 'react-hook-form'
import client from '../api/client'

interface Shipment {
  _id: string
  orderId: string
  carrier: string
  trackingNumber: string
  status: string
  statusHistory?: { status: string; at?: string }[]
  expectedDelivery?: string
  createdAt?: string
}

const ShipmentsPage = () => {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<Shipment | null>(null)
  const { register, handleSubmit, reset, setValue } = useForm()

  const fetchShipments = async () => {
    setLoading(true)
    try {
      const res = await client.get('/shipments')
      setShipments(res.data)
    } catch (error) {
      console.error('Error fetching shipments:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchShipments()
  }, [])

  const handleOpen = (shipment: Shipment | null = null) => {
    setEditing(shipment)
    if (shipment) {
      setValue('orderId', shipment.orderId)
      setValue('carrier', shipment.carrier)
      setValue('trackingNumber', shipment.trackingNumber)
      setValue('status', shipment.status)
      setValue('expectedDelivery', shipment.expectedDelivery ? new Date(shipment.expectedDelivery).toISOString().slice(0, 16) : '')
    } else {
      reset()
    }
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setEditing(null)
    reset()
  }

  const onSubmit = async (data: any) => {
    const payload = {
      orderId: data.orderId,
      carrier: data.carrier,
      trackingNumber: data.trackingNumber,
      status: data.status,
      expectedDelivery: data.expectedDelivery || undefined,
    }
    try {
      setSaving(true)
      if (editing) {
        await client.patch(`/shipments/${editing._id}`, payload)
      } else {
        await client.post('/shipments', payload)
      }
      fetchShipments()
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
        fetchShipments()
      } catch (error) {
        console.error('Error deleting shipment:', error)
      }
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
      renderCell: (params: GridRenderCellParams<Shipment>) => <Chip label={params.value} color="primary" size="small" />,
    },
    {
      field: 'expectedDelivery',
      headerName: 'Dự kiến giao',
      width: 200,
      valueFormatter: (params) =>
        (params as any).value ? new Date((params as any).value as string).toLocaleString('vi-VN') : '',
    },
    {
      field: 'createdAt',
      headerName: 'Tạo lúc',
      width: 180,
      valueFormatter: (params) =>
        (params as any).value ? new Date((params as any).value as string).toLocaleString('vi-VN') : '',
    },
    {
      field: 'actions',
      headerName: 'Hành động',
      width: 140,
      renderCell: (params: GridRenderCellParams<Shipment>) => (
        <>
          <IconButton onClick={() => handleOpen(params.row)} color="primary">
            <EditIcon />
          </IconButton>
          <IconButton onClick={() => handleDelete(params.row._id)} color="error">
            <DeleteIcon />
          </IconButton>
        </>
      ),
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

      {loading && <LinearProgress />}

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
            <TextField margin="normal" fullWidth label="Trạng thái" required {...register('status')} />
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
