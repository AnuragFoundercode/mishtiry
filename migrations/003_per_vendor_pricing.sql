-- ============================================
-- Migration: 003_per_vendor_pricing.sql
-- ============================================
USE mistry_db;

-- Update platform_settings: remove global revenue_model/commission, add defaults + gst
ALTER TABLE platform_settings
  DROP COLUMN IF EXISTS revenue_model,
  DROP COLUMN IF EXISTS commission_percent,
  DROP COLUMN IF EXISTS subscription_commission_discount,
  ADD COLUMN IF NOT EXISTS default_commission_percent DECIMAL(5,2) DEFAULT 10.00
    COMMENT 'Used for new vendors until admin sets per-vendor commission',
  ADD COLUMN IF NOT EXISTS default_revenue_model ENUM('subscription','commission','hybrid') DEFAULT 'commission'
    COMMENT 'Used for new vendors until admin sets per-vendor model';

-- Update seed row
UPDATE platform_settings SET
  platform_charge_percent = 5.00,
  gst_percent = 18.00,
  default_commission_percent = 10.00,
  default_revenue_model = 'commission'
WHERE id = 1;

-- Add per-vendor pricing columns to vendors table
ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS revenue_model ENUM('subscription','commission','hybrid') DEFAULT NULL
    COMMENT 'NULL = use platform default_revenue_model',
  ADD COLUMN IF NOT EXISTS commission_percent DECIMAL(5,2) DEFAULT NULL
    COMMENT 'NULL = use platform default_commission_percent';
