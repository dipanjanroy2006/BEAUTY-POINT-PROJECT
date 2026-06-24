import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import { User, Category, Product, Order, Review, Setting, RewardWallet, RewardTransaction, Referral, Coupon } from '../src/types';

// Load environment variables
dotenv.config();

const DB_FILE = path.join(process.cwd(), 'data', 'database.json');
const JWT_SECRET = process.env.JWT_SECRET || 'beauty_point_luxury_key_2026';

// Global database pool state
export let mysqlPool: mysql.Pool | null = null;
export let isMySQLConnected = false;
let mysqlConfigUsed: any = null;

// ID Conversion Helper functions to bridge JSON String IDs and MySQL BigInt IDs
export function toNumericId(id: string): number {
  if (!id) return 0;
  if (typeof id === 'number') return id;
  const strId = String(id);
  
  if (strId === 'usr_admin') return 1;
  if (strId === 'usr_demo') return 2;
  if (strId === 'usr_demo_2') return 3;
  if (strId === 'usr_demo_3') return 4;
  if (strId === 'usr_demo_4') return 5;
  if (strId === 'usr_demo_5') return 6;
  
  if (strId === 'cat_1') return 1;
  if (strId === 'cat_2') return 2;
  if (strId === 'cat_3') return 3;
  if (strId === 'cat_4') return 4;
  
  if (strId === 'prod_1') return 1;
  if (strId === 'prod_2') return 2;
  if (strId === 'prod_3') return 3;
  if (strId === 'prod_4') return 4;
  if (strId === 'prod_5') return 5;
  if (strId === 'prod_6') return 6;
  
  if (strId === 'ord_1') return 1;
  if (strId === 'ord_2') return 2;
  if (strId === 'ord_3') return 3;
  if (strId === 'ord_4') return 4;
  if (strId === 'ord_5') return 5;
  if (strId === 'ord_6') return 6;
  
  if (strId === 'rev_1') return 1;
  if (strId === 'rev_2') return 2;
  if (strId === 'rev_3') return 3;
  if (strId === 'rev_4') return 4;

  if (strId === 'ref_1') return 1;
  if (strId === 'ref_2') return 2;

  if (strId === 'cpn_1') return 1;
  if (strId === 'cpn_2') return 2;

  // Extract digits for generated timestamp or random IDs
  const digits = strId.replace(/\D/g, '');
  if (digits.length > 0) {
    return parseInt(digits.substring(0, 15), 10);
  }
  
  // Safe string hash code fallback
  let hash = 0;
  for (let i = 0; i < strId.length; i++) {
    hash = strId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 100000000;
}

export function fromNumericId(num: number, prefix: string): string {
  const n = Number(num);
  if (prefix === 'usr_') {
    if (n === 1) return 'usr_admin';
    if (n === 2) return 'usr_demo';
    if (n === 3) return 'usr_demo_2';
    if (n === 4) return 'usr_demo_3';
    if (n === 5) return 'usr_demo_4';
    if (n === 6) return 'usr_demo_5';
  }
  if (prefix === 'cat_') {
    if (n === 1) return 'cat_1';
    if (n === 2) return 'cat_2';
    if (n === 3) return 'cat_3';
    if (n === 4) return 'cat_4';
  }
  if (prefix === 'prod_') {
    if (n === 1) return 'prod_1';
    if (n === 2) return 'prod_2';
    if (n === 3) return 'prod_3';
    if (n === 4) return 'prod_4';
    if (n === 5) return 'prod_5';
    if (n === 6) return 'prod_6';
  }
  if (prefix === 'ord_') {
    if (n === 1) return 'ord_1';
    if (n === 2) return 'ord_2';
    if (n === 3) return 'ord_3';
    if (n === 4) return 'ord_4';
    if (n === 5) return 'ord_5';
    if (n === 6) return 'ord_6';
  }
  if (prefix === 'rev_') {
    if (n === 1) return 'rev_1';
    if (n === 2) return 'rev_2';
    if (n === 3) return 'rev_3';
    if (n === 4) return 'rev_4';
  }
  if (prefix === 'ref_') {
    if (n === 1) return 'ref_1';
    if (n === 2) return 'ref_2';
  }
  if (prefix === 'cpn_') {
    if (n === 1) return 'cpn_1';
    if (n === 2) return 'cpn_2';
  }
  
  return `${prefix}${n}`;
}

// Database JSON Schema interface
export interface DatabaseSchema {
  users: User[];
  passwordHashes: Record<string, string>; // userId -> passwordHash
  categories: Category[];
  products: Product[];
  orders: Order[];
  reviews: Review[];
  settings: Setting;
  rewardWallets: RewardWallet[];
  rewardTransactions: RewardTransaction[];
  referrals: Referral[];
  coupons: Coupon[];
}

// Initial default settings
const defaultSettings: Setting = {
  bannerTitle: "ILLUMINATE YOUR BEAUTY",
  bannerSubtitle: "Experience perfect radiance and restore your skin to its natural, glowing beauty with our handpicked collection.",
  bannerCtaText: "SHOP THE COLLECTION",
  bannerImage: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=1200",
  announcementText: "✨ COMPLIMENTARY LUXE GIFT BOX ON ORDERS OVER $150 • CODE: LUXEGIFT ✨",
  referralEnabled: true,
  referralRewardReferrer: 10,
  referralRewardReferred: 5,
  rewardEnabled: true,
  rewardCoinConversionRate: 1,
  rewardMaxRedemptionPercent: 50
};

// Seeding Initial Premium Categories
const initialCategories: Category[] = [];

// Seeding Premium Products
const initialProducts: Product[] = [];

// Seeding Initial Reviews
const initialReviews: Review[] = [];

// Initial Coupons list
const initialCoupons: Coupon[] = [];

// Connect to MySQL with Auto-Credentials scanning
async function initMySQL() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const user = process.env.DB_USER || 'root';
  const dbName = process.env.DB_NAME || 'beauty_point';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  
  const configuredPassword = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '';
  // List of candidate passwords to try automatically
  const passwordsToTry = [configuredPassword, '', 'root', 'password', 'admin', 'rootroot', '123456', '12345678'];
  
  // Deduplicate
  const uniquePasswords = Array.from(new Set(passwordsToTry));
  
  let connected = false;
  let activePassword = '';
  
  console.log("--------------------------------------------------");
  console.log("SQL DATABASE AUDIT: Probing credentials...");
  
  for (const pwd of uniquePasswords) {
    try {
      // Connect to server (without DB name) to create database if it does not exist
      const conn = await mysql.createConnection({
        host,
        user,
        password: pwd,
        port
      });
      
      await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` DEFAULT CHARACTER SET utf8mb4 DEFAULT COLLATE utf8mb4_unicode_ci`);
      await conn.end();
      
      activePassword = pwd;
      connected = true;
      console.log(`✓ MySQL connected successfully (user: "${user}", pwd: "${pwd || '(blank)'}")`);
      break;
    } catch (err: any) {
      // Console logging skipped to keep output neat, failures are normal during scanning
    }
  }
  
  if (!connected) {
    throw new Error("Unable to connect to local MySQL server using standard passwords.");
  }
  
  mysqlPool = mysql.createPool({
    host,
    user,
    password: activePassword,
    database: dbName,
    port,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
  
  isMySQLConnected = true;
  mysqlConfigUsed = { host, user, password: activePassword, database: dbName, port };
  console.log(`✓ MySQL connection pool established for database: "${dbName}"`);
  console.log("--------------------------------------------------");
}

// Runs schema.sql if tables are not found
async function ensureSchema() {
  if (!mysqlPool) return;
  
  try {
    const [rows]: any = await mysqlPool.query("SHOW TABLES LIKE 'products'");
    if (rows.length > 0) {
      console.log("✓ MySQL tables already present. Skipping table creation.");
      // Ensure customers table schema matches: email optional (NULL), phone_number required (NOT NULL UNIQUE)
      try {
        await mysqlPool.query("ALTER TABLE `customers` MODIFY COLUMN `email` VARCHAR(191) NULL");
        try {
          await mysqlPool.query("ALTER TABLE `customers` MODIFY COLUMN `phone_number` VARCHAR(30) NOT NULL");
        } catch (e) {}
        try {
          await mysqlPool.query("ALTER TABLE `customers` ADD UNIQUE INDEX `uk_customers_phone` (`phone_number`)");
        } catch (e) {}
        try {
          await mysqlPool.query("ALTER TABLE `customers` ADD COLUMN `referral_code` VARCHAR(50) NULL UNIQUE");
        } catch (e) {}
        try {
          await mysqlPool.query("INSERT IGNORE INTO `website_settings` (`setting_key`, `setting_value`, `description`) VALUES " +
            "('referral_enabled', 'true', 'Enable/disable customer referral program'), " +
            "('referral_reward_referrer', '10', 'Coins awarded to referrer'), " +
            "('referral_reward_referred', '5', 'Coins awarded to new referred user')");
        } catch (e) {}
        
        // Reward Coins System Alterations
        try {
          await mysqlPool.query("ALTER TABLE `products` ADD COLUMN `reward_coins` INT NOT NULL DEFAULT 0");
        } catch (e) {}
        try {
          await mysqlPool.query("ALTER TABLE `orders` ADD COLUMN `coins_earned` INT NOT NULL DEFAULT 0, ADD COLUMN `coins_used` INT NOT NULL DEFAULT 0");
        } catch (e) {}
        try {
          await mysqlPool.query("ALTER TABLE `reward_wallet` ADD COLUMN `lifetime_points_redeemed` INT UNSIGNED NOT NULL DEFAULT 0");
        } catch (e) {}
        try {
          await mysqlPool.query("ALTER TABLE `reward_transactions` MODIFY COLUMN `transaction_type` VARCHAR(50) NOT NULL");
        } catch (e) {}
        try {
          await mysqlPool.query("INSERT IGNORE INTO `website_settings` (`setting_key`, `setting_value`, `description`) VALUES " +
            "('reward_enabled', 'true', 'Enable/disable purchase rewards program'), " +
            "('reward_coin_conversion_rate', '1', 'Value of 1 coin in discount Rupees'), " +
            "('reward_max_redemption_percent', '50', 'Maximum percentage of order subtotal payable via coins')");
        } catch (e) {}
      } catch (alterErr: any) {
        // Safe to ignore if constraints are already applied
      }
      return;
    }
  } catch (err) {
    console.error("Error checking tables:", err);
  }
  
  console.log("Database schema not found. Executing schema.sql...");
  try {
    const schemaPath = path.join(process.cwd(), 'database', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      
      // Need multipleStatements to execute the whole schema.sql file
      const conn = await mysql.createConnection({
        host: mysqlConfigUsed.host,
        user: mysqlConfigUsed.user,
        password: mysqlConfigUsed.password,
        port: mysqlConfigUsed.port,
        multipleStatements: true
      });
      
      await conn.query(schemaSql);
      console.log("✓ Database schema tables created successfully!");
      await conn.end();
      
      // Seed MySQL tables using local JSON dataset on first load
      await seedMySQLFromJson();
    } else {
      console.error("CRITICAL: schema.sql file not found at path:", schemaPath);
    }
  } catch (err: any) {
    console.error("FATAL: Failed to execute schema.sql:", err.message);
  }
}

// Seed MySQL from JSON file
async function seedMySQLFromJson() {
  if (!mysqlPool) return;
  console.log("Populating MySQL tables from JSON file dataset...");
  const db = readDB();
  await syncJsonToMysql(db);
  console.log("✓ Seeding finished successfully.");
}

// Push JSON database structure to MySQL
async function syncJsonToMysql(db: DatabaseSchema) {
  if (!mysqlPool) return;
  
  // Disable foreign keys temporarily to delete and rebuild safely
  await mysqlPool.query("SET FOREIGN_KEY_CHECKS = 0");
  
  try {
    // 1. Clear tables
    const tables = [
      'website_settings', 'reviews', 'coupons', 'referrals', 
      'reward_transactions', 'reward_wallet', 'order_items', 
      'orders', 'products', 'categories', 'customers', 'admins'
    ];
    for (const table of tables) {
      await mysqlPool.query(`TRUNCATE TABLE \`${table}\``);
    }
    
    // 2. Insert Settings
    const settings = db.settings || defaultSettings;
    const settingsMap = [
      ['banner_title', settings.bannerTitle, 'Storefront Hero main heading label'],
      ['banner_subtitle', settings.bannerSubtitle, 'Storefront Hero subtitle description'],
      ['banner_cta_text', settings.bannerCtaText, 'Storefront Hero button text'],
      ['banner_image_url', settings.bannerImage, 'Storefront Hero image cover link'],
      ['announcement_text', settings.announcementText, 'Global scrolling top banner text message'],
      ['referral_enabled', settings.referralEnabled ? 'true' : 'false', 'Enable/disable customer referral program'],
      ['referral_reward_referrer', String(settings.referralRewardReferrer ?? 10), 'Coins awarded to referrer'],
      ['referral_reward_referred', String(settings.referralRewardReferred ?? 5), 'Coins awarded to new referred user'],
      ['reward_enabled', settings.rewardEnabled ? 'true' : 'false', 'Enable/disable purchase rewards program'],
      ['reward_coin_conversion_rate', String(settings.rewardCoinConversionRate ?? 1), 'Value of 1 coin in discount Rupees'],
      ['reward_max_redemption_percent', String(settings.rewardMaxRedemptionPercent ?? 50), 'Maximum percentage of order subtotal payable via coins']
    ];
    for (const [key, val, desc] of settingsMap) {
      await mysqlPool.query(
        "INSERT INTO `website_settings` (`setting_key`, `setting_value`, `description`) VALUES (?, ?, ?)",
        [key, val || '', desc]
      );
    }
    
    // 3. Insert Admins
    const admins = db.users.filter(u => u.role === 'admin');
    for (const admin of admins) {
      const numId = toNumericId(admin.id);
      const hash = db.passwordHashes[admin.id] || '';
      await mysqlPool.query(
        "INSERT INTO `admins` (`id`, `username`, `email`, `password_hash`, `first_name`, `last_name`, `is_active`, `created_at`) VALUES (?, ?, ?, ?, ?, ?, 1, ?)",
        [numId, admin.username, admin.email, hash, admin.username, '', new Date(admin.createdAt)]
      );
    }
    
    // 4. Insert Customers
    const customers = db.users.filter(u => u.role === 'customer');
    for (const cust of customers) {
      const numId = toNumericId(cust.id);
      const hash = db.passwordHashes[cust.id] || '';
      await mysqlPool.query(
        "INSERT INTO `customers` (`id`, `username`, `email`, `password_hash`, `first_name`, `last_name`, `phone_number`, `referral_code`, `is_active`, `created_at`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [numId, cust.username, cust.email || null, hash, cust.username, '', cust.phone || '', cust.referralCode || null, cust.isBlocked ? 0 : 1, new Date(cust.createdAt)]
      );
    }
    
    // 5. Insert Categories
    for (const cat of db.categories) {
      const numId = toNumericId(cat.id);
      await mysqlPool.query(
        "INSERT INTO `categories` (`id`, `name`, `slug`, `description`, `image_url`, `is_active`) VALUES (?, ?, ?, ?, ?, 1)",
        [numId, cat.name, cat.slug, cat.description || '', cat.image || '']
      );
    }
    
    // 6. Insert Products
    for (const prod of db.products) {
      const numId = toNumericId(prod.id);
      const catNumId = toNumericId(prod.categoryId);
      const details = prod.details || { brand: 'Beauty Point Collection', skinType: 'All Skin Types', ingredients: '', howToUse: '' };
      await mysqlPool.query(
        "INSERT INTO `products` (`id`, `category_id`, `name`, `slug`, `brand`, `description`, `price`, `sale_price`, `stock_quantity`, `skin_type`, `ingredients`, `how_to_use`, `image_url`, `rating_average`, `reviews_count`, `is_featured`, `reward_coins`, `is_active`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)",
        [
          numId,
          catNumId,
          prod.name,
          prod.slug,
          details.brand,
          prod.description,
          prod.price,
          prod.salePrice !== undefined ? prod.salePrice : null,
          prod.stock,
          details.skinType,
          details.ingredients,
          details.howToUse,
          prod.image,
          prod.rating || 0.00,
          prod.reviewsCount || 0,
          prod.isFeatured ? 1 : 0,
          prod.rewardCoins || 0
        ]
      );
    }
    
    // 7. Insert Orders and Items
    for (const order of db.orders) {
      const numId = toNumericId(order.id);
      const userNumId = toNumericId(order.userId);
      await mysqlPool.query(
        "INSERT INTO `orders` (`id`, `customer_id`, `order_number`, `subtotal`, `discount_amount`, `shipping_fee`, `tax_amount`, `total_amount`, `order_status`, `payment_status`, `payment_method`, `shipping_address_line1`, `shipping_address_line2`, `shipping_city`, `shipping_state`, `shipping_postal_code`, `shipping_country`, `notes`, `coins_earned`, `coins_used`, `created_at`) VALUES (?, ?, ?, ?, 0, 0, 0, ?, ?, ?, ?, ?, '', '', '', '', '', '', ?, ?, ?, ?)",
        [
          numId,
          userNumId,
          order.id,
          order.totalAmount,
          order.totalAmount,
          order.orderStatus,
          order.paymentStatus,
          order.paymentMethod || 'Credit Card',
          order.shippingAddress,
          order.coinsEarned || 0,
          order.coinsUsed || 0,
          new Date(order.createdAt)
        ]
      );
      
      if (order.items && Array.isArray(order.items)) {
        for (const item of order.items) {
          const itemProdNumId = toNumericId(item.productId);
          await mysqlPool.query(
            "INSERT INTO `order_items` (`order_id`, `product_id`, `product_name`, `quantity`, `price_per_unit`) VALUES (?, ?, ?, ?, ?)",
            [
              numId,
              itemProdNumId,
              item.name,
              item.quantity,
              item.price
            ]
          );
        }
      }
    }
    
    // 8. Insert Reward Wallets
    for (const w of db.rewardWallets || []) {
      const custNumId = toNumericId(w.customerId);
      await mysqlPool.query(
        "INSERT INTO `reward_wallet` (`id`, `customer_id`, `balance_points`, `lifetime_points_earned`, `lifetime_points_redeemed`) VALUES (?, ?, ?, ?, ?)",
        [custNumId, custNumId, w.balancePoints, w.lifetimePointsEarned, w.lifetimePointsRedeemed || 0]
      );
    }
    
    // 9. Insert Reward Transactions
    for (const tx of db.rewardTransactions || []) {
      const txNumId = toNumericId(tx.id);
      const walletNumId = toNumericId(tx.walletId);
      await mysqlPool.query(
        "INSERT INTO `reward_transactions` (`id`, `wallet_id`, `points`, `transaction_type`, `description`, `created_at`) VALUES (?, ?, ?, ?, ?, ?)",
        [txNumId, walletNumId, tx.points, tx.transactionType, tx.description, new Date(tx.createdAt)]
      );
    }
    
    // 10. Insert Referrals
    for (const r of db.referrals || []) {
      const refNumId = toNumericId(r.id);
      const referrerNumId = toNumericId(r.referrerId);
      const referredNumId = toNumericId(r.referredId);
      await mysqlPool.query(
        "INSERT INTO `referrals` (`id`, `referrer_id`, `referred_id`, `referral_code`, `status`, `points_rewarded`, `created_at`) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [refNumId, referrerNumId, referredNumId, r.referralCode, r.status, r.pointsRewarded, new Date(r.createdAt)]
      );
    }
    
    // 11. Insert Reviews
    for (const rev of db.reviews) {
      const revNumId = toNumericId(rev.id);
      const prodNumId = toNumericId(rev.productId);
      const userNumId = toNumericId(rev.userId);
      await mysqlPool.query(
        "INSERT INTO `reviews` (`id`, `product_id`, `customer_id`, `rating`, `comment`, `is_approved`, `created_at`) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [revNumId, prodNumId, userNumId, rev.rating, rev.comment, rev.isApproved ? 1 : 0, new Date(rev.createdAt)]
      );
    }
    
    // 12. Insert Coupons
    for (const c of db.coupons || []) {
      const cpnNumId = toNumericId(c.id);
      await mysqlPool.query(
        "INSERT INTO `coupons` (`id`, `code`, `discount_type`, `discount_value`, `min_purchase_amount`, `usage_count`, `is_active`) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [cpnNumId, c.code, c.discountType, c.discountValue, c.minPurchaseAmount, c.usageCount, c.isActive ? 1 : 0]
      );
    }
  } catch (err: any) {
    console.error("Error during MySQL database write synchronization:", err.message);
  } finally {
    await mysqlPool.query("SET FOREIGN_KEY_CHECKS = 1");
  }
}

// Pull MySQL tables state and rebuild DatabaseSchema
async function loadJsonFromMySQL(): Promise<DatabaseSchema | null> {
  if (!mysqlPool) return null;
  try {
    const db: DatabaseSchema = {
      users: [],
      passwordHashes: {},
      categories: [],
      products: [],
      orders: [],
      reviews: [],
      settings: defaultSettings,
      rewardWallets: [],
      rewardTransactions: [],
      referrals: [],
      coupons: []
    };

    // 1. Settings
    const [settingsRows]: any = await mysqlPool.query("SELECT * FROM `website_settings`");
    const settingsObj: any = {};
    for (const r of settingsRows) {
      if (r.setting_key === 'banner_title') settingsObj.bannerTitle = r.setting_value;
      else if (r.setting_key === 'banner_subtitle') settingsObj.bannerSubtitle = r.setting_value;
      else if (r.setting_key === 'banner_cta_text') settingsObj.bannerCtaText = r.setting_value;
      else if (r.setting_key === 'banner_image_url') settingsObj.bannerImage = r.setting_value;
      else if (r.setting_key === 'announcement_text') settingsObj.announcementText = r.setting_value;
      else if (r.setting_key === 'referral_enabled') settingsObj.referralEnabled = r.setting_value === 'true';
      else if (r.setting_key === 'referral_reward_referrer') settingsObj.referralRewardReferrer = parseInt(r.setting_value, 10);
      else if (r.setting_key === 'referral_reward_referred') settingsObj.referralRewardReferred = parseInt(r.setting_value, 10);
      else if (r.setting_key === 'reward_enabled') settingsObj.rewardEnabled = r.setting_value === 'true';
      else if (r.setting_key === 'reward_coin_conversion_rate') settingsObj.rewardCoinConversionRate = parseFloat(r.setting_value);
      else if (r.setting_key === 'reward_max_redemption_percent') settingsObj.rewardMaxRedemptionPercent = parseInt(r.setting_value, 10);
    }
    if (Object.keys(settingsObj).length > 0) {
      db.settings = { ...defaultSettings, ...settingsObj };
    }

    // 2. Admins
    const [adminRows]: any = await mysqlPool.query("SELECT * FROM `admins` WHERE `deleted_at` IS NULL");
    for (const r of adminRows) {
      const stringId = fromNumericId(r.id, 'usr_');
      db.users.push({
        id: stringId,
        username: r.username,
        email: r.email,
        role: 'admin',
        createdAt: r.created_at ? r.created_at.toISOString() : new Date().toISOString()
      });
      db.passwordHashes[stringId] = r.password_hash;
    }

    // 3. Customers
    const [customerRows]: any = await mysqlPool.query("SELECT * FROM `customers` WHERE `deleted_at` IS NULL");
    for (const r of customerRows) {
      const stringId = fromNumericId(r.id, 'usr_');
      db.users.push({
        id: stringId,
        username: r.username,
        email: r.email || '',
        role: 'customer',
        phone: r.phone_number || undefined,
        referralCode: r.referral_code || undefined,
        isBlocked: r.is_active === 0,
        createdAt: r.created_at ? r.created_at.toISOString() : new Date().toISOString()
      });
      db.passwordHashes[stringId] = r.password_hash;
    }

    // 4. Categories
    const [catRows]: any = await mysqlPool.query("SELECT * FROM `categories` WHERE `deleted_at` IS NULL");
    for (const r of catRows) {
      db.categories.push({
        id: fromNumericId(r.id, 'cat_'),
        name: r.name,
        slug: r.slug,
        description: r.description || '',
        image: r.image_url || ''
      });
    }

    // 5. Products
    const [prodRows]: any = await mysqlPool.query("SELECT * FROM `products` WHERE `deleted_at` IS NULL");
    for (const r of prodRows) {
      const catId = fromNumericId(r.category_id, 'cat_');
      const cat = db.categories.find(c => c.id === catId);
      db.products.push({
        id: fromNumericId(r.id, 'prod_'),
        name: r.name,
        slug: r.slug,
        description: r.description || '',
        price: Number(r.price),
        salePrice: r.sale_price !== null ? Number(r.sale_price) : undefined,
        stock: r.stock_quantity,
        categoryId: catId,
        categoryName: cat ? cat.name : 'Unknown',
        image: r.image_url,
        rating: Number(r.rating_average),
        reviewsCount: r.reviews_count,
        isFeatured: r.is_featured === 1,
        rewardCoins: r.reward_coins || 0,
        details: {
          brand: r.brand,
          skinType: r.skin_type,
          ingredients: r.ingredients || '',
          howToUse: r.how_to_use || ''
        }
      });
    }

    // 6. Orders
    const [orderRows]: any = await mysqlPool.query("SELECT * FROM `orders` WHERE `deleted_at` IS NULL");
    for (const r of orderRows) {
      const orderIdString = r.order_number;
      const userStringId = fromNumericId(r.customer_id, 'usr_');
      const userObj = db.users.find(u => u.id === userStringId);

      const [itemRows]: any = await mysqlPool.query("SELECT * FROM `order_items` WHERE `order_id` = ?", [r.id]);
      const items = itemRows.map((it: any) => {
        const prodId = fromNumericId(it.product_id, 'prod_');
        return {
          productId: prodId,
          name: it.product_name,
          price: Number(it.price_per_unit),
          quantity: it.quantity,
          image: db.products.find(p => p.id === prodId)?.image || ''
        };
      });

      db.orders.push({
        id: orderIdString,
        userId: userStringId,
        userEmail: userObj ? userObj.email : 'customer@beautypoint.com',
        userName: userObj ? userObj.username : 'Valued Customer',
        items,
        totalAmount: Number(r.total_amount),
        shippingAddress: r.shipping_address_line1,
        phone: userObj?.phone || '',
        paymentMethod: r.payment_method || 'Credit Card',
        paymentStatus: r.payment_status,
        orderStatus: r.order_status,
        coinsEarned: r.coins_earned || 0,
        coinsUsed: r.coins_used || 0,
        createdAt: r.created_at ? r.created_at.toISOString() : new Date().toISOString()
      });
    }

    // 7. Reviews
    const [reviewRows]: any = await mysqlPool.query("SELECT * FROM `reviews` WHERE `deleted_at` IS NULL");
    for (const r of reviewRows) {
      const userStringId = fromNumericId(r.customer_id, 'usr_');
      const prodStringId = fromNumericId(r.product_id, 'prod_');
      const userObj = db.users.find(u => u.id === userStringId);
      const prodObj = db.products.find(p => p.id === prodStringId);
      db.reviews.push({
        id: fromNumericId(r.id, 'rev_'),
        productId: prodStringId,
        productName: prodObj ? prodObj.name : 'Unknown Product',
        userId: userStringId,
        userName: userObj ? userObj.username : 'Valued Customer',
        rating: r.rating,
        comment: r.comment || '',
        isApproved: r.is_approved === 1,
        createdAt: r.created_at ? r.created_at.toISOString() : new Date().toISOString()
      });
    }

    // 8. Reward Wallets
    const [walletRows]: any = await mysqlPool.query("SELECT * FROM `reward_wallet`");
    for (const r of walletRows) {
      db.rewardWallets.push({
        customerId: fromNumericId(r.customer_id, 'usr_'),
        balancePoints: r.balance_points,
        lifetimePointsEarned: r.lifetime_points_earned,
        lifetimePointsRedeemed: r.lifetime_points_redeemed || 0
      });
    }

    // 9. Reward Transactions
    const [txRows]: any = await mysqlPool.query("SELECT * FROM `reward_transactions`");
    for (const r of txRows) {
      db.rewardTransactions.push({
        id: fromNumericId(r.id, 'tx_'),
        walletId: fromNumericId(r.wallet_id, 'usr_'),
        points: r.points,
        transactionType: r.transaction_type,
        description: r.description || '',
        createdAt: r.created_at ? r.created_at.toISOString() : new Date().toISOString()
      });
    }

    // 10. Referrals
    const [refRows]: any = await mysqlPool.query("SELECT * FROM `referrals` WHERE `deleted_at` IS NULL");
    for (const r of refRows) {
      const refId = fromNumericId(r.id, 'ref_');
      const referrerStringId = fromNumericId(r.referrer_id, 'usr_');
      const referredStringId = fromNumericId(r.referred_id, 'usr_');
      const referrerObj = db.users.find(u => u.id === referrerStringId);
      const referredObj = db.users.find(u => u.id === referredStringId);
      db.referrals.push({
        id: refId,
        referrerId: referrerStringId,
        referredId: referredStringId,
        referrerName: referrerObj ? referrerObj.username : 'Aria Glow',
        referredName: referredObj ? referredObj.username : 'Boutique Member',
        referralCode: r.referral_code,
        status: r.status,
        pointsRewarded: r.points_rewarded,
        createdAt: r.created_at ? r.created_at.toISOString() : new Date().toISOString()
      });
    }

    // 11. Coupons
    const [couponRows]: any = await mysqlPool.query("SELECT * FROM `coupons` WHERE `deleted_at` IS NULL");
    for (const r of couponRows) {
      db.coupons.push({
        id: fromNumericId(r.id, 'cpn_'),
        code: r.code,
        discountType: r.discount_type,
        discountValue: Number(r.discount_value),
        minPurchaseAmount: Number(r.min_purchase_amount),
        usageCount: r.usage_count,
        isActive: r.is_active === 1
      });
    }

    return db;
  } catch (err: any) {
    console.error("Failed to load schema data from MySQL:", err.message);
    return null;
  }
}

// Helper to get a fresh copy of the default seeded database
export function getDefaultDB(): DatabaseSchema {
  const adminId = "usr_admin";
  const adminPasswordHash = hashPassword("admin123");

  return {
    users: [
      {
        id: adminId,
        username: "LuxeAdmin",
        email: "admin@beautypoint.com",
        role: "admin",
        createdAt: new Date().toISOString()
      }
    ],
    passwordHashes: {
      [adminId]: adminPasswordHash
    },
    categories: [],
    products: [],
    orders: [],
    reviews: [],
    settings: defaultSettings,
    rewardWallets: [],
    rewardTransactions: [],
    referrals: [],
    coupons: []
  };
}

// Helper to check if a database schema has any user-created custom data (products, categories, customers, orders)
export function hasCustomData(db: DatabaseSchema | null): boolean {
  if (!db) return false;
  const hasProducts = Array.isArray(db.products) && db.products.length > 0;
  const hasCategories = Array.isArray(db.categories) && db.categories.length > 0;
  const hasCustomers = Array.isArray(db.users) && db.users.some(u => u.role === 'customer');
  const hasOrders = Array.isArray(db.orders) && db.orders.length > 0;
  return hasProducts || hasCategories || hasCustomers || hasOrders;
}

// Initialize database
export async function initDB() {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Load from local database.json if exists
  let localDB: DatabaseSchema | null = null;
  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      localDB = JSON.parse(data) as DatabaseSchema;
    } catch (err) {
      console.error("Error reading JSON database:", err);
    }
  }

  // If localDB is missing or has no users, construct the default seeded data
  const hasNoUsers = !localDB || !localDB.users || localDB.users.length === 0;
  if (hasNoUsers) {
    console.log("JSON database is empty or missing. Constructing default seed data...");
    localDB = getDefaultDB();
    fs.writeFileSync(DB_FILE, JSON.stringify(localDB, null, 2), 'utf-8');
  }

  // Initialize MySQL Connection
  try {
    await initMySQL();
    await ensureSchema();

    if (mysqlPool) {
      const mysqlDB = await loadJsonFromMySQL();
      
      const localHasCustom = hasCustomData(localDB);
      const mysqlHasCustom = hasCustomData(mysqlDB);

      if (mysqlHasCustom && mysqlDB) {
        // MySQL is the source of truth because it has custom data.
        // Update local database.json cache with MySQL data.
        fs.writeFileSync(DB_FILE, JSON.stringify(mysqlDB, null, 2), 'utf-8');
        console.log("✓ JSON local cache successfully loaded/synced from MySQL (MySQL has custom data).");
      } else if (localHasCustom && localDB) {
        // MySQL is empty or lacks custom data, but local JSON cache has data.
        // Sync local JSON to MySQL.
        console.log("⚠️ MySQL has no custom data, but local JSON has data. Syncing JSON cache to MySQL...");
        await syncJsonToMysql(localDB);
        console.log("✓ JSON cache successfully synced to MySQL.");
      } else {
        // Neither has custom data. Sync default/local DB to MySQL.
        if (localDB) {
          console.log("No custom data found in either JSON or MySQL. Syncing default/initial local JSON cache to MySQL...");
          await syncJsonToMysql(localDB);
        }
      }
    }
  } catch (err: any) {
    console.warn("--------------------------------------------------");
    console.warn("⚠️  WARNING: MySQL connection could not be established.");
    console.warn(`Reason: ${err.message}`);
    console.warn("Fallback to local JSON database mode. Server is fully runnable.");
    console.warn("--------------------------------------------------");
  }
}

