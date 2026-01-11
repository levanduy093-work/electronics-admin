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
  FormHelperText,
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import type { GridColDef } from '@mui/x-data-grid'
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, Search as SearchIcon } from '@mui/icons-material'
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
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [dynamicSpecs, setDynamicSpecs] = useState<{ id: string; key: string; value: string }[]>([])
  const [imageFiles, setImageFiles] = useState<File[]>([])
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
    setImageFiles([])
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
      setDynamicSpecs(entries.map(([k, v], idx) => ({ id: `${product._id}-${idx}`, key: k, value: v ?? '' })))
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
    setImageFiles([])
  }

  const onSubmit = async (data: ProductFormValues) => {
    const dynamicSpecMap = dynamicSpecs.reduce<Record<string, string>>((acc, item) => {
      if (item.key.trim() && item.value.trim()) {
        acc[item.key.trim()] = item.value.trim()
      }
      return acc
    }, {})

    const urlListFromInput = data.images
      ? data.images
          .split(',')
          .map((url) => url.trim())
          .filter(Boolean)
      : []

    const folder =
      editingProduct?._id
        ? `electronics-shop/products/${editingProduct._id}`
        : `electronics-shop/products/temp-${Date.now()}-${slugify(data.name || 'product')}`

    let uploadedUrls: string[] = []
    if (imageFiles.length) {
      try {
        uploadedUrls = await uploadImagesToCloud(imageFiles, folder)
      } catch (error) {
        console.error('Error uploading images:', error)
      }
    }

    const mergedImages = Array.from(new Set([...urlListFromInput, ...uploadedUrls]))
    const latestOnly = mergedImages.length ? [mergedImages[mergedImages.length - 1]] : []

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
      images: latestOnly,
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
      setImageFiles([])
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
    // mọi token phải xuất hiện (partial prefix ok)
    return tokens.every((t) => h.includes(t) || h.split(/\s+/).some((w) => w.startsWith(t)))
  }

  const normalizedSearch = normalizeText(search)
  const filteredProducts = normalizedSearch
    ? products.filter((p) => {
        const haystacks = [
          p.name,
          p.code,
          p.category,
          p.description,
          ...Object.entries(p.specs || {}).map(([k, v]) => `${k} ${v ?? ''}`),
        ]
        return haystacks.some((h) => fuzzyMatch(h, normalizedSearch))
      })
    : products

  const slugify = (value: string) =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48)

  const uploadImagesToCloud = async (files: File[], folder: string) => {
    const uploads = files.map(async (file) => {
      const formData = new FormData()
      formData.append('file', file)
      const res = await client.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        params: { folder },
      })
      return res.data?.secure_url || res.data?.url
    })
    const results = await Promise.all(uploads)
    return results.filter((url): url is string => Boolean(url))
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, flexWrap: 'wrap' }}>
        <div>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Sản phẩm
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Quản lý danh mục, giá bán, tồn kho và thông số kỹ thuật.
          </Typography>
        </div>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: { sm: 'center' }, width: { xs: '100%', sm: 'auto' } }}>
          <TextField
            size="small"
            placeholder="Tìm theo tên, mã, danh mục..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: { xs: '100%', sm: 260 } }}
          />
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
            Thêm sản phẩm
          </Button>
        </Stack>
      </Box>

      {loading && <LinearProgress />}

      <DataGrid
        rows={filteredProducts}
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
            <Box sx={{ gridColumn: { sm: 'span 2' } }}>
              <Button variant="outlined" component="label">
                Chọn ảnh từ máy
                <input
                  hidden
                  multiple
                  accept="image/*"
                  type="file"
                  onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
                />
              </Button>
              <FormHelperText>
                Có thể dán URL hoặc chọn file. Khi lưu, file sẽ được tải lên Cloudinary và lưu URL trả về.
              </FormHelperText>
              {imageFiles.length > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  {imageFiles.length} file đã chọn: {imageFiles.map((f) => f.name).join(', ')}
                </Typography>
              )}
            </Box>

            <Typography variant="subtitle1" sx={{ mt: 1, mb: 0.5, gridColumn: { sm: 'span 2' } }}>
              Thông số kỹ thuật
            </Typography>
            {dynamicSpecs.map((item) => (
              <React.Fragment key={item.id}>
                <TextField
                  fullWidth
                  label="Tên thông số"
                  value={item.key}
                  onChange={(e) =>
                    setDynamicSpecs((prev) =>
                      prev.map((spec) => (spec.id === item.id ? { ...spec, key: e.target.value } : spec))
                    )
                  }
                />
                <TextField
                  fullWidth
                  label="Giá trị"
                  value={item.value}
                  onChange={(e) =>
                    setDynamicSpecs((prev) =>
                      prev.map((spec) => (spec.id === item.id ? { ...spec, value: e.target.value } : spec))
                    )
                  }
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="Xóa"
                          onClick={() => setDynamicSpecs((prev) => prev.filter((spec) => spec.id !== item.id))}
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
              onClick={() =>
                setDynamicSpecs((prev) => [
                  ...prev,
                  { id: `spec-${Date.now()}-${prev.length}`, key: '', value: '' },
                ])
              }
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
