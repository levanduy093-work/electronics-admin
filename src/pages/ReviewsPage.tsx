import { useEffect, useState } from 'react'
import { Box, Typography, IconButton, Rating, LinearProgress } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { Delete as DeleteIcon } from '@mui/icons-material'
import client from '../api/client'

interface Review {
  _id: string
  userId: string
  productId: string
  rating: number
  comment?: string
  createdAt: string
}

const ReviewsPage = () => {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(false)

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const response = await client.get('/reviews')
      setReviews(response.data)
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [])

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa đánh giá này?')) {
      try {
        await client.delete(`/reviews/${id}`)
        fetchReviews()
      } catch (error) {
        console.error('Error deleting review:', error)
      }
    }
  }

  const columns: GridColDef<Review>[] = [
    { field: '_id', headerName: 'ID', width: 220 },
    { field: 'productId', headerName: 'Product ID', width: 220 },
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
      field: 'createdAt',
      headerName: 'Ngày',
      width: 180,
      valueFormatter: (params) => new Date((params as any).value as string).toLocaleString('vi-VN'),
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
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
        Đánh giá
      </Typography>

      {loading && <LinearProgress />}

      <DataGrid
        rows={reviews}
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
    </Box>
  )
}

export default ReviewsPage
