import { useEffect, useState } from 'react'
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress,
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, ConfirmationNumber } from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import client from '../api/client'

interface User {
  _id: string
  name: string
  email: string
  role: string
  avatar?: string
}

interface UserFormValues {
  name: string
  email: string
  role: string
  password?: string
  avatar?: string
}

interface VoucherFormValues {
  code: string
  description: string
  minTotal: number
  expire: string
  discountRate?: number
  maxDiscountPrice?: number
  discountPrice?: number
}

const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const { register, handleSubmit, reset, setValue, control } = useForm<UserFormValues>()

  // Voucher State
  const [openVoucherDialog, setOpenVoucherDialog] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [voucherType, setVoucherType] = useState<'fixed' | 'shipping' | 'percentage'>('fixed')
  const { register: registerVoucher, handleSubmit: handleSubmitVoucher, reset: resetVoucher } = useForm<VoucherFormValues>()

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await client.get('/users')
      setUsers(response.data)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleOpen = (user: User | null = null) => {
    setEditingUser(user)
    if (user) {
      setValue('name', user.name)
      setValue('email', user.email)
      setValue('role', user.role)
      setValue('avatar', user.avatar || '')
    } else {
      reset({ role: 'customer' })
    }
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setEditingUser(null)
    reset({ role: 'customer' })
  }

  const onSubmit = async (data: UserFormValues) => {
    try {
      setSaving(true)
      if (editingUser) {
        // Only update role for existing users
        await client.patch(`/users/${editingUser._id}`, { role: data.role })
      } else {
        // Create new user with all fields
        const payload: UserFormValues = {
          name: data.name,
          email: data.email,
          role: data.role,
          avatar: data.avatar || undefined,
          password: data.password || 'Password123!',
        }
        await client.post('/users', payload)
      }
      fetchUsers()
      handleClose()
    } catch (error) {
      console.error('Error saving user:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa người dùng này?')) {
      try {
        await client.delete(`/users/${id}`)
        fetchUsers()
      } catch (error) {
        console.error('Error deleting user:', error)
      }
    }
  }

  // Voucher Handlers
  const handleOpenVoucherDialog = (userId: string) => {
    setSelectedUserId(userId)
    setOpenVoucherDialog(true)
    resetVoucher()
    setVoucherType('fixed')
  }

  const handleCloseVoucherDialog = () => {
    setOpenVoucherDialog(false)
    setSelectedUserId(null)
    resetVoucher()
  }

  const onSubmitVoucher = async (data: VoucherFormValues) => {
    if (!selectedUserId) return

    const payload: Record<string, unknown> = {
      code: data.code,
      description: data.description,
      minTotal: Number(data.minTotal),
      expire: data.expire ? new Date(data.expire).toISOString() : undefined,
      type: voucherType,
    }

    if (voucherType === 'percentage') {
      payload.discountRate = Number(data.discountRate)
      payload.maxDiscountPrice = data.maxDiscountPrice ? Number(data.maxDiscountPrice) : undefined
      payload.discountPrice = 0
    } else {
      payload.discountPrice = Number(data.discountPrice)
      payload.discountRate = undefined
      payload.maxDiscountPrice = undefined
    }

    try {
      setSaving(true)
      await client.post(`/users/${selectedUserId}/vouchers`, payload)
      alert('Đã thêm voucher thành công!')
      handleCloseVoucherDialog()
    } catch (error) {
      console.error('Error adding voucher:', error)
      alert('Có lỗi xảy ra khi thêm voucher')
    } finally {
      setSaving(false)
    }
  }

  const columns: GridColDef<User>[] = [
    { field: 'name', headerName: 'Tên', flex: 1, minWidth: 160 },
    { field: 'email', headerName: 'Email', flex: 1.2, minWidth: 220 },
    { field: 'role', headerName: 'Quyền', width: 130 },
    {
      field: 'actions',
      headerName: 'Hành động',
      width: 180,
      renderCell: (params: GridRenderCellParams<User>) => (
        <>
          <IconButton onClick={() => handleOpenVoucherDialog(params.row._id)} color="success" title="Thêm voucher">
            <ConfirmationNumber />
          </IconButton>
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
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }} gutterBottom>
            Người dùng
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Thêm, sửa quyền hạn và thông tin tài khoản.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
          sx={{ minWidth: 180, height: 40, px: 3, borderRadius: 1, alignSelf: 'flex-end', mt: 1 }}
        >
          Thêm người dùng
        </Button>
      </Box>

      {loading && <LinearProgress />}

      <DataGrid
        rows={users}
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

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editingUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng'}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 1, minWidth: 400 }}>
            <TextField
              margin="normal"
              fullWidth
              label="Tên"
              required
              {...register('name')}
              disabled={!!editingUser}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Email"
              required
              {...register('email')}
              disabled={!!editingUser}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel id="role-label">Quyền</InputLabel>
              <Controller
                name="role"
                control={control}
                defaultValue="customer"
                render={({ field }) => (
                  <Select labelId="role-label" label="Quyền" {...field}>
                    <MenuItem value="customer">Customer</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                  </Select>
                )}
              />
            </FormControl>
            {!editingUser && (
              <>
                <TextField
                  margin="normal"
                  fullWidth
                  label="Mật khẩu mặc định"
                  type="password"
                  {...register('password')}
                />
                <TextField margin="normal" fullWidth label="Avatar URL" {...register('avatar')} />
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Hủy</Button>
          <Button onClick={handleSubmit(onSubmit)} variant="contained" disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Add Voucher */}
      <Dialog open={openVoucherDialog} onClose={handleCloseVoucherDialog}>
        <DialogTitle>Thêm voucher cho người dùng</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmitVoucher(onSubmitVoucher)} sx={{ mt: 1, minWidth: 400 }}>
            <TextField margin="normal" fullWidth label="Mã voucher" required {...registerVoucher('code')} />
            <TextField margin="normal" fullWidth label="Mô tả" {...registerVoucher('description')} />
            <TextField
              margin="normal"
              fullWidth
              select
              label="Loại giảm giá"
              SelectProps={{ native: true }}
              value={voucherType}
              onChange={(e) => setVoucherType(e.target.value as 'fixed' | 'shipping' | 'percentage')}
            >
              <option value="fixed">Giảm số tiền cố định</option>
              <option value="percentage">Giảm theo % (có thể đặt mức tối đa)</option>
              <option value="shipping">Giảm phí vận chuyển</option>
            </TextField>

            {voucherType === 'percentage' ? (
              <>
                <TextField
                  margin="normal"
                  fullWidth
                  label="Giảm (%)"
                  type="number"
                  inputProps={{ min: 0, max: 100, step: 1 }}
                  {...registerVoucher('discountRate', { valueAsNumber: true })}
                />
                <TextField
                  margin="normal"
                  fullWidth
                  label="Giảm tối đa (đ)"
                  type="number"
                  inputProps={{ min: 0, step: 1000 }}
                  {...registerVoucher('maxDiscountPrice', { valueAsNumber: true })}
                />
              </>
            ) : (
              <TextField
                margin="normal"
                fullWidth
                label={voucherType === 'shipping' ? 'Giảm phí ship (đ)' : 'Giảm giá (đ)'}
                type="number"
                inputProps={{ min: 0, step: 1000 }}
                required
                {...registerVoucher('discountPrice', { valueAsNumber: true })}
              />
            )}

            <TextField
              margin="normal"
              fullWidth
              label="Đơn hàng tối thiểu"
              type="number"
              required
              {...registerVoucher('minTotal', { valueAsNumber: true })}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Ngày hết hạn"
              type="datetime-local"
              InputLabelProps={{ shrink: true }}
              required
              {...registerVoucher('expire')}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseVoucherDialog}>Hủy</Button>
          <Button onClick={handleSubmitVoucher(onSubmitVoucher)} variant="contained" disabled={saving}>
            {saving ? 'Đang thêm...' : 'Thêm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default UsersPage
