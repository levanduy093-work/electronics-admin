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
  Stack,
  InputAdornment,
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, Search as SearchIcon } from '@mui/icons-material'
import { useForm } from 'react-hook-form'
import client from '../api/client'

interface Voucher {
  _id: string
  code: string
  description?: string
  discountPrice: number
  discountRate?: number
  maxDiscountPrice?: number
  minTotal: number
  expire?: string
  type?: 'fixed' | 'shipping' | 'percentage'
}

interface VoucherFormValues {
  code: string
  description: string
  discountPrice: number
  discountRate: number
  maxDiscountPrice: number
  minTotal: number
  expire: string
}

const VouchersPage = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null)
  const { register, handleSubmit, reset, setValue } = useForm<VoucherFormValues>()
  const [type, setType] = useState<'fixed' | 'shipping' | 'percentage'>('fixed')

  const fetchVouchers = async () => {
    setLoading(true)
    try {
      const response = await client.get('/vouchers')
      const normalized = (response.data as Voucher[]).map((v) => ({
        ...v,
        discountPrice: Number(v.discountPrice ?? 0),
        minTotal: Number(v.minTotal ?? 0),
        expire: v.expire,
      }))
      setVouchers(normalized)
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
      setValue('description', voucher.description || '')
      setValue('discountPrice', voucher.discountPrice)
      setValue('discountRate', voucher.discountRate || 0)
      setValue('maxDiscountPrice', voucher.maxDiscountPrice || 0)
      setValue('minTotal', voucher.minTotal)
      setValue('expire', voucher.expire ? new Date(voucher.expire).toISOString().slice(0, 16) : '')
      if (voucher.type) {
        setType(voucher.type)
      } else {
        setType('fixed')
      }
    } else {
      reset()
      setType('fixed')
    }
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setEditingVoucher(null)
    reset()
  }

  const onSubmit = async (data: VoucherFormValues) => {
    const payload: Record<string, unknown> = {
      code: data.code,
      description: data.description,
      minTotal: Number(data.minTotal),
      expire: data.expire ? new Date(data.expire).toISOString() : undefined,
      type,
    }

    if (type === 'percentage') {
      payload.discountRate = Number(data.discountRate)
      payload.maxDiscountPrice = data.maxDiscountPrice ? Number(data.maxDiscountPrice) : undefined
      payload.discountPrice = 0
    } else {
      payload.discountPrice = Number(data.discountPrice)
      payload.discountRate = undefined
      payload.maxDiscountPrice = undefined
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
      renderCell: (params: GridRenderCellParams<Voucher>) => {
        const row = params.row
        if (row.type === 'percentage') {
          const rate = Number(row.discountRate ?? 0)
          const cap = row.maxDiscountPrice ? Number(row.maxDiscountPrice).toLocaleString('vi-VN') + ' đ' : 'không giới hạn'
          return `${rate}% (tối đa ${cap})`
        }
        const num = Number(row.discountPrice ?? 0)
        return num.toLocaleString('vi-VN') + ' đ'
      },
    },
    {
      field: 'minTotal',
      headerName: 'Đơn tối thiểu',
      width: 160,
      renderCell: (params: GridRenderCellParams<Voucher>) => {
        const value = params.row?.minTotal ?? 0
        const num = Number(value ?? 0)
        return num.toLocaleString('vi-VN') + ' đ'
      },
    },
    {
      field: 'expire',
      headerName: 'Hết hạn',
      width: 200,
      renderCell: (params: GridRenderCellParams<Voucher>) => {
        const raw = params.row?.expire
        if (!raw) return '—'
        const parsed = new Date(raw as string)
        if (Number.isNaN(parsed.getTime())) return '—'
        return parsed.toLocaleString('vi-VN')
      },
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

  const normalizeText = (value?: string) =>
    (value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()

  const fuzzyMatch = (haystack: string | undefined, needle: string) => {
    if (!needle) return true
    const h = normalizeText(haystack)
    if (h.includes(needle)) return true
    const tokens = needle.split(/\s+/).filter(Boolean)
    if (!tokens.length) return true
    return tokens.every((t) => h.includes(t) || h.split(/\s+/).some((w) => w.startsWith(t)))
  }

  const normalizedSearch = normalizeText(search)
  const filteredVouchers = normalizedSearch
    ? vouchers.filter((v) => {
      const haystacks = [
        v.code,
        v.description,
        v.type,
        v.discountPrice?.toString(),
        v.discountRate?.toString(),
        v.maxDiscountPrice?.toString(),
        v.minTotal?.toString(),
      ]
      return haystacks.some((h) => fuzzyMatch(h, normalizedSearch))
    })
    : vouchers

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Voucher
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: { sm: 'center' }, width: { xs: '100%', sm: 'auto' } }}>
          <TextField
            size="small"
            placeholder="Tìm theo mã, mô tả, loại..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: { xs: '100%', sm: 240 } }}
          />
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
            Thêm voucher
          </Button>
        </Stack>
      </Box>

      {loading && <LinearProgress />}

      <DataGrid
        rows={filteredVouchers}
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
              select
              label="Loại giảm giá"
              SelectProps={{ native: true }}
              value={type}
              onChange={(e) => setType(e.target.value as 'fixed' | 'shipping' | 'percentage')}
            >
              <option value="fixed">Giảm số tiền cố định</option>
              <option value="percentage">Giảm theo % (có thể đặt mức tối đa)</option>
              <option value="shipping">Giảm phí vận chuyển</option>
            </TextField>
            {type === 'percentage' ? (
              <>
                <TextField
                  margin="normal"
                  fullWidth
                  label="Giảm (%)"
                  type="number"
                  inputProps={{ min: 0, max: 100, step: 1 }}
                  {...register('discountRate', { valueAsNumber: true })}
                />
                <TextField
                  margin="normal"
                  fullWidth
                  label="Giảm tối đa (đ)"
                  type="number"
                  inputProps={{ min: 0, step: 1000 }}
                  {...register('maxDiscountPrice', { valueAsNumber: true })}
                />
              </>
            ) : (
              <TextField
                margin="normal"
                fullWidth
                label={type === 'shipping' ? 'Giảm phí ship (đ)' : 'Giảm giá (đ)'}
                type="number"
                inputProps={{ min: 0, step: 1000 }}
                required
                {...register('discountPrice', { valueAsNumber: true })}
              />
            )}
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
