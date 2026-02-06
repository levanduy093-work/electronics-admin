import { useMemo } from 'react'
import { Box, LinearProgress, Paper, Stack, Typography, Chip } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { useQuery } from '@tanstack/react-query'
import client from '../api/client'

interface OrderSummary {
  _id: string
  code: string
  totalPrice: number
  paymentStatus?: string
  createdAt?: string
  status?: {
    ordered?: string
    confirmed?: string
    packaged?: string
    shipped?: string
  }
  isCancelled?: boolean
}

interface StatBlock {
  label: string
  value: number | string
  suffix?: string
}

const DashboardPage = () => {
  const fetchDashboard = async () => {
    const [productsRes, ordersRes, usersRes, vouchersRes, reviewsRes] = await Promise.all([
      client.get('/products'),
      client.get('/orders'),
      client.get('/users'),
      client.get('/vouchers'),
      client.get('/reviews'),
    ])

    const orders: OrderSummary[] = ordersRes.data ?? []
    const revenue = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0)
    const stats = {
      products: productsRes.data?.length ?? 0,
      orders: orders.length,
      users: usersRes.data?.length ?? 0,
      vouchers: vouchersRes.data?.length ?? 0,
      reviews: reviewsRes.data?.length ?? 0,
      revenue,
    }
    const sorted = [...orders].sort((a, b) => (new Date(b.createdAt || '').getTime()) - (new Date(a.createdAt || '').getTime()))
    return { stats, recentOrders: sorted.slice(0, 5) }
  }

  const {
    data,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ['dashboard:stats'],
    queryFn: fetchDashboard,
  })

  const stats = data?.stats ?? {
    products: 0,
    orders: 0,
    users: 0,
    vouchers: 0,
    reviews: 0,
    revenue: 0,
  }
  const recentOrders = data?.recentOrders ?? []

  const cards: StatBlock[] = useMemo(
    () => [
      { label: 'Sản phẩm', value: stats.products },
      { label: 'Đơn hàng', value: stats.orders },
      { label: 'Người dùng', value: stats.users },
      { label: 'Voucher', value: stats.vouchers },
      { label: 'Đánh giá', value: stats.reviews },
      {
        label: 'Doanh thu (ước tính)',
        value: stats.revenue.toLocaleString('vi-VN'),
        suffix: 'đ',
      },
    ],
    [stats],
  )

  const statusChip = (order: OrderSummary) => {
    if (order.isCancelled) return <Chip label="Đã hủy" color="error" size="small" />
    if (order.status?.shipped) return <Chip label="Đã giao" color="success" size="small" />
    if (order.status?.packaged) return <Chip label="Đóng gói" color="info" size="small" />
    if (order.status?.confirmed) return <Chip label="Đã xác nhận" color="primary" size="small" />
    if (order.status?.ordered) return <Chip label="Đã đặt" color="warning" size="small" />
    return <Chip label="Chờ xử lý" size="small" />
  }

  const columns: GridColDef<OrderSummary>[] = [
    { field: 'code', headerName: 'Mã đơn', flex: 1, minWidth: 140 },
    {
      field: 'totalPrice',
      headerName: 'Tổng tiền',
      flex: 1,
      minWidth: 140,
      valueFormatter: (value?: number) => Number(value || 0).toLocaleString('vi-VN'),
    },
    { field: 'paymentStatus', headerName: 'Thanh toán', flex: 1, minWidth: 140 },
    {
      field: 'status',
      headerName: 'Trạng thái',
      flex: 1,
      minWidth: 150,
      renderCell: (params: GridRenderCellParams<OrderSummary>) => statusChip(params.row),
      sortable: false,
      filterable: false,
    },
    {
      field: 'createdAt',
      headerName: 'Ngày tạo',
      flex: 1.2,
      minWidth: 170,
      valueFormatter: (value?: string) =>
        value ? new Date(value).toLocaleString('vi-VN') : '',
    },
  ]

  return (
    <Stack spacing={3}>
      <Box className="page-header">
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }} gutterBottom>
            Tổng quan hệ thống
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Kiểm soát nhanh số liệu chính của backend Electronics Shop.
          </Typography>
        </Box>
      </Box>

      {(isLoading || isFetching) && <LinearProgress />}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
          gap: 2,
        }}
      >
        {cards.map((card) => (
          <Paper key={card.label} className="section-card" sx={{ p: 2.5 }}>
            <Typography variant="body2" color="text.secondary">
              {card.label}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {card.value} {card.suffix ?? ''}
            </Typography>
          </Paper>
        ))}
      </Box>

      <Paper className="section-card" sx={{ p: 2.5 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Đơn hàng mới nhất
        </Typography>
        <div style={{ width: '100%' }}>
          <DataGrid
            autoHeight
            rows={recentOrders}
            columns={columns}
            getRowId={(row) => row._id}
            initialState={{
              pagination: { paginationModel: { page: 0, pageSize: 5 } },
            }}
            pageSizeOptions={[5, 10]}
            disableRowSelectionOnClick
          />
        </div>
      </Paper>
    </Stack>
  )
}

export default DashboardPage
