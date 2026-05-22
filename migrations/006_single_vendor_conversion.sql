-- Migration: Convert multi-vendor to single-vendor
-- Remove vendor_id from services (single vendor owns all services)
-- Remove vendor_id from bookings (no vendor assignment needed)

ALTER TABLE `services` DROP FOREIGN KEY IF EXISTS `services_ibfk_vendor`;
ALTER TABLE `services` DROP COLUMN IF EXISTS `vendor_id`;

ALTER TABLE `bookings` DROP FOREIGN KEY IF EXISTS `bookings_ibfk_vendor`;
ALTER TABLE `bookings` DROP COLUMN IF EXISTS `vendor_id`;
ALTER TABLE `bookings` DROP COLUMN IF EXISTS `commission_amount`;
ALTER TABLE `bookings` DROP COLUMN IF EXISTS `vendor_payout`;
