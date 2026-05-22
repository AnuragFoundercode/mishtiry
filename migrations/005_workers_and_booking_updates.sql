-- ============================================================
-- Migration: 005_workers_and_booking_updates.sql
-- Single-vendor model: Workers system + payment method
-- ============================================================
USE mistry_db;

-- Workers table
CREATE TABLE IF NOT EXISTS `workers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `phone` varchar(15) NOT NULL UNIQUE,
  `aadhaar_number` varchar(12) DEFAULT NULL,
  `aadhaar_front` varchar(255) DEFAULT NULL,
  `aadhaar_back` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `is_blocked` tinyint(1) DEFAULT 0,
  `fcm_token` varchar(255) DEFAULT NULL,
  `created_at` timestamp DEFAULT current_timestamp(),
  `updated_at` timestamp DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add worker_id, payment_method, cod_collected, admin_due to bookings
ALTER TABLE `bookings`
  ADD COLUMN IF NOT EXISTS `worker_id` int(11) DEFAULT NULL AFTER `vendor_id`,
  ADD COLUMN IF NOT EXISTS `payment_method` enum('online','cod') DEFAULT 'online' AFTER `payment_id`,
  ADD COLUMN IF NOT EXISTS `cod_collected` decimal(10,2) DEFAULT 0.00 AFTER `payment_method`,
  ADD COLUMN IF NOT EXISTS `admin_due` decimal(10,2) DEFAULT 0.00 AFTER `cod_collected`,
  ADD CONSTRAINT `fk_booking_worker` FOREIGN KEY (`worker_id`) REFERENCES `workers` (`id`) ON DELETE SET NULL;
