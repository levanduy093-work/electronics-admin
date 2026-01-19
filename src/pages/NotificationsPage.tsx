import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  Chip,
  IconButton,
  InputAdornment,
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon, Search as SearchIcon } from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import client from '../api/client'
import { useDbChange } from '../hooks/useDbChange'

interface NotificationTarget {
  scope: 'all_users' | 'user'
  user_id?: string
  userId?: string
}

interface AdminNotification {
  _id: string
  title: string
  body: string
  type: string
  priority: 'low' | 'normal' | 'high'
  send_at?: string
  createdAt?: string
  expires_at?: string
  targets?: NotificationTarget[]
  readCount?: number
  totalDeliveries?: number
  metadata?: any
}

interface NotificationFormValues {
  title: string
  body: string
  type: string
  priority: 'low' | 'normal' | 'high'
  targetScope: 'all_users' | 'user'
  emails: string
  sendAt?: string
  expiresAt?: string
}

const defaultValues: NotificationFormValues = {
  title: '',
  body: '',
  type: 'system',
  priority: 'normal',
  targetScope: 'all_users',
  emails: '',
  sendAt: '',
  expiresAt: '',
}

const TYPE_OPTIONS = ['system', 'promo', 'order']

const NotificationsPage = () => {
  const [items, setItems] = useState<AdminNotification[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<AdminNotification | null>(null)
  const { control, handleSubmit, reset, watch } = useForm<NotificationFormValues>({
    defaultValues,
  })

  const targetScope = watch('targetScope')

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await client.get('/notifications/admin/all')
      setItems(res.data || [])
    } catch (error) {
      console.error('Không tải được thông báo:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useDbChange(['notifications'], () => {
    fetchData()
  })

  const handleClose = () => {
    setOpen(false)
    setEditing(null)
    reset(defaultValues)
  }

  const handleOpenCreate = () => {
    setEditing(null)
    reset(defaultValues)
    setOpen(true)
  }

  const handleOpenEdit = (item: AdminNotification) => {
    setEditing(item)
    reset({
      title: item.title,
      body: item.body,
      type: item.type || 'system',
      priority: item.priority || 'normal',
      targetScope: item.targets?.some((t) => t.scope === 'user') ? 'user' : 'all_users',
      emails: '', // không lưu email trên server, cho phép nhập mới nếu cần
      sendAt: item.send_at ? item.send_at.slice(0, 16) : '',
      expiresAt: (item as any)?.expires_at ? (item as any).expires_at.slice(0, 16) : '',
    })
    setOpen(true)
  }

  const onSubmit = async (data: NotificationFormValues) => {
    const payload: any = {
      title: data.title,
      body: data.body,
      type: data.type,
      priority: data.priority,
      sendAt: data.sendAt ? new Date(data.sendAt).toISOString() : undefined,
      expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : undefined,
      target: {
        scope: data.targetScope,
      },
    }

    if (data.targetScope === 'user') {
      const emailList = data.emails
        .split(/[;,\n]/)
        .map((e) => e.trim())
        .filter(Boolean)
      payload.target.emails = emailList
    }

    try {
      setSaving(true)
      if (editing) {
        await client.patch(`/notifications/admin/${editing._id}`, payload)
      } else {
        await client.post('/notifications/admin', payload)
      }
      handleClose()
      fetchData()
    } catch (error) {
      console.error('Lưu thông báo thất bại:', error)
      alert('Không thể lưu thông báo, kiểm tra log.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Xóa thông báo này?')) return
    try {
      await client.delete(`/notifications/admin/${id}`)
      fetchData()
    } catch (error) {
      console.error('Xóa thông báo thất bại:', error)
    }
  }

  const columns: GridColDef<AdminNotification>[] = useMemo(() => {
    return [
      { field: 'title', headerName: 'Tiêu đề', flex: 1.5, minWidth: 200 },
      { field: 'type', headerName: 'Loại', width: 120 },
      { field: 'priority', headerName: 'Ưu tiên', width: 120 },
      {
        field: 'send_at',
        headerName: 'Thời gian gửi',
        width: 190,
        valueGetter: (_value, row: AdminNotification) => row?.send_at || row?.createdAt,
        valueFormatter: (value) => (value ? new Date(value as string).toLocaleString('vi-VN') : ''),
      },
      {
        field: 'expires_at',
        headerName: 'Hết hạn',
        width: 190,
        valueFormatter: (value) => (value ? new Date(value as string).toLocaleString('vi-VN') : ''),
      },
      {
        field: 'scope',
        headerName: 'Phạm vi',
        width: 140,
        valueGetter: (_value, row: AdminNotification) =>
          row?.targets?.some((t: NotificationTarget) => t.scope === 'user') ? 'User chỉ định' : 'Tất cả',
      },
      {
        field: 'delivery',
        headerName: 'Đã gửi/Đã đọc',
        width: 180,
        renderCell: (params: GridRenderCellParams<AdminNotification>) => (
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              label={`${params.row.totalDeliveries ?? 0} gửi`}
              size="small"
              sx={{ minWidth: 68, justifyContent: 'center' }}
            />
            <Chip
              label={`${params.row.readCount ?? 0} đọc`}
              size="small"
              color="success"
              sx={{ minWidth: 68, justifyContent: 'center' }}
            />
          </Stack>
        ),
        sortable: false,
        filterable: false,
      },
      {
        field: 'actions',
        headerName: 'Hành động',
        width: 140,
        renderCell: (params: GridRenderCellParams<AdminNotification>) => (
          <Stack direction="row" spacing={1}>
            <IconButton color="primary" onClick={() => handleOpenEdit(params.row)}>
              <EditIcon />
            </IconButton>
            <IconButton color="error" onClick={() => handleDelete(params.row._id)}>
              <DeleteIcon />
            </IconButton>
          </Stack>
        ),
        sortable: false,
        filterable: false,
      },
    ]
  }, [])

  const normalizeText = (value?: string) =>
    (value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()

  const fuzzyMatch = (haystack: string | undefined, needle: string) => {
    if (!needle) return true
    const h = normalizeText(haystack)
    if (h.includes(needle)) return true
    const tokens = needle.split(/\s+/).filter(Boolean)
    if (!tokens.length) return true
    return tokens.every((t) => h.includes(t) || h.split(/\s+/).some((w) => w.startsWith(t)))
  }

  const normalizedSearch = normalizeText(search)
  const filteredItems = normalizedSearch
    ? items.filter((n) => {
        const haystacks = [
          n.title,
          n.body,
          n.type,
          n.priority,
          n.metadata ? JSON.stringify(n.metadata) : '',
        ]
        return haystacks.some((h) => fuzzyMatch(h, normalizedSearch))
      })
    : items

  return (
    <Stack spacing={3}>
      <Box
        className="page-header"
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }} gutterBottom>
            Thông báo
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gửi thông báo tới tất cả người dùng hoặc user chỉ định (qua email).
          </Typography>
        </Box>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{ alignItems: { sm: 'center' }, width: { xs: '100%', sm: 'auto' } }}
        >
          <TextField
            size="small"
            placeholder="Tìm theo tiêu đề, nội dung, loại..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: { xs: '100%', sm: 260 } }}
          />
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
            Tạo thông báo
          </Button>
        </Stack>
      </Box>

      {loading && <LinearProgress />}

      <PaperWrapper>
        <DataGrid
          autoHeight
          rows={filteredItems}
          columns={columns}
          getRowId={(row) => row._id}
          initialState={{ pagination: { paginationModel: { page: 0, pageSize: 10 } } }}
          pageSizeOptions={[10, 20, 50]}
          disableRowSelectionOnClick
          sx={{
            '& .MuiDataGrid-cell': { display: 'flex', alignItems: 'center' },
            '& .MuiDataGrid-columnHeaders': { alignItems: 'center' },
          }}
        />
      </PaperWrapper>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? 'Chỉnh sửa thông báo' : 'Tạo thông báo'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Controller
              name="title"
              control={control}
              rules={{ required: 'Bắt buộc' }}
              render={({ field, fieldState }) => (
                <TextField {...field} label="Tiêu đề" fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} />
              )}
            />
            <Controller
              name="body"
              control={control}
              rules={{ required: 'Bắt buộc' }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="Nội dung"
                  fullWidth
                  multiline
                  minRows={3}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Controller
                name="type"
                control={control}
                render={({ field }) => {
                  const value = field.value || 'system'
                  const options = TYPE_OPTIONS.includes(value) ? TYPE_OPTIONS : [...TYPE_OPTIONS, value]
                  return (
                    <FormControl fullWidth>
                      <InputLabel>Loại</InputLabel>
                      <Select {...field} value={value} label="Loại">
                        {options.map((opt) => (
                          <MenuItem key={opt} value={opt}>
                            {opt}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )
                }}
              />
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Ưu tiên</InputLabel>
                    <Select {...field} label="Ưu tiên">
                      <MenuItem value="low">Thấp</MenuItem>
                      <MenuItem value="normal">Bình thường</MenuItem>
                      <MenuItem value="high">Cao</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Controller
                name="sendAt"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Thời gian gửi"
                    type="datetime-local"
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                )}
              />
              <Controller
                name="expiresAt"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Hết hạn"
                    type="datetime-local"
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                )}
              />
            </Stack>

            <FormControl fullWidth>
              <InputLabel>Phạm vi</InputLabel>
              <Controller
                name="targetScope"
                control={control}
                render={({ field }) => (
                  <Select {...field} label="Phạm vi">
                    <MenuItem value="all_users">Tất cả người dùng</MenuItem>
                    <MenuItem value="user">User chỉ định (email)</MenuItem>
                  </Select>
                )}
              />
            </FormControl>

            {targetScope === 'user' && (
              <Controller
                name="emails"
                control={control}
                rules={{ required: 'Nhập ít nhất một email' }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Emails (cách nhau bởi dấu phẩy, chấm phẩy hoặc xuống dòng)"
                    fullWidth
                    multiline
                    minRows={2}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Hủy</Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={saving} variant="contained">
            {saving ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

const PaperWrapper = ({ children }: { children: React.ReactNode }) => (
  <Box component="div" sx={{ backgroundColor: '#fff', p: 2.5, borderRadius: 2, boxShadow: 1 }}>
    {children}
  </Box>
)

export default NotificationsPage
