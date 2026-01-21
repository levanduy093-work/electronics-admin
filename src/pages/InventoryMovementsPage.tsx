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
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Chip,
  LinearProgress,
  Autocomplete,
  CircularProgress,
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import client from '../api/client'

interface Movement {
  _id: string
  productId: string
  type: string
  quantity: number
  note?: string
  createdAt?: string | Date
  updatedAt?: string | Date
  created_at?: string | Date
  updated_at?: string | Date
}

interface ProductOption {
  _id: string
  name: string
  code?: string
  category?: string
  description?: string
  specs?: Record<string, string | undefined>
  stock?: number
}

const InventoryMovementsPage = () => {
  const [movements, setMovements] = useState<Movement[]>([])
  const [products, setProducts] = useState<ProductOption[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [productsLoading, setProductsLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<Movement | null>(null)
  const { register, handleSubmit, reset, setValue, control } = useForm<{
    productId: string
    type: string
    quantity: number
    note: string
  }>({
    defaultValues: { productId: '', type: 'inbound', quantity: undefined, note: '' },
  })

  const fetchMovements = async () => {
    setLoading(true)
    try {
      const res = await client.get('/inventory-movements')
      const normalized = (res.data || []).map(
        (m: Movement & { created_at?: string | Date; updated_at?: string | Date; _id?: unknown }) => {
          const normalizeId = (value: unknown) =>
            typeof value === 'string'
              ? value
              : (value as { toString?: () => string })?.toString?.() ?? String(value)
          const normalizeDate = (value?: string | Date) =>
            value ? new Date(value).toISOString() : undefined
          const createdRaw = m.createdAt ?? m.created_at
          const updatedRaw = m.updatedAt ?? m.updated_at

          return {
            ...m,
            _id: normalizeId(m._id),
            productId: normalizeId(m.productId),
            createdAt: normalizeDate(createdRaw) ?? normalizeDate(updatedRaw),
            updatedAt: normalizeDate(updatedRaw),
          }
        },
      )
      setMovements(normalized)
    } catch (error) {
      console.error('Error fetching inventory movements:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    setProductsLoading(true)
    try {
      const res = await client.get('/products')
      setProducts(res.data)
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setProductsLoading(false)
    }
  }

  useEffect(() => {
    fetchMovements()
    fetchProducts()
  }, [])

  const handleOpen = (movement: Movement | null = null) => {
    setEditing(movement)
    if (movement) {
      setValue('productId', movement.productId)
      setValue('type', movement.type)
      setValue('quantity', movement.quantity ?? 0)
    } else {
      reset({ productId: '', type: 'inbound', quantity: undefined, note: '' })
    }
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setEditing(null)
    reset({ productId: '', type: 'inbound', quantity: undefined, note: '' })
  }

  const onSubmit = async (data: {
    productId: string
    type: string
    quantity: number
    note: string
  }) => {
    const payload = {
      productId: data.productId,
      type: data.type,
      quantity: Number(data.quantity),
      note: data.note,
    }
    try {
      setSaving(true)
      if (editing) {
        await client.patch(`/inventory-movements/${editing._id}`, payload)
      } else {
        await client.post('/inventory-movements', payload)
      }
      fetchMovements()
      handleClose()
    } catch (error) {
      console.error('Error saving inventory movement:', error)
    } finally {
      setSaving(false)
    }
  }

  const getCreatedValue = (row: Movement) =>
    row?.createdAt ?? row?.created_at ?? row?.updatedAt ?? row?.updated_at ?? ''

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa phiếu kho này?')) {
      try {
        await client.delete(`/inventory-movements/${id}`)
        fetchMovements()
      } catch (error) {
        console.error('Error deleting inventory movement:', error)
      }
    }
  }

  const columns: GridColDef<Movement>[] = [
    {
      field: 'productId',
      headerName: 'Sản phẩm',
      flex: 1,
      minWidth: 220,
      renderCell: (params: GridRenderCellParams<Movement>) => {
        const product = products.find((p) => p._id === params.row.productId)
        const label = product
          ? `${product.name}${product.code ? ` (${product.code})` : ''}`
          : params.row.productId
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <Typography variant="body2">{label}</Typography>
          </Box>
        )
      },
    },
    {
      field: 'type',
      headerName: 'Loại',
      width: 130,
      renderCell: (params: GridRenderCellParams<Movement>) => (
        <Chip
          size="small"
          label={params.value === 'inbound' ? 'Nhập kho' : 'Xuất kho'}
          color={params.value === 'inbound' ? 'success' : 'warning'}
        />
      ),
      sortable: false,
      filterable: false,
    },
    { field: 'quantity', headerName: 'Số lượng', width: 130 },
    { field: 'note', headerName: 'Ghi chú', flex: 1, minWidth: 160 },
    {
      field: 'createdAt',
      headerName: 'Ngày tạo',
      width: 180,
      valueGetter: (_value, row) => getCreatedValue(row),
      renderCell: (params) => {
        const raw = getCreatedValue(params.row)
        const dateValue = raw ? new Date(raw) : null
        const display = dateValue && !Number.isNaN(dateValue.getTime()) ? dateValue.toLocaleString('vi-VN') : ''
        return (
          <Box sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2">{display}</Typography>
          </Box>
        )
      },
    },
    {
      field: 'actions',
      headerName: 'Hành động',
      width: 140,
      renderCell: (params) => (
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

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Tồn kho
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
          Thêm phiếu
        </Button>
      </Box>

      {loading && <LinearProgress />}

      <DataGrid
        rows={movements}
        columns={columns}
        getRowId={(row) => row._id}
        autoHeight
        initialState={{ pagination: { paginationModel: { page: 0, pageSize: 10 } } }}
        pageSizeOptions={[5, 10, 25]}
        disableRowSelectionOnClick
      />

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editing ? 'Chỉnh sửa phiếu kho' : 'Thêm phiếu kho'}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 1, minWidth: 420 }}>
            <Controller
              name="productId"
              control={control}
              defaultValue=""
              rules={{ required: 'Vui lòng chọn sản phẩm' }}
              render={({ field, fieldState }) => {
                const selectedProduct = products.find((p) => p._id === field.value) || null
                return (
                  <Autocomplete
                    fullWidth
                    options={products}
                    value={selectedProduct}
                    loading={productsLoading}
                    onChange={(_, value) => field.onChange(value?._id ?? '')}
                    getOptionLabel={(option) =>
                      option?.name ? `${option.name}${option.code ? ` (${option.code})` : ''}` : ''
                    }
                    isOptionEqualToValue={(option, value) => option._id === value._id}
                    filterOptions={(options, { inputValue }) => {
                      const normalized = normalizeText(inputValue)
                      if (!normalized) return options
                      return options.filter((opt) => {
                        const haystacks = [
                          opt.name,
                          opt.code,
                          opt.category,
                          opt.description,
                          ...Object.entries(opt.specs || {}).map(([k, v]) => `${k} ${v ?? ''}`),
                        ]
                        return haystacks.some((h) => fuzzyMatch(h, normalized))
                      })
                    }}
                    renderOption={(props, option) => (
                      <li {...props}>
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {option.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {option.code ? `${option.code} • ` : ''}
                            {option.category || 'Chưa có danh mục'}
                            {typeof option.stock === 'number' ? ` • Tồn: ${option.stock}` : ''}
                          </Typography>
                        </Box>
                      </li>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        margin="normal"
                        fullWidth
                        label="Sản phẩm"
                        required
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {productsLoading ? <CircularProgress color="inherit" size={18} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />
                )
              }}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel id="type-label">Loại</InputLabel>
              <Controller
                name="type"
                control={control}
                defaultValue="inbound"
                render={({ field }) => (
                  <Select labelId="type-label" label="Loại" {...field}>
                    <MenuItem value="inbound">Nhập kho</MenuItem>
                    <MenuItem value="outbound">Xuất kho</MenuItem>
                  </Select>
                )}
              />
            </FormControl>
            <TextField
              margin="normal"
              fullWidth
              label="Số lượng"
              type="number"
              required
              {...register('quantity', { valueAsNumber: true })}
            />
            <TextField margin="normal" fullWidth label="Ghi chú" {...register('note')} />
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

export default InventoryMovementsPage
