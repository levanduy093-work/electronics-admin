import React, { useEffect, useState } from 'react';
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
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import client from '../api/client';

interface Voucher {
  _id: string;
  code: string;
  description: string;
  discountPrice: number;
  minTotal: number;
  expire: string;
}

const VouchersPage = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [open, setOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const { register, handleSubmit, reset, setValue } = useForm();

  const fetchVouchers = async () => {
    try {
      const response = await client.get('/vouchers');
      setVouchers(response.data);
    } catch (error) {
      console.error('Error fetching vouchers:', error);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const handleOpen = (voucher: Voucher | null = null) => {
    setEditingVoucher(voucher);
    if (voucher) {
      setValue('code', voucher.code);
      setValue('description', voucher.description);
      setValue('discountPrice', voucher.discountPrice);
      setValue('minTotal', voucher.minTotal);
      setValue('expire', voucher.expire ? new Date(voucher.expire).toISOString().slice(0, 16) : '');
    } else {
      reset();
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingVoucher(null);
    reset();
  };

  const onSubmit = async (data: any) => {
    try {
      if (editingVoucher) {
        await client.patch(`/vouchers/${editingVoucher._id}`, data);
      } else {
        await client.post('/vouchers', data);
      }
      fetchVouchers();
      handleClose();
    } catch (error) {
      console.error('Error saving voucher:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this voucher?')) {
      try {
        await client.delete(`/vouchers/${id}`);
        fetchVouchers();
      } catch (error) {
        console.error('Error deleting voucher:', error);
      }
    }
  };

  const columns: GridColDef[] = [
    { field: 'code', headerName: 'Code', width: 150 },
    { field: 'description', headerName: 'Description', width: 200 },
    { field: 'discountPrice', headerName: 'Discount', width: 130 },
    { field: 'minTotal', headerName: 'Min Total', width: 130 },
    {
      field: 'expire',
      headerName: 'Expire Date',
      width: 180,
      valueFormatter: (params) => new Date(params.value).toLocaleString(),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
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
    },
  ];

  return (
    <Box sx={{ height: 600, width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4">Vouchers</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
          Add Voucher
        </Button>
      </Box>
      <DataGrid
        rows={vouchers}
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

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editingVoucher ? 'Edit Voucher' : 'Add Voucher'}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 1, minWidth: 400 }}>
            <TextField
              margin="normal"
              fullWidth
              label="Code"
              {...register('code', { required: true })}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Description"
              {...register('description')}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Discount Price"
              type="number"
              {...register('discountPrice', { required: true })}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Min Total"
              type="number"
              {...register('minTotal', { required: true })}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Expire Date"
              type="datetime-local"
              InputLabelProps={{ shrink: true }}
              {...register('expire', { required: true })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit(onSubmit)} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VouchersPage;
