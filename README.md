# MERN SaaS Project

## Folder Structure

```
mern-saas/
  server/
    config/
      db.js
    controllers/
      adminController.js
      authController.js
      paymentController.js
    middleware/
      authMiddleware.js
    models/
      Payment.js
      User.js
    routes/
      adminRoutes.js
      authRoutes.js
      paymentRoutes.js
    utils/
      email.js
      generateToken.js
      razorpay.js
    .env.example
    package.json
    server.js
  client/
    src/
      api/
        axios.js
      components/
        AdminProtectedRoute.jsx
        Navbar.jsx
        ProtectedRoute.jsx
      context/
        AuthContext.jsx
      pages/
        AdminDashboard.jsx
        AdminLogin.jsx
        Dashboard.jsx
        Home.jsx
        Login.jsx
        Payment.jsx
        Register.jsx
      App.jsx
      index.css
      main.jsx
    .env.example
    index.html
    package.json
    postcss.config.js
    tailwind.config.js
    vite.config.js
```

## Setup Instructions

### 1) Backend Setup

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

Update `server/.env`:

```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/mern_saas
JWT_SECRET=change_this_jwt_secret
CLIENT_URL=http://localhost:5173

ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Admin@12345

RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxx
RAZORPAY_AMOUNT=49900
RAZORPAY_CURRENCY=INR

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_smtp_password
SMTP_FROM=your_email@gmail.com
```

### 2) Frontend Setup

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

Update `client/.env`:

```
VITE_API_URL=http://localhost:5000/api
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
```

### 3) Run Flow

1. Register user (`/register`)
2. Complete payment (`/payment`)
3. Admin login (`/admin/login`) and approve user in admin dashboard
4. Approved user login (`/login`)
5. Access user dashboard (`/dashboard`)

