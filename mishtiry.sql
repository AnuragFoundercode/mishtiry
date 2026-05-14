-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: May 14, 2026 at 12:09 PM
-- Server version: 10.11.6-MariaDB-log
-- PHP Version: 8.3.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `mishtiry`
--

-- --------------------------------------------------------

--
-- Table structure for table `bookings`
--

CREATE TABLE `bookings` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `vendor_id` int(11) NOT NULL,
  `service_id` int(11) NOT NULL,
  `booking_date` datetime NOT NULL,
  `notes` text DEFAULT NULL,
  `address` text DEFAULT NULL,
  `zone_id` int(11) DEFAULT NULL,
  `status` enum('pending','accepted','in_progress','completed','cancelled') DEFAULT 'pending',
  `amount` decimal(10,2) DEFAULT NULL,
  `platform_charge` decimal(10,2) DEFAULT 0.00,
  `gst_amount` decimal(10,2) DEFAULT 0.00,
  `total_amount` decimal(10,2) DEFAULT 0.00,
  `commission_amount` decimal(10,2) DEFAULT 0.00,
  `commission_percent_applied` decimal(5,2) DEFAULT 0.00,
  `vendor_payout` decimal(10,2) DEFAULT 0.00,
  `revenue_model_applied` varchar(20) DEFAULT NULL,
  `payment_status` enum('pending','paid','refunded') DEFAULT 'pending',
  `payment_id` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Dumping data for table `bookings`
--

