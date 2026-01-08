import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Rating,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Delete as DeleteIcon } from '@mui/icons-material';
import client from '../api/client';

interface Review {
  _id: string;
  userId: string;
  productId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

const ReviewsPage = () => {
  const [reviews, setReviews] = useState<Review[]>([]);

  const fetchReviews = async () => {
    try {
      const response = await client.get('/reviews'); // Backend might need a getAll endpoint for admins if it doesn't exist
      setReviews(response.data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      try {
        await client.delete(`/reviews/${id}`);
        fetchReviews();
      } catch (error) {
        console.error('Error deleting review:', error);
      }
    }
  };

  const columns: GridColDef[] = [
    { field: '_id', headerName: 'ID', width: 220 },
    { field: 'productId', headerName: 'Product ID', width: 220 },
    { field: 'userId', headerName: 'User ID', width: 220 },
    {
      field: 'rating',
      headerName: 'Rating',
      width: 150,
      renderCell: (params) => <Rating value={params.value} readOnly />,
    },
    { field: 'comment', headerName: 'Comment', width: 300 },
    {
      field: 'createdAt',
      headerName: 'Date',
      width: 180,
      valueFormatter: (params) => new Date(params.value).toLocaleString(),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      renderCell: (params) => (
        <IconButton onClick={() => handleDelete(params.row._id)} color="error">
          <DeleteIcon />
        </IconButton>
      ),
    },
  ];

  return (
    <Box sx={{ height: 600, width: '100%' }}>
      <Typography variant="h4" gutterBottom>
        Reviews
      </Typography>
      <DataGrid
        rows={reviews}
        columns={columns}
        getRowId={(row) => row._id}
        initialState={{
          pagination: {
            paginationModel: { page: 0, pageSize: 10 },
          },
        }}
        pageSizeOptions={[5, 10, 25]}
        disableRowSelectionOnClick
      />
    </Box>
  );
};

export default ReviewsPage;
