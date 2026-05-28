-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: May 28, 2026 at 12:02 PM
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
-- Table structure for table `addresses`
--

CREATE TABLE `addresses` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `label` varchar(50) DEFAULT 'Home',
  `full_address` text NOT NULL,
  `landmark` varchar(255) DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `pincode` varchar(10) DEFAULT NULL,
  `is_default` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `addresses`
--

INSERT INTO `addresses` (`id`, `user_id`, `label`, `full_address`, `landmark`, `latitude`, `longitude`, `city`, `state`, `pincode`, `is_default`, `created_at`, `updated_at`) VALUES
(5, 2, 'Work', '126, Jankipuram, Near City Mall, lucknow, UttarPradesh.', 'Jankipuram', 26.94320331, 80.94016817, 'lucknow', 'Uttar Pardesh', '787567', 0, '2026-05-27 04:56:14', '2026-05-27 08:07:09'),
(6, 2, 'Office11', '456, Vijay Nagar, AB Road, Indore, Madhya Pradesh', 'Near Bombay Hospital', 22.75330000, 75.89370000, 'Indore', 'Madhya Pradesh', '452010', 0, '2026-05-27 04:57:39', '2026-05-27 08:07:09'),
(9, 2, 'Home', '123, Shanti Nagar, Near City Mall, Indore, Madhya Pradesh', 'Opposite SBI Bank', 22.71960000, 75.85770000, 'Indore', 'Madhya Pradesh', '452001', 1, '2026-05-27 08:07:09', '2026-05-27 08:07:09'),
(12, 22, 'WWVQ+HW2', 'WWVQ+HW2, Jankipuram Extension, Malookpur, 226031', 'WWVQ+HW2', 26.94340205, 80.93964815, 'Malookpur', 'Uttar Pradesh', '226031', 0, '2026-05-27 09:25:57', '2026-05-27 09:28:33'),
(13, 22, 'WWVQ+HW2', 'WWVQ+HW2, Jankipuram Extension, Malookpur, 226031', 'WWVQ+HW2', 26.94340205, 80.93964815, 'Malookpur', 'Uttar Pradesh', '226031', 0, '2026-05-27 09:26:45', '2026-05-27 09:28:33'),
(15, 22, 'WWVQ+HW2', 'WWVQ+HW2, Jankipuram Extension, Malookpur, 226031', 'WWVQ+HW2', 26.94347587, 80.93961529, 'Malookpur', 'Uttar Pradesh', '226031', 1, '2026-05-27 09:28:33', '2026-05-27 09:28:33');

-- --------------------------------------------------------

--
-- Table structure for table `bookings`
--

CREATE TABLE `bookings` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `worker_id` int(11) DEFAULT NULL,
  `service_id` int(11) NOT NULL,
  `booking_date` datetime NOT NULL,
  `notes` text DEFAULT NULL,
  `address` text DEFAULT NULL,
  `address_id` int(11) DEFAULT NULL,
  `slot_id` int(11) DEFAULT NULL,
  `zone_id` int(11) DEFAULT NULL,
  `status` enum('pending','accepted','in_progress','completed','cancelled') DEFAULT 'pending',
  `amount` decimal(10,2) DEFAULT NULL,
  `platform_charge` decimal(10,2) DEFAULT 0.00,
  `gst_amount` decimal(10,2) DEFAULT 0.00,
  `total_amount` decimal(10,2) DEFAULT 0.00,
  `payment_status` enum('pending','paid','refunded') DEFAULT 'pending',
  `payment_id` varchar(255) DEFAULT NULL,
  `cf_order_id` varchar(255) DEFAULT NULL,
  `payment_method` enum('online','cod') DEFAULT 'online',
  `cod_collected` decimal(10,2) DEFAULT 0.00,
  `admin_due` decimal(10,2) DEFAULT 0.00,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Dumping data for table `bookings`
--

