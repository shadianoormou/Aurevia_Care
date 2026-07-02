# MediMart AI — Smart E-Pharmacy Platform 💊

A full-stack MERN e-pharmacy platform where customers can browse and order medicines
and healthcare products, and admins/pharmacists can manage products, categories,
inventory, and orders — with a smart, symptom-based product search.

> ⚠️ **Disclaimer:** This platform does not provide medical advice. Please consult a
> doctor or pharmacist before taking any medicine.

## 📸 Screenshots

_(Add screenshots of your running app here, e.g. `docs/screenshots/home.png`)_

| Home | Products | Admin Dashboard |
|------|----------|------------------|
| _screenshot_ | _screenshot_ | _screenshot_ |

## ✨ Features

**Customer**
- Register / Login with JWT auth (httpOnly cookie + Bearer token fallback)
- Browse, search, filter (category/price/stock), and sort products
- **Smart symptom search** — type "fever", "cough", etc. to see relevant OTC products
- "Recommended for you" product suggestions
- Cart with quantity controls, persisted in `localStorage`
- Clear prescription-required warnings on product cards, product details, and cart
- Checkout requires acknowledging the prescription notice before placing an order
  that contains prescription-required medicine (enforced on both frontend and backend)
- Checkout with Cash on Delivery (Stripe placeholder included, disabled)
- Order tracking: Pending → Confirmed → Processing → Shipped → Delivered / Cancelled
- Product reviews & ratings
- Editable profile with address book
- Prices shown in Bangladeshi Taka (৳)

**Admin**
- Dashboard with total sales/orders/users/products + 7-day sales chart (Recharts)
- Full CRUD for products (with real image file upload, or an image URL fallback)
- Full CRUD for categories (view / add / edit / delete, with delete confirmation)
- Order management with status updates
- User management (role changes, activate/deactivate, delete)
- Inventory management with low-stock alerts and product verification

**Pharmacist/Manager**
- View inventory & update stock
- View low-stock products
- Verify/unverify medicine & product information (shows a "Verified" badge to customers)
- View/manage orders

## 🧱 Tech Stack

**Frontend:** React (Vite), Tailwind CSS, React Router DOM, Axios, Context API,
React Hook Form, Recharts, react-hot-toast, react-icons

**Backend:** Node.js, Express, MongoDB + Mongoose, JWT, bcrypt, dotenv, cors,
cookie-parser, express-validator, Multer + Cloudinary (uploaded via memory storage +
a manual upload stream — see the Troubleshooting section for why)

## 📁 Project Structure

```
medimart-ai/
├── server/                   # Express + MongoDB backend
│   ├── config/db.js
│   ├── models/                # User, Product, Category, Order, Review
│   ├── controllers/
│   ├── routes/
│   ├── middleware/            # auth, error handler, validation
│   ├── utils/                 # JWT + Cloudinary helpers
│   ├── data/symptomMap.js     # dummy symptom → keyword mapping (AI feature)
│   ├── seed/seed.js           # seeds admin/pharmacist/customer + categories + products + reviews + a sample order
│   ├── .env.example
│   └── server.js
└── client/                    # React (Vite) frontend
    ├── src/
    │   ├── api/axios.js
    │   ├── context/            # AuthContext, CartContext
    │   ├── components/
    │   ├── pages/
    │   │   └── admin/          # includes AdminCategories.jsx
    │   ├── utils/currency.js   # ৳ price formatting helper
    │   ├── App.jsx
    │   └── main.jsx
    ├── .env.example
    ├── tailwind.config.js
    └── vite.config.js
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB running locally, or a MongoDB Atlas connection string
- A free [Cloudinary](https://cloudinary.com/) account (for product image upload)

### 1. Clone & install

```bash
git clone <your-repo-url>
cd medimart-ai

# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

`npm install` in `server/` now works with **no flags** (no `--legacy-peer-deps`
needed) — see the Troubleshooting section for details on the fix.

### 2. Configure environment variables

**Server:**
```bash
cd server
cp .env.example .env
# then edit .env with your MongoDB URI, JWT secret, Cloudinary keys, etc.
```

**Client:**
```bash
cd client
cp .env.example .env
# VITE_API_URL is optional in dev (Vite proxies /api to the backend already),
# but required if you deploy the frontend and backend separately.
```

### 3. Seed the database

```bash
cd server
npm run seed
```

This creates an admin, a pharmacist, and a customer account, plus categories,
OTC products, prescription-required products, sample reviews, and a sample order —
and prints the demo credentials to the console.

To wipe all seeded data (Users, Products, Categories, Orders, Reviews):
```bash
npm run seed:destroy
```

### 4. Run the app locally

In **two terminals**:

```bash
# Terminal 1 — backend (http://localhost:5000)
cd server
npm run dev

# Terminal 2 — frontend (http://localhost:5173)
cd client
npm run dev
```

The Vite dev server proxies `/api` requests to the backend automatically (see
`client/vite.config.js`), so you can just open **http://localhost:5173**.

## 🔑 Demo Login Credentials

After running `npm run seed`, log in with:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@medimart.ai` | `Admin@12345` |
| Pharmacist/Manager | `pharmacist@medimart.ai` | `Pharma@12345` |
| Customer | `customer@medimart.ai` | `Customer@123` |

(You can override the admin credentials via `ADMIN_EMAIL` / `ADMIN_PASSWORD` in
`server/.env` before seeding.)

## 🔑 Environment Variables

**`server/.env`**

| Variable | Description |
|---|---|
| `PORT` | Backend port (default 5000) |
| `NODE_ENV` | `development` or `production` |
| `MONGO_URI` | MongoDB connection string (local or Atlas) |
| `JWT_SECRET` | Secret used to sign JWTs — use a long random string |
| `JWT_EXPIRE` | Token expiry, e.g. `30d` |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Cloudinary credentials for product image upload |
| `CLIENT_URL` | Frontend URL for CORS, e.g. `http://localhost:5173` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Used by the seed script |

