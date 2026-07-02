
# MediMart AI — Smart E-Pharmacy Platform 💊

MediMart AI is a full-stack MERN e-pharmacy platform designed for browsing, ordering, and managing medicines and healthcare products online. The platform includes customer shopping features, role-based dashboards for admins and pharmacists, inventory management, order tracking, product verification, prescription safety checks, and smart symptom-based product search.

> ⚠️ **Medical Disclaimer:** MediMart AI does not provide medical advice. Users should consult a doctor or pharmacist before taking any medicine.

---

## 🚀 Project Overview

This project was built as a complete full-stack web application using the MERN stack. The main goal of MediMart AI is to demonstrate how an online pharmacy system can manage customers, medicines, categories, orders, stock, reviews, and role-based administration from one platform.

The application supports three user roles:

- **Customer** — browse products, search medicines, manage cart, place orders, track orders, and review products.
- **Admin** — manage products, categories, users, orders, inventory, and dashboard analytics.
- **Pharmacist/Manager** — manage inventory, update stock, verify medicine/product information, and monitor low-stock products.

---

## ✨ Key Features

### Customer Features

- User registration and login with JWT authentication
- Browse all medicines and healthcare products
- Search products by name, category, brand, or symptom
- Smart symptom-based search for common terms like fever, cough, headache, etc.
- Filter products by category, price range, stock status, and rating
- Sort products by newest, price, and popularity
- Product details page with description, stock, rating, reviews, and safety information
- Add products to cart
- Update cart quantity
- Remove items from cart
- Cart data persistence using `localStorage`
- Checkout with Cash on Delivery
- Prescription-required product warning
- Prescription acknowledgement required before placing orders with Rx products
- View personal order history
- Track order status
- Add product reviews and ratings
- Update user profile and address information
- Prices displayed in Bangladeshi Taka format

---

### Admin Features

- Admin dashboard with key platform statistics
- Total sales, orders, users, and products overview
- 7-day sales chart using Recharts
- Full product management
  - Add product
  - Edit product
  - Delete product
  - Upload product image
  - Use image URL fallback
- Category management
  - Add category
  - Edit category
  - Delete category
  - View all categories
- Order management
  - View all orders
  - Update order status
  - Manage customer orders
- User management
  - View all users
  - Change user roles
  - Activate/deactivate users
  - Delete users
- Inventory management
  - View stock
  - Update stock
  - Low-stock alert
  - Product verification system

---

### Pharmacist / Manager Features

- View product inventory
- Update product stock
- Monitor low-stock products
- Verify or unverify medicine/product information
- View order information
- Help maintain product accuracy and safety

---

## 🧠 Smart Search Feature

MediMart AI includes a simple rule-based smart search system.

Example search terms:

- `fever`
- `cough`
- `cold`
- `headache`
- `pain`
- `vitamin`

When a user searches symptoms, the system maps those terms to related product keywords and shows relevant healthcare products.

This feature is not real medical AI and does not provide medical advice. It is implemented as a safe product discovery feature using predefined symptom-to-keyword mapping.

---

## 💊 Prescription Safety

MediMart AI includes prescription-related safety features:

- Products can be marked as prescription-required.
- Prescription products show an Rx warning badge.
- Product card, product details, cart, and checkout pages show prescription warnings.
- Customers must acknowledge the prescription notice before placing an order that contains prescription-required medicine.
- The backend also validates prescription acknowledgement before creating the order.
- Admins and pharmacists can verify product information.
- Verified products show a verification badge to customers.

---

## 🧱 Tech Stack

### Frontend

- React.js
- Vite
- Tailwind CSS
- React Router DOM
- Axios
- Context API
- React Hook Form
- Recharts
- React Hot Toast
- React Icons

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- bcrypt
- dotenv
- cors
- cookie-parser
- express-validator
- Multer
- Cloudinary

---

## 📁 Project Structure

