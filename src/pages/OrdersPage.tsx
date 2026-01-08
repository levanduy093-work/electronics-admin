import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Visibility as VisibilityIcon } from '@mui/icons-material';
import client from '../api/client';

interface Order {
  _id: string;
  code: string;
  userId: string;
  status: {
    ordered?: string;
    confirmed?: string;
    packaged?: string;
    shipped?: string;
  };
  isCancelled: boolean;
  totalPrice: number;
  payment: string;
  paymentStatus: string;
  items: any[];
  shippingAddress: any;
}

const OrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [open, setOpen] = useState(false);

  const fetchOrders = async () => {
    try {
      const response = await client.get('/orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleOpen = (order: Order) => {
    setSelectedOrder(order);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedOrder(null);
  };

  const updateStatus = async (statusField: string) => {
    if (!selectedOrder) return;
    try {
      const payload = {
        status: {
          ...selectedOrder.status,
          [statusField]: new Date().toISOString(),
        },
      };
      await client.patch(`/orders/${selectedOrder._id}`, payload);
      fetchOrders();
      handleClose(); // Or refresh the selectedOrder
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const getStatusChip = (status: any, isCancelled: boolean) => {
    if (isCancelled) return <Chip label="Cancelled" color="error" />;
    if (status.shipped) return <Chip label="Shipped" color="success" />;
    if (status.packaged) return <Chip label="Packaged" color="info" />;
    if (status.confirmed) return <Chip label="Confirmed" color="primary" />;
    if (status.ordered) return <Chip label="Ordered" color="warning" />;
    return <Chip label="Unknown" />;
  };

  const columns: GridColDef[] = [
    { field: 'code', headerName: 'Order Code', width: 150 },
    { field: 'totalPrice', headerName: 'Total Price', width: 130 },
    { field: 'payment', headerName: 'Payment', width: 130 },
    { field: 'paymentStatus', headerName: 'Payment Status', width: 130 },
    {
      field: 'status',
      headerName: 'Status',
      width: 150,
      renderCell: (params) => getStatusChip(params.row.status, params.row.isCancelled),
    },
    {
      field: 'createdAt',
      headerName: 'Date',
      width: 200,
      valueFormatter: (params) => new Date(params.value).toLocaleString(),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      renderCell: (params) => (
        <IconButton onClick={() => handleOpen(params.row)} color="primary">
          <VisibilityIcon />
        </IconButton>
      ),
    },
  ];

  return (
    <Box sx={{ height: 600, width: '100%' }}>
      <Typography variant="h4" gutterBottom>
        Orders
      </Typography>
      <DataGrid
        rows={orders}
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
        <DialogTitle>Order Details - {selectedOrder?.code}</DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6">Customer Info</Typography>
                    <Typography>Name: {selectedOrder.shippingAddress?.name}</Typography>
                    <Typography>Phone: {selectedOrder.shippingAddress?.phone}</Typography>
                    <Typography>
                      Address: {selectedOrder.shippingAddress?.street}, {selectedOrder.shippingAddress?.ward},{' '}
                      {selectedOrder.shippingAddress?.district}, {selectedOrder.shippingAddress?.city}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6">Order Status</Typography>
                    {getStatusChip(selectedOrder.status, selectedOrder.isCancelled)}
                    <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {!selectedOrder.status.confirmed && !selectedOrder.isCancelled && (
                            <Button variant="contained" size="small" onClick={() => updateStatus('confirmed')}>Confirm</Button>
                        )}
                        {selectedOrder.status.confirmed && !selectedOrder.status.packaged && !selectedOrder.isCancelled && (
                            <Button variant="contained" size="small" onClick={() => updateStatus('packaged')}>Package</Button>
                        )}
                        {selectedOrder.status.packaged && !selectedOrder.status.shipped && !selectedOrder.isCancelled && (
                            <Button variant="contained" size="small" onClick={() => updateStatus('shipped')}>Ship</Button>
                        )}
                    </Box>
                  </Paper>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mt: 2 }}>Items</Typography>
                  <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Product</TableCell>
                                <TableCell align="right">Quantity</TableCell>
                                <TableCell align="right">Price</TableCell>
                                <TableCell align="right">Total</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {selectedOrder.items.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell>{item.name}</TableCell>
                                    <TableCell align="right">{item.quantity}</TableCell>
                                    <TableCell align="right">{item.price}</TableCell>
                                    <TableCell align="right">{item.totalPrice}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrdersPage;