INSERT INTO `bookings` (`id`, `user_id`, `worker_id`, `service_id`, `booking_date`, `notes`, `address`, `address_id`, `slot_id`, `zone_id`, `status`, `amount`, `platform_charge`, `gst_amount`, `total_amount`, `payment_status`, `payment_id`, `cf_order_id`, `payment_method`, `cod_collected`, `admin_due`, `created_at`, `updated_at`) VALUES
(43, 2, 1, 1, '2024-01-15 10:00:00', 'Kitchen tap is leaking badly', 'A-123, Lajpat Nagar, Delhi', NULL, NULL, 6, 'accepted', 299.00, 14.95, 53.82, 367.77, 'paid', NULL, NULL, 'online', 0.00, 0.00, '2026-05-12 07:52:12', '2026-05-22 07:57:29'),
(44, 2, NULL, 20, '2024-01-22 11:00:00', 'AC not cooling, need repair', 'A-123, Lajpat Nagar, Delhi', NULL, NULL, 6, 'in_progress', 899.00, 44.95, 161.82, 1105.77, 'paid', NULL, NULL, 'online', 0.00, 0.00, '2026-05-12 07:52:12', '2026-05-13 12:07:16'),
(45, 4, NULL, 16, '2024-01-25 10:00:00', 'Paint living room walls', 'C-789, Dwarka, Delhi', NULL, NULL, 6, 'accepted', 2999.00, 149.95, 539.82, 3688.77, 'pending', NULL, NULL, 'online', 0.00, 0.00, '2026-05-12 07:52:12', '2026-05-13 12:06:54'),
(46, 2, NULL, 1, '2026-06-15 10:00:00', 'Please bring tools', '123, MG Road, Delhi', NULL, NULL, NULL, 'pending', 299.00, 14.95, 2.69, 316.64, 'pending', NULL, NULL, 'cod', 0.00, 0.00, '2026-05-22 10:02:56', '2026-05-22 10:02:56'),
(47, 2, NULL, 1, '2026-06-15 10:00:00', 'Please bring tools', '123, MG Road, Delhi', NULL, NULL, NULL, 'pending', 299.00, 14.95, 2.69, 316.64, 'pending', NULL, NULL, 'online', 0.00, 0.00, '2026-05-22 10:03:33', '2026-05-22 10:03:33'),
(48, 2, NULL, 1, '2026-06-15 10:00:00', 'Please bring tools', '123, MG Road, Delhi', NULL, NULL, NULL, 'pending', 299.00, 14.95, 2.69, 316.64, 'pending', NULL, NULL, 'online', 0.00, 0.00, '2026-05-22 10:18:33', '2026-05-22 10:18:33'),
(49, 2, NULL, 1, '2026-06-15 10:00:00', 'Please bring tools', '123, MG Road, Delhi', NULL, NULL, NULL, 'pending', 299.00, 14.95, 2.69, 316.64, 'pending', NULL, NULL, 'online', 0.00, 0.00, '2026-05-22 10:20:07', '2026-05-22 10:20:07'),
(50, 2, NULL, 1, '2026-06-15 10:00:00', 'Please bring tools', '123, MG Road, Delhi', NULL, NULL, NULL, 'pending', 299.00, 14.95, 2.69, 316.64, 'pending', NULL, NULL, 'online', 0.00, 0.00, '2026-05-22 10:20:29', '2026-05-22 10:20:29'),
(51, 2, NULL, 1, '2026-06-15 10:00:00', 'Please bring tools', '123, MG Road, Delhi', NULL, NULL, NULL, 'pending', 299.00, 14.95, 2.69, 316.64, 'pending', NULL, NULL, 'online', 0.00, 0.00, '2026-05-22 11:19:55', '2026-05-22 11:19:55'),
(52, 2, NULL, 1, '2026-06-15 10:00:00', 'Please bring tools', '123, MG Road, Delhi', NULL, NULL, NULL, 'pending', 299.00, 14.95, 2.69, 316.64, 'pending', NULL, NULL, 'online', 0.00, 0.00, '2026-05-22 11:20:01', '2026-05-22 11:20:01'),
(53, 2, NULL, 1, '2026-06-15 10:00:00', 'Please bring tools', '123, MG Road, Delhi', NULL, NULL, NULL, 'pending', 299.00, 14.95, 2.69, 316.64, 'pending', NULL, NULL, 'online', 0.00, 0.00, '2026-05-22 11:35:32', '2026-05-22 11:35:32'),
(54, 2, NULL, 1, '2026-06-15 10:00:00', 'Please bring tools', '123, MG Road, Delhi', NULL, NULL, NULL, 'pending', 299.00, 14.95, 2.69, 316.64, 'pending', NULL, NULL, 'online', 0.00, 0.00, '2026-05-22 11:36:06', '2026-05-22 11:36:06'),
(55, 2, NULL, 1, '2026-06-15 10:00:00', 'Please bring tools', '123, MG Road, Delhi', NULL, NULL, NULL, 'pending', 299.00, 14.95, 2.69, 316.64, 'pending', NULL, NULL, 'online', 0.00, 0.00, '2026-05-22 11:40:22', '2026-05-22 11:40:22'),
(56, 2, NULL, 1, '2026-06-15 10:00:00', 'Please bring tools', '123, MG Road, Delhi', NULL, NULL, NULL, 'pending', 299.00, 14.95, 2.69, 316.64, 'pending', NULL, NULL, 'online', 0.00, 0.00, '2026-05-22 11:41:32', '2026-05-22 11:41:32'),
(57, 2, NULL, 1, '2026-06-15 10:00:00', 'Please bring tools', '123, MG Road, Delhi', NULL, NULL, NULL, 'pending', 299.00, 14.95, 2.69, 316.64, 'pending', NULL, NULL, 'cod', 0.00, 0.00, '2026-05-22 11:41:44', '2026-05-22 11:41:44'),
(58, 2, NULL, 1, '2026-06-15 10:00:00', 'Please bring tools', '123, MG Road, Delhi', NULL, NULL, NULL, 'pending', 299.00, 14.95, 2.69, 316.64, 'pending', NULL, NULL, 'online', 0.00, 0.00, '2026-05-22 11:41:57', '2026-05-22 11:41:57'),
(59, 2, NULL, 1, '2026-06-15 10:00:00', 'Please bring tools', '123, MG Road, Delhi', NULL, NULL, NULL, 'pending', 299.00, 14.95, 2.69, 316.64, 'pending', NULL, '2209127448', 'online', 0.00, 0.00, '2026-05-22 11:43:25', '2026-05-22 11:43:27'),
(60, 2, NULL, 1, '2026-06-15 10:00:00', 'Please bring tools', '123, MG Road, Delhi', NULL, NULL, NULL, 'pending', 299.00, 14.95, 2.69, 316.64, 'pending', NULL, '2209127472', 'online', 0.00, 0.00, '2026-05-22 11:45:09', '2026-05-22 11:45:10');

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
(33, 'Cleaning Service', NULL, '1779436395228-clean.webp', 1, '2026-05-20 10:46:01', '2026-05-22 07:53:15'),
(34, 'Beauty & Salon', NULL, '1779436383689-salon.webp', 1, '2026-05-20 10:46:35', '2026-05-22 07:53:03'),
(35, 'Plumbing', NULL, '1779436353938-plumber.webp', 1, '2026-05-20 10:46:59', '2026-05-22 07:52:34'),
(36, 'Appliance Repair', NULL, '1779436336180-aplience_repair.webp', 1, '2026-05-20 10:47:15', '2026-05-22 07:52:16'),
(37, 'Electrician', NULL, '1779436323550-eletric.webp', 1, '2026-05-20 10:47:52', '2026-05-22 07:52:03'),
(38, 'Carpenter', NULL, '1779436300725-carpanerter.webp', 1, '2026-05-20 10:48:23', '2026-05-22 07:51:40');

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
  `body` mediumtext DEFAULT NULL,
  `type` enum('booking','payment','promotional','system') DEFAULT 'system',
  `is_read` tinyint(1) DEFAULT 0,
  `data` longtext DEFAULT NULL CHECK (json_valid(`data`)),
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
(7, 9, 'Subscription Expiring', 'Your Pro plan subscription expires in 5 days. Renew now!', 'system', 0, NULL, '2026-05-12 07:56:58', '2026-05-12 07:56:58'),
(8, 10, '🔔 Subscription Renewal Reminder', 'Your basic plan expires on 19/5/2026 (5 days left). Renew now to stay active.', 'system', 0, NULL, '2026-05-14 06:11:07', '2026-05-14 06:11:07'),
(9, 11, '🔔 Subscription Renewal Reminder', 'Your pro plan expires on 17/5/2026 (3 days left). Renew now to stay active.', 'system', 0, NULL, '2026-05-14 06:11:07', '2026-05-14 06:11:07'),
(10, 11, '🔔 Subscription Renewal Reminder', 'Your pro plan expires on 17/5/2026 (3 days left). Renew now to stay active.', 'system', 0, NULL, '2026-05-14 06:11:18', '2026-05-14 06:11:18'),
(11, 8, '🔔 Subscription Renewal Reminder', 'Your basic plan expires on 14/6/2026 (31 days left). Renew now to stay active.', 'system', 0, NULL, '2026-05-14 06:11:23', '2026-05-14 06:11:23'),
(12, 7, '🔔 Subscription Renewal Reminder', 'Your pro plan expires on 14/6/2026 (31 days left). Renew now to stay active.', 'system', 0, NULL, '2026-05-14 06:12:32', '2026-05-14 06:12:32'),
(13, 2, 'Worker Assigned', 'Anurag Pandey has been assigned to your booking #43', 'booking', 0, '{\"bookingId\":43}', '2026-05-22 07:57:29', '2026-05-22 07:57:29');

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

