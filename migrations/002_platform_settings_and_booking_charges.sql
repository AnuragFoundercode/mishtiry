-- ============================================
-- Migration: 002_platform_settings_and_booking_charges.sql
-- ============================================
USE mistry_db;

-- Platform Settings (single-row config, admin controls)
CREATE TABLE IF NOT EXISTS platform_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,

  -- Revenue model admin can toggle
  revenue_model ENUM('subscription', 'commission', 'hybrid') DEFAULT 'hybrid',

  -- % of service price charged as commission from vendor
  commission_percent DECIMAL(5, 2) DEFAULT 10.00,

  -- % of service price charged as platform convenience fee from user
  platform_charge_percent DECIMAL(5, 2) DEFAULT 5.00,

  -- GST % applied on platform_charge only (not on full service price)
  gst_percent DECIMAL(5, 2) DEFAULT 18.00,

  -- In hybrid model: subscribed vendors get this % discount on commission
  -- e.g. commission=10%, discount=5% → subscribed vendor pays only 5%
  subscription_commission_discount DECIMAL(5, 2) DEFAULT 5.00,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Seed default settings
INSERT IGNORE INTO platform_settings
  (id, revenue_model, commission_percent, platform_charge_percent, gst_percent, subscription_commission_discount)
VALUES
  (1, 'hybrid', 10.00, 5.00, 18.00, 5.00);

-- ============================================
-- Add new charge columns to bookings table
-- ============================================
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS platform_charge DECIMAL(10, 2) DEFAULT 0.00 AFTER amount,
  ADD COLUMN IF NOT EXISTS gst_amount DECIMAL(10, 2) DEFAULT 0.00 AFTER platform_charge,
  ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10, 2) DEFAULT 0.00 AFTER gst_amount,
  ADD COLUMN IF NOT EXISTS vendor_payout DECIMAL(10, 2) DEFAULT 0.00 AFTER commission_amount,
  ADD COLUMN IF NOT EXISTS revenue_model_applied VARCHAR(20) AFTER vendor_payout,
  ADD COLUMN IF NOT EXISTS commission_percent_applied DECIMAL(5, 2) DEFAULT 0.00 AFTER revenue_model_applied;