INSERT INTO `bookings` (`id`, `user_id`, `vendor_id`, `service_id`, `booking_date`, `notes`, `address`, `zone_id`, `status`, `amount`, `platform_charge`, `gst_amount`, `total_amount`, `commission_amount`, `commission_percent_applied`, `vendor_payout`, `revenue_model_applied`, `payment_status`, `payment_id`, `created_at`, `updated_at`) VALUES
(43, 2, 1, 1, '2024-01-15 10:00:00', 'Kitchen tap is leaking badly', 'A-123, Lajpat Nagar, Delhi', 6, 'completed', 299.00, 14.95, 53.82, 367.77, 29.90, 0.00, 0.00, NULL, 'paid', NULL, '2026-05-12 07:52:12', '2026-05-12 07:52:12'),
(44, 2, 6, 20, '2024-01-22 11:00:00', 'AC not cooling, need repair', 'A-123, Lajpat Nagar, Delhi', 6, 'in_progress', 899.00, 44.95, 161.82, 1105.77, 89.90, 0.00, 0.00, NULL, 'paid', NULL, '2026-05-12 07:52:12', '2026-05-13 12:07:16'),
(45, 4, 5, 16, '2024-01-25 10:00:00', 'Paint living room walls', 'C-789, Dwarka, Delhi', 6, 'accepted', 2999.00, 149.95, 539.82, 3688.77, 299.90, 0.00, 0.00, NULL, 'pending', NULL, '2026-05-12 07:52:12', '2026-05-13 12:06:54');

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `name`, `parent_id`, `image`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Home Services', NULL, '1778673301519-ChatGPT_Image_May_13,_2026,_03_20_35_PM.png', 1, '2026-05-12 07:08:47', '2026-05-13 11:55:31'),
(2, 'Plumbing', 1, '1778673388371-ChatGPT_Image_May_13,_2026,_03_20_35_PM.png', 1, '2026-05-12 07:08:47', '2026-05-13 11:56:31'),
(3, 'Electrical', 1, '1778673408602-ChatGPT_Image_May_13,_2026,_03_20_35_PM.png', 1, '2026-05-12 07:08:47', '2026-05-13 11:56:51'),
(4, 'Cleaning', 1, '1778673429936-ChatGPT_Image_May_13,_2026,_03_20_35_PM.png', 1, '2026-05-12 07:08:47', '2026-05-13 11:57:12'),
(5, 'Carpentry', 1, '1778673455116-ChatGPT_Image_May_13,_2026,_03_20_35_PM.png', 1, '2026-05-12 07:08:47', '2026-05-13 11:57:38'),
(6, 'Painting', 1, '1778673484674-ChatGPT_Image_May_13,_2026,_03_20_35_PM.png', 1, '2026-05-12 07:08:47', '2026-05-13 11:58:07'),
(7, 'AC Repair', 1, '1778673505176-ChatGPT_Image_May_13,_2026,_03_20_35_PM.png', 1, '2026-05-12 07:08:47', '2026-05-13 11:58:28'),
(8, 'Appliance Repair', 1, '1778673519006-ChatGPT_Image_May_13,_2026,_03_20_35_PM.png', 1, '2026-05-12 07:08:47', '2026-05-13 11:58:41'),
(9, 'Beauty & Wellness', NULL, '1778673533917-ChatGPT_Image_May_13,_2026,_03_20_35_PM.png', 1, '2026-05-12 07:08:47', '2026-05-13 11:58:56'),
(10, 'Salon at Home', 9, '1778673547026-ChatGPT_Image_May_13,_2026,_03_20_35_PM.png', 1, '2026-05-12 07:08:47', '2026-05-13 11:59:09'),
(11, 'Massage', 9, '1778673570041-ChatGPT_Image_May_13,_2026,_03_20_35_PM.png', 1, '2026-05-12 07:08:47', '2026-05-13 11:59:32'),
(12, 'Fitness', 9, '1778673587877-ChatGPT_Image_May_13,_2026,_03_20_35_PM.png', 1, '2026-05-12 07:08:47', '2026-05-13 11:59:50'),
(13, 'Vehicle Services', NULL, '1778673637395-ChatGPT_Image_May_13,_2026,_03_20_35_PM.png', 1, '2026-05-12 07:08:47', '2026-05-13 12:00:40'),
(14, 'Car Wash', 13, '1778673674385-ChatGPT_Image_May_13,_2026,_03_20_35_PM.png', 1, '2026-05-12 07:08:47', '2026-05-13 12:01:17'),
(15, 'Bike Service', 13, '1778673301519-ChatGPT_Image_May_13,_2026,_03_20_35_PM.png', 1, '2026-05-12 07:08:47', '2026-05-13 12:01:34'),
(16, 'Home Services', NULL, '1778673301519-ChatGPT_Image_May_13,_2026,_03_20_35_PM.png', 1, '2026-05-12 07:10:34', '2026-05-13 12:01:37'),
(17, 'Plumbing', 1, '1778673301519-ChatGPT_Image_May_13,_2026,_03_20_35_PM.png', 1, '2026-05-12 07:10:34', '2026-05-13 12:01:39'),
(18, 'Electrical', 1, '1778673301519-ChatGPT_Image_May_13,_2026,_03_20_35_PM.png', 1, '2026-05-12 07:10:34', '2026-05-13 12:01:42'),
(19, 'Cleaning', 1, '1778673301519-ChatGPT_Image_May_13,_2026,_03_20_35_PM.png', 1, '2026-05-12 07:10:34', '2026-05-13 12:01:44'),
(20, 'Carpentry', 1, '1778673301519-ChatGPT_Image_May_13,_2026,_03_20_35_PM.png', 1, '2026-05-12 07:10:34', '2026-05-13 12:01:47'),
(21, 'Painting', 1, '1778673301519-ChatGPT_Image_May_13,_2026,_03_20_35_PM.png', 1, '2026-05-12 07:10:34', '2026-05-13 12:01:51'),
(22, 'AC Repair', 1, '1778673301519-ChatGPT_Image_May_13,_2026,_03_20_35_PM.png', 1, '2026-05-12 07:10:34', '2026-05-13 12:01:53'),
(23, 'Appliance Repair', 1, '1778673301519-ChatGPT_Image_May_13,_2026,_03_20_35_PM.png', 1, '2026-05-12 07:10:34', '2026-05-13 12:01:56'),
(24, 'Beauty & Wellness', NULL, '1778673301519-ChatGPT_Image_May_13,_2026,_03_20_35_PM.png', 1, '2026-05-12 07:10:34', '2026-05-13 12:01:59'),
(25, 'Salon at Home', 9, '1778673301519-ChatGPT_Image_May_13,_2026,_03_20_35_PM.png', 1, '2026-05-12 07:10:34', '2026-05-13 12:02:02'),
(26, 'Massage', 9, '1778673301519-ChatGPT_Image_May_13,_2026,_03_20_35_PM.png', 1, '2026-05-12 07:10:34', '2026-05-13 12:02:22'),
(27, 'Fitness', 9, '1778673301519-ChatGPT_Image_May_13,_2026,_03_20_35_PM.png', 1, '2026-05-12 07:10:34', '2026-05-13 12:02:25'),
(28, 'Vehicle Services', NULL, '1778673301519-ChatGPT_Image_May_13,_2026,_03_20_35_PM.png', 1, '2026-05-12 07:10:34', '2026-05-13 12:02:28'),
(29, 'Car Wash', 13, '1778673301519-ChatGPT_Image_May_13,_2026,_03_20_35_PM.png', 1, '2026-05-12 07:10:34', '2026-05-13 12:02:31'),
(30, 'Bike Service', 13, '1778673301519-ChatGPT_Image_May_13,_2026,_03_20_35_PM.png', 1, '2026-05-12 07:10:34', '2026-05-13 12:02:34');

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `id` int(11) NOT NULL,
  `booking_id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `receiver_id` int(11) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Dumping data for table `messages`
--

INSERT INTO `messages` (`id`, `booking_id`, `sender_id`, `receiver_id`, `message`, `is_read`, `created_at`, `updated_at`) VALUES
(1, 43, 2, 7, 'Hi, when can you come for the tap repair?', 1, '2026-05-12 07:57:58', '2026-05-12 07:57:58'),
(2, 43, 7, 2, 'I can come today at 10 AM. Is that okay?', 1, '2026-05-12 07:57:58', '2026-05-12 07:57:58'),
(3, 43, 2, 7, 'Yes, that works. Please bring the necessary tools.', 1, '2026-05-12 07:57:58', '2026-05-12 07:57:58'),
(4, 43, 7, 2, 'Sure, I will bring everything needed. See you at 10 AM.', 1, '2026-05-12 07:57:58', '2026-05-12 07:57:58'),
(5, 44, 3, 8, 'Need ceiling fan installation in bedroom', 1, '2026-05-12 07:57:58', '2026-05-12 07:57:58'),
(6, 44, 8, 3, 'I can install it tomorrow at 2 PM. Which brand fan?', 1, '2026-05-12 07:57:58', '2026-05-12 07:57:58'),
(7, 44, 3, 8, 'It is Bajaj fan. I have already purchased it.', 1, '2026-05-12 07:57:58', '2026-05-12 07:57:58'),
(8, 45, 4, 9, 'House needs deep cleaning. 3 BHK apartment.', 1, '2026-05-12 07:57:58', '2026-05-12 07:57:58'),
(9, 45, 9, 4, 'I will bring my team. It will take 4-5 hours for complete cleaning.', 1, '2026-05-12 07:57:58', '2026-05-12 07:57:58');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(200) DEFAULT NULL,
  `body` text DEFAULT NULL,
  `type` enum('booking','payment','promotional','system') DEFAULT 'system',
  `is_read` tinyint(1) DEFAULT 0,
  `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`data`)),
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `title`, `body`, `type`, `is_read`, `data`, `created_at`, `updated_at`) VALUES
(1, 2, 'Booking Confirmed', 'Your plumbing service booking has been confirmed for Jan 15, 2024', 'booking', 1, NULL, '2026-05-12 07:56:58', '2026-05-12 07:56:58'),
(2, 2, 'Service Completed', 'Your tap repair service has been completed. Please rate the service.', 'booking', 0, NULL, '2026-05-12 07:56:58', '2026-05-12 07:56:58'),
(3, 3, 'New Offer', 'Get 20% off on your next electrical service booking!', 'promotional', 0, NULL, '2026-05-12 07:56:58', '2026-05-12 07:56:58'),
(4, 4, 'Payment Successful', 'Payment of ₹1843.77 received for deep cleaning service', 'payment', 1, NULL, '2026-05-12 07:56:58', '2026-05-12 07:56:58'),
(5, 7, 'New Booking', 'You have received a new booking for tap repair service', 'booking', 1, NULL, '2026-05-12 07:56:58', '2026-05-12 07:56:58'),
(6, 8, 'Payment Received', 'Payment of ₹490.77 has been credited to your account', 'payment', 1, NULL, '2026-05-12 07:56:58', '2026-05-12 07:56:58'),
(7, 9, 'Subscription Expiring', 'Your Pro plan subscription expires in 5 days. Renew now!', 'system', 0, NULL, '2026-05-12 07:56:58', '2026-05-12 07:56:58');

