# Mistry — Single Vendor Home Services Platform

A full-stack Node.js platform where a single vendor (business owner) manages all home services (plumbing, electrical, cleaning, etc.) with a complete admin panel, REST APIs, real-time chat, worker management, and OTP-based authentication.

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
│   ├── 001_create_all_tables.sql
│   ├── 002_platform_settings_and_booking_charges.sql
│   ├── 003_per_vendor_pricing.sql
│   ├── 004_create_sliders.sql
│   ├── 005_workers_and_booking_updates.sql
│   └── 006_single_vendor_conversion.sql     # Removes vendor_id from services/bookings
│
├── src/
│   ├── config/
│   │   └── database.js
│   │
│   ├── controllers/
│   │   ├── admin/
│   │   │   ├── web.controller.js      # Admin panel (EJS) — users, bookings, workers, etc.
│   │   │   └── slider.controller.js
│   │   ├── user/
│   │   │   ├── auth.controller.js     # User OTP auth
│   │   │   ├── booking.controller.js  # User booking APIs
│   │   │   └── user.controller.js     # Profile, categories, services
│   │   ├── vendor/
│   │   │   └── vendor.controller.js   # Vendor manages categories, services, bookings, workers
│   │   └── worker/
│   │       ├── auth.controller.js     # Worker OTP login
│   │       └── booking.controller.js  # Worker booking actions
│   │
│   ├── helpers/
│   │   ├── otp.helper.js
│   │   ├── notification.helper.js
│   │   ├── pricing.helper.js
│   │   ├── response.helper.js
│   │   ├── view.helper.js
│   │   └── zone.helper.js
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.js         # JWT authenticate + role authorize
│   │   ├── upload.middleware.js
│   │   └── worker.middleware.js
│   │
│   ├── models/
│   │   ├── index.js
│   │   ├── user.model.js              # role: user | vendor | admin
│   │   ├── service.model.js           # No vendor_id (single vendor)
│   │   ├── category.model.js
│   │   ├── booking.model.js
│   │   ├── worker.model.js
│   │   ├── review.model.js
│   │   ├── notification.model.js
│   │   ├── message.model.js
│   │   ├── otp.model.js
│   │   ├── platform_setting.model.js
│   │   ├── policy.model.js
│   │   ├── zone.model.js
│   │   └── slider.model.js
│   │
│   ├── routes/
│   │   ├── admin/
│   │   │   ├── index.js               # Admin REST API routes
│   │   │   └── web.js                 # Admin panel web routes
│   │   ├── user/
│   │   │   └── index.js
│   │   ├── vendor/
│   │   │   └── index.js               # Vendor manages everything
│   │   └── worker/
│   │       └── index.js
│   │
│   ├── sockets/
│   │   └── socket.handler.js
│   │
│   ├── views/admin/
│   │   ├── partials/header.ejs, footer.ejs
│   │   ├── auth/login.ejs, forgot.ejs, reset.ejs
│   │   ├── dashboard.ejs
│   │   ├── users.ejs / user-detail.ejs
│   │   ├── categories.ejs
│   │   ├── services.ejs / service-detail.ejs
│   │   ├── bookings.ejs / booking-detail.ejs
│   │   ├── workers.ejs / worker-detail.ejs
│   │   ├── revenue.ejs
│   │   ├── settings.ejs
│   │   ├── notifications.ejs
│   │   ├── policies.ejs
│   │   ├── zones.ejs
│   │   └── sliders.ejs
│   │
│   └── app.js
│
├── server.js
├── package.json
├── .env.example
└── mishtiry.sql
```

---

## Setup & Installation

### 1. Install Dependencies
```bash
cd mishtiry
npm install
```

### 2. Environment Variables
```bash
cp .env.example .env
```

```env
PORT=3300
NODE_ENV=production

DB_HOST=localhost
DB_PORT=3306
DB_NAME=mistry_db
DB_USER=root
DB_PASSWORD=your_password

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

SESSION_SECRET=your_session_secret

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

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

APP_URL=https://yourdomain.com
```

### 3. Database Setup
```bash
mysql -u root -p -e "CREATE DATABASE mistry_db;"
mysql -u root -p mistry_db < migrations/001_create_all_tables.sql
mysql -u root -p mistry_db < migrations/002_platform_settings_and_booking_charges.sql
mysql -u root -p mistry_db < migrations/003_per_vendor_pricing.sql
mysql -u root -p mistry_db < migrations/004_create_sliders.sql
mysql -u root -p mistry_db < migrations/005_workers_and_booking_updates.sql
mysql -u root -p mistry_db < migrations/006_single_vendor_conversion.sql
```

### 4. Start Server
```bash
npm run dev    # development (nodemon)
npm start      # production

