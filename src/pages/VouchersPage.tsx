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
  LinearProgress,
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material'
import { useForm } from 'react-hook-form'
import client from '../api/client'

interface Voucher {
  _id: string
  code: string
  description?: string
  discountPrice: number
  minTotal: number
  expire: string
}

const VouchersPage = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null)
  const { register, handleSubmit, reset, setValue } = useForm()

  const fetchVouchers = async () => {
    setLoading(true)
    try {
      const response = await client.get('/vouchers')
      setVouchers(response.data)
    } catch (error) {
      console.error('Error fetching vouchers:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVouchers()
  }, [])

  const handleOpen = (voucher: Voucher | null = null) => {
    setEditingVoucher(voucher)
    if (voucher) {
      setValue('code', voucher.code)
      setValue('description', voucher.description)
      setValue('discountPrice', voucher.discountPrice)
      setValue('minTotal', voucher.minTotal)
      setValue('expire', voucher.expire ? new Date(voucher.expire).toISOString().slice(0, 16) : '')
    } else {
      reset()
    }
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setEditingVoucher(null)
    reset()
  }

  const onSubmit = async (data: any) => {
    const payload = {
      code: data.code,
      description: data.description,
      discountPrice: Number(data.discountPrice),
      minTotal: Number(data.minTotal),
      expire: data.expire,
    }

    try {
      setSaving(true)
      if (editingVoucher) {
        await client.patch(`/vouchers/${editingVoucher._id}`, payload)
      } else {
        await client.post('/vouchers', payload)
      }
      fetchVouchers()
      handleClose()
    } catch (error) {
      console.error('Error saving voucher:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa voucher này?')) {
      try {
        await client.delete(`/vouchers/${id}`)
        fetchVouchers()
      } catch (error) {
        console.error('Error deleting voucher:', error)
      }
    }
  }

  const columns: GridColDef<Voucher>[] = [
    { field: 'code', headerName: 'Mã', width: 140 },
    { field: 'description', headerName: 'Mô tả', flex: 1, minWidth: 160 },
    {
      field: 'discountPrice',
      headerName: 'Giảm giá',
      width: 140,
      valueFormatter: (params) => Number((params as any).value || 0).toLocaleString('vi-VN') + ' đ',
    },
    {
      field: 'minTotal',
      headerName: 'Đơn tối thiểu',
      width: 160,
      valueFormatter: (params) => Number((params as any).value || 0).toLocaleString('vi-VN') + ' đ',
    },
    {
      field: 'expire',
      headerName: 'Hết hạn',
      width: 200,
      valueFormatter: (params) => new Date((params as any).value as string).toLocaleString('vi-VN'),
    },
    {
      field: 'actions',
      headerName: 'Hành động',
      width: 140,
      renderCell: (params: GridRenderCellParams<Voucher>) => (
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
    <Box sx={{ height: '100%', width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Voucher
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
          Thêm voucher
        </Button>
      </Box>

      {loading && <LinearProgress />}

      <DataGrid
        rows={vouchers}
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

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editingVoucher ? 'Chỉnh sửa voucher' : 'Thêm voucher'}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 1, minWidth: 420 }}>
            <TextField margin="normal" fullWidth label="Mã" required {...register('code')} />
            <TextField margin="normal" fullWidth label="Mô tả" {...register('description')} />
            <TextField
              margin="normal"
              fullWidth
              label="Giảm giá"
              type="number"
              required
              {...register('discountPrice', { valueAsNumber: true })}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Đơn hàng tối thiểu"
              type="number"
              required
              {...register('minTotal', { valueAsNumber: true })}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Ngày hết hạn"
              type="datetime-local"
              InputLabelProps={{ shrink: true }}
              required
              {...register('expire')}
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

export default VouchersPage
