# System Design: Duka Yetu — Kenyan Dress E-Commerce Platform

## 1. Overview

Duka Yetu is a full-stack e-commerce platform for selling dresses in Kenya with M-Pesa payment integration. It features a customer-facing storefront and a seller admin dashboard for managing products, orders, and inventory.

**Target scale:** ~1,000 monthly active users, ~200–500 products, ~100–500 orders/month.

---

## 2. Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENT (React + Vite)              │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐             │
│  │Storefront│  │  Cart &   │  │   Admin   │             │
│  │  (Shop)  │  │ Checkout  │  │ Dashboard │             │
│  └────┬─────┘  └────┬─────┘  └─────┬─────┘             │
│       │              │              │                    │
│       └──────────────┴──────────────┘                    │
│                      │                                   │
│              Axios HTTP Requests                         │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│                  SERVER (Node.js + Express)               │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │ Products │  │  Orders  │  │  M-Pesa  │  │  Upload  │ │
│  │  Routes  │  │  Routes  │  │  Routes  │  │  Routes  │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬────┘ │
│       │              │              │              │      │
│  ┌────┴──────────────┴──────────────┴──────────────┘     │
│  │              Middleware (Auth, CORS, Validation)       │
│  └───────┬──────────────────┬───────────────┬───────┘    │
│          │                  │               │            │
│          ▼                  ▼               ▼            │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐     │
│  │   Supabase   │  │   Daraja     │  │ Cloudinary │     │
│  │  (Postgres)  │  │  (M-Pesa)    │  │  (Images)  │     │
│  └──────────────┘  └──────────────┘  └────────────┘     │
└──────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│                 EXTERNAL SERVICES                         │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  Supabase    │  │  Safaricom   │  │  Cloudinary  │   │
│  │  - Database  │  │  Daraja API  │  │  - CDN       │   │
│  │  - Auth      │  │  - STK Push  │  │  - Transform │   │
│  │  - Storage   │  │  - Callbacks │  │  - Storage   │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
└──────────────────────────────────────────────────────────┘
```

---

## 3. Tech Stack

| Layer         | Technology        | Reason                                        |
|---------------|-------------------|-----------------------------------------------|
| Frontend      | React + Vite      | Fast dev server, component-based, large ecosystem |
| Routing       | React Router v6   | Client-side routing for SPA                   |
| State         | React Context     | Sufficient for cart/auth at this scale         |
| Styling       | CSS Modules       | Scoped styles, no build complexity             |
| Backend       | Node.js + Express | Same language as frontend, huge M-Pesa community |
| Database      | Supabase (Postgres)| Free tier, built-in auth, real-time capable   |
| Payments      | Daraja API        | Safaricom's official M-Pesa integration        |
| Image Storage | Cloudinary        | Free tier, auto-optimization, CDN delivery     |
| Deployment    | Vercel + Railway  | Free/cheap tiers, zero-config deploys          |

---

## 4. Database Schema

```sql
-- Users (managed by Supabase Auth, extended with profiles)
profiles
├── id              UUID (FK → auth.users.id)
├── full_name       TEXT
├── phone           TEXT
├── email           TEXT
├── role            TEXT ('customer' | 'admin')
├── address         TEXT
├── city            TEXT
├── created_at      TIMESTAMPTZ

-- Product catalog
products
├── id              UUID (PK)
├── name            TEXT
├── slug            TEXT (UNIQUE, for URLs)
├── description     TEXT
├── price           INTEGER (in KES, no decimals)
├── compare_price   INTEGER (original price for sales)
├── category        TEXT ('dresses' | 'maxi' | 'mini' | 'gowns' | 'two-piece' | 'jumpsuits')
├── sizes           TEXT[] (array: ['S','M','L','XL'])
├── colors          JSONB ([{name: 'Black', hex: '#000'}])
├── images          TEXT[] (Cloudinary URLs)
├── stock           INTEGER
├── is_published    BOOLEAN
├── is_featured     BOOLEAN
├── badge           TEXT ('NEW' | 'SALE' | null)
├── created_at      TIMESTAMPTZ
├── updated_at      TIMESTAMPTZ