--
-- Dumping data for table `otps`
--

INSERT INTO `otps` (`id`, `mobile`, `otp`, `expires_at`, `is_used`, `created_at`, `updated_at`) VALUES
(7, '8855688255', '111111', '2026-05-20 05:05:56', 0, '2026-05-20 05:00:57', '2026-05-20 05:00:57'),
(10, '8840928016', '111111', '2026-05-20 05:10:37', 0, '2026-05-20 05:05:38', '2026-05-20 05:05:38'),
(11, '8544554855', '111111', '2026-05-20 05:12:24', 0, '2026-05-20 05:07:26', '2026-05-20 05:07:26'),
(12, '8840958095', '111111', '2026-05-20 05:44:40', 0, '2026-05-20 05:39:41', '2026-05-20 05:39:41'),
(13, '8555888899', '111111', '2026-05-20 05:46:49', 0, '2026-05-20 05:41:50', '2026-05-20 05:41:50'),
(16, '8840958016', '111111', '2026-05-20 05:53:24', 0, '2026-05-20 05:48:25', '2026-05-20 05:48:25'),
(17, '8855555558', '111111', '2026-05-20 06:01:06', 0, '2026-05-20 05:56:07', '2026-05-20 05:56:07'),
(19, '8840958855', '1111', '2026-05-20 06:09:53', 1, '2026-05-20 06:04:54', '2026-05-20 06:05:04'),
(21, '8555588665', '1111', '2026-05-20 06:16:02', 1, '2026-05-20 06:11:03', '2026-05-20 06:11:11'),
(22, '8840958019', '1111', '2026-05-20 06:19:34', 1, '2026-05-20 06:14:35', '2026-05-20 06:14:39'),
(23, '8885585588', '1111', '2026-05-20 06:20:47', 1, '2026-05-20 06:15:48', '2026-05-20 06:15:55'),
(25, '8375895787', '1111', '2026-05-20 07:41:08', 1, '2026-05-20 07:36:09', '2026-05-20 07:37:18'),
(39, '7081472797', '1111', '2026-05-25 04:28:56', 1, '2026-05-25 04:23:57', '2026-05-25 04:24:14'),
(44, '8090145106', '1111', '2026-05-25 11:23:22', 1, '2026-05-25 11:18:23', '2026-05-25 11:18:38'),
(48, '8840980168', '1111', '2026-05-26 17:54:01', 1, '2026-05-26 17:49:02', '2026-05-26 17:49:08'),
(49, '3758493023', '1111', '2026-05-26 18:15:11', 1, '2026-05-26 18:10:12', '2026-05-26 18:10:17'),
(55, '9876543210', '1111', '2026-05-27 11:39:38', 1, '2026-05-27 11:34:39', '2026-05-27 11:34:42');

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
  `category_id` int(11) NOT NULL,
  `name` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `estimated_time` varchar(50) DEFAULT NULL,
  `images` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`images`)),
  `faqs` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`faqs`)),
  `includes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`includes`)),
  `how_its_done` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`how_its_done`)),
  `does_not_include` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`does_not_include`)),
  `rating` decimal(2,1) DEFAULT 0.0,
  `rating_count` int(11) DEFAULT 0,
  `discount_percent` decimal(5,2) DEFAULT 0.00,
  `final_price` decimal(10,2) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Dumping data for table `services`
--

INSERT INTO `services` (`id`, `category_id`, `name`, `description`, `price`, `estimated_time`, `images`, `faqs`, `includes`, `how_its_done`, `does_not_include`, `rating`, `rating_count`, `discount_percent`, `final_price`, `is_active`, `created_at`, `updated_at`) VALUES
(27, 36, 'Appliance Repair', 'We provide expert appliance repair services for all major home appliances including air conditioners, refrigerators, washing machines, microwaves, and TVs. Our skilled technicians ensure quick diagnosis and efficient repair using quality parts.', 599.00, '3', '[\"1779452411894-aplience_repair.webp\"]', '[{\"question\":\"How long does it work?\",\"answer\":\"usually 2-3 hours\"}]', NULL, NULL, NULL, 0.0, 0, 7.00, 557.07, 1, '2026-05-22 12:20:12', '2026-05-25 05:41:34'),
(28, 34, 'Bridal Makeup Package', 'Professional bridal makeup service including HD makeup, hairstyling, and draping for your special day.', 7999.00, '4', '[\"1779691396949-ChatGPT_Image_May_25,_2026,_12_12_52_PM.webp\"]', '[{\"question\":\"How long does it take?\",\"answer\":\"Around 3-4 hours depending on the look\"},{\"question\":\"Do you provide products?\",\"answer\":\"Yes, all makeup products are provided\"},{\"question\":\"Can I choose my hairstyle?\",\"answer\":\"Yes, you can select your preferred style\"},{\"question\":\"Is a trial included?\",\"answer\":\"Trial can be added at extra cost\"}]', '[\"HD bridal makeup\",\"Hair styling (bun/ curls/ straightening)\",\"Saree/dupatta draping\",\"Skin prep & base correction\",\"False eyelashes application\"]', '[\"Consultation and skin analysis\",\"Face cleansing and skin prep\",\"Makeup application using HD products\",\"Hairstyling as per chosen look\",\"Final touch-up and setting spray\"]', '[\"Pre-bridal skin treatments\",\"Hair coloring\",\"Outstation travel charges\",\"Additional makeup for guests\"]', 0.0, 0, 15.00, 6799.15, 1, '2026-05-25 06:43:17', '2026-05-25 06:43:17');

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
(1, 'BOOK NOW', 'its a very useful application', '1779436545837-ChatGPT_Image_May_20,_2026,_03_45_10_PM.webp', 'both', '', 1, 1, '2026-05-13 10:34:14', '2026-05-22 07:55:46'),
(2, 'SUPER SAVING', 'up 80% off', '1779436458981-40.webp', 'user', '', 2, 1, '2026-05-20 10:22:23', '2026-05-22 07:54:19'),
(3, 'BRING ORDER TO EVERY SELF', 'neat fresh sorted', '1779436473149-3d3c5108-db1b-41ca-a875-b0ed7daf0ac9.webp', 'user', '', 3, 1, '2026-05-20 10:23:29', '2026-05-22 07:54:33'),
(4, 'BRING ORDER TO EVERY SELF', 'neat, fresh, sorted', '1779436487728-ChatGPT_Image_May_20,_2026,_03_45_04_PM.webp', 'user', '', 4, 1, '2026-05-20 10:24:11', '2026-05-22 07:54:47'),
(5, 'BRING ORDER TO EVERY SELF', 'neat, fresh, sorted', '1779436506432-ChatGPT_Image_May_20,_2026,_11_57_26_AM.webp', 'user', '', 5, 1, '2026-05-20 10:24:37', '2026-05-22 07:55:06');

-- --------------------------------------------------------

--
-- Table structure for table `slots`
--

CREATE TABLE `slots` (
  `id` int(11) NOT NULL,
  `date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `max_bookings` int(11) DEFAULT 10,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `slots`