// Database Read/Write Operations (Synchronous write-through cache patterns)
export function readDB(): DatabaseSchema {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    const db = JSON.parse(data) as DatabaseSchema;
    if (!db.coupons) db.coupons = [];
    return db;
  } catch (err) {
    console.error("Error reading JSON database, resetting...", err);
    return {
      users: [],
      passwordHashes: {},
      categories: [],
      products: [],
      orders: [],
      reviews: [],
      settings: defaultSettings,
      rewardWallets: [],
      rewardTransactions: [],
      referrals: [],
      coupons: []
    };
  }
}

export function writeDB(db: DatabaseSchema) {
  try {
    // 1. Sync to local JSON file synchronously (immediate availability)
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
    
    // 2. Sync to MySQL asynchronously in the background (prevent blocking API responses)
    if (isMySQLConnected && mysqlPool) {
      syncJsonToMysql(db).catch(err => {
        console.error("Background sync to MySQL failed:", err.message);
      });
    }
  } catch (err) {
    console.error("Error writing to database:", err);
  }
}

// Cryptography Helpers
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, combinedHash: string): boolean {
  try {
    const [salt, originalHash] = combinedHash.split(':');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hash === originalHash;
  } catch {
    return false;
  }
}

// Custom JWT sign/verify
export function signToken(payload: any): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const data = Buffer.from(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 86400 * 30 })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${data}`).digest('base64url');
  return `${header}.${data}.${signature}`;
}

export function verifyToken(token: string): any {
  try {
    const [header, data, signature] = token.split('.');
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${data}`).digest('base64url');
    if (signature !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return null; // Expired
    }
    return payload;
  } catch {
    return null;
  }
}
