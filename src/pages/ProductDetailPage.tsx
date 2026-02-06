import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'
import { useDbChange } from '../hooks/useDbChange'

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
  specs?: Record<string, string | undefined>
  createdAt?: string
  updatedAt?: string
}

const formatCurrency = (value?: number) =>
  `${(value ?? 0).toLocaleString('vi-VN')} đ`

const formatDateTime = (value?: string) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('vi-VN')
}

const ProductDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const productId = id || ''

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['products', productId],
    queryFn: async () => {
      const response = await client.get(`/products/${productId}`)
      return response.data as Product
    },
    enabled: Boolean(productId),
    refetchInterval: 30000,
  })

  useDbChange(['products'], () => {
    queryClient.invalidateQueries({ queryKey: ['products', productId] })
  })

  const specs = useMemo(() => product?.specs || {}, [product?.specs])
  const images = useMemo(() => product?.images || [], [product?.images])

  if (!productId) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Không tìm thấy sản phẩm
        </Typography>
        <Button variant="contained" onClick={() => navigate('/products')}>
          Quay lại danh sách
        </Button>
      </Paper>
    )
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (isError || !product) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Không thể tải chi tiết sản phẩm
        </Typography>
        <Button variant="contained" onClick={() => navigate('/products')}>
          Quay lại danh sách
        </Button>
      </Paper>
    )
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {product.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Mã: {product.code || 'N/A'}
          </Typography>
        </Box>
        <Button variant="outlined" onClick={() => navigate('/products')}>
          Quay lại
        </Button>
      </Stack>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                <Chip label={product.category || 'Khác'} color="primary" variant="outlined" />
                <Chip
                  label={product.stock > 0 ? `Tồn kho: ${product.stock}` : 'Hết hàng'}
                  color={product.stock > 0 ? 'success' : 'warning'}
                  variant="outlined"
                />
              </Stack>

              <Divider />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Giá bán
                  </Typography>
                  <Typography variant="h6">{formatCurrency(product.price?.salePrice)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Giá gốc
                  </Typography>
                  <Typography variant="h6">{formatCurrency(product.price?.originalPrice)}</Typography>
                </Grid>
              </Grid>

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Mô tả
                </Typography>
                <Typography variant="body2">{product.description || 'Chưa có mô tả'}</Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Thông số kỹ thuật
                </Typography>
                {Object.keys(specs).length === 0 ? (
                  <Typography variant="body2">Chưa có thông số</Typography>
                ) : (
                  <Stack spacing={1}>
                    {Object.entries(specs).map(([key, value]) => (
                      <Stack key={key} direction="row" spacing={1.5}>
                        <Typography variant="body2" sx={{ minWidth: 140, fontWeight: 600 }}>
                          {key}
                        </Typography>
                        <Typography variant="body2">{value || '-'}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                )}
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Tuỳ chọn
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {(product.options || []).length === 0 ? (
                    <Typography variant="body2">Không có</Typography>
                  ) : (
                    product.options?.map((opt, idx) => (
                      <Chip key={`${opt}-${idx}`} label={opt} variant="outlined" size="small" />
                    ))
                  )}
                </Stack>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Phân loại
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {(product.classifications || []).length === 0 ? (
                    <Typography variant="body2">Không có</Typography>
                  ) : (
                    product.classifications?.map((cls, idx) => (
                      <Chip key={`${cls}-${idx}`} label={cls} variant="outlined" size="small" />
                    ))
                  )}
                </Stack>
              </Box>

              {product.datasheet && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Datasheet
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => window.open(product.datasheet, '_blank')}
                  >
                    Mở datasheet
                  </Button>
                </Box>
              )}
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Typography variant="subtitle2" color="text.secondary">
                Hình ảnh
              </Typography>
              {images.length === 0 ? (
                <Typography variant="body2">Chưa có hình ảnh</Typography>
              ) : (
                <Grid container spacing={1.5}>
                  {images.map((src, idx) => (
                    <Grid item xs={6} key={`${src}-${idx}`}>
                      <Box
                        component="img"
                        src={src}
                        alt={product.name}
                        sx={{
                          width: '100%',
                          height: 120,
                          borderRadius: 2,
                          objectFit: 'cover',
                          backgroundColor: '#f1f5f9',
                        }}
                      />
                    </Grid>
                  ))}
                </Grid>
              )}

              <Divider />

              <Typography variant="subtitle2" color="text.secondary">
                Thời gian
              </Typography>
              <Typography variant="body2">
                Tạo lúc: {formatDateTime(product.createdAt) || 'N/A'}
              </Typography>
              <Typography variant="body2">
                Cập nhật: {formatDateTime(product.updatedAt) || 'N/A'}
              </Typography>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  )
}

export default ProductDetailPage
