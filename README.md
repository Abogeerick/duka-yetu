# Duka Yetu — Kenyan Dress E-Commerce Platform

A full-stack e-commerce platform for selling dresses in Kenya with **M-Pesa STK Push** payment integration, built with React, Express, Supabase, and Cloudinary.

## Features

**Customer-facing:**
- Product catalog with category filtering and search
- Product detail pages with size/color selection
- Shopping cart with quantity management
- Checkout with M-Pesa STK Push payment
- Order tracking
- Guest checkout (no account required)

**Admin dashboard:**
- Product management (create, edit, delete, publish)
- Image upload to Cloudinary
- Order management with status updates
- Revenue and order statistics

---

## Tech Stack

| Layer    | Technology                 |
|----------|----------------------------|
| Frontend | React 18 + Vite + React Router |
| Backend  | Node.js + Express          |
| Database | Supabase (PostgreSQL)      |
| Payments | Safaricom Daraja API (M-Pesa STK Push) |
| Images   | Cloudinary                 |
| Deploy   | Vercel (frontend) + Railway (backend) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) account (free)
- A [Cloudinary](https://cloudinary.com) account (free)
- A [Safaricom Daraja](https://developer.safaricom.co.ke) account (free)

### 1. Clone and install

```bash
git clone https://github.com/your-username/duka-yetu.git
cd duka-yetu

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run `database/schema.sql`
3. Then run `database/seed.sql` for sample products
4. Go to **Settings → API** and copy your:
   - Project URL
   - Anon (public) key
   - Service role key

### 3. Set up Cloudinary

1. Create a free account at [cloudinary.com](https://cloudinary.com)
2. From dashboard, copy your:
   - Cloud name
   - API key
   - API secret

### 4. Set up Daraja (M-Pesa)

1. Register at [developer.safaricom.co.ke](https://developer.safaricom.co.ke)
2. Create a new app (select **Lipa Na M-Pesa Sandbox**)
3. From your app, copy:
   - Consumer key
   - Consumer secret
4. Go to **APIs → M-Pesa Express → Simulate** and note:
   - Shortcode (174379 for sandbox)
   - Passkey

### 5. Configure environment variables

```bash
# Server
cp server/.env.example server/.env
# Edit server/.env with your credentials

# Client
cp client/.env.example client/.env
```

### 6. Run development servers

```bash
# Terminal 1: Start backend
cd server
npm run dev

# Terminal 2: Start frontend
cd client
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

### 7. Create an admin user

1. Register through the app at `/login`
2. Go to Supabase → Table Editor → `profiles`
3. Find your user and change `role` from `customer` to `admin`
4. Refresh the app — you'll now see the Admin button

---

## M-Pesa Testing (Sandbox)

In sandbox mode, use these test credentials:
- **Phone number:** Any number starting with 2547 (e.g., 254712345678)
- **PIN:** Any 4 digits (sandbox auto-approves)
- **Amount:** Any amount

The sandbox simulates the full STK push flow including callbacks.

### Exposing callback URL locally

M-Pesa needs to reach your server to send payment results. For local development, use ngrok:

```bash
# Install ngrok: https://ngrok.com/download
ngrok http 5000

# Copy the https URL (e.g., https://abc123.ngrok.io)
# Update MPESA_CALLBACK_URL in server/.env:
MPESA_CALLBACK_URL=https://abc123.ngrok.io/api/mpesa/callback
```

---

## Deployment

### Frontend → Vercel (free)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → Import project
3. Set root directory to `client`
4. Add environment variable: `VITE_API_URL=https://your-backend.railway.app/api`
5. Deploy

### Backend → Railway ($5/mo)

1. Go to [railway.app](https://railway.app) → New Project
2. Deploy from GitHub, set root directory to `server`
3. Add all environment variables from `server/.env`
4. Set `CLIENT_URL` to your Vercel URL
5. Set `MPESA_CALLBACK_URL` to your Railway URL + `/api/mpesa/callback`
6. Deploy

### Going live with M-Pesa

To accept real payments:
1. Apply for a **Safaricom Business Till** or **Paybill Number**
2. Go live on Daraja portal (submit your app for review)
3. Update `server/.env`:
   - `MPESA_ENV=live`
   - Replace sandbox credentials with production ones
   - Update `MPESA_SHORTCODE` to your real shortcode

---

## Project Structure

```
duka-yetu/
├── docs/SYSTEM_DESIGN.md      ← Architecture & design decisions
├── database/
│   ├── schema.sql             ← Full database schema (run in Supabase)
│   └── seed.sql               ← Sample products
├── server/                    ← Express backend
│   ├── src/
│   │   ├── index.js           ← Entry point
│   │   ├── config/            ← Supabase, Cloudinary setup
│   │   ├── middleware/auth.js ← JWT + role verification
│   │   ├── routes/            ← API endpoints
│   │   │   ├── products.js    ← Product CRUD
│   │   │   ├── orders.js      ← Order management
│   │   │   ├── mpesa.js       ← STK Push + callback
│   │   │   ├── upload.js      ← Image upload
│   │   │   └── auth.js        ← Login/register
│   │   ├── services/mpesa.js  ← Daraja API service
│   │   └── utils/helpers.js   ← Phone formatting, slugify
│   └── .env.example
└── client/                    ← React frontend
    ├── src/
    │   ├── config/api.js      ← Axios instance
    │   ├── context/           ← Auth + Cart state
    │   ├── components/        ← Reusable components
    │   │   ├── layout/        ← Header, Footer
    │   │   ├── ProductCard.jsx
    │   │   └── MpesaCheckout.jsx  ← STK Push UI + polling
    │   └── pages/
    │       ├── Home.jsx
    │       ├── Shop.jsx
    │       ├── ProductDetail.jsx
    │       ├── Cart.jsx
    │       ├── Checkout.jsx
    │       ├── Login.jsx
    │       └── admin/         ← Dashboard, Products, Orders
    └── .env.example
```

---

## API Endpoints

| Method | Endpoint                 | Auth   | Description              |
|--------|--------------------------|--------|--------------------------|
| GET    | /api/products            | Public | List products (filterable)|
| GET    | /api/products/:slug      | Public | Single product           |
| POST   | /api/orders              | Public | Create order             |
| POST   | /api/mpesa/stkpush       | Public | Initiate M-Pesa payment  |
| POST   | /api/mpesa/callback      | Webhook| Safaricom payment result |
| GET    | /api/mpesa/status/:id    | Public | Check payment status     |
| POST   | /api/auth/login          | Public | Login                    |
| POST   | /api/auth/register       | Public | Register                 |
| GET    | /api/products/admin/all  | Admin  | All products (inc. drafts)|
| POST   | /api/products            | Admin  | Create product           |
| PUT    | /api/products/:id        | Admin  | Update product           |
| DELETE | /api/products/:id        | Admin  | Delete product           |
| POST   | /api/admin/upload        | Admin  | Upload image             |
| GET    | /api/orders/admin/all    | Admin  | All orders               |
| PUT    | /api/orders/admin/:id    | Admin  | Update order status      |

---

## License

MIT