```bash
medimart-ai/
├── client/                     # React + Vite frontend
│   ├── public/
│   ├── src/
│   │   ├── api/                # Axios configuration
│   │   ├── components/         # Reusable UI components
│   │   ├── context/            # Auth and cart context
│   │   ├── pages/              # Main application pages
│   │   ├── pages/admin/        # Admin dashboard pages
│   │   ├── utils/              # Helper functions
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                     # Express + MongoDB backend
│   ├── config/                 # Database configuration
│   ├── controllers/            # Route controller logic
│   ├── data/                   # Symptom mapping data
│   ├── middleware/             # Auth, validation, error handler
│   ├── models/                 # Mongoose models
│   ├── routes/                 # API routes
│   ├── seed/                   # Database seed script
│   ├── utils/                  # JWT and Cloudinary helpers
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
├── .gitignore
└── README.md
````

---

## ⚙️ Installation and Setup

### Prerequisites

Make sure the following tools are installed:

* Node.js 18 or newer
* npm
* Git
* MongoDB locally or MongoDB Atlas
* Cloudinary account for image upload

---

## 1. Clone the Repository

```bash
git clone https://github.com/shadianoormou/medimart-ai.git
cd medimart-ai
```

---

## 2. Install Backend Dependencies

```bash
cd server
npm install
```

---

## 3. Install Frontend Dependencies

```bash
cd ../client
npm install
```

---

## 4. Configure Environment Variables

### Server Environment

Create a `.env` file inside the `server` folder.

```bash
cd server
cp .env.example .env
```

Example `server/.env`:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/medimart-ai
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=30d
CLIENT_URL=http://localhost:5173

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

ADMIN_EMAIL=admin@medimart.ai
ADMIN_PASSWORD=Admin@12345
```

### Client Environment

Create a `.env` file inside the `client` folder.

```bash
cd client
cp .env.example .env
```

