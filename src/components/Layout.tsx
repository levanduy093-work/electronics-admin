import { useMemo, useState } from 'react'
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Button,
  Avatar,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  ShoppingCart as ShoppingCartIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  Logout as LogoutIcon,
  CardGiftcard as VoucherIcon,
  Reviews as ReviewsIcon,
  LocalShipping as LocalShippingIcon,
  Warehouse as WarehouseIcon,
  Paid as PaidIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const drawerWidth = 240

const Layout = () => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = useMemo(
    () => [
      { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
      { text: 'Products', icon: <InventoryIcon />, path: '/products' },
      { text: 'Orders', icon: <ShoppingCartIcon />, path: '/orders' },
      { text: 'Shipments', icon: <LocalShippingIcon />, path: '/shipments' },
      { text: 'Inventory', icon: <WarehouseIcon />, path: '/inventory' },
      { text: 'Transactions', icon: <PaidIcon />, path: '/transactions' },
      { text: 'Users', icon: <PeopleIcon />, path: '/users' },
      { text: 'Vouchers', icon: <VoucherIcon />, path: '/vouchers' },
      { text: 'Reviews', icon: <ReviewsIcon />, path: '/reviews' },
      { text: 'Notifications', icon: <NotificationsIcon />, path: '/notifications' },
    ],
    [],
  )

  const handleDrawerToggle = () => {
    setMobileOpen((prev) => !prev)
  }

  const drawer = (
    <div>
      <Toolbar sx={{ px: 2 }}>
        <Typography variant="h6" noWrap component="div">
          Electronics Admin
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path)
                setMobileOpen(false)
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  )

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <Box sx={{ display: 'flex' }} className="app-shell">
      <CssBaseline />
      <AppBar
        position="fixed"
        color="inherit"
        elevation={1}
        sx={{
          backgroundColor: '#ffffffcc',
          backdropFilter: 'blur(12px)',
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {menuItems.find((item) => item.path === location.pathname)?.text || 'Dashboard'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {user?.name || 'Admin'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>
            <Avatar sx={{ width: 36, height: 36 }}>{user?.name?.[0]?.toUpperCase() || 'A'}</Avatar>
            <Button color="primary" onClick={handleLogout} startIcon={<LogoutIcon />}
              sx={{ textTransform: 'none', ml: 1 }}
            >
              Logout
            </Button>
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="navigation menu"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{ flexGrow: 1, p: { xs: 2.5, md: 4 }, width: { sm: `calc(100% - ${drawerWidth}px)` } }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  )
}

export default Layout