**`client/.env`**

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base URL, e.g. `http://localhost:5000/api` |

## 🛣️ API Overview

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET/PUT | `/api/auth/profile` | Get/update profile |
| GET | `/api/products` | List products (filter/sort/paginate) |
| GET | `/api/products/:id` | Get single product |
| GET | `/api/products/search?q=` | Smart symptom search |
| GET | `/api/products/recommendations` | Recommended products |
| POST | `/api/products/admin` | Create product (admin, multipart/form-data image upload) |
| PUT | `/api/products/admin/:id` | Update product (admin, multipart/form-data image upload) |
| DELETE | `/api/products/admin/:id` | Delete product (admin) |
| PUT | `/api/products/admin/:id/stock` | Update stock (admin/pharmacist) |
| PUT | `/api/products/admin/:id/verify` | Verify/unverify product (admin/pharmacist) |
| GET | `/api/categories` | List categories |
| POST/PUT/DELETE | `/api/categories/admin[/:id]` | Admin category CRUD |
| POST | `/api/orders` | Place order (validates prescription acknowledgement) |
| GET | `/api/orders/my-orders` | Customer's orders |
| GET | `/api/orders/:id` | Get single order (owner or admin/pharmacist) |
| GET | `/api/orders/admin` | All orders (admin/pharmacist) |
| PUT | `/api/orders/admin/:id/status` | Update order status (admin) |
| POST/GET | `/api/reviews/:productId` | Add/list reviews |
| GET | `/api/admin/stats` | Dashboard stats (admin) |
| GET | `/api/admin/low-stock` | Low stock products (admin/pharmacist) |
| GET/PUT/DELETE | `/api/admin/users[/:id]` | Admin user management |

## 🧠 AI/Smart Features

- **Smart symptom search**: `GET /api/products/search?q=fever` maps common symptoms
  to relevant product keywords (see `server/data/symptomMap.js`) — this is a simple
  rule-based mapping over dummy data, **not** real medical AI.
- **Recommended for you**: Suggests top-rated products from the same category.
- A medical disclaimer is shown across the app (product page, cart, checkout) and
  returned by the search API. This platform never generates medical advice.

## 💊 Prescription Medicine Safety

- Products have a `requiresPrescription` flag. Prescription-required medicine is
  clearly marked with an "Rx" badge on product cards, product details, and the cart.
- At checkout, if the cart contains prescription-required medicine, the customer must
  tick a confirmation checkbox before the "Place Order" button is enabled.
- This is also enforced **server-side**: `POST /api/orders` rejects the order if it
  contains prescription items and `prescriptionAcknowledged` was not sent as `true`.
- Pharmacists/Managers and Admins can verify a product's medicine information
  (`isVerified`, `verifiedBy`, `verifiedAt`), shown to customers as a "Verified" badge.

## 🔒 Security

- Passwords hashed with bcrypt
- JWT auth via httpOnly cookies (+ Bearer token fallback)
- Role-based middleware (`customer`, `admin`, `pharmacist`)
- express-validator input validation on auth routes
- Centralized error handling middleware
- Multer file-type/size validation (JPG/PNG/WEBP, max 5MB) on product image uploads
- No secrets hardcoded — all config via `.env`

## 🛠️ Troubleshooting

**`npm install` fails in `server/` with a dependency conflict**
This project previously depended on `multer-storage-cloudinary`, which pins a peer
dependency on `cloudinary@^1.x`. That conflicted with `cloudinary@^2.x`, which is
what `npm install` needs to resolve, causing an `ERESOLVE` error. The fix: the
project no longer uses `multer-storage-cloudinary` at all. Instead, `multer` is
configured with `memoryStorage()`, and `server/utils/cloudinary.js` streams the
uploaded file buffer straight to Cloudinary with `cloudinary.uploader.upload_stream`.
This removes the conflicting package, so a plain `npm install` (no `--legacy-peer-deps`)
now works.

**MongoDB connection issues**
- Confirm `MONGO_URI` in `server/.env` is correct and MongoDB is running (for local
  MongoDB) or that your IP is allow-listed (for MongoDB Atlas).
- Local MongoDB default: `mongodb://127.0.0.1:27017/medimart_ai`.
- Atlas connection strings look like:
  `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/medimart_ai`.

**Cloudinary setup issues**
- Create a free account at cloudinary.com, then copy the Cloud Name, API Key, and
  API Secret from your Cloudinary dashboard into `server/.env`.
- If image uploads fail with an auth error, double-check there are no extra spaces
  or quotes around the values in `.env`.
- Product image upload still works with an image URL even without Cloudinary
  configured — Cloudinary is only required for real file uploads.

**CORS issues**
- Make sure `CLIENT_URL` in `server/.env` matches the URL the frontend is actually
  running on (default `http://localhost:5173`).
- In development, prefer using the Vite proxy (already configured) instead of
  calling the backend URL directly from the browser, to avoid CORS entirely.

**"npm install" issues in `client/`**
- Delete `node_modules` and `package-lock.json`, then run `npm install` again.
- Make sure you're on Node.js 18 or newer (`node -v`).

## 📝 License

MIT — free to use for learning and portfolio projects.
