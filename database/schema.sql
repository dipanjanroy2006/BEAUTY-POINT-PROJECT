-- ============================================================================
-- Beauty Point Cosmetics - Production Database Architecture (MySQL 8.0+)
-- Author: AI Coding Agent
-- Date: 2026-06-24
-- Description: Complete MySQL Relational Database Schema optimized for scale,
--              featuring indexes, foreign key constraints, reward systems, 
--              referrals, soft deletes, and professional naming conventions.
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `beauty_point`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `beauty_point`;

-- Disable foreign key checks temporarily to avoid drop ordering conflicts
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `website_settings`;
DROP TABLE IF EXISTS `reviews`;
DROP TABLE IF EXISTS `coupons`;
DROP TABLE IF EXISTS `referrals`;
DROP TABLE IF EXISTS `reward_transactions`;
DROP TABLE IF EXISTS `reward_wallet`;
DROP TABLE IF EXISTS `wishlist`;
DROP TABLE IF EXISTS `cart`;
DROP TABLE IF EXISTS `order_items`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `customers`;
DROP TABLE IF EXISTS `admins`;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- 1. Table: admins
-- Purpose: Backend administrators who moderates review queues, updates settings,
--          and manages catalog inventory.
-- ============================================================================
CREATE TABLE `admins` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(100) NOT NULL UNIQUE,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `first_name` VARCHAR(100) NULL,
  `last_name` VARCHAR(100) NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  
  -- Indexes for active/soft delete lookups
  INDEX `idx_admins_is_active` (`is_active`),
  INDEX `idx_admins_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- 2. Table: customers
-- Purpose: Registered retail buyers with addresses and authentication profiles.
-- ============================================================================
CREATE TABLE `customers` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(100) NOT NULL UNIQUE,
  `email` VARCHAR(191) NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `first_name` VARCHAR(100) NULL,
  `last_name` VARCHAR(100) NULL,
  `phone_number` VARCHAR(30) NOT NULL UNIQUE,
  `referral_code` VARCHAR(50) NULL UNIQUE,
  `profile_picture_url` VARCHAR(2048) NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  
  -- Performance Indexes
  INDEX `idx_customers_is_active` (`is_active`),
  INDEX `idx_customers_deleted_at` (`deleted_at`),
  INDEX `idx_customers_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- 3. Table: categories
