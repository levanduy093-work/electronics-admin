import React from 'react';
import { Typography, Grid, Paper, Box } from '@mui/material';

const DashboardPage = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Welcome to Electronics Shop Admin
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Orders
            </Typography>
            <Typography component="p" variant="h4">
              Coming Soon
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Products
            </Typography>
            <Typography component="p" variant="h4">
              Coming Soon
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Users
            </Typography>
            <Typography component="p" variant="h4">
              Coming Soon
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;
