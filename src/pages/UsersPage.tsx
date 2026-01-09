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
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material'
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

const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const { register, handleSubmit, reset, setValue, control } = useForm<UserFormValues>()

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
    const payload: UserFormValues = {
      name: data.name,
      email: data.email,
      role: data.role,
      avatar: data.avatar || undefined,
      password: data.password || undefined,
    }
    try {
      setSaving(true)
      if (editingUser) {
        if (!data.password) delete payload.password
        await client.patch(`/users/${editingUser._id}`, payload)
      } else {
        await client.post('/users', { ...payload, password: data.password || 'Password123!' })
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

  const columns: GridColDef<User>[] = [
    { field: 'name', headerName: 'Tên', flex: 1, minWidth: 160 },
    { field: 'email', headerName: 'Email', flex: 1.2, minWidth: 220 },
    { field: 'role', headerName: 'Quyền', width: 130 },
    {
      field: 'actions',
      headerName: 'Hành động',
      width: 140,
      renderCell: (params: GridRenderCellParams<User>) => (
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
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }} gutterBottom>
            Người dùng
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Thêm, sửa quyền hạn và thông tin tài khoản.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
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
            <TextField margin="normal" fullWidth label="Tên" required {...register('name')} />
            <TextField margin="normal" fullWidth label="Email" required {...register('email')} />
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
            <TextField
              margin="normal"
              fullWidth
              label={editingUser ? 'Mật khẩu (để trống nếu không đổi)' : 'Mật khẩu mặc định'}
              type="password"
              {...register('password')}
            />
            <TextField margin="normal" fullWidth label="Avatar URL" {...register('avatar')} />
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

export default UsersPage
