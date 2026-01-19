import { useEffect, useMemo, useState } from 'react'
import {
  Autocomplete,
  Avatar,
  Box,
  IconButton,
  LinearProgress,
  Rating,
  Stack,
  TextField,
  Typography,
  Tooltip,
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { Delete as DeleteIcon } from '@mui/icons-material'
import client from '../api/client'
import { useRef } from 'react'
import { getSocket } from '../api/socket'
import { useDbChange } from '../hooks/useDbChange'

interface Review {
  _id: string
  userId: string
  productId: string
  rating: number
  comment?: string
  createdAt: string
  updatedAt?: string
}

interface ProductOption {
  _id: string
  name: string
  code?: string
  images?: string[]
}

const ReviewsPage = () => {
  const [reviews, setReviews] = useState<Review[]>([])
  const [products, setProducts] = useState<ProductOption[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null)

  const productMap = useMemo(() => new Map(products.map((product) => [product._id, product])), [products])
  const selectedProduct = useMemo(
    () => products.find((product) => product._id === selectedProductId) ?? null,
    [products, selectedProductId]
  )

  const fetchReviews = async (productId?: string) => {
    setLoading(true)
    try {
      const url = productId ? `/reviews/product/${productId}` : '/reviews'
      const response = await client.get(url)
      setReviews(response.data)
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchInitialData = async () => {
    setLoading(true)
    try {
      const [productsResponse, reviewsResponse] = await Promise.all([client.get('/products'), client.get('/reviews')])
      setProducts(productsResponse.data)
      setReviews(reviewsResponse.data)
    } catch (error) {
      console.error('Error fetching initial data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInitialData()
    socketRef.current = getSocket()
    return () => {
      socketRef.current = null
    }
  }, [])

  useDbChange(['reviews'], () => {
    fetchReviews(selectedProductId ?? undefined)
  })

  useDbChange(['products'], () => {
    client.get('/products').then((res) => setProducts(res.data)).catch(() => undefined)
  })

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa đánh giá này?')) {
      try {
        await client.delete(`/reviews/${id}`)
        fetchReviews(selectedProductId ?? undefined)
      } catch (error) {
        console.error('Error deleting review:', error)
      }
    }
  }

  const handleFilterByProduct = (product: ProductOption | null) => {
    const productId = product?._id ?? null
    setSelectedProductId(productId)
    fetchReviews(productId ?? undefined)
  }

  const columns: GridColDef<Review>[] = [
    {
      field: 'product',
      headerName: 'Sản phẩm',
      flex: 1,
      minWidth: 260,
      renderCell: (params: GridRenderCellParams<Review>) => {
        const product = productMap.get(params.row.productId)
        const productName = product?.name ?? 'Không tìm thấy sản phẩm'
        const productCode = product?.code ? ` · ${product.code}` : ''
        const shortId = params.row.productId?.slice(-6)

        return (
          <Tooltip title={productName} arrow placement="bottom-start">
            <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: '100%', whiteSpace: 'normal' }}>
                <Avatar
                  variant="rounded"
                  src={product?.images?.[0]}
                  alt={productName}
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: product ? 'primary.light' : 'grey.200',
                    color: product ? 'primary.contrastText' : 'text.secondary',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {productName.charAt(0).toUpperCase()}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3, whiteSpace: 'normal' }}>
                    {productName}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', lineHeight: 1.2, whiteSpace: 'normal' }}
                  >
                    #{shortId} {productCode}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Tooltip>
        )
      },
      sortable: false,
      filterable: false,
    },
    { field: '_id', headerName: 'Review ID', width: 220 },
    { field: 'userId', headerName: 'User ID', width: 220 },
    {
      field: 'rating',
      headerName: 'Rating',
      width: 140,
      renderCell: (params: GridRenderCellParams<Review>) => <Rating value={params.value} readOnly />,
      sortable: false,
      filterable: false,
    },
    { field: 'comment', headerName: 'Bình luận', flex: 1, minWidth: 220 },
    {
      field: 'updatedAt',
      headerName: 'Ngày',
      width: 200,
      renderCell: (params: GridRenderCellParams<Review>) => {
        const value = params.row.updatedAt || params.row.createdAt
        const date = value ? new Date(value) : null
        const label = date && !Number.isNaN(date.getTime()) ? date.toLocaleString('vi-VN') : '—'
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <Typography variant="body2">{label}</Typography>
          </Box>
        )
      },
    },
    {
      field: 'actions',
      headerName: 'Hành động',
      width: 120,
      renderCell: (params) => (
        <IconButton onClick={() => handleDelete(params.row._id)} color="error">
          <DeleteIcon />
        </IconButton>
      ),
      sortable: false,
      filterable: false,
    },
  ]

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          flexWrap: 'wrap',
          gap: 2,
          mb: 2,
        }}
      >
        <div>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Đánh giá
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Xem nhanh comment theo sản phẩm để xử lý phản hồi chính xác hơn.
          </Typography>
        </div>

        <Autocomplete
          sx={{ width: { xs: '100%', sm: 320, md: 380 } }}
          options={products}
          value={selectedProduct}
          onChange={(_, value) => handleFilterByProduct(value)}
          getOptionLabel={(option) => (option.code ? `${option.name} (${option.code})` : option.name)}
          isOptionEqualToValue={(option, value) => option._id === value._id}
          clearOnBlur
          renderInput={(params) => (
            <TextField {...params} label="Lọc theo sản phẩm" placeholder="Nhập tên hoặc mã sản phẩm" size="small" />
          )}
          noOptionsText="Không tìm thấy sản phẩm"
        />
      </Box>

      {loading && <LinearProgress />}

      <DataGrid
        rows={reviews}
        columns={columns}
        getRowId={(row) => row._id}
        autoHeight
        rowHeight={90}
        initialState={{
          pagination: {
            paginationModel: { page: 0, pageSize: 10 },
          },
        }}
        pageSizeOptions={[5, 10, 25]}
        disableRowSelectionOnClick
      />
    </Box>
  )
}

export default ReviewsPage
