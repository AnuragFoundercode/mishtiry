# Mistry — Multi-Vendor Home Services Platform

A full-stack Node.js platform connecting customers with local service vendors (plumbers, electricians, cleaners, etc.) with a complete admin panel, REST APIs, real-time chat, and OTP-based authentication.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js v24+ |
| Framework | Express.js v5 |
| Database | MySQL / MariaDB |
| ORM | Sequelize v6 |
| Auth | JWT + OTP (IndoPay SMS) |
| Real-time | Socket.IO |
| Templating | EJS (Admin Panel) |
| File Upload | Multer |
| Notifications | Firebase Admin SDK |
| Payments | Razorpay |
| Email | Nodemailer (SMTP) |

---

## Project Structure

```
mishtiry/
├── migrations/
│   ├── 001_create_all_tables.sql                    # All core tables
│   ├── 002_platform_settings_and_booking_charges.sql
│   ├── 003_per_vendor_pricing.sql
│   └── 004_create_sliders.sql                       # Sliders table
│
├── src/
│   ├── config/
│   │   └── database.js                # Sequelize DB connection
│   │
│   ├── controllers/
│   │   ├── admin/
│   │   │   ├── admin.controller.js    # Admin REST API controllers
│   │   │   ├── web.controller.js      # Admin panel web controllers (EJS)
│   │   │   ├── web.controller.zones.js
│   │   │   └── slider.controller.js   # Slider CRUD + API
│   │   ├── user/
│   │   │   ├── auth.controller.js     # User/Vendor OTP auth
│   │   │   ├── booking.controller.js  # User booking APIs
│   │   │   └── user.controller.js     # Profile, categories, services
│   │   └── vendor/
│   │       ├── onboarding.controller.js  # Vendor profile/KYC/bank
│   │       ├── service.controller.js     # Vendor service CRUD
│   │       └── booking.controller.js     # Vendor booking management
│   │
│   ├── helpers/
│   │   ├── otp.helper.js              # IndoPay OTP integration
│   │   ├── notification.helper.js     # Firebase push + email
│   │   ├── pricing.helper.js          # Commission/GST calculations
│   │   ├── response.helper.js         # Standardized API responses { status, data, message }
│   │   ├── view.helper.js             # EJS template helpers (formatDate etc.)
│   │   └── zone.helper.js             # Zone/location utilities
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.js         # JWT authenticate + role authorize
│   │   └── upload.middleware.js       # Multer file upload config
│   │
│   ├── models/
│   │   ├── index.js                   # All model associations
│   │   ├── user.model.js              # Users (customer / vendor / admin)
│   │   ├── vendor.model.js            # Vendor business profiles
│   │   ├── vendor_kyc.model.js        # KYC documents
│   │   ├── vendor_bank_detail.model.js
│   │   ├── service.model.js           # Services offered by vendors
│   │   ├── category.model.js          # Hierarchical categories
│   │   ├── booking.model.js           # Bookings with full pricing breakdown
│   │   ├── review.model.js            # Customer reviews & ratings
│   │   ├── notification.model.js      # In-app notifications
│   │   ├── message.model.js           # Real-time chat messages
│   │   ├── otp.model.js               # OTP records with expiry
│   │   ├── platform_setting.model.js  # Global platform config
│   │   ├── policy.model.js            # Terms / Privacy / Refund pages
│   │   ├── subscription.model.js      # Plans + vendor subscriptions
│   │   ├── zone.model.js              # Circle-based service zones
│   │   └── slider.model.js            # App banners/sliders
│   │
│   ├── routes/
│   │   ├── admin/
│   │   │   ├── index.js               # Admin REST API routes
│   │   │   └── web.js                 # Admin panel web routes
│   │   ├── user/
│   │   │   └── index.js               # User API routes
│   │   └── vendor/
│   │       └── index.js               # Vendor API routes
│   │
│   ├── sockets/
│   │   └── socket.handler.js          # Socket.IO real-time chat
│   │
│   ├── views/admin/                   # EJS templates
│   │   ├── partials/
│   │   │   ├── header.ejs             # Sidebar + topbar layout
│   │   │   └── footer.ejs
│   │   ├── auth/login.ejs, forgot.ejs, reset.ejs
│   │   ├── dashboard.ejs
│   │   ├── users.ejs / user-detail.ejs
│   │   ├── vendors.ejs / vendor-detail.ejs
│   │   ├── categories.ejs
│   │   ├── services.ejs               # With vendor filter
│   │   ├── service-detail.ejs         # Booking history per service
│   │   ├── bookings.ejs / booking-detail.ejs
│   │   ├── sliders.ejs
│   │   ├── subscriptions.ejs
│   │   ├── revenue.ejs                # With date range filter
│   │   ├── settings.ejs
│   │   ├── notifications.ejs
│   │   ├── policies.ejs
│   │   └── zones.ejs
│   │
│   └── app.js                         # Express app setup
│
├── server.js                          # Entry point (HTTP + Socket.IO)
├── package.json
├── .env.example
└── complete_dummy_data.sql            # Test data for all tables
```