-- Purpose: Hierarchy of product types (e.g. Skincare, Makeup, Haircare).
-- ============================================================================
CREATE TABLE `categories` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(150) NOT NULL UNIQUE,
  `description` TEXT NULL,
  `image_url` VARCHAR(2048) NULL,
  `parent_id` BIGINT UNSIGNED NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  
  -- Constraints & Indexes
  CONSTRAINT `fk_categories_parent_id` FOREIGN KEY (`parent_id`) 
    REFERENCES `categories` (`id`) ON DELETE SET NULL,
  INDEX `idx_categories_is_active` (`is_active`),
  INDEX `idx_categories_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- 4. Table: products
-- Purpose: Luxury cosmetics catalog storing formula specs, ingredients, and pricing.
-- ============================================================================
CREATE TABLE `products` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `category_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `brand` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `price` DECIMAL(10, 2) NOT NULL,
  `sale_price` DECIMAL(10, 2) NULL,
  `stock_quantity` INT NOT NULL DEFAULT 0,
  `skin_type` VARCHAR(150) NOT NULL DEFAULT 'All Skin Types',
  `ingredients` TEXT NULL,
  `how_to_use` TEXT NULL,
  `image_url` VARCHAR(2048) NOT NULL,
  `rating_average` DECIMAL(3, 2) NOT NULL DEFAULT 0.00,
  `reviews_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `is_featured` TINYINT(1) NOT NULL DEFAULT 0,
  `reward_coins` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  
  -- Foreign Keys, Integrity Constraints & Indexes
  CONSTRAINT `fk_products_category_id` FOREIGN KEY (`category_id`) 
    REFERENCES `categories` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_products_price` CHECK (`price` >= 0.00),
  CONSTRAINT `chk_products_sale_price` CHECK (`sale_price` IS NULL OR `sale_price` >= 0.00),
  INDEX `idx_products_brand` (`brand`),
  INDEX `idx_products_is_featured` (`is_featured`),
  INDEX `idx_products_is_active` (`is_active`),
  INDEX `idx_products_deleted_at` (`deleted_at`),
  INDEX `idx_products_price` (`price`),
  INDEX `idx_products_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- 5. Table: orders
-- Purpose: Ledger of final customer transactions with full shipment tracking.
-- ============================================================================
CREATE TABLE `orders` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `customer_id` BIGINT UNSIGNED NOT NULL,
  `order_number` VARCHAR(50) NOT NULL UNIQUE,
  `subtotal` DECIMAL(10, 2) NOT NULL,
  `discount_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `shipping_fee` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `tax_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `total_amount` DECIMAL(10, 2) NOT NULL,
  `order_status` ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded') NOT NULL DEFAULT 'pending',
  `payment_status` ENUM('unpaid', 'paid', 'partially_refunded', 'refunded', 'failed') NOT NULL DEFAULT 'unpaid',
  `payment_method` VARCHAR(50) NULL,
  `shipping_address_line1` VARCHAR(255) NOT NULL,
  `shipping_address_line2` VARCHAR(255) NULL,
  `shipping_city` VARCHAR(100) NOT NULL,
  `shipping_state` VARCHAR(100) NOT NULL,
  `shipping_postal_code` VARCHAR(20) NOT NULL,
  `shipping_country` VARCHAR(100) NOT NULL,
  `tracking_number` VARCHAR(100) NULL,
  `notes` TEXT NULL,
  `coins_earned` INT NOT NULL DEFAULT 0,
  `coins_used` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  
  -- Foreign Keys & Operational Indexes
  CONSTRAINT `fk_orders_customer_id` FOREIGN KEY (`customer_id`) 
    REFERENCES `customers` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_orders_amounts` CHECK (`total_amount` >= 0.00),
  INDEX `idx_orders_status` (`order_status`),
  INDEX `idx_orders_payment_status` (`payment_status`),
  INDEX `idx_orders_created_at` (`created_at`),
  INDEX `idx_orders_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- 6. Table: order_items
-- Purpose: Line-item decomposition of each order storing exact prices at purchase
--          time to handle historical price changes.
-- ============================================================================
CREATE TABLE `order_items` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `order_id` BIGINT UNSIGNED NOT NULL,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `product_name` VARCHAR(255) NOT NULL, -- Safeguard for product name edits
  `quantity` INT NOT NULL,
  `price_per_unit` DECIMAL(10, 2) NOT NULL,
  `total_price` DECIMAL(10, 2) GENERATED ALWAYS AS (`quantity` * `price_per_unit`) STORED,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign Keys & Indexes
  CONSTRAINT `fk_order_items_order_id` FOREIGN KEY (`order_id`) 
    REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_order_items_product_id` FOREIGN KEY (`product_id`) 
    REFERENCES `products` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_order_items_qty` CHECK (`quantity` > 0),
  CONSTRAINT `chk_order_items_price` CHECK (`price_per_unit` >= 0.00)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- 7. Table: cart
-- Purpose: Persistent storage for unpurchased customer shopping bags.
-- ============================================================================
CREATE TABLE `cart` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `customer_id` BIGINT UNSIGNED NOT NULL,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign Keys & Multi-column Unique Indexes
  CONSTRAINT `fk_cart_customer_id` FOREIGN KEY (`customer_id`) 
    REFERENCES `customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cart_product_id` FOREIGN KEY (`product_id`) 
    REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_cart_quantity` CHECK (`quantity` > 0),
  UNIQUE KEY `uk_customer_product_cart` (`customer_id`, `product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- 8. Table: wishlist
-- Purpose: Customer bookmarks of favorite luxury formulations.
-- ============================================================================
CREATE TABLE `wishlist` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `customer_id` BIGINT UNSIGNED NOT NULL,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign Keys & Multi-column Unique Indexes
  CONSTRAINT `fk_wishlist_customer_id` FOREIGN KEY (`customer_id`) 
    REFERENCES `customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_wishlist_product_id` FOREIGN KEY (`product_id`) 
    REFERENCES `products` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_customer_product_wishlist` (`customer_id`, `product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- 9. Table: reward_wallet
-- Purpose: Ledger of beauty club loyalty points accumulated by each customer.
-- ============================================================================
CREATE TABLE `reward_wallet` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `customer_id` BIGINT UNSIGNED NOT NULL UNIQUE,
  `balance_points` INT NOT NULL DEFAULT 0,
  `lifetime_points_earned` INT UNSIGNED NOT NULL DEFAULT 0,
  `lifetime_points_redeemed` INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign Keys & Constraints
  CONSTRAINT `fk_reward_wallet_customer_id` FOREIGN KEY (`customer_id`) 
    REFERENCES `customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_reward_wallet_balance` CHECK (`balance_points` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- 10. Table: reward_transactions
-- Purpose: Audit history tracking how loyalty points were earned or redeemed.
-- ============================================================================
CREATE TABLE `reward_transactions` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `wallet_id` BIGINT UNSIGNED NOT NULL,
  `points` INT NOT NULL, -- Can be negative (redemption) or positive (earning)
  `transaction_type` VARCHAR(50) NOT NULL,
  `description` VARCHAR(255) NULL,
  `reference_id` BIGINT UNSIGNED NULL, -- Points to relevant order_id or referral_id
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign Keys & Performance Indexes
  CONSTRAINT `fk_reward_tx_wallet_id` FOREIGN KEY (`wallet_id`) 
    REFERENCES `reward_wallet` (`id`) ON DELETE CASCADE,
  INDEX `idx_reward_transactions_type` (`transaction_type`),
  INDEX `idx_reward_transactions_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- 11. Table: referrals
-- Purpose: Records tracking peer-to-peer affiliate referrals.
-- ============================================================================
CREATE TABLE `referrals` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `referrer_id` BIGINT UNSIGNED NOT NULL, -- Shareholder
  `referred_id` BIGINT UNSIGNED NOT NULL UNIQUE, -- Invitee
  `referral_code` VARCHAR(50) NOT NULL,
  `status` ENUM('pending', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  `points_rewarded` INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  
  -- Foreign Keys & Operational Indexes
  CONSTRAINT `fk_referrals_referrer_id` FOREIGN KEY (`referrer_id`) 
    REFERENCES `customers` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_referrals_referred_id` FOREIGN KEY (`referred_id`) 
    REFERENCES `customers` (`id`) ON DELETE CASCADE,
  INDEX `idx_referrals_code` (`referral_code`),
  INDEX `idx_referrals_status` (`status`),
  INDEX `idx_referrals_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- 12. Table: coupons
-- Purpose: Interactive storefront promotional coupon rules and limits.
-- ============================================================================
CREATE TABLE `coupons` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `discount_type` ENUM('percentage', 'fixed_amount', 'free_shipping') NOT NULL,
  `discount_value` DECIMAL(10, 2) NOT NULL,
  `min_purchase_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `max_discount_amount` DECIMAL(10, 2) NULL,
  `start_date` TIMESTAMP NULL DEFAULT NULL,
  `end_date` TIMESTAMP NULL DEFAULT NULL,
  `usage_limit` INT UNSIGNED NULL DEFAULT NULL,
  `usage_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  
  -- Integrity constraints and lookups
  CONSTRAINT `chk_coupons_discount_value` CHECK (`discount_value` >= 0.00),
  CONSTRAINT `chk_coupons_min_purchase` CHECK (`min_purchase_amount` >= 0.00),
  INDEX `idx_coupons_active_dates` (`is_active`, `start_date`, `end_date`),
  INDEX `idx_coupons_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- 13. Table: reviews
-- Purpose: Moderated ratings & comments on cosmetics.
-- ============================================================================
CREATE TABLE `reviews` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `customer_id` BIGINT UNSIGNED NOT NULL,
  `rating` TINYINT NOT NULL,
  `comment` TEXT NULL,
  `is_approved` TINYINT(1) NOT NULL DEFAULT 0,
  `approved_by` BIGINT UNSIGNED NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  
  -- Foreign Keys, Constraints & Indexes
  CONSTRAINT `fk_reviews_product_id` FOREIGN KEY (`product_id`) 
    REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_reviews_customer_id` FOREIGN KEY (`customer_id`) 
    REFERENCES `customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_reviews_approved_by` FOREIGN KEY (`approved_by`) 
    REFERENCES `admins` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_reviews_rating` CHECK (`rating` BETWEEN 1 AND 5),
  INDEX `idx_reviews_approved` (`product_id`, `is_approved`),
  INDEX `idx_reviews_deleted_at` (`deleted_at`),
  INDEX `idx_reviews_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- 14. Table: website_settings
-- Purpose: Key-value metadata table managing storefront design details, banners,
--          and global announcements.
-- ============================================================================
CREATE TABLE `website_settings` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `setting_key` VARCHAR(100) NOT NULL UNIQUE,
  `setting_value` TEXT NULL,
  `description` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Fast index on keys
  INDEX `idx_website_settings_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- INITIAL DATA SEEDING (SAMPLE RECORDS)
-- ============================================================================

INSERT INTO `website_settings` (`setting_key`, `setting_value`, `description`) VALUES 
('banner_title', 'ILLUMINATE YOUR BEAUTY', 'Storefront Hero main heading label'),
('banner_subtitle', 'Experience perfect radiance and restore your skin to its natural, glowing beauty with our handpicked collection.', 'Storefront Hero subtitle description'),
('banner_cta_text', 'SHOP THE COLLECTION', 'Storefront Hero button text'),
('banner_image_url', 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=1200', 'Storefront Hero image cover link'),
('announcement_text', '✨ COMPLIMENTARY LUXE GIFT BOX ON ORDERS OVER $150 • CODE: LUXEGIFT ✨', 'Global scrolling top banner text message'),
('referral_enabled', 'true', 'Enable/disable customer referral program'),
('referral_reward_referrer', '10', 'Coins awarded to referrer'),
('referral_reward_referred', '5', 'Coins awarded to new referred user'),
('reward_enabled', 'true', 'Enable/disable purchase rewards program'),
('reward_coin_conversion_rate', '1', 'Value of 1 coin in discount Rupees'),
('reward_max_redemption_percent', '50', 'Maximum percentage of order subtotal payable via coins');

INSERT INTO `admins` (`id`, `username`, `email`, `password_hash`, `first_name`, `last_name`) VALUES 
(1, 'LuxeAdmin', 'admin@beautypoint.com', '$2b$10$xyzExampleHashAdminSecurePwd123', 'Luxe', 'Administrator');



-- ============================================================================
-- End of SQL Scripts
-- ============================================================================