--

INSERT INTO `slots` (`id`, `date`, `start_time`, `end_time`, `max_bookings`, `is_active`, `created_at`, `updated_at`) VALUES
(1, '2026-05-27', '10:49:00', '00:50:00', 10, 1, '2026-05-27 05:20:10', '2026-05-27 06:22:56');

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
(2, 'bhanta', 'bhatinda@gmail.com', '9876543210', NULL, NULL, NULL, NULL, NULL, 'user', 1, 0, '2026-05-12 07:08:47', '2026-05-23 07:44:32'),
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
(14, 'Kiran Car Wash', 'kiran@gmail.com', '9876543227', NULL, NULL, NULL, NULL, NULL, 'vendor', 1, 0, '2026-05-12 07:08:47', '2026-05-12 07:08:47'),
(15, NULL, NULL, '8840958855', NULL, NULL, NULL, NULL, NULL, 'user', 1, 0, '2026-05-20 05:59:36', '2026-05-20 05:59:36'),
(16, NULL, NULL, '8555588665', NULL, NULL, NULL, NULL, NULL, 'user', 1, 0, '2026-05-20 06:11:11', '2026-05-20 06:11:11'),
(17, NULL, NULL, '8840958019', NULL, NULL, NULL, NULL, NULL, 'user', 1, 0, '2026-05-20 06:14:39', '2026-05-20 06:14:39'),
(18, 'Rahul', '', '8885585588', NULL, NULL, NULL, NULL, NULL, 'user', 1, 0, '2026-05-20 06:15:55', '2026-05-20 12:37:38'),
(19, NULL, NULL, '8375895787', NULL, NULL, NULL, NULL, NULL, 'user', 1, 0, '2026-05-20 07:37:18', '2026-05-20 07:37:18'),
(20, 'Vivek', 'vivek@gmail.com', '8090145106', NULL, NULL, NULL, NULL, NULL, 'user', 1, 0, '2026-05-23 07:06:19', '2026-05-25 09:39:19'),
(21, NULL, NULL, '7081472797', NULL, NULL, NULL, NULL, NULL, 'user', 1, 0, '2026-05-25 04:24:14', '2026-05-25 04:24:14'),
(22, NULL, NULL, '8840980168', NULL, NULL, NULL, NULL, NULL, 'user', 1, 0, '2026-05-26 17:49:08', '2026-05-26 17:49:08'),
(23, NULL, NULL, '3758493023', NULL, NULL, NULL, NULL, NULL, 'user', 1, 0, '2026-05-26 18:10:17', '2026-05-26 18:10:17');

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
(1, 7, 'Kumar Plumbing Services', 'Expert plumbing solutions for homes and offices. 24/7 emergency service available.', NULL, NULL, 'Lajpat Nagar, New Delhi', 28.56720000, 77.24310000, NULL, 1, 0, 0, 'approved', NULL, 4.50, 25, NULL, NULL, '2026-05-12 07:08:47', '2026-05-19 09:37:26'),
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
(1, 1, 2, 'monthly', '2026-05-14 00:00:00', '2026-06-14 00:00:00', NULL, 'active', '2026-05-12 07:56:37', '2026-05-14 05:12:44'),
(2, 2, 1, 'monthly', '2026-05-14 00:00:00', '2026-06-14 00:00:00', NULL, 'active', '2026-05-12 07:56:37', '2026-05-14 05:12:44'),
(3, 3, 3, 'yearly', '2026-05-14 00:00:00', '2027-05-14 00:00:00', NULL, 'active', '2026-05-12 07:56:37', '2026-05-14 05:12:44'),
(4, 4, 1, 'monthly', '2026-04-19 00:00:00', '2026-05-19 00:00:00', NULL, 'active', '2026-05-12 07:56:37', '2026-05-14 05:12:44'),
(5, 5, 2, 'monthly', '2026-04-17 00:00:00', '2026-05-17 00:00:00', NULL, 'active', '2026-05-12 07:56:37', '2026-05-14 05:12:44'),
(6, 6, 2, 'monthly', '2026-04-29 00:00:00', '2026-05-29 00:00:00', NULL, 'active', '2026-05-12 07:56:37', '2026-05-14 05:12:44'),
(7, 7, 3, 'yearly', '2026-05-14 00:00:00', '2027-05-14 00:00:00', NULL, 'active', '2026-05-12 07:56:37', '2026-05-14 05:12:44'),
(8, 8, 1, 'monthly', '2026-05-14 00:00:00', '2026-06-14 00:00:00', NULL, 'active', '2026-05-12 07:56:37', '2026-05-14 05:12:44');

