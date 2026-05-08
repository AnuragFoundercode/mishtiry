-- ============================================
-- Mistry - Service Booking Platform
-- FINAL MIGRATION (run once on fresh DB)
-- ============================================

CREATE DATABASE IF NOT EXISTS mistry_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mistry_db;

-- Users
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100),
  email         VARCHAR(150) UNIQUE,
  mobile        VARCHAR(15) NOT NULL UNIQUE,
  profile_image       VARCHAR(255),
  fcm_token           VARCHAR(255),
  password            VARCHAR(255) DEFAULT NULL,
  reset_token         VARCHAR(255) DEFAULT NULL,
  reset_token_expires DATETIME DEFAULT NULL,
  role                ENUM('user','vendor','admin') DEFAULT 'user',
  is_active           TINYINT(1) DEFAULT 1,
  is_blocked          TINYINT(1) DEFAULT 0,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- OTPs
CREATE TABLE IF NOT EXISTS otps (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  mobile     VARCHAR(15) NOT NULL,
  otp        VARCHAR(10) NOT NULL,
  expires_at DATETIME NOT NULL,
  is_used    TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_mobile (mobile)
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  parent_id  INT DEFAULT NULL,
  image      VARCHAR(255),
  is_active  TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Vendors
CREATE TABLE IF NOT EXISTS vendors (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  user_id               INT NOT NULL,
  business_name         VARCHAR(200),
  description           TEXT,
  logo                  VARCHAR(255),
  banner                VARCHAR(255),
  address               TEXT,
  latitude              DECIMAL(10,8),
  longitude             DECIMAL(11,8),
  working_hours         JSON,
  is_approved           TINYINT(1) DEFAULT 0,
  is_suspended          TINYINT(1) DEFAULT 0,
  is_featured           TINYINT(1) DEFAULT 0,
  kyc_status            ENUM('pending','under_review','approved','rejected') DEFAULT 'pending',
  kyc_rejection_reason  TEXT,
  avg_rating            DECIMAL(3,2) DEFAULT 0.00,
  total_reviews         INT DEFAULT 0,
  revenue_model         ENUM('subscription','commission','hybrid') DEFAULT NULL,
  commission_percent    DECIMAL(5,2) DEFAULT NULL,
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Vendor KYC Documents
CREATE TABLE IF NOT EXISTS vendor_kyc (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  vendor_id       INT NOT NULL UNIQUE,
  aadhaar_number  VARCHAR(12),
  aadhaar_front   VARCHAR(255),
  aadhaar_back    VARCHAR(255),
  pan_number      VARCHAR(10),
  pan_document    VARCHAR(255),
  gst_number      VARCHAR(15),
  gst_document    VARCHAR(255),
  selfie          VARCHAR(255),
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
);

-- Vendor Bank Details
CREATE TABLE IF NOT EXISTS vendor_bank_details (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  vendor_id            INT NOT NULL UNIQUE,
  account_holder_name  VARCHAR(200) NOT NULL,
  account_number       VARCHAR(20) NOT NULL,
  ifsc_code            VARCHAR(11) NOT NULL,
  bank_name            VARCHAR(100),
  branch_name          VARCHAR(100),
  upi_id               VARCHAR(100),
  passbook_image       VARCHAR(255),
  created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
);

-- Services
CREATE TABLE IF NOT EXISTS services (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  vendor_id      INT NOT NULL,
  category_id    INT NOT NULL,
  name           VARCHAR(200) NOT NULL,
  description    TEXT,
  price          DECIMAL(10,2) NOT NULL,
  estimated_time VARCHAR(50),
  images         JSON,
  is_active      TINYINT(1) DEFAULT 1,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
);

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id                         INT AUTO_INCREMENT PRIMARY KEY,
  user_id                    INT NOT NULL,
  vendor_id                  INT NOT NULL,
  service_id                 INT NOT NULL,
  booking_date               DATETIME NOT NULL,
  notes                      TEXT,
  address                    TEXT,
  status                     ENUM('pending','accepted','in_progress','completed','cancelled') DEFAULT 'pending',
  amount                     DECIMAL(10,2),
  platform_charge            DECIMAL(10,2) DEFAULT 0.00,
  gst_amount                 DECIMAL(10,2) DEFAULT 0.00,
  total_amount               DECIMAL(10,2) DEFAULT 0.00,
  commission_amount          DECIMAL(10,2) DEFAULT 0.00,
  commission_percent_applied DECIMAL(5,2) DEFAULT 0.00,
  vendor_payout              DECIMAL(10,2) DEFAULT 0.00,
  revenue_model_applied      VARCHAR(20),
  payment_status             ENUM('pending','paid','refunded') DEFAULT 'pending',
  payment_id                 VARCHAR(255),
  created_at                 TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at                 TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  vendor_id   INT NOT NULL,
  booking_id  INT NOT NULL UNIQUE,
  rating      TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review      TEXT,
  is_approved TINYINT(1) DEFAULT 1,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

-- Subscription Plans
CREATE TABLE IF NOT EXISTS subscription_plans (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  name            ENUM('basic','pro','advanced') NOT NULL,
  price_monthly   DECIMAL(10,2),
  price_yearly    DECIMAL(10,2),
  service_limit   INT DEFAULT 5,
  gallery_limit   INT DEFAULT 10,
  featured_listing TINYINT(1) DEFAULT 0,
  chat_support    ENUM('basic','priority','premium') DEFAULT 'basic',
  is_active       TINYINT(1) DEFAULT 1,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Vendor Subscriptions
CREATE TABLE IF NOT EXISTS vendor_subscriptions (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  vendor_id     INT NOT NULL,
  plan_id       INT NOT NULL,
  billing_cycle ENUM('monthly','yearly') DEFAULT 'monthly',
  starts_at     DATETIME,
  expires_at    DATETIME,
  payment_id    VARCHAR(255),
  status        ENUM('active','expired','cancelled') DEFAULT 'active',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE RESTRICT
);

-- Platform Settings (single row, admin controls)
CREATE TABLE IF NOT EXISTS platform_settings (
  id                         INT AUTO_INCREMENT PRIMARY KEY,
  platform_charge_percent    DECIMAL(5,2) DEFAULT 5.00,
  gst_percent                DECIMAL(5,2) DEFAULT 18.00,
  default_commission_percent DECIMAL(5,2) DEFAULT 10.00,
  default_revenue_model      ENUM('subscription','commission','hybrid') DEFAULT 'commission',
  created_at                 TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at                 TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  title      VARCHAR(200),
  body       TEXT,
  type       ENUM('booking','payment','promotional','system') DEFAULT 'system',
  is_read    TINYINT(1) DEFAULT 0,
  data       JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_read (user_id, is_read)
);

-- Messages (Chat)
CREATE TABLE IF NOT EXISTS messages (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  booking_id  INT NOT NULL,
  sender_id   INT NOT NULL,
  receiver_id INT NOT NULL,
  message     TEXT NOT NULL,
  is_read     TINYINT(1) DEFAULT 0,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_booking (booking_id)
);

-- ============================================
-- Seeds
-- ============================================

INSERT IGNORE INTO platform_settings (id, platform_charge_percent, gst_percent, default_commission_percent, default_revenue_model)
VALUES (1, 5.00, 18.00, 10.00, 'commission');

INSERT IGNORE INTO subscription_plans (name, price_monthly, price_yearly, service_limit, gallery_limit, featured_listing, chat_support) VALUES
('basic',    299.00,   2999.00,  5,           10,          0, 'basic'),
('pro',      699.00,   6999.00,  20,          50,          1, 'priority'),
('advanced', 1299.00, 12999.00,  2147483647,  2147483647,  1, 'premium');

INSERT IGNORE INTO users (name, email, mobile, role, password) VALUES ('Admin', 'admin@mistry.com', '9999999999', 'admin', '$2b$10$33MJSUpyt1JPOcF2NYmGreLp9a1SgJuaOimOI2zb53eEu2l9BOAyW');