---

## Setup & Installation

### 1. Clone & Install
```bash
git clone <repo-url>
cd mishtiry
npm install
```

### 2. Environment Variables
```bash
cp .env.example .env
```

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_NAME=mistry_db
DB_USER=root
DB_PASSWORD=your_password

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

INDOPAY_MERCHANT_KEY=your_merchant_key
INDOPAY_BASE_URL=https://indopay.cloud/otp

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=

OTP_EXPIRES_IN=300
OTP_LENGTH=6

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

DEFAULT_COMMISSION_PERCENT=10
REVENUE_MODEL=hybrid
```

### 3. Database Setup
```bash
mysql -u root -p -e "CREATE DATABASE mistry_db;"
mysql -u root -p mistry_db < migrations/001_create_all_tables.sql
mysql -u root -p mistry_db < migrations/002_platform_settings_and_booking_charges.sql
mysql -u root -p mistry_db < migrations/003_per_vendor_pricing.sql
mysql -u root -p mistry_db < migrations/004_create_sliders.sql

# Optional: load test data
mysql -u root -p mistry_db < complete_dummy_data.sql
```

### 4. Start Server
```bash
npm run dev    # development (nodemon)
npm start      # production
```

---

## API Reference

### Base URLs
| App | Base URL |
|---|---|
| User API | `/api/user/...` |
| Vendor API | `/api/vendor/...` |
| Admin API | `/api/admin/...` |
| Admin Panel | `/admin/...` |

All protected routes require header:
```
Authorization: Bearer <jwt_token>
```

---

### User APIs

#### Auth
```
POST /api/user/auth/send-otp        Body: { mobile }
POST /api/user/auth/verify-otp      Body: { mobile, otp }
```

#### Profile
```
GET  /api/user/profile
PUT  /api/user/profile              Body (multipart): name, email, fcm_token, profile_image
```

#### Categories
```
GET /api/user/categories                     # All categories with subcategories
GET /api/user/categories/:id/services        # Services by category
    Query: ?page=1&limit=20
```

#### Sliders
```
GET /api/user/sliders               # Active sliders for user app
```

#### Bookings
```
GET  /api/user/bookings/charges-preview
POST /api/user/bookings
GET  /api/user/bookings
```

---

### Vendor APIs

#### Auth & Onboarding
```
POST /api/vendor/auth/send-otp
POST /api/vendor/auth/verify-otp