Example `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

---

## 5. Seed the Database

Run the seed command from the `server` folder:

```bash
cd server
npm run seed
```

This will create:

* Admin account
* Pharmacist/Manager account
* Customer account
* Categories
* Sample products
* Prescription-required products
* Non-prescription products
* Sample reviews
* Sample order

To remove seeded data:

```bash
npm run seed:destroy
```

---

## 6. Run the Project Locally

Open two terminals.

### Terminal 1 — Backend

```bash
cd server
npm run dev
```

Backend will run at:

```bash
http://localhost:5000
```

### Terminal 2 — Frontend

```bash
cd client
npm run dev
```

Frontend will run at:

```bash
http://localhost:5173
```

---

## 🔑 Demo Login Credentials

After running the seed command, use these demo accounts:

| Role                 | Email                    | Password       |
| -------------------- | ------------------------ | -------------- |
| Admin                | `admin@medimart.ai`      | `Admin@12345`  |
| Pharmacist / Manager | `pharmacist@medimart.ai` | `Pharma@12345` |
| Customer             | `customer@medimart.ai`   | `Customer@123` |

---

## 🛣️ API Overview

### Auth Routes

| Method | Route                | Description                   |
| ------ | -------------------- | ----------------------------- |
| POST   | `/api/auth/register` | Register new user             |
| POST   | `/api/auth/login`    | Login user                    |
| POST   | `/api/auth/logout`   | Logout user                   |
| GET    | `/api/auth/profile`  | Get logged-in user profile    |
| PUT    | `/api/auth/profile`  | Update logged-in user profile |

### Product Routes

| Method | Route                            | Description                                |
| ------ | -------------------------------- | ------------------------------------------ |
| GET    | `/api/products`                  | Get all products                           |
| GET    | `/api/products/:id`              | Get single product                         |
| GET    | `/api/products/search?q=`        | Search products using smart symptom search |
| GET    | `/api/products/recommendations`  | Get recommended products                   |
| POST   | `/api/products/admin`            | Create product                             |
| PUT    | `/api/products/admin/:id`        | Update product                             |
| DELETE | `/api/products/admin/:id`        | Delete product                             |
| PUT    | `/api/products/admin/:id/stock`  | Update product stock                       |
| PUT    | `/api/products/admin/:id/verify` | Verify or unverify product                 |

### Category Routes

| Method | Route                       | Description        |
| ------ | --------------------------- | ------------------ |
| GET    | `/api/categories`           | Get all categories |
| POST   | `/api/categories/admin`     | Create category    |
| PUT    | `/api/categories/admin/:id` | Update category    |
| DELETE | `/api/categories/admin/:id` | Delete category    |

### Order Routes

| Method | Route                          | Description         |
| ------ | ------------------------------ | ------------------- |
| POST   | `/api/orders`                  | Place order         |
| GET    | `/api/orders/my-orders`        | Get customer orders |
| GET    | `/api/orders/:id`              | Get single order    |
| GET    | `/api/orders/admin`            | Get all orders      |
| PUT    | `/api/orders/admin/:id/status` | Update order status |

### Review Routes

| Method | Route                     | Description         |
| ------ | ------------------------- | ------------------- |
| POST   | `/api/reviews/:productId` | Add product review  |
| GET    | `/api/reviews/:productId` | Get product reviews |

### Admin Routes

| Method | Route                  | Description              |
| ------ | ---------------------- | ------------------------ |
| GET    | `/api/admin/stats`     | Get dashboard statistics |
| GET    | `/api/admin/low-stock` | Get low-stock products   |
| GET    | `/api/admin/users`     | Get all users            |
| PUT    | `/api/admin/users/:id` | Update user              |
| DELETE | `/api/admin/users/:id` | Delete user              |

---

## 🔒 Security Features

* Password hashing using bcrypt
* JWT authentication
* httpOnly cookie support
* Bearer token fallback
* Role-based authorization
* Protected admin routes
* Protected pharmacist/manager routes
* Input validation using express-validator
* Centralized error handling middleware
* Environment-based configuration
* No hardcoded secret keys
* File upload validation for product images
* Prescription acknowledgement validation on frontend and backend

---

## 🌐 Deployment Plan

This project is currently configured for local development.

Recommended deployment platforms:

### Frontend

* Vercel
* Netlify

### Backend

* Render
* Railway
* Cyclic

### Database

* MongoDB Atlas

### Image Upload

* Cloudinary

---

## 🧪 Testing Checklist

Before final deployment, test these flows:

* Register new customer
* Login as customer
* Browse products
* Search product by symptom
* Add product to cart
* Place normal order
* Try placing prescription product order without acknowledgement
* Place prescription product order with acknowledgement
* Login as admin
* Add new product
* Edit product
* Delete product
* Add category
* Update order status
* Update stock
* Verify product
* Login as pharmacist
* Update inventory
* Check low-stock products

---

## 🛠️ Troubleshooting

### Server npm install issue

If backend dependency installation fails, delete `node_modules` and `package-lock.json`, then run:

```bash
npm install
```

This project uses Multer memory storage with Cloudinary upload stream. It does not require `multer-storage-cloudinary`.

---

### MongoDB connection issue

For local MongoDB, use:

```env
MONGO_URI=mongodb://127.0.0.1:27017/medimart-ai
```

Make sure MongoDB service is running on your computer.

For MongoDB Atlas, use a connection string like:

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/medimart-ai
```

Also make sure your IP address is allowed in MongoDB Atlas Network Access.

---

### Cloudinary upload issue

Check these values in `server/.env`:

```env
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

If Cloudinary is not configured, image URL fallback can still be used.

---

### CORS issue

Make sure this value in `server/.env` matches your frontend URL:

```env
CLIENT_URL=http://localhost:5173
```

---

### Frontend API issue

Make sure `client/.env` contains:

```env
VITE_API_URL=http://localhost:5000/api
```

Then restart the frontend server.

---

## 📌 Project Status

MediMart AI is completed as a portfolio-ready full-stack MERN project. Future improvements may include:

* Online payment integration
* Real prescription image upload and verification
* Advanced AI product recommendation
* Email notifications
* Order invoice PDF generation
* Live deployment
* Unit and integration testing

---

## 👩‍💻 Author

**Shadia Noor Mou**

* GitHub: [shadianoormou](https://github.com/shadianoormou)
* Project Repository: [MediMart AI](https://github.com/shadianoormou/medimart-ai)

---


```powershell
git add README.md
git commit -m "Update professional README"
git push
````