-- --------------------------------------------------------

--
-- Table structure for table `otps`
--

CREATE TABLE `otps` (
  `id` int(11) NOT NULL,
  `mobile` varchar(15) NOT NULL,
  `otp` varchar(10) NOT NULL,
  `expires_at` datetime NOT NULL,
  `is_used` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `platform_settings`
--

CREATE TABLE `platform_settings` (
  `id` int(11) NOT NULL,
  `platform_charge_percent` decimal(5,2) DEFAULT 5.00,
  `gst_percent` decimal(5,2) DEFAULT 18.00,
  `default_commission_percent` decimal(5,2) DEFAULT 10.00,
  `default_revenue_model` enum('subscription','commission','hybrid') DEFAULT 'commission',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Dumping data for table `platform_settings`
--

INSERT INTO `platform_settings` (`id`, `platform_charge_percent`, `gst_percent`, `default_commission_percent`, `default_revenue_model`, `created_at`, `updated_at`) VALUES
(1, 5.00, 18.00, 10.00, 'commission', '2026-05-08 06:29:49', '2026-05-08 06:29:49');

-- --------------------------------------------------------

--
-- Table structure for table `policies`
--

CREATE TABLE `policies` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `policies`
--

INSERT INTO `policies` (`id`, `title`, `slug`, `content`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Terms & Conditions', 'terms', '<h2>Terms & Conditions</h2><p>Welcome to Mistry platform. By using our services, you agree to these terms...</p>', 1, '2026-05-08 10:04:50', '2026-05-08 10:04:50'),
(2, 'Privacy Policy', 'privacy', '<h2>Privacy Policy</h2><p>Your privacy is important to us. This policy explains how we collect and use your data...</p>', 1, '2026-05-08 10:04:50', '2026-05-08 10:04:50'),
(3, 'Refund Policy', 'refund', '<h2>Refund Policy</h2><p>We offer refunds under certain conditions. Please read carefully...</p>', 1, '2026-05-08 10:04:50', '2026-05-08 10:04:50');

-- --------------------------------------------------------

--
-- Table structure for table `reviews`
--

CREATE TABLE `reviews` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `vendor_id` int(11) NOT NULL,
  `booking_id` int(11) NOT NULL,
  `rating` tinyint(4) NOT NULL CHECK (`rating` between 1 and 5),
  `review` text DEFAULT NULL,
  `is_approved` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Dumping data for table `reviews`
--

INSERT INTO `reviews` (`id`, `user_id`, `vendor_id`, `booking_id`, `rating`, `review`, `is_approved`, `created_at`, `updated_at`) VALUES
(10, 2, 1, 43, 5, 'Excellent service! Fixed the tap quickly and professionally. Highly recommended.', 1, '2026-05-12 07:55:05', '2026-05-12 07:55:05'),
(11, 3, 2, 44, 4, 'Good work on fan installation. Came on time and completed the job efficiently.', 1, '2026-05-12 07:55:05', '2026-05-12 07:55:05'),
(12, 4, 3, 45, 5, 'Amazing deep cleaning service. House looks brand new. Very satisfied!', 1, '2026-05-12 07:55:05', '2026-05-12 07:55:05');

-- --------------------------------------------------------

--
-- Table structure for table `services`
--

CREATE TABLE `services` (
  `id` int(11) NOT NULL,
  `vendor_id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `name` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `estimated_time` varchar(50) DEFAULT NULL,
  `images` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`images`)),
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Dumping data for table `services`
--

INSERT INTO `services` (`id`, `vendor_id`, `category_id`, `name`, `description`, `price`, `estimated_time`, `images`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 1, 2, 'Tap Repair/Replacement', 'Fix leaky taps, replace old taps with new ones', 299.00, '1-2 hours', NULL, 1, '2026-05-12 07:08:47', '2026-05-12 07:08:47'),
(2, 1, 2, 'Pipe Leak Repair', 'Emergency pipe leak fixing, pipe replacement', 499.00, '2-3 hours', NULL, 1, '2026-05-12 07:08:47', '2026-05-12 07:08:47'),
(3, 1, 2, 'Toilet Installation', 'Complete toilet installation and fitting', 899.00, '3-4 hours', NULL, 1, '2026-05-12 07:08:47', '2026-05-12 07:08:47'),
(4, 1, 2, 'Water Tank Cleaning', 'Thorough cleaning of overhead and underground tanks', 799.00, '2-3 hours', NULL, 1, '2026-05-12 07:08:47', '2026-05-12 07:08:47'),
(5, 2, 3, 'Fan Installation', 'Ceiling fan installation with wiring', 399.00, '1-2 hours', NULL, 1, '2026-05-12 07:08:47', '2026-05-12 07:08:47'),
(6, 2, 3, 'Switch/Socket Repair', 'Fix or replace electrical switches and sockets', 199.00, '30 min - 1 hour', NULL, 1, '2026-05-12 07:08:47', '2026-05-12 07:08:47'),
(7, 2, 3, 'Wiring Work', 'New electrical wiring for rooms', 1299.00, '4-6 hours', NULL, 1, '2026-05-12 07:08:47', '2026-05-12 07:08:47'),
(8, 2, 3, 'MCB/Fuse Box Repair', 'Electrical panel and MCB replacement', 699.00, '2-3 hours', NULL, 1, '2026-05-12 07:08:47', '2026-05-12 07:08:47'),
(9, 3, 4, 'Deep House Cleaning', 'Complete house deep cleaning service', 1499.00, '4-6 hours', NULL, 1, '2026-05-12 07:08:47', '2026-05-12 07:08:47'),
(10, 3, 4, 'Bathroom Cleaning', 'Specialized bathroom deep cleaning', 599.00, '1-2 hours', NULL, 1, '2026-05-12 07:08:47', '2026-05-12 07:08:47'),
(11, 3, 4, 'Kitchen Cleaning', 'Complete kitchen cleaning including appliances', 799.00, '2-3 hours', NULL, 1, '2026-05-12 07:08:47', '2026-05-12 07:08:47'),
(12, 3, 4, 'Sofa Cleaning', 'Professional sofa and upholstery cleaning', 899.00, '2-3 hours', NULL, 1, '2026-05-12 07:08:47', '2026-05-12 07:08:47'),
(13, 4, 5, 'Furniture Repair', 'Repair and restoration of wooden furniture', 599.00, '2-4 hours', NULL, 1, '2026-05-12 07:08:47', '2026-05-12 07:08:47'),
(14, 4, 5, 'Custom Shelves', 'Design and install custom wooden shelves', 1299.00, '4-6 hours', NULL, 1, '2026-05-12 07:08:47', '2026-05-12 07:08:47'),
(15, 4, 5, 'Door/Window Repair', 'Fix doors, windows, and locks', 799.00, '2-3 hours', NULL, 1, '2026-05-12 07:08:47', '2026-05-12 07:08:47'),
(16, 5, 6, 'Room Painting', 'Interior room painting (per room)', 2999.00, '1-2 days', NULL, 1, '2026-05-12 07:08:47', '2026-05-12 07:08:47'),
(17, 5, 6, 'Wall Touch-up', 'Small wall repairs and touch-up painting', 799.00, '2-4 hours', NULL, 1, '2026-05-12 07:08:47', '2026-05-12 07:08:47'),
(18, 5, 6, 'Exterior Painting', 'House exterior painting', 8999.00, '3-5 days', NULL, 1, '2026-05-12 07:08:47', '2026-05-12 07:08:47'),
(19, 6, 7, 'AC Installation', 'Split AC installation with piping', 1999.00, '3-4 hours', NULL, 1, '2026-05-12 07:08:47', '2026-05-12 07:08:47'),
(20, 6, 7, 'AC Repair', 'AC not cooling, gas filling, general repair', 899.00, '1-2 hours', NULL, 1, '2026-05-12 07:08:47', '2026-05-12 07:08:47'),
(21, 6, 7, 'AC Cleaning', 'Deep cleaning of AC unit', 599.00, '1-2 hours', NULL, 1, '2026-05-12 07:08:47', '2026-05-12 07:08:47'),
(22, 7, 10, 'Haircut & Styling', 'Professional haircut and styling at home', 499.00, '1 hour', NULL, 1, '2026-05-12 07:08:47', '2026-05-12 07:08:47'),
(23, 7, 10, 'Facial Treatment', 'Relaxing facial treatment', 899.00, '1.5 hours', NULL, 1, '2026-05-12 07:08:47', '2026-05-12 07:08:47'),
(24, 7, 10, 'Manicure & Pedicure', 'Complete nail care service', 699.00, '1.5 hours', NULL, 1, '2026-05-12 07:08:47', '2026-05-12 07:08:47'),
(25, 8, 14, 'Car Wash', 'External car washing and cleaning', 299.00, '30-45 min', NULL, 1, '2026-05-12 07:08:47', '2026-05-12 07:08:47'),
(26, 8, 14, 'Car Detailing', 'Complete interior and exterior detailing', 1299.00, '2-3 hours', NULL, 1, '2026-05-12 07:08:47', '2026-05-12 07:08:47');

-- --------------------------------------------------------

--
-- Table structure for table `sliders`
--

CREATE TABLE `sliders` (
  `id` int(11) NOT NULL,
  `title` varchar(200) DEFAULT NULL,
  `subtitle` varchar(300) DEFAULT NULL,
  `image` varchar(255) NOT NULL,
  `type` enum('user','vendor','both') NOT NULL DEFAULT 'both',
  `link` varchar(500) DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sliders`
--

INSERT INTO `sliders` (`id`, `title`, `subtitle`, `image`, `type`, `link`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'BOOK NOW', 'its a very useful application', '1778668451036-ChatGPT_Image_May_13,_2026,_03_20_35_PM.png', 'both', '', 1, 1, '2026-05-13 10:34:14', '2026-05-13 10:34:14');

-- --------------------------------------------------------

--
-- Table structure for table `subscription_plans`
--

CREATE TABLE `subscription_plans` (
  `id` int(11) NOT NULL,
  `name` enum('basic','pro','advanced') NOT NULL,
  `price_monthly` decimal(10,2) DEFAULT NULL,
  `price_yearly` decimal(10,2) DEFAULT NULL,
  `service_limit` int(11) DEFAULT 5,
  `gallery_limit` int(11) DEFAULT 10,
  `featured_listing` tinyint(1) DEFAULT 0,
  `chat_support` enum('basic','priority','premium') DEFAULT 'basic',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Dumping data for table `subscription_plans`
--

INSERT INTO `subscription_plans` (`id`, `name`, `price_monthly`, `price_yearly`, `service_limit`, `gallery_limit`, `featured_listing`, `chat_support`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'basic', 299.00, 2999.00, 5, 10, 0, 'basic', 1, '2026-05-08 06:29:49', '2026-05-08 06:29:49'),
(2, 'pro', 699.00, 6999.00, 20, 50, 1, 'priority', 1, '2026-05-08 06:29:49', '2026-05-11 04:25:59'),
(3, 'advanced', 1299.00, 12999.00, 2147483647, 2147483647, 1, 'premium', 1, '2026-05-08 06:29:49', '2026-05-08 06:29:49');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `mobile` varchar(15) NOT NULL,
  `profile_image` varchar(255) DEFAULT NULL,
  `fcm_token` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expires` datetime DEFAULT NULL,
  `role` enum('user','vendor','admin') DEFAULT 'user',
  `is_active` tinyint(1) DEFAULT 1,
  `is_blocked` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `mobile`, `profile_image`, `fcm_token`, `password`, `reset_token`, `reset_token_expires`, `role`, `is_active`, `is_blocked`, `created_at`, `updated_at`) VALUES
(1, 'Super Admin', 'admin@mistry.com', '9999999999', NULL, NULL, '$2b$10$33MJSUpyt1JPOcF2NYmGreLp9a1SgJuaOimOI2zb53eEu2l9BOAyW', NULL, NULL, 'admin', 1, 0, '2026-05-12 07:08:47', '2026-05-12 07:08:47'),
(2, 'Rahul Sharma', 'rahul@gmail.com', '9876543210', NULL, NULL, NULL, NULL, NULL, 'user', 1, 0, '2026-05-12 07:08:47', '2026-05-12 07:08:47'),
(3, 'Priya Singh', 'priya@gmail.com', '9876543211', NULL, NULL, NULL, NULL, NULL, 'user', 1, 0, '2026-05-12 07:08:47', '2026-05-12 07:08:47'),
(4, 'Amit Kumar', 'amit@gmail.com', '9876543212', NULL, NULL, NULL, NULL, NULL, 'user', 1, 0, '2026-05-12 07:08:47', '2026-05-12 07:08:47'),
(5, 'Sneha Patel', 'sneha@gmail.com', '9876543213', NULL, NULL, NULL, NULL, NULL, 'user', 1, 0, '2026-05-12 07:08:47', '2026-05-12 07:08:47'),
(6, 'Vikash Gupta', 'vikash@gmail.com', '9876543214', NULL, NULL, NULL, NULL, NULL, 'user', 1, 0, '2026-05-12 07:08:47', '2026-05-12 07:08:47'),
(7, 'Ramesh Kumar', 'ramesh@gmail.com', '9876543220', NULL, NULL, NULL, NULL, NULL, 'vendor', 1, 0, '2026-05-12 07:08:47', '2026-05-12 07:08:47'),
(8, 'Suresh Electrician', 'suresh@gmail.com', '9876543221', NULL, NULL, NULL, NULL, NULL, 'vendor', 1, 0, '2026-05-12 07:08:47', '2026-05-12 07:08:47'),
(9, 'Deepak Cleaner', 'deepak@gmail.com', '9876543222', NULL, NULL, NULL, NULL, NULL, 'vendor', 1, 0, '2026-05-12 07:08:47', '2026-05-12 07:08:47'),
(10, 'Rajesh Carpenter', 'rajesh@gmail.com', '9876543223', NULL, NULL, NULL, NULL, NULL, 'vendor', 1, 0, '2026-05-12 07:08:47', '2026-05-12 07:08:47'),
(11, 'Mohan Painter', 'mohan@gmail.com', '9876543224', NULL, NULL, NULL, NULL, NULL, 'vendor', 1, 0, '2026-05-12 07:08:47', '2026-05-12 07:08:47'),
(12, 'Sanjay AC Tech', 'sanjay@gmail.com', '9876543225', NULL, NULL, NULL, NULL, NULL, 'vendor', 1, 0, '2026-05-12 07:08:47', '2026-05-12 07:08:47'),
(13, 'Ravi Beauty Expert', 'ravi@gmail.com', '9876543226', NULL, NULL, NULL, NULL, NULL, 'vendor', 1, 0, '2026-05-12 07:08:47', '2026-05-12 07:08:47'),
(14, 'Kiran Car Wash', 'kiran@gmail.com', '9876543227', NULL, NULL, NULL, NULL, NULL, 'vendor', 1, 0, '2026-05-12 07:08:47', '2026-05-12 07:08:47');

-- --------------------------------------------------------

--
-- Table structure for table `vendors`
--

CREATE TABLE `vendors` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `business_name` varchar(200) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `logo` varchar(255) DEFAULT NULL,
  `banner` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `working_hours` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`working_hours`)),
  `is_approved` tinyint(1) DEFAULT 0,
  `is_suspended` tinyint(1) DEFAULT 0,
  `is_featured` tinyint(1) DEFAULT 0,
  `kyc_status` enum('pending','under_review','approved','rejected') DEFAULT 'pending',
  `kyc_rejection_reason` text DEFAULT NULL,
  `avg_rating` decimal(3,2) DEFAULT 0.00,
  `total_reviews` int(11) DEFAULT 0,
  `revenue_model` enum('subscription','commission','hybrid') DEFAULT NULL,
  `commission_percent` decimal(5,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Dumping data for table `vendors`
--

INSERT INTO `vendors` (`id`, `user_id`, `business_name`, `description`, `logo`, `banner`, `address`, `latitude`, `longitude`, `working_hours`, `is_approved`, `is_suspended`, `is_featured`, `kyc_status`, `kyc_rejection_reason`, `avg_rating`, `total_reviews`, `revenue_model`, `commission_percent`, `created_at`, `updated_at`) VALUES
(1, 7, 'Kumar Plumbing Services', 'Expert plumbing solutions for homes and offices. 24/7 emergency service available.', NULL, NULL, 'Lajpat Nagar, New Delhi', 28.56720000, 77.24310000, NULL, 1, 0, 0, 'approved', NULL, 4.50, 25, NULL, NULL, '2026-05-12 07:08:47', '2026-05-12 11:52:25'),
(2, 8, 'Suresh Electrical Works', 'Licensed electrician with 10+ years experience. All electrical repairs and installations.', NULL, NULL, 'Karol Bagh, New Delhi', 28.65190000, 77.19090000, NULL, 1, 0, 0, 'approved', NULL, 4.30, 18, NULL, NULL, '2026-05-12 07:08:47', '2026-05-12 07:08:47'),
(3, 9, 'Deepak Cleaning Services', 'Professional home and office cleaning. Deep cleaning specialists.', NULL, NULL, 'Dwarka, New Delhi', 28.59210000, 77.04600000, NULL, 1, 0, 0, 'approved', NULL, 4.70, 32, NULL, NULL, '2026-05-12 07:08:47', '2026-05-12 07:08:47'),
(4, 10, 'Rajesh Carpentry', 'Custom furniture and carpentry work. Quality wood work guaranteed.', NULL, NULL, 'Rohini, New Delhi', 28.70410000, 77.10250000, NULL, 1, 0, 0, 'approved', NULL, 4.20, 15, NULL, NULL, '2026-05-12 07:08:47', '2026-05-12 07:08:47'),
(5, 11, 'Mohan Painting Services', 'Interior and exterior painting. Premium quality paints used.', NULL, NULL, 'Janakpuri, New Delhi', 28.62190000, 77.08140000, NULL, 1, 0, 0, 'approved', NULL, 4.40, 22, NULL, NULL, '2026-05-12 07:08:47', '2026-05-12 07:08:47'),
(6, 12, 'Sanjay AC Solutions', 'AC installation, repair and maintenance. All brands serviced.', NULL, NULL, 'Gurgaon, Haryana', 28.45950000, 77.02660000, NULL, 1, 0, 0, 'approved', NULL, 4.60, 28, NULL, NULL, '2026-05-12 07:08:47', '2026-05-12 07:08:47'),
(7, 13, 'Ravi Beauty Salon', 'Professional beauty services at your doorstep. Unisex salon.', NULL, NULL, 'Noida, UP', 28.53550000, 77.39100000, NULL, 1, 0, 0, 'approved', NULL, 4.80, 45, NULL, NULL, '2026-05-12 07:08:47', '2026-05-12 07:08:47'),
(8, 14, 'Kiran Car Care', 'Premium car washing and detailing services. Eco-friendly products.', NULL, NULL, 'South Delhi', 28.53550000, 77.25000000, NULL, 1, 0, 0, 'approved', NULL, 4.10, 12, NULL, NULL, '2026-05-12 07:08:47', '2026-05-12 07:08:47');

-- --------------------------------------------------------

--
-- Table structure for table `vendor_bank_details`
--

CREATE TABLE `vendor_bank_details` (
  `id` int(11) NOT NULL,
  `vendor_id` int(11) NOT NULL,
  `account_holder_name` varchar(200) NOT NULL,
  `account_number` varchar(20) NOT NULL,
  `ifsc_code` varchar(11) NOT NULL,
  `bank_name` varchar(100) DEFAULT NULL,
  `branch_name` varchar(100) DEFAULT NULL,
  `upi_id` varchar(100) DEFAULT NULL,
  `passbook_image` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Dumping data for table `vendor_bank_details`
--

INSERT INTO `vendor_bank_details` (`id`, `vendor_id`, `account_holder_name`, `account_number`, `ifsc_code`, `bank_name`, `branch_name`, `upi_id`, `passbook_image`, `created_at`, `updated_at`) VALUES
(1, 1, 'Ramesh Kumar', '1234567890123456', 'SBIN0001234', 'State Bank of India', NULL, 'ramesh@paytm', NULL, '2026-05-12 07:56:25', '2026-05-12 07:56:25'),
(2, 2, 'Suresh Electrician', '2345678901234567', 'HDFC0001235', 'HDFC Bank', NULL, 'suresh@phonepe', NULL, '2026-05-12 07:56:25', '2026-05-12 07:56:25'),
(3, 3, 'Deepak Cleaner', '3456789012345678', 'ICIC0001236', 'ICICI Bank', NULL, 'deepak@gpay', NULL, '2026-05-12 07:56:25', '2026-05-12 07:56:25'),
(4, 4, 'Rajesh Carpenter', '4567890123456789', 'AXIS0001237', 'Axis Bank', NULL, 'rajesh@paytm', NULL, '2026-05-12 07:56:25', '2026-05-12 07:56:25'),
(5, 5, 'Mohan Painter', '5678901234567890', 'SBIN0001238', 'State Bank of India', NULL, 'mohan@phonepe', NULL, '2026-05-12 07:56:25', '2026-05-12 07:56:25'),
(6, 6, 'Sanjay AC Tech', '6789012345678901', 'HDFC0001239', 'HDFC Bank', NULL, 'sanjay@gpay', NULL, '2026-05-12 07:56:25', '2026-05-12 07:56:25'),
(7, 7, 'Ravi Beauty Expert', '7890123456789012', 'ICIC0001240', 'ICICI Bank', NULL, 'ravi@paytm', NULL, '2026-05-12 07:56:25', '2026-05-12 07:56:25'),
(8, 8, 'Kiran Car Wash', '8901234567890123', 'AXIS0001241', 'Axis Bank', NULL, 'kiran@phonepe', NULL, '2026-05-12 07:56:25', '2026-05-12 07:56:25');

-- --------------------------------------------------------

--
-- Table structure for table `vendor_kyc`
--

CREATE TABLE `vendor_kyc` (
  `id` int(11) NOT NULL,
  `vendor_id` int(11) NOT NULL,
  `aadhaar_number` varchar(12) DEFAULT NULL,
  `aadhaar_front` varchar(255) DEFAULT NULL,
  `aadhaar_back` varchar(255) DEFAULT NULL,
  `pan_number` varchar(10) DEFAULT NULL,
  `pan_document` varchar(255) DEFAULT NULL,
  `gst_number` varchar(15) DEFAULT NULL,
  `gst_document` varchar(255) DEFAULT NULL,
  `selfie` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Dumping data for table `vendor_kyc`
--

INSERT INTO `vendor_kyc` (`id`, `vendor_id`, `aadhaar_number`, `aadhaar_front`, `aadhaar_back`, `pan_number`, `pan_document`, `gst_number`, `gst_document`, `selfie`, `created_at`, `updated_at`) VALUES
(1, 1, '123456789012', NULL, NULL, 'ABCDE1234F', NULL, 'GST123456789', NULL, NULL, '2026-05-12 07:56:09', '2026-05-12 07:56:09'),
(2, 2, '234567890123', NULL, NULL, 'BCDEF2345G', NULL, 'GST234567890', NULL, NULL, '2026-05-12 07:56:09', '2026-05-12 07:56:09'),
(3, 3, '345678901234', NULL, NULL, 'CDEFG3456H', NULL, 'GST345678901', NULL, NULL, '2026-05-12 07:56:09', '2026-05-12 07:56:09'),
(4, 4, '456789012345', NULL, NULL, 'DEFGH4567I', NULL, 'GST456789012', NULL, NULL, '2026-05-12 07:56:09', '2026-05-12 07:56:09'),
(5, 5, '567890123456', NULL, NULL, 'EFGHI5678J', NULL, 'GST567890123', NULL, NULL, '2026-05-12 07:56:09', '2026-05-12 07:56:09'),
(6, 6, '678901234567', NULL, NULL, 'FGHIJ6789K', NULL, 'GST678901234', NULL, NULL, '2026-05-12 07:56:09', '2026-05-12 07:56:09'),
(7, 7, '789012345678', NULL, NULL, 'GHIJK7890L', NULL, 'GST789012345', NULL, NULL, '2026-05-12 07:56:09', '2026-05-12 07:56:09'),
(8, 8, '890123456789', NULL, NULL, 'HIJKL8901M', NULL, 'GST890123456', NULL, NULL, '2026-05-12 07:56:09', '2026-05-12 07:56:09');

-- --------------------------------------------------------

--
-- Table structure for table `vendor_subscriptions`
--

CREATE TABLE `vendor_subscriptions` (
  `id` int(11) NOT NULL,
  `vendor_id` int(11) NOT NULL,
  `plan_id` int(11) NOT NULL,
  `billing_cycle` enum('monthly','yearly') DEFAULT 'monthly',
  `starts_at` datetime DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL,
  `payment_id` varchar(255) DEFAULT NULL,
  `status` enum('active','expired','cancelled') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Dumping data for table `vendor_subscriptions`
--

INSERT INTO `vendor_subscriptions` (`id`, `vendor_id`, `plan_id`, `billing_cycle`, `starts_at`, `expires_at`, `payment_id`, `status`, `created_at`, `updated_at`) VALUES
(1, 1, 2, 'monthly', '2024-01-01 00:00:00', '2024-02-01 00:00:00', NULL, 'active', '2026-05-12 07:56:37', '2026-05-12 07:56:37'),
(2, 2, 1, 'monthly', '2024-01-01 00:00:00', '2024-02-01 00:00:00', NULL, 'active', '2026-05-12 07:56:37', '2026-05-12 07:56:37'),
(3, 3, 3, 'yearly', '2024-01-01 00:00:00', '2025-01-01 00:00:00', NULL, 'active', '2026-05-12 07:56:37', '2026-05-12 07:56:37'),
(4, 4, 1, 'monthly', '2024-01-01 00:00:00', '2024-02-01 00:00:00', NULL, 'active', '2026-05-12 07:56:37', '2026-05-12 07:56:37'),
(5, 5, 2, 'monthly', '2024-01-01 00:00:00', '2024-02-01 00:00:00', NULL, 'active', '2026-05-12 07:56:37', '2026-05-12 07:56:37'),
(6, 6, 2, 'monthly', '2024-01-01 00:00:00', '2024-02-01 00:00:00', NULL, 'active', '2026-05-12 07:56:37', '2026-05-12 07:56:37'),
(7, 7, 3, 'yearly', '2024-01-01 00:00:00', '2025-01-01 00:00:00', NULL, 'active', '2026-05-12 07:56:37', '2026-05-12 07:56:37'),
(8, 8, 1, 'monthly', '2024-01-01 00:00:00', '2024-02-01 00:00:00', NULL, 'active', '2026-05-12 07:56:37', '2026-05-12 07:56:37');

-- --------------------------------------------------------

--
-- Table structure for table `zones`
--

CREATE TABLE `zones` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `color` varchar(7) DEFAULT '#6c47ff' COMMENT 'Hex color for map display',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `coordinates` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'Array of {lat, lng} objects forming polygon boundary' CHECK (json_valid(`coordinates`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `zones`
--

INSERT INTO `zones` (`id`, `name`, `color`, `is_active`, `created_at`, `updated_at`, `coordinates`) VALUES
(1, 'Central Delhi Zone', '#6c47ff', 1, '2026-05-08 12:05:08', '2026-05-08 12:05:08', ''),
(2, 'South Delhi Zone', '#10b981', 1, '2026-05-08 12:05:08', '2026-05-08 12:05:08', ''),
(3, 'Noida Zone', '#f59e0b', 1, '2026-05-08 12:05:08', '2026-05-08 12:05:08', ''),
(4, 'Gurgaon Zone', '#ef4444', 1, '2026-05-08 12:05:08', '2026-05-08 12:05:08', ''),
(6, 'india', '#6c47ff', 1, '2026-05-12 07:12:07', '2026-05-12 07:12:07', '[{\"lat\":36.26288131717469,\"lng\":72.73498953247072},{\"lat\":22.086661671007363,\"lng\":69.08752859497072},{\"lat\":7.820939855518303,\"lng\":78.14026296997072},{\"lat\":26.21558028881294,\"lng\":95.01526296997072}]');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `bookings`
--
ALTER TABLE `bookings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `vendor_id` (`vendor_id`),
  ADD KEY `service_id` (`service_id`),
  ADD KEY `idx_zone_id` (`zone_id`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `parent_id` (`parent_id`);

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sender_id` (`sender_id`),
  ADD KEY `receiver_id` (`receiver_id`),
  ADD KEY `idx_booking` (`booking_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_read` (`user_id`,`is_read`);

--
-- Indexes for table `otps`
--
ALTER TABLE `otps`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_mobile` (`mobile`);

--
-- Indexes for table `platform_settings`
--
ALTER TABLE `platform_settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `policies`
--
ALTER TABLE `policies`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `idx_slug` (`slug`),
  ADD KEY `idx_is_active` (`is_active`);

--
-- Indexes for table `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `booking_id` (`booking_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `vendor_id` (`vendor_id`);

--
-- Indexes for table `services`
--
ALTER TABLE `services`
  ADD PRIMARY KEY (`id`),
  ADD KEY `vendor_id` (`vendor_id`),
  ADD KEY `category_id` (`category_id`);

--
-- Indexes for table `sliders`
--
ALTER TABLE `sliders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_type_active` (`type`,`is_active`);

--
-- Indexes for table `subscription_plans`
--
ALTER TABLE `subscription_plans`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `mobile` (`mobile`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `vendors`
--
ALTER TABLE `vendors`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `vendor_bank_details`
--
ALTER TABLE `vendor_bank_details`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `vendor_id` (`vendor_id`);

--
-- Indexes for table `vendor_kyc`
--
ALTER TABLE `vendor_kyc`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `vendor_id` (`vendor_id`);

--
-- Indexes for table `vendor_subscriptions`
--
ALTER TABLE `vendor_subscriptions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `vendor_id` (`vendor_id`),
  ADD KEY `plan_id` (`plan_id`);

--
-- Indexes for table `zones`
--
ALTER TABLE `zones`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_is_active` (`is_active`),
  ADD KEY `idx_zone_active` (`is_active`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `bookings`
--
ALTER TABLE `bookings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=46;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `otps`
--
ALTER TABLE `otps`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `platform_settings`
--
ALTER TABLE `platform_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `policies`
--
ALTER TABLE `policies`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `reviews`
--
ALTER TABLE `reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `services`
--
ALTER TABLE `services`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `sliders`
--
ALTER TABLE `sliders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `subscription_plans`
--
ALTER TABLE `subscription_plans`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `vendors`
--
ALTER TABLE `vendors`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `vendor_bank_details`
--
ALTER TABLE `vendor_bank_details`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `vendor_kyc`
--
ALTER TABLE `vendor_kyc`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `vendor_subscriptions`
--
ALTER TABLE `vendor_subscriptions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `zones`
--
ALTER TABLE `zones`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `bookings`
--
ALTER TABLE `bookings`
  ADD CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `bookings_ibfk_2` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `bookings_ibfk_3` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_booking_zone` FOREIGN KEY (`zone_id`) REFERENCES `zones` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `categories`
--
ALTER TABLE `categories`
  ADD CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `messages_ibfk_3` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reviews_ibfk_3` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `services`
--
ALTER TABLE `services`
  ADD CONSTRAINT `services_ibfk_1` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `services_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`);

--
-- Constraints for table `vendors`
--
ALTER TABLE `vendors`
  ADD CONSTRAINT `vendors_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `vendor_bank_details`
--
ALTER TABLE `vendor_bank_details`
  ADD CONSTRAINT `vendor_bank_details_ibfk_1` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `vendor_kyc`
--
ALTER TABLE `vendor_kyc`
  ADD CONSTRAINT `vendor_kyc_ibfk_1` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `vendor_subscriptions`
--
ALTER TABLE `vendor_subscriptions`
  ADD CONSTRAINT `vendor_subscriptions_ibfk_1` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `vendor_subscriptions_ibfk_2` FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
