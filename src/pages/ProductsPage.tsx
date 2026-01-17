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
  Snackbar,
  Alert,
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
  options?: string[]
  classifications?: string[]
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
  const [backgroundSaving, setBackgroundSaving] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [dynamicSpecs, setDynamicSpecs] = useState<{ id: string; key: string; value: string }[]>([])
  const [options, setOptions] = useState<{ id: string; value: string }[]>([])
  const [classifications, setClassifications] = useState<{ id: string; value: string }[]>([])
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imageUrls, setImageUrls] = useState<{ id: string; url: string }[]>([])
  const [toast, setToast] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error' | 'info'
  }>({
    open: false,
    message: '',
    severity: 'info',
  })
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ProductFormValues>()

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
      setValue('datasheet', product.datasheet || '')
      
      const currentImages = product.images || []
      setImageUrls(currentImages.map((url, index) => ({ id: `img-${index}-${Date.now()}`, url })))
      
      const entries = Object.entries(product.specs || {})
      setDynamicSpecs(
        entries.map(([k, v], idx) => ({
          id: `${product._id}-${idx}`,
          key: k,
          value: v !== null && v !== undefined ? String(v) : '',
        })),
      )
      
      // Load options
      const productOptions = product.options || []
      setOptions(
        productOptions.map((opt, idx) => ({
          id: `opt-${product._id}-${idx}`,
          value: String(opt),
        })),
      )
      
      // Load classifications
      const productClassifications = product.classifications || []
      setClassifications(
        productClassifications.map((cls, idx) => ({
          id: `cls-${product._id}-${idx}`,
          value: String(cls),
        })),
      )
    } else {
      reset()
      setDynamicSpecs([])
      setOptions([])
      setClassifications([])
      setImageUrls([])
    }
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setSaving(false)
    setEditingProduct(null)
    reset()
    setImageFiles([])
    setImageUrls([])
    setOptions([])
    setClassifications([])
  }

  const onSubmit = async (data: ProductFormValues) => {
    const productBeingEdited = editingProduct
    const specsSnapshot = [...dynamicSpecs]
    const optionsSnapshot = [...options]
    const classificationsSnapshot = [...classifications]
    const filesSnapshot = [...imageFiles]
    const urlsSnapshot = [...imageUrls]

    const dynamicSpecMap = specsSnapshot.reduce<Record<string, string>>((acc, item) => {
      const k = String(item.key || '').trim()
      const v = String(item.value || '').trim()
      if (k && v) {
        acc[k] = v
      }
      return acc
    }, {})
    
    const optionsArray = optionsSnapshot
      .map((item) => String(item.value || '').trim())
      .filter(Boolean)
    
    const classificationsArray = classificationsSnapshot
      .map((item) => String(item.value || '').trim())
      .filter(Boolean)

    // Collect URLs from the dynamic inputs
    const existingUrls = urlsSnapshot
      .map((item) => item.url.trim())
      .filter(Boolean)

    const folder =
      productBeingEdited?._id
        ? `electronics-shop/products/${productBeingEdited._id}`
        : `electronics-shop/products/temp-${Date.now()}-${slugify(data.name || 'product')}`

    setSaving(true)
    setBackgroundSaving(true)
    setToast({ open: true, message: 'Đang lưu, upload sẽ chạy nền...', severity: 'info' })
    handleClose()

    let uploadedFileUrls: string[] = []
    if (filesSnapshot.length) {
      try {
        uploadedFileUrls = await uploadImagesToCloud(filesSnapshot, folder)
      } catch (error) {
        console.error('Error uploading images:', error)
      }
    }

    // We don't need to re-upload existing URLs usually, unless we want to ensure they are on our cloud
    // But for now let's assume valid URLs are kept as is, or we can use uploadUrlsToCloud if needed.
    // Let's just keep them as is to simplify deleting/reordering.
    
    // If you want to ensure they are on cloud, you can use uploadUrlsToCloud(existingUrls, folder)
    // For now, let's mix them.
    
    const mergedImages = [...existingUrls, ...uploadedFileUrls]
    
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
      images: mergedImages,
      options: optionsArray.length > 0 ? optionsArray : undefined,
      classifications: classificationsArray.length > 0 ? classificationsArray : undefined,
      specs: Object.fromEntries(
        Object.entries({ ...dynamicSpecMap }).filter(
          ([, v]) => v !== undefined && v !== null && String(v).trim() !== ''
        )
      ),
    }

    try {
      if (productBeingEdited) {
        await client.patch(`/products/${productBeingEdited._id}`, payload)
      } else {
        await client.post('/products', payload)
      }
      setToast({ open: true, message: 'Lưu sản phẩm thành công', severity: 'success' })
      fetchProducts()
    } catch (error) {
      console.error('Error saving product:', error)
      setToast({ open: true, message: 'Lưu sản phẩm thất bại. Vui lòng thử lại.', severity: 'error' })
    } finally {
      setImageFiles([])
      setSaving(false)
      setBackgroundSaving(false)
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

  const uploadUrlsToCloud = async (urls: string[], folder: string) => {
    const uploads = urls.map(async (rawUrl) => {
      const url = rawUrl.trim()
      if (!url) return null
      if (/res\.cloudinary\.com/i.test(url)) return url
      try {
        const res = await client.post(
          '/upload/image/by-url',
          { url },
          {
            params: { folder },
          },
        )
        return res.data?.secure_url || res.data?.url || url
      } catch (error) {
        console.error('Error uploading image by URL:', error)
        return url
      }
    })

    const results = await Promise.all(uploads)
    return results.filter((url): url is string => Boolean(url))
  }

  const onError = (errors: any) => {
    console.error('Form validation errors:', errors)
    setToast({
      open: true,
      message: 'Vui lòng kiểm tra lại thông tin (các trường bắt buộc)',
      severity: 'error',
    })
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

      {(loading || backgroundSaving) && (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <LinearProgress sx={{ flex: 1 }} color={backgroundSaving ? 'secondary' : 'primary'} />
          <Typography variant="caption" color="text.secondary">
            {backgroundSaving ? 'Đang lưu, upload chạy nền...' : 'Đang tải dữ liệu...'}
          </Typography>
        </Stack>
      )}

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
            <TextField
              margin="normal"
              fullWidth
              label="Tên"
              required
              error={!!errors.name}
              helperText={errors.name?.message}
              {...register('name', { required: 'Tên sản phẩm là bắt buộc' })}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Mã sản phẩm"
              {...register('code')}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Danh mục"
              {...register('category')}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Link datasheet"
              {...register('datasheet')}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Giá gốc"
              type="number"
              required
              error={!!errors.originalPrice}
              helperText={errors.originalPrice?.message}
              {...register('originalPrice', {
                valueAsNumber: true,
                required: 'Giá gốc là bắt buộc',
                min: { value: 0, message: 'Giá không được âm' },
              })}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Giá bán"
              type="number"
              required
              error={!!errors.salePrice}
              helperText={errors.salePrice?.message}
              {...register('salePrice', {
                valueAsNumber: true,
                required: 'Giá bán là bắt buộc',
                min: { value: 0, message: 'Giá không được âm' },
              })}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Tồn kho"
              type="number"
              required
              error={!!errors.stock}
              helperText={errors.stock?.message}
              {...register('stock', {
                valueAsNumber: true,
                required: 'Số lượng tồn kho là bắt buộc',
                min: { value: 0, message: 'Tồn kho không được âm' },
              })}
            />
            <Typography variant="subtitle1" sx={{ mt: 1, mb: 0.5, gridColumn: { sm: 'span 2' } }}>
              Ảnh sản phẩm (URLs)
            </Typography>
            {imageUrls.map((item) => (
              <Box key={item.id} sx={{ gridColumn: { sm: 'span 2' }, display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="URL Ảnh"
                  value={item.url}
                  onChange={(e) =>
                    setImageUrls((prev) =>
                      prev.map((img) => (img.id === item.id ? { ...img, url: e.target.value } : img))
                    )
                  }
                />
                 <IconButton
                    aria-label="Xóa ảnh"
                    color="error"
                    onClick={() => setImageUrls((prev) => prev.filter((img) => img.id !== item.id))}
                  >
                    <DeleteIcon />
                 </IconButton>
              </Box>
            ))}
            <Button
              variant="outlined"
              sx={{ gridColumn: { sm: 'span 2' }, mb: 2 }}
              onClick={() =>
                setImageUrls((prev) => [
                  ...prev,
                  { id: `img-new-${Date.now()}-${prev.length}`, url: '' },
                ])
              }
            >
              Thêm URL Ảnh
            </Button>

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
            
            <Typography variant="subtitle1" sx={{ mt: 1, mb: 0.5, gridColumn: { sm: 'span 2' } }}>
              Tuỳ chọn
            </Typography>
            {options.map((item) => (
              <Box key={item.id} sx={{ gridColumn: { sm: 'span 2' }, display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Tuỳ chọn"
                  value={item.value}
                  onChange={(e) =>
                    setOptions((prev) =>
                      prev.map((opt) => (opt.id === item.id ? { ...opt, value: e.target.value } : opt))
                    )
                  }
                />
                <IconButton
                  aria-label="Xóa tuỳ chọn"
                  color="error"
                  onClick={() => setOptions((prev) => prev.filter((opt) => opt.id !== item.id))}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}
            <Button
              variant="outlined"
              sx={{ gridColumn: { sm: 'span 2' } }}
              onClick={() =>
                setOptions((prev) => [
                  ...prev,
                  { id: `opt-${Date.now()}-${prev.length}`, value: '' },
                ])
              }
            >
              Thêm tuỳ chọn
            </Button>
            
            <Typography variant="subtitle1" sx={{ mt: 1, mb: 0.5, gridColumn: { sm: 'span 2' } }}>
              Phân loại
            </Typography>
            {classifications.map((item) => (
              <Box key={item.id} sx={{ gridColumn: { sm: 'span 2' }, display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Phân loại"
                  value={item.value}
                  onChange={(e) =>
                    setClassifications((prev) =>
                      prev.map((cls) => (cls.id === item.id ? { ...cls, value: e.target.value } : cls))
                    )
                  }
                />
                <IconButton
                  aria-label="Xóa phân loại"
                  color="error"
                  onClick={() => setClassifications((prev) => prev.filter((cls) => cls.id !== item.id))}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}
            <Button
              variant="outlined"
              sx={{ gridColumn: { sm: 'span 2' } }}
              onClick={() =>
                setClassifications((prev) => [
                  ...prev,
                  { id: `cls-${Date.now()}-${prev.length}`, value: '' },
                ])
              }
            >
              Thêm phân loại
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
          <Button onClick={handleSubmit(onSubmit, onError)} variant="contained" disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          severity={toast.severity}
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default ProductsPage
