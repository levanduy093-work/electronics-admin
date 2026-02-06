import { useState } from 'react'
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
  Chip,
  LinearProgress,
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material'
import { useForm } from 'react-hook-form'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'
import { useDbChange } from '../hooks/useDbChange'

interface Transaction {
  _id: string
  orderId: string
  userId: string
  provider: string
  amount: number
  currency: string
  status: string
  paidAt?: string
  createdAt?: string
  updatedAt?: string
}

interface TransactionFormValues {
  orderId: string
  userId: string
  provider: string
  amount: number
  currency: string
  status: string
  paidAt: string
}

const TransactionsPage = () => {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const { register, handleSubmit, reset, setValue } = useForm<TransactionFormValues>()
  const queryClient = useQueryClient()

  const fetchTransactions = async () => {
    const res = await client.get('/transactions')
    return res.data as Transaction[]
  }

  const {
    data: transactions = [],
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ['transactions'],
    queryFn: fetchTransactions,
  })

  useDbChange(['transactions'], () => {
    queryClient.invalidateQueries({ queryKey: ['transactions'] })
  })

  const handleOpen = (transaction: Transaction | null = null) => {
    setEditing(transaction)
    if (transaction) {
      setValue('orderId', transaction.orderId)
      setValue('userId', transaction.userId)
      setValue('provider', transaction.provider)
      setValue('amount', transaction.amount)
      setValue('currency', transaction.currency)
      setValue('status', transaction.status)
      setValue('paidAt', transaction.paidAt ? new Date(transaction.paidAt).toISOString().slice(0, 16) : '')
    } else {
      reset({ currency: 'VND' })
    }
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setEditing(null)
    reset({ currency: 'VND' })
  }

  const onSubmit = async (data: TransactionFormValues) => {
    const payload = {
      orderId: data.orderId,
      userId: data.userId,
      provider: data.provider,
      amount: Number(data.amount),
      currency: data.currency,
      status: data.status,
      paidAt: data.paidAt || undefined,
    }
    try {
      setSaving(true)
      if (editing) {
        await client.patch(`/transactions/${editing._id}`, payload)
      } else {
        await client.post('/transactions', payload)
      }
      await queryClient.invalidateQueries({ queryKey: ['transactions'] })
      handleClose()
    } catch (error) {
      console.error('Error saving transaction:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa giao dịch này?')) {
      try {
        await client.delete(`/transactions/${id}`)
        await queryClient.invalidateQueries({ queryKey: ['transactions'] })
      } catch (error) {
        console.error('Error deleting transaction:', error)
      }
    }
  }

  const columns: GridColDef<Transaction>[] = [
    { field: 'orderId', headerName: 'Order ID', flex: 1, minWidth: 200 },
    { field: 'userId', headerName: 'User ID', flex: 1, minWidth: 200 },
    { field: 'provider', headerName: 'Cổng thanh toán', width: 160 },
    {
      field: 'amount',
      headerName: 'Số tiền',
      width: 150,
      valueFormatter: (value?: number) => Number(value ?? 0).toLocaleString('vi-VN'),
    },
    { field: 'currency', headerName: 'Tiền tệ', width: 110 },
    {
      field: 'status',
      headerName: 'Trạng thái',
      width: 150,
      renderCell: (params: GridRenderCellParams<Transaction>) => (
        <Chip label={params.value as string} color="primary" size="small" />
      ),
    },
    {
      field: 'paidAt',
      headerName: 'Thanh toán lúc',
      width: 200,
      renderCell: (params: GridRenderCellParams<Transaction>) => {
        const value = params?.row?.paidAt || params?.row?.createdAt || params?.row?.updatedAt
        return <span>{value ? new Date(value).toLocaleString('vi-VN') : '—'}</span>
      },
    },
    {
      field: 'actions',
      headerName: 'Hành động',
      width: 140,
      renderCell: (params: GridRenderCellParams<Transaction>) => (
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

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Giao dịch
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
          Thêm giao dịch
        </Button>
      </Box>

      {(isLoading || isFetching) && <LinearProgress />}

      <DataGrid
        rows={transactions}
        columns={columns}
        getRowId={(row) => row._id}
        autoHeight
        initialState={{ pagination: { paginationModel: { page: 0, pageSize: 10 } } }}
        pageSizeOptions={[5, 10, 25]}
        disableRowSelectionOnClick
      />

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editing ? 'Cập nhật giao dịch' : 'Thêm giao dịch'}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 1, minWidth: 440 }}>
            <TextField margin="normal" fullWidth label="Order ID" required {...register('orderId')} />
            <TextField margin="normal" fullWidth label="User ID" required {...register('userId')} />
            <TextField margin="normal" fullWidth label="Cổng thanh toán" required {...register('provider')} />
            <TextField
              margin="normal"
              fullWidth
              label="Số tiền"
              type="number"
              required
              {...register('amount', { valueAsNumber: true })}
            />
            <TextField margin="normal" fullWidth label="Tiền tệ" defaultValue="VND" {...register('currency')} />
            <TextField margin="normal" fullWidth label="Trạng thái" required {...register('status')} />
            <TextField
              margin="normal"
              fullWidth
              label="Thời gian thanh toán"
              type="datetime-local"
              InputLabelProps={{ shrink: true }}
              {...register('paidAt')}
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

export default TransactionsPage