-- --------------------------------------------------------

--
-- Table structure for table `workers`
--

CREATE TABLE `workers` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `phone` varchar(15) NOT NULL,
  `aadhaar_number` varchar(12) DEFAULT NULL,
  `aadhaar_front` varchar(255) DEFAULT NULL,
  `aadhaar_back` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `is_blocked` tinyint(1) DEFAULT 0,
  `fcm_token` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `workers`
--

INSERT INTO `workers` (`id`, `name`, `email`, `phone`, `aadhaar_number`, `aadhaar_front`, `aadhaar_back`, `is_active`, `is_blocked`, `fcm_token`, `created_at`, `updated_at`) VALUES
(1, 'Anurag Pandey', 'anurag@gmail.com', '1234567890', '123456789012', '1779436619055-ChatGPT_Image_May_20,_2026,_03_45_04_PM.webp', '1779436619055-ChatGPT_Image_May_20,_2026,_03_45_04_PM.webp', 1, 0, NULL, '2026-05-22 07:56:59', '2026-05-22 07:56:59');

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
(6, 'india', '#6c47ff', 1, '2026-05-12 07:12:07', '2026-05-12 07:12:07', '[{\"lat\":36.26288131717469,\"lng\":72.73498953247072},{\"lat\":22.086661671007363,\"lng\":69.08752859497072},{\"lat\":7.820939855518303,\"lng\":78.14026296997072},{\"lat\":26.21558028881294,\"lng\":95.01526296997072}]'),
(7, 'Delhi', '#6c47ff', 1, '2026-05-15 05:15:32', '2026-05-15 05:15:32', '[{\"lat\":29.182974206860067,\"lng\":76.55394018554689},{\"lat\":29.221334233068703,\"lng\":78.56993139648439},{\"lat\":27.918824110715363,\"lng\":78.56443823242189},{\"lat\":27.86541886072603,\"lng\":76.53196752929689}]'),
(8, 'india', '#6c47ff', 1, '2026-05-22 09:51:55', '2026-05-22 09:51:55', '[{\"lat\":34.600371210725335,\"lng\":72.46256292724611},{\"lat\":34.744936387328536,\"lng\":91.79850042724611},{\"lat\":10.318898954235513,\"lng\":92.85318792724611},{\"lat\":9.972834579977581,\"lng\":67.71646917724611}]');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `addresses`
--
ALTER TABLE `addresses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `bookings`
--
ALTER TABLE `bookings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `service_id` (`service_id`),
  ADD KEY `idx_zone_id` (`zone_id`),
  ADD KEY `fk_booking_worker` (`worker_id`),
  ADD KEY `fk_bookings_address` (`address_id`),
  ADD KEY `fk_bookings_slot` (`slot_id`);

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
  ADD KEY `category_id` (`category_id`);