# With PM2
pm2 start server.js --name mistry
pm2 save
pm2 startup
```

---

## Roles

| Role | Description |
|---|---|
| `admin` | Web panel access — users, bookings, workers, settings |
| `vendor` | Mobile/API access — manages categories, services, bookings, workers |
| `user` | Customer — browses services, creates bookings |
| `worker` | Field worker — views assigned bookings, updates status |

> **Note:** In single-vendor mode, the vendor IS the business owner. The vendor manages everything via API (mobile app). The admin panel is a separate web dashboard for the same owner.

---

## API Reference

### Base URLs
| App | Base URL |
|---|---|
| User API | `/api/user/...` |
| Vendor API | `/api/vendor/...` |
| Worker API | `/api/worker/...` |
| Admin API | `/api/admin/...` |
| Admin Panel | `/admin/...` |

All protected routes require:
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

#### Categories & Services
```
GET /api/user/categories
GET /api/user/categories/:id/services    Query: ?page=1&limit=20
```

#### Sliders
```
GET /api/user/sliders
```

#### Bookings
```
GET  /api/user/bookings/charges-preview  Query: ?service_id=1
POST /api/user/bookings                  Body: { service_id, booking_date, address, latitude, longitude, payment_method }
GET  /api/user/bookings
```

---

### Vendor APIs

#### Auth
```
POST /api/vendor/auth/send-otp      Body: { mobile }
POST /api/vendor/auth/verify-otp    Body: { mobile, otp }
```

#### Categories
```
GET    /api/vendor/categories
POST   /api/vendor/categories        Body (multipart): name, parent_id, is_active, image
PUT    /api/vendor/categories/:id
DELETE /api/vendor/categories/:id
```

#### Services
```
GET    /api/vendor/services
POST   /api/vendor/services          Body (multipart): category_id, name, description, price, estimated_time, images[]
PUT    /api/vendor/services/:id
DELETE /api/vendor/services/:id
```

#### Bookings
```
GET   /api/vendor/bookings                        Query: ?status=pending
PATCH /api/vendor/bookings/:id/status             Body: { status }
PATCH /api/vendor/bookings/:id/assign-worker      Body: { worker_id }
```

#### Workers
```
GET    /api/vendor/workers
POST   /api/vendor/workers           Body (multipart): name, phone, email, aadhaar_number, aadhaar_front, aadhaar_back
PUT    /api/vendor/workers/:id
DELETE /api/vendor/workers/:id
```

#### Sliders
```
GET /api/vendor/sliders
```

---

### Worker APIs

#### Auth
```
POST /api/worker/auth/send-otp      Body: { phone }
POST /api/worker/auth/verify-otp    Body: { phone, otp }
```

#### Profile
```
GET   /api/worker/profile
PATCH /api/worker/fcm-token         Body: { fcm_token }
```

#### Bookings
```
GET   /api/worker/bookings                      Query: ?status=accepted
GET   /api/worker/bookings/:id
PATCH /api/worker/bookings/:id/status           Body: { status: accepted|in_progress|completed }
POST  /api/worker/bookings/:id/collect-cod      Body: { amount_collected }
```

---

### Admin Panel (Web)

| Route | Description |
|---|---|
| `GET /admin/login` | Login page |
| `GET /admin/dashboard` | Stats, charts, recent bookings & workers |
| `GET /admin/users` | User list with search |
| `GET /admin/users/:id` | User detail + booking history |
| `GET /admin/categories` | Category management |
| `GET /admin/services` | Services list with search |
| `GET /admin/services/:id` | Service detail + booking history |
| `GET /admin/bookings` | All bookings with status filter |
| `GET /admin/bookings/:id` | Booking detail + assign worker + chat |
| `GET /admin/workers` | Worker list |
| `GET /admin/workers/:id` | Worker detail + assigned bookings |
| `GET /admin/revenue` | Revenue with date range filter |
| `GET /admin/settings` | Platform settings (GST, charges) |
| `GET /admin/notifications` | Send broadcast notifications |
| `GET /admin/policies` | Terms / Privacy / Refund policies |
| `GET /admin/zones` | Service zone management |
| `GET /admin/sliders` | App banner management |

---

## Booking Flow

```
User creates booking (pending)
        ↓
Vendor sees booking → assigns worker → status: accepted
        ↓
Worker accepts → status: in_progress
        ↓
Worker completes → status: completed
        ↓
COD: Worker collects cash → POST collect-cod
Online: Payment via Razorpay
```

---

## Pricing Calculation

```
amount          = Service base price
platform_charge = amount × platform_charge_percent
gst_amount      = (amount + platform_charge) × gst_percent
total_amount    = amount + platform_charge + gst_amount
```

---

## Database Schema

| Table | Description |
|---|---|
| `users` | All users — role: `user`, `vendor`, `admin` |
| `categories` | Hierarchical (parent → subcategory) |
| `services` | Services (no vendor_id — single vendor) |
| `bookings` | Full pricing breakdown per booking |
| `workers` | Field workers created by vendor |
| `reviews` | Customer ratings and reviews |
| `messages` | Real-time chat per booking |
| `notifications` | In-app push notifications |
| `otps` | OTP records with expiry |
| `platform_settings` | GST %, platform charge % |
| `zones` | Polygon-based service zones |
| `sliders` | App banners — type: `user`, `vendor`, `both` |
| `policies` | Terms, Privacy, Refund pages |

---

## File Uploads

Files stored in `src/uploads/`, served at `/uploads/<filename>`.

| Field | Used For |
|---|---|
| `profile_image` | User profile photo |
| `images[]` | Service images (max 10) |
| `image` | Category icon / Slider banner |
| `aadhaar_front`, `aadhaar_back` | Worker KYC |

---

## Real-time (Socket.IO)

- Live chat between user and vendor per booking
- Booking status updates pushed instantly to user

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
  Mobile: 9876543220
```