-- Customer orders
orders
├── id              UUID (PK)
├── order_number    TEXT (UNIQUE, e.g., 'DY-20260305-001')
├── customer_id     UUID (FK → profiles.id, nullable for guests)
├── customer_name   TEXT
├── customer_phone  TEXT
├── customer_email  TEXT
├── delivery_address TEXT
├── delivery_city   TEXT
├── subtotal        INTEGER
├── delivery_fee    INTEGER
├── total           INTEGER
├── status          TEXT ('pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled')
├── payment_method  TEXT ('mpesa' | 'cod')
├── notes           TEXT
├── created_at      TIMESTAMPTZ
├── updated_at      TIMESTAMPTZ

-- Items within each order
order_items
├── id              UUID (PK)
├── order_id        UUID (FK → orders.id)
├── product_id      UUID (FK → products.id)
├── product_name    TEXT (snapshot at time of order)
├── product_image   TEXT
├── size            TEXT
├── color           TEXT
├── quantity        INTEGER
├── unit_price      INTEGER
├── total_price     INTEGER

-- M-Pesa payment tracking
payments
├── id              UUID (PK)
├── order_id        UUID (FK → orders.id)
├── phone_number    TEXT
├── amount          INTEGER
├── merchant_request_id  TEXT
├── checkout_request_id  TEXT (UNIQUE — links STK push to callback)
├── mpesa_receipt   TEXT
├── result_code     INTEGER
├── result_desc     TEXT
├── status          TEXT ('initiated' | 'pending' | 'completed' | 'failed' | 'cancelled')
├── created_at      TIMESTAMPTZ
├── updated_at      TIMESTAMPTZ
```

### Key Relationships
```
profiles ──1:N──▶ orders
orders   ──1:N──▶ order_items
orders   ──1:1──▶ payments
products ──1:N──▶ order_items
```

---

## 5. M-Pesa Payment Flow (STK Push)

This is the core payment mechanism. The sequence:

```
Step 1: Customer clicks "Pay via M-Pesa"
         │
         ▼
Step 2: Frontend sends POST /api/mpesa/stkpush
        { phone: "254712345678", orderId: "uuid" }
         │
         ▼
Step 3: Backend generates OAuth token from Daraja
        POST https://api.safaricom.co.ke/oauth/v1/generate
         │
         ▼
Step 4: Backend initiates STK Push
        POST https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest
        {
          BusinessShortCode, Password (base64), Timestamp,
          TransactionType: "CustomerPayBillOnline",
          Amount, PartyA (phone), PartyB (shortcode),
          PhoneNumber, CallBackURL, AccountReference, TransactionDesc
        }
         │
         ▼
Step 5: Safaricom sends STK push to customer's phone
        Customer enters M-Pesa PIN
         │
         ▼
Step 6: Safaricom POSTs result to CallbackURL
        POST /api/mpesa/callback
        {
          Body: { stkCallback: {
            MerchantRequestID, CheckoutRequestID,
            ResultCode: 0 (success) or error code,
            CallbackMetadata: { Amount, MpesaReceiptNumber, PhoneNumber }
          }}
        }
         │
         ▼
Step 7: Backend matches CheckoutRequestID → payment → order
        Updates payment status → order status
         │
         ▼
Step 8: Frontend polls GET /api/mpesa/status/:checkoutRequestId
        Shows success/failure to customer
```

### Error Handling
- ResultCode 0 = Success
- ResultCode 1032 = Cancelled by user
- ResultCode 1037 = Timeout (user didn't respond)
- ResultCode 1 = Insufficient balance
- Network failures: Retry with exponential backoff (max 3 attempts)

---

## 6. API Endpoints

### Public (No Auth Required)
```
GET    /api/products              List products (with filters, pagination)
GET    /api/products/:slug        Get single product
POST   /api/orders                Create new order (guest checkout)
POST   /api/mpesa/stkpush         Initiate M-Pesa STK push
POST   /api/mpesa/callback        Safaricom callback (webhook)
GET    /api/mpesa/status/:id      Check payment status (polling)
```

### Protected (Auth Required)
```
POST   /api/auth/register         Register new user
POST   /api/auth/login            Login
GET    /api/auth/me               Get current user profile
PUT    /api/auth/profile          Update profile
GET    /api/orders/my-orders      Customer's order history
```

### Admin Only
```
GET    /api/admin/products        List all products (inc. unpublished)
POST   /api/admin/products        Create product
PUT    /api/admin/products/:id    Update product
DELETE /api/admin/products/:id    Delete product
POST   /api/admin/upload          Upload image to Cloudinary
GET    /api/admin/orders          List all orders
PUT    /api/admin/orders/:id      Update order status
GET    /api/admin/dashboard       Dashboard stats
```

---

## 7. Frontend Routes

```
/                    → Home (hero + featured products)
/shop                → All products (with category filters)
/shop/:category      → Products by category
/product/:slug       → Product detail page
/cart                → Shopping cart
/checkout            → Checkout (delivery info + M-Pesa)
/account             → Customer account/orders
/login               → Login page
/register            → Registration page