--
-- Indexes for table `sliders`
--
ALTER TABLE `sliders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_type_active` (`type`,`is_active`);

--
-- Indexes for table `slots`
--
ALTER TABLE `slots`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_slots_date` (`date`),
  ADD KEY `idx_slots_active_date` (`is_active`,`date`);

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
-- Indexes for table `workers`
--
ALTER TABLE `workers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `phone` (`phone`),
  ADD KEY `idx_phone` (`phone`);

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
-- AUTO_INCREMENT for table `addresses`
--
ALTER TABLE `addresses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `bookings`
--
ALTER TABLE `bookings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=61;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=39;

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `otps`
--
ALTER TABLE `otps`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=56;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT for table `sliders`
--
ALTER TABLE `sliders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `slots`
--
ALTER TABLE `slots`
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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

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
-- AUTO_INCREMENT for table `workers`
--
ALTER TABLE `workers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `zones`
--
ALTER TABLE `zones`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `addresses`
--
ALTER TABLE `addresses`
  ADD CONSTRAINT `addresses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `bookings`
--
ALTER TABLE `bookings`
  ADD CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `bookings_ibfk_3` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_booking_worker` FOREIGN KEY (`worker_id`) REFERENCES `workers` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_booking_zone` FOREIGN KEY (`zone_id`) REFERENCES `zones` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_bookings_address` FOREIGN KEY (`address_id`) REFERENCES `addresses` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_bookings_slot` FOREIGN KEY (`slot_id`) REFERENCES `slots` (`id`) ON DELETE SET NULL;

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
