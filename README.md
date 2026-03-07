# ElectronicsShop Admin

Admin dashboard for managing products, orders, vouchers, and users.

## Tech Stack
- React (web)
- API integration with ElectronicsShop backend

## Requirements
- Node.js >= 20

## Environment
Create `.env` in this folder:

```env
REACT_APP_API_BASE_URL=https://your-backend-host
```

## Install
```bash
npm install
```

## Run
```bash
npm start
```

## Build
```bash
npm run build
```

## Deploy (Reference)
1. Build production assets:
```bash
npm run build
```
2. Serve `build/` with Nginx/Apache/S3 + CDN.
3. Ensure `REACT_APP_API_BASE_URL` points to the backend.

## Notes
- Make sure backend CORS allows this admin domain.
- Use admin account roles for privileged access.
