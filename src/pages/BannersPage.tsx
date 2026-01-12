import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  LinearProgress,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'
import { DataGrid } from '@mui/x-data-grid'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import {
  Add as AddIcon,
  ArrowDownward as ArrowDownwardIcon,
  ArrowUpward as ArrowUpwardIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material'
import { Controller, useForm } from 'react-hook-form'
import client from '../api/client'

interface Banner {
  _id: string
  title: string
  subtitle?: string
  imageUrl: string
  ctaLabel?: string
  productId?: string
  isActive: boolean
  order?: number
}

interface BannerFormValues {
  title: string
  subtitle?: string
  imageUrl?: string
  ctaLabel?: string
  productId?: string
  isActive: boolean
  order?: number
}

interface ProductOption {
  _id: string
  name: string
}

const BannersPage = () => {
  const [banners, setBanners] = useState<Banner[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null)
  const [reorderingId, setReorderingId] = useState<string | null>(null)
  const [products, setProducts] = useState<ProductOption[]>([])
  const [productSearch, setProductSearch] = useState('')

  const { control, register, reset, setValue, handleSubmit, watch } = useForm<BannerFormValues>({
    defaultValues: {
      title: '',
      subtitle: '',
      imageUrl: '',
      ctaLabel: '',
      productId: '',
      isActive: true,
      order: undefined,
    },
  })

  const sortedBanners = useMemo(
    () => [...banners].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [banners],
  )

  useEffect(() => {
    fetchBanners()
  }, [])

  useEffect(() => {
    if (editingBanner?.productId) {
      const found = products.find((p) => p._id === editingBanner.productId)
      setProductSearch(found?.name || '')
    }
  }, [editingBanner?.productId, products])

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await client.get('/products')
        const items: ProductOption[] = (response.data || []).map((p: any) => ({ _id: p._id, name: p.name }))
        setProducts(items)
      } catch (error) {
        console.error('Error fetching products:', error)
      }
    }
    fetchProducts()
  }, [])

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null)
      return
    }
    const objectUrl = URL.createObjectURL(imageFile)
    setImagePreview(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [imageFile])

  const watchImageUrl = watch('imageUrl')

  const fetchBanners = async () => {
    setLoading(true)
    try {
      const response = await client.get('/banners')
      setBanners(response.data || [])
    } catch (error) {
      console.error('Error fetching banners:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpen = (banner?: Banner) => {
    setEditingBanner(banner || null)
    setImageFile(null)
    if (banner) {
      setValue('title', banner.title)
      setValue('subtitle', banner.subtitle || '')
      setValue('imageUrl', banner.imageUrl || '')
      setValue('ctaLabel', banner.ctaLabel || '')
      setValue('productId', banner.productId || '')
      setValue('isActive', banner.isActive)
      setValue('order', banner.order ?? undefined)
      const selectedProduct = products.find((p) => p._id === banner.productId)
      setProductSearch(selectedProduct?.name || '')
    } else {
      reset({
        title: '',
        subtitle: '',
        imageUrl: '',
        ctaLabel: '',
        productId: '',
        isActive: true,
        order: sortedBanners.length,
      })
      setProductSearch('')
    }
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setSaving(false)
    setEditingBanner(null)
    setImageFile(null)
    setProductSearch('')
    reset({
      title: '',
      subtitle: '',
      imageUrl: '',
      ctaLabel: '',
      productId: '',
      isActive: true,
      order: sortedBanners.length,
    })
  }

  const slugify = (value: string) =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48)

  const uploadImageFile = async (file: File, folder: string) => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await client.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params: { folder },
    })
    return res.data?.secure_url || res.data?.url
  }

  const uploadImageByUrl = async (url: string, folder: string) => {
    if (/res\.cloudinary\.com/i.test(url)) return url
    const res = await client.post(
      '/upload/image/by-url',
      { url },
      {
        params: { folder },
      },
    )
    return res.data?.secure_url || res.data?.url || url
  }

  const onSubmit = async (data: BannerFormValues) => {
    setSaving(true)
    try {
      const folder = `electronics-shop/banners/${editingBanner?._id || slugify(data.title || 'banner')}`
      let resolvedImageUrl = data.imageUrl?.trim() || editingBanner?.imageUrl || ''

      if (imageFile) {
        resolvedImageUrl = (await uploadImageFile(imageFile, folder)) || resolvedImageUrl
      } else if (resolvedImageUrl) {
        resolvedImageUrl = (await uploadImageByUrl(resolvedImageUrl, folder)) || resolvedImageUrl
      }

      if (!resolvedImageUrl) {
        alert('Vui lòng thêm ảnh cho banner')
        setSaving(false)
        return
      }

      const normalizedOrder = Number.isFinite(data.order) ? data.order : undefined
      const payload = {
        title: data.title,
        subtitle: data.subtitle || undefined,
        imageUrl: resolvedImageUrl,
        ctaLabel: data.ctaLabel || undefined,
        productId: data.productId || undefined,
        isActive: data.isActive,
        order: normalizedOrder,
      }

      if (editingBanner) {
        await client.patch(`/banners/${editingBanner._id}`, payload)
      } else {
        await client.post('/banners', payload)
      }
      await fetchBanners()
      handleClose()
    } catch (error) {
      console.error('Error saving banner:', error)
      alert('Không thể lưu banner, vui lòng thử lại')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (banner: Banner) => {
    const confirmed = window.confirm(`Xóa banner "${banner.title}"?`)
    if (!confirmed) return
    try {
      await client.delete(`/banners/${banner._id}`)
      await fetchBanners()
    } catch (error) {
      console.error('Error deleting banner:', error)
      alert('Không thể xóa banner')
    }
  }

  const handleReorder = async (bannerId: string, direction: 'up' | 'down') => {
    const ordered = [...sortedBanners]
    const currentIndex = ordered.findIndex((b) => b._id === bannerId)
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= ordered.length) return

    const next = [...ordered]
    const [moved] = next.splice(currentIndex, 1)
    next.splice(targetIndex, 0, moved)

    const payload = {
      items: next.map((b, index) => ({ id: b._id, order: index })),
    }

    try {
      setReorderingId(bannerId)
      await client.patch('/banners/reorder', payload)
      await fetchBanners()
    } catch (error) {
      console.error('Error reordering banners:', error)
      alert('Không thể sắp xếp banner')
    } finally {
      setReorderingId(null)
    }
  }

  const columns: GridColDef[] = [
    {
      field: 'order',
      headerName: '#',
      width: 70,
      valueGetter: (_value, row) => row.order ?? 0,
    },
    {
      field: 'imageUrl',
      headerName: 'Ảnh',
      width: 130,
      renderCell: (params: GridRenderCellParams<string>) =>
        params.value ? (
          <Box
            component="img"
            src={params.value}
            alt={params.row.title}
            sx={{ width: 96, height: 64, objectFit: 'cover', borderRadius: 1 }}
          />
        ) : (
          <Typography variant="caption" color="text.secondary">
            Không có ảnh
          </Typography>
        ),
    },
    { field: 'title', headerName: 'Tiêu đề', flex: 1, minWidth: 180 },
    {
      field: 'subtitle',
      headerName: 'Mô tả',
      flex: 1.2,
      minWidth: 200,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary" noWrap>
          {params.value || '-'}
        </Typography>
      ),
    },
    {
      field: 'ctaLabel',
      headerName: 'Nhãn',
      width: 140,
      renderCell: (params) => <Typography variant="body2">{params.value || '-'}</Typography>,
    },
    {
      field: 'productId',
      headerName: 'Sản phẩm',
      minWidth: 180,
      renderCell: (params) => {
        const product = products.find((p) => p._id === params.value)
        return (
          <Tooltip title={product?.name || params.value || ''}>
            <Typography variant="body2" color="text.secondary" noWrap>
              {product?.name || params.value || '-'}
            </Typography>
          </Tooltip>
        )
      },
    },
    {
      field: 'isActive',
      headerName: 'Trạng thái',
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Hiển thị' : 'Ẩn'}
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'reorder',
      headerName: 'Sắp xếp',
      width: 140,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const index = sortedBanners.findIndex((b) => b._id === params.row._id)
        const canMoveUp = index > 0
        const canMoveDown = index < sortedBanners.length - 1
        return (
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Lên">
              <span>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleReorder(params.row._id, 'up')}
                  disabled={!canMoveUp || !!reorderingId}
                  startIcon={<ArrowUpwardIcon fontSize="small" />}
                >
                  Up
                </Button>
              </span>
            </Tooltip>
            <Tooltip title="Xuống">
              <span>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleReorder(params.row._id, 'down')}
                  disabled={!canMoveDown || !!reorderingId}
                  startIcon={<ArrowDownwardIcon fontSize="small" />}
                >
                  Down
                </Button>
              </span>
            </Tooltip>
          </Stack>
        )
      },
    },
    {
      field: 'actions',
      headerName: 'Hành động',
      width: 150,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5}>
          <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => handleOpen(params.row)}>
            Sửa
          </Button>
          <Button
            size="small"
            color="error"
            variant="outlined"
            startIcon={<DeleteIcon />}
            onClick={() => handleDelete(params.row)}
          >
            Xóa
          </Button>
        </Stack>
      ),
    },
  ]

  return (
    <Box sx={{ width: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          mb: 2,
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Banner
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Quản lý hình ảnh hero trên app. Tải ảnh lên, bật/tắt hiển thị và sắp xếp thứ tự.
          </Typography>
        </div>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
          Thêm banner
        </Button>
      </Box>

      {(loading || reorderingId) && (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <LinearProgress sx={{ flex: 1 }} color={reorderingId ? 'secondary' : 'primary'} />
          <Typography variant="caption" color="text.secondary">
            {reorderingId ? 'Đang sắp xếp...' : 'Đang tải dữ liệu...'}
          </Typography>
        </Stack>
      )}

      <DataGrid
        autoHeight
        rows={sortedBanners}
        columns={columns}
        loading={loading}
        getRowId={(row) => row._id}
        disableRowSelectionOnClick
        initialState={{
          pagination: {
            paginationModel: { page: 0, pageSize: 10 },
          },
        }}
        pageSizeOptions={[5, 10, 20]}
      />

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>{editingBanner ? 'Chỉnh sửa banner' : 'Thêm banner'}</DialogTitle>
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
          <TextField margin="normal" fullWidth label="Tiêu đề" required {...register('title')} />
          <TextField margin="normal" fullWidth label="Mô tả ngắn" {...register('subtitle')} />
          <TextField margin="normal" fullWidth label="Nhãn" {...register('ctaLabel')} />
          <Controller
            name="productId"
            control={control}
            render={({ field }) => {
              const selected = products.find((p) => p._id === field.value) || null
              return (
                <Autocomplete
                  options={products}
                  getOptionLabel={(option) => option.name}
                  value={selected}
                  onChange={(_e, option) => {
                    field.onChange(option?._id || '')
                    setProductSearch(option?.name || '')
                  }}
                  inputValue={productSearch}
                  onInputChange={(_e, value) => setProductSearch(value)}
                  renderInput={(params) => <TextField {...params} label="Chọn sản phẩm" margin="normal" fullWidth />}
                  noOptionsText={productSearch ? 'Không tìm thấy' : 'Nhập tên sản phẩm'}
                />
              )
            }}
          />
          <TextField
            margin="normal"
            fullWidth
            label="Thứ tự (0, 1, 2...)"
            type="number"
              {...register('order', { valueAsNumber: true })}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Ảnh (URL nếu có sẵn)"
              sx={{ gridColumn: { sm: 'span 2' } }}
              {...register('imageUrl')}
            />
            <Box sx={{ gridColumn: { sm: 'span 2' } }}>
              <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                <Button variant="outlined" component="label" startIcon={<CloudUploadIcon />}>
                  Chọn ảnh từ máy
                  <input
                    hidden
                    accept="image/*"
                    type="file"
                    onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                  />
                </Button>
                {imageFile ? (
                  <Typography variant="body2" color="text.secondary">
                    {imageFile.name}
                  </Typography>
                ) : null}
                {imagePreview || watchImageUrl?.trim() || editingBanner?.imageUrl ? (
                  <Box
                    component="img"
                    src={imagePreview || watchImageUrl?.trim() || editingBanner?.imageUrl || undefined}
                    alt="Preview"
                    sx={{ width: 140, height: 90, objectFit: 'cover', borderRadius: 1, border: '1px solid #eee' }}
                  />
                ) : null}
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Có thể dán URL ảnh có sẵn hoặc chọn file để tải lên Cloudinary.
              </Typography>
            </Box>

            <Controller
              control={control}
              name="isActive"
              render={({ field }) => (
                <FormControlLabel
                  sx={{ gridColumn: { sm: 'span 2' } }}
                  control={<Switch checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                  label="Hiển thị trên app"
                />
              )}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="inherit">
            Hủy
          </Button>
          <Button onClick={handleSubmit(onSubmit)} variant="contained" disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default BannersPage
