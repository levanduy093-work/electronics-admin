import React, { useEffect, useState } from 'react'
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
  Stack,
  Chip,
  LinearProgress,
  InputAdornment,
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import type { GridColDef } from '@mui/x-data-grid'
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material'
import { useForm } from 'react-hook-form'
import client from '../api/client'

interface Product {
  _id: string
  name: string
  code?: string
  category?: string
  price: {
    originalPrice: number
    salePrice: number
  }
  stock: number
  description?: string
  images: string[]
  datasheet?: string
  specs?: {
    resistance?: string
    tolerance?: string
    power?: string
    scope?: string
    voltage?: string
    [key: string]: string | undefined
  }
}

interface ProductFormValues {
  name: string
  code?: string
  category?: string
  originalPrice: number
  salePrice: number
  stock: number
  description?: string
  images?: string
  datasheet?: string
}

const ProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [dynamicSpecs, setDynamicSpecs] = useState<{ key: string; value: string }[]>([])
  const { register, handleSubmit, reset, setValue } = useForm<ProductFormValues>()

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const response = await client.get('/products')
      setProducts(response.data)
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const handleOpen = (product: Product | null = null) => {
    setEditingProduct(product)
    if (product) {
      setValue('name', product.name)
      setValue('code', product.code || '')
      setValue('category', product.category || '')
      setValue('originalPrice', product.price.originalPrice)
      setValue('salePrice', product.price.salePrice)
      setValue('stock', product.stock)
      setValue('description', product.description || '')
      setValue('images', product.images?.join(', ') || '')
      setValue('datasheet', product.datasheet || '')
      const entries = Object.entries(product.specs || {})
      setDynamicSpecs(entries.map(([k, v]) => ({ key: k, value: v ?? '' })))
    } else {
      reset()
      setDynamicSpecs([])
    }
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setEditingProduct(null)
    reset()
  }

  const onSubmit = async (data: ProductFormValues) => {
    const dynamicSpecMap = dynamicSpecs.reduce<Record<string, string>>((acc, item) => {
      if (item.key.trim() && item.value.trim()) {
        acc[item.key.trim()] = item.value.trim()
      }
      return acc
    }, {})

    const payload = {
      name: data.name,
      code: data.code || undefined,
      category: data.category || undefined,
      price: {
        originalPrice: Number(data.originalPrice),
        salePrice: Number(data.salePrice),
      },
      stock: Number(data.stock),
      description: data.description,
      datasheet: data.datasheet,
      images: data.images
        ? data.images
            .split(',')
            .map((url) => url.trim())
            .filter(Boolean)
        : [],
      specs: Object.fromEntries(
        Object.entries({ ...dynamicSpecMap }).filter(
          ([, v]) => v !== undefined && v !== null && String(v).trim() !== ''
        )
      ),
    }

    try {
      setSaving(true)
      if (editingProduct) {
        await client.patch(`/products/${editingProduct._id}`, payload)
      } else {
        await client.post('/products', payload)
      }
      fetchProducts()
      handleClose()
    } catch (error) {
      console.error('Error saving product:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
      try {
        await client.delete(`/products/${id}`)
        fetchProducts()
      } catch (error) {
        console.error('Error deleting product:', error)
      }
    }
  }

  const columns: GridColDef[] = [
    { field: 'code', headerName: 'Mã', width: 120 },
    { field: 'name', headerName: 'Tên', width: 200 },
    { field: 'category', headerName: 'Danh mục', width: 140 },
    {
      field: 'price',
      headerName: 'Giá',
      width: 180,
      valueGetter: (params: any) => params.row?.price?.salePrice ?? 0,
      renderCell: (params: any) => {
        const sale = params.row?.price?.salePrice ?? 0
        const original = params.row?.price?.originalPrice ?? 0
        return (
        <Stack spacing={0.3}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {sale.toLocaleString('vi-VN')} đ
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Gốc: {original.toLocaleString('vi-VN')} đ
          </Typography>
        </Stack>
        )
      },
    },
    { field: 'stock', headerName: 'Tồn kho', width: 110 },
    {
      field: 'status',
      headerName: 'Trạng thái',
      width: 140,
      renderCell: (params) => (
        <Chip
          label={params.row.stock > 0 ? 'Đang bán' : 'Hết hàng'}
          color={params.row.stock > 0 ? 'success' : 'warning'}
          size="small"
        />
      ),
      sortable: false,
      filterable: false,
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

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
        <div>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Sản phẩm
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Quản lý danh mục, giá bán, tồn kho và thông số kỹ thuật.
          </Typography>
        </div>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
          Thêm sản phẩm
        </Button>
      </Box>

      {loading && <LinearProgress />}

      <DataGrid
        rows={products}
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
        <DialogTitle>{editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm'}</DialogTitle>
        <DialogContent>
          <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            sx={{
              mt: 1,
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
              gap: 2,
            }}
          >
            <TextField margin="normal" fullWidth label="Tên" required {...register('name')} />
            <TextField margin="normal" fullWidth label="Mã sản phẩm" {...register('code')} />
            <TextField margin="normal" fullWidth label="Danh mục" {...register('category')} />
            <TextField margin="normal" fullWidth label="Link datasheet" {...register('datasheet')} />
            <TextField
              margin="normal"
              fullWidth
              label="Giá gốc"
              type="number"
              required
              {...register('originalPrice', { valueAsNumber: true })}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Giá bán"
              type="number"
              required
              {...register('salePrice', { valueAsNumber: true })}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Tồn kho"
              type="number"
              required
              {...register('stock', { valueAsNumber: true })}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Ảnh (URL, cách nhau bởi dấu phẩy)"
              sx={{ gridColumn: { sm: 'span 2' } }}
              {...register('images')}
            />

            <Typography variant="subtitle1" sx={{ mt: 1, mb: 0.5, gridColumn: { sm: 'span 2' } }}>
              Thông số kỹ thuật
            </Typography>
            {dynamicSpecs.map((item, idx) => (
              <React.Fragment key={`${item.key}-${idx}`}>
                <TextField
                  fullWidth
                  label="Tên thông số"
                  value={item.key}
                  onChange={(e) =>
                    setDynamicSpecs((prev) =>
                      prev.map((spec, i) => (i === idx ? { ...spec, key: e.target.value } : spec))
                    )
                  }
                />
                <TextField
                  fullWidth
                  label="Giá trị"
                  value={item.value}
                  onChange={(e) =>
                    setDynamicSpecs((prev) =>
                      prev.map((spec, i) => (i === idx ? { ...spec, value: e.target.value } : spec))
                    )
                  }
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="Xóa"
                          onClick={() => setDynamicSpecs((prev) => prev.filter((_, i) => i !== idx))}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </React.Fragment>
            ))}
            <Button
              variant="outlined"
              sx={{ gridColumn: { sm: 'span 2' } }}
              onClick={() => setDynamicSpecs((prev) => [...prev, { key: '', value: '' }])}
            >
              Thêm thông số
            </Button>
            <TextField
              margin="normal"
              fullWidth
              label="Mô tả"
              multiline
              rows={4}
              sx={{ gridColumn: { sm: 'span 2' } }}
              {...register('description')}
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

export default ProductsPage
