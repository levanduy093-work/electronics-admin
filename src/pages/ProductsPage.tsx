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
  Grid,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import client from '../api/client';

interface Product {
  _id: string;
  name: string;
  category: string;
  price: {
    originalPrice: number;
    salePrice: number;
  };
  stock: number;
  description: string;
  images: string[];
  specs?: {
    resistance?: string;
    tolerance?: string;
    power?: string;
    scope?: string;
    voltage?: string;
  };
}

const ProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { register, handleSubmit, reset, setValue } = useForm();

  const fetchProducts = async () => {
    try {
      const response = await client.get('/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleOpen = (product: Product | null = null) => {
    setEditingProduct(product);
    if (product) {
      setValue('name', product.name);
      setValue('category', product.category);
      setValue('originalPrice', product.price.originalPrice);
      setValue('salePrice', product.price.salePrice);
      setValue('stock', product.stock);
      setValue('description', product.description);
      setValue('images', product.images ? product.images.join(', ') : '');
      setValue('resistance', product.specs?.resistance || '');
      setValue('tolerance', product.specs?.tolerance || '');
      setValue('power', product.specs?.power || '');
      setValue('scope', product.specs?.scope || '');
      setValue('voltage', product.specs?.voltage || '');
    } else {
      reset();
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingProduct(null);
    reset();
  };

  const onSubmit = async (data: any) => {
    const payload = {
      name: data.name,
      category: data.category,
      price: {
        originalPrice: Number(data.originalPrice),
        salePrice: Number(data.salePrice),
      },
      stock: Number(data.stock),
      description: data.description,
      images: data.images ? data.images.split(',').map((url: string) => url.trim()).filter((url: string) => url) : [],
      specs: {
        resistance: data.resistance,
        tolerance: data.tolerance,
        power: data.power,
        scope: data.scope,
        voltage: data.voltage,
      },
    };

    try {
      if (editingProduct) {
        await client.patch(`/products/${editingProduct._id}`, payload);
      } else {
        await client.post('/products', payload);
      }
      fetchProducts();
      handleClose();
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await client.delete(`/products/${id}`);
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const columns: GridColDef[] = [
    { field: '_id', headerName: 'ID', width: 220 },
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'category', headerName: 'Category', width: 130 },
    {
      field: 'originalPrice',
      headerName: 'Original Price',
      width: 130,
      valueGetter: (params: any) => params.row.price?.originalPrice,
    },
    {
      field: 'salePrice',
      headerName: 'Sale Price',
      width: 130,
      valueGetter: (params: any) => params.row.price?.salePrice,
    },
    { field: 'stock', headerName: 'Stock', width: 90 },
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
        <Typography variant="h4">Products</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
          Add Product
        </Button>
      </Box>
      <DataGrid
        rows={products}
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

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                    <TextField
                    margin="normal"
                    fullWidth
                    label="Name"
                    {...register('name', { required: true })}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                    margin="normal"
                    fullWidth
                    label="Category"
                    {...register('category')}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                    margin="normal"
                    fullWidth
                    label="Original Price"
                    type="number"
                    {...register('originalPrice', { required: true })}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                    margin="normal"
                    fullWidth
                    label="Sale Price"
                    type="number"
                    {...register('salePrice', { required: true })}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                    margin="normal"
                    fullWidth
                    label="Stock"
                    type="number"
                    {...register('stock', { required: true })}
                    />
                </Grid>
                <Grid item xs={12}>
                    <TextField
                    margin="normal"
                    fullWidth
                    label="Images (comma separated URLs)"
                    {...register('images')}
                    />
                </Grid>
                
                <Grid item xs={12}>
                    <Typography variant="h6" sx={{ mt: 2 }}>Specifications</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <TextField fullWidth label="Resistance" {...register('resistance')} />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <TextField fullWidth label="Tolerance" {...register('tolerance')} />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <TextField fullWidth label="Power" {...register('power')} />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Scope" {...register('scope')} />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Voltage" {...register('voltage')} />
                </Grid>

                <Grid item xs={12}>
                    <TextField
                    margin="normal"
                    fullWidth
                    label="Description"
                    multiline
                    rows={4}
                    {...register('description')}
                    />
                </Grid>
            </Grid>
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

export default ProductsPage;