GET  /api/vendor/onboarding/status
GET  /api/vendor/onboarding/profile
POST /api/vendor/onboarding/profile     # logo, banner (multipart)
GET  /api/vendor/onboarding/kyc
POST /api/vendor/onboarding/kyc         # aadhaar_front, aadhaar_back, pan_document, selfie
GET  /api/vendor/onboarding/bank
POST /api/vendor/onboarding/bank        # passbook_image
```

#### Services (Approved vendors only)
```
GET    /api/vendor/services
GET    /api/vendor/services/:id
POST   /api/vendor/services             # images[] (multipart)
PUT    /api/vendor/services/:id
DELETE /api/vendor/services/:id
```

#### Bookings
```
GET   /api/vendor/bookings
PATCH /api/vendor/bookings/:id/status   Body: { status }
```

#### Sliders
```
GET /api/vendor/sliders                 # Active sliders for vendor app
```

---

### Admin Panel (Web)

| Route | Description |
|---|---|
| `GET /admin/login` | Login (auto-redirects if already logged in) |
| `GET /admin/dashboard` | Stats, charts, recent activity |
| `GET /admin/users` | User list with search |
| `GET /admin/users/:id` | User detail + bookings + reviews |
| `GET /admin/vendors` | Vendor list with status filter |
| `GET /admin/vendors/:id` | Vendor detail + KYC + subscription |
| `GET /admin/categories` | Category management |
| `GET /admin/services` | Services list with vendor filter + search |
| `GET /admin/services/:id` | Service detail + booking history + stats |
| `GET /admin/bookings` | All bookings with status filter |
| `GET /admin/bookings/:id` | Booking detail + chat messages |
| `GET /admin/sliders` | Slider management (add/edit/delete) |
| `GET /admin/subscriptions` | Subscription plan management |
| `GET /admin/revenue` | Revenue with date range filter |
| `GET /admin/settings` | Platform settings (GST, commission) |
| `GET /admin/notifications` | Send broadcast notifications |
| `GET /admin/policies` | Terms/Privacy/Refund policies |
| `GET /admin/zones` | Service zone management |

---

## Database Schema

| Table | Description |
|---|---|
| `users` | All users — role: `user`, `vendor`, `admin` |
| `vendors` | Vendor business profiles |
| `vendor_kyc` | Aadhaar, PAN, GST documents |
| `vendor_bank_details` | Bank account + UPI for payouts |
| `categories` | Hierarchical (parent → subcategory) |
| `services` | Services offered by vendors |
| `bookings` | Full pricing breakdown per booking |
| `reviews` | Customer ratings and reviews |
| `messages` | Real-time chat per booking |
| `notifications` | In-app push notifications |
| `otps` | OTP records with expiry |
| `subscription_plans` | Basic / Pro / Advanced |
| `vendor_subscriptions` | Active vendor subscriptions |
| `platform_settings` | GST %, commission %, revenue model |
| `zones` | Circle-based service zones |
| `sliders` | App banners — type: `user`, `vendor`, `both` |
| `policies` | CMS for Terms, Privacy, Refund |

---

## Pricing Model

```
amount            = Service base price
platform_charge   = amount × platform_charge_percent
gst_amount        = (amount + platform_charge) × gst_percent
total_amount      = amount + platform_charge + gst_amount
commission_amount = amount × commission_percent
vendor_payout     = amount - commission_amount
```

Revenue models:
- `commission` — Platform takes % per booking
- `subscription` — Vendor pays monthly/yearly plan
- `hybrid` — Both commission + subscription

---

## Slider Types

| Type | Visible To |
|---|---|
| `user` | Customer app only |
| `vendor` | Vendor app only |
| `both` | Both apps |

---

## Test Credentials

```
Admin Panel:
  URL:      /admin/login
  Email:    admin@mistry.com
  Password: admin123

Customer OTP Login:
  Mobiles: 9876543210 — 9876543214

Vendor OTP Login:
  Mobiles: 9876543220 — 9876543227
```

---

## Real-time (Socket.IO)

- Live chat between user and vendor per booking
- Booking status updates pushed instantly
- Vendor receives new booking notifications in real-time

---

## File Uploads

Files stored in `src/uploads/`, served at `/uploads/<filename>`.

| Field | Used For |
|---|---|
| `profile_image` | User profile photo |
| `logo`, `banner` | Vendor branding |
| `aadhaar_front`, `aadhaar_back` | KYC verification |
| `pan_document`, `gst_document`, `selfie` | KYC documents |
| `passbook_image` | Bank verification |
| `images[]` | Service images (max 10) |
| `image` | Category icon / Slider banner |