/admin               → Admin dashboard (order stats, recent orders)
/admin/products      → Product list (CRUD)
/admin/products/new  → Add new product
/admin/products/:id  → Edit product
/admin/orders        → Order management
/admin/orders/:id    → Order detail
```

---

## 8. Folder Structure

```
duka-yetu/
├── README.md                    # Setup instructions
├── .gitignore
├── docs/
│   └── SYSTEM_DESIGN.md         # This document
│
├── client/                      # React frontend
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── .env.example
│   └── src/
│       ├── main.jsx             # App entry point
│       ├── App.jsx              # Router setup
│       ├── index.css            # Global styles
│       ├── config/
│       │   └── api.js           # Axios instance
│       ├── context/
│       │   ├── AuthContext.jsx   # Auth state management
│       │   └── CartContext.jsx   # Cart state management
│       ├── hooks/
│       │   └── useProducts.js   # Data fetching hooks
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Header.jsx
│       │   │   └── Footer.jsx
│       │   ├── ProductCard.jsx
│       │   └── MpesaCheckout.jsx
│       └── pages/
│           ├── Home.jsx
│           ├── Shop.jsx
│           ├── ProductDetail.jsx
│           ├── Cart.jsx
│           ├── Checkout.jsx
│           ├── Login.jsx
│           └── admin/
│               ├── Dashboard.jsx
│               ├── Products.jsx
│               ├── ProductForm.jsx
│               └── Orders.jsx
│
├── server/                      # Express backend
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── index.js             # Server entry point
│       ├── config/
│       │   ├── supabase.js      # Supabase client
│       │   └── cloudinary.js    # Cloudinary config
│       ├── middleware/
│       │   └── auth.js          # JWT auth + role checking
│       ├── routes/
│       │   ├── products.js      # Product CRUD
│       │   ├── orders.js        # Order management
│       │   ├── mpesa.js         # M-Pesa STK push + callback
│       │   ├── upload.js        # Image upload to Cloudinary
│       │   └── auth.js          # Authentication routes
│       ├── services/
│       │   └── mpesa.js         # Daraja API service layer
│       └── utils/
│           └── helpers.js       # Order numbers, phone formatting
│
└── database/
    ├── schema.sql               # Full database schema
    └── seed.sql                 # Sample data for development
```

---

## 9. Security Considerations

1. **M-Pesa Callback Validation**: Verify callback origin IP ranges from Safaricom
2. **Environment Variables**: All secrets stored in .env, never committed
3. **Input Validation**: Sanitize all user inputs server-side
4. **CORS**: Restrict to known frontend origins
5. **Rate Limiting**: Protect STK push endpoint from abuse
6. **Row Level Security**: Supabase RLS policies so users see only their own orders
7. **Admin Auth**: Role-based middleware checking profile.role === 'admin'
8. **HTTPS**: Enforced by Vercel/Railway in production

---

## 10. Deployment Architecture

```
┌──────────────────┐     ┌──────────────────┐
│   Vercel (Free)  │     │  Railway ($5/mo)  │
│                  │     │                   │
│  React Frontend  │────▶│  Express Backend  │
│  Static + SSR    │     │  Node.js API      │
│                  │     │                   │
│  CDN: Global     │     │  Region: Auto     │
└──────────────────┘     └───────┬───────────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
                    ▼            ▼            ▼
             ┌──────────┐ ┌──────────┐ ┌──────────┐
             │ Supabase │ │ Daraja   │ │Cloudinary│
             │ (Free)   │ │ (Free)   │ │ (Free)   │
             └──────────┘ └──────────┘ └──────────┘
```

### Environment Setup
- **Development**: localhost:5173 (client) + localhost:5000 (server)
- **Staging**: Use Daraja sandbox (sandbox.safaricom.co.ke)
- **Production**: Switch to live Daraja endpoints (api.safaricom.co.ke)
