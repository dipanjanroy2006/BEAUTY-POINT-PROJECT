import { Router, Request, Response } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { upload } from '../middleware/upload';

// Import Controllers
import * as authController from '../controllers/authController';
import * as productController from '../controllers/productController';
import * as categoryController from '../controllers/categoryController';
import * as reviewController from '../controllers/reviewController';
import * as orderController from '../controllers/orderController';
import * as adminController from '../controllers/adminController';
import * as customerController from '../controllers/customerController';
import * as couponController from '../controllers/couponController';
import * as referralController from '../controllers/referralController';
import { mysqlPool, isMySQLConnected } from '../db';

const router = Router();

// ---------------- USER & AUTH ROUTES ----------------
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/me', requireAuth, authController.getMe);

// ---------------- CATALOG CATEGORIES ----------------
router.get('/categories', categoryController.getAllCategories);
router.post('/categories', requireAdmin, upload.single('image'), categoryController.createCategory);
router.delete('/categories/:id', requireAdmin, categoryController.deleteCategory);

// ---------------- PRODUCTS CATALOG ----------------
router.get('/products', productController.getAllProducts);
router.get('/products/:id', productController.getProductById);
router.post('/products', requireAdmin, upload.single('image'), productController.createProduct);
router.put('/products/:id', requireAdmin, upload.single('image'), productController.updateProduct);
router.delete('/products/:id', requireAdmin, productController.deleteProduct);

// ---------------- USER REVIEWS ----------------
router.post('/reviews/:productId', requireAuth, reviewController.createReview);

// ---------------- MODERATED REVIEW MANAGEMENT ----------------
router.get('/admin/reviews', requireAdmin, reviewController.getAdminReviews);
router.put('/admin/reviews/:id/approve', requireAdmin, reviewController.approveReview);
router.delete('/admin/reviews/:id', requireAdmin, reviewController.deleteReview);

// ---------------- E-COMMERCE ORDERS ----------------
router.post('/orders', requireAuth, orderController.createOrder);
router.get('/orders', requireAuth, orderController.getOrders);
router.put('/orders/:id/status', requireAdmin, orderController.updateOrderStatus);

// ---------------- STOREFRONT SETTINGS & ADMIN ANALYTICS ----------------
router.get('/settings', adminController.getSettings);
router.put('/settings', requireAdmin, adminController.updateSettings);
router.get('/admin/stats', requireAdmin, adminController.getStats);

// ---------------- CUSTOMER MANAGEMENT SYSTEM ----------------
router.get('/admin/customers', requireAdmin, customerController.getCustomers);
router.get('/admin/customers/:id', requireAdmin, customerController.getCustomerDetails);
router.put('/admin/customers/:id', requireAdmin, customerController.updateCustomer);
router.put('/admin/customers/:id/block', requireAdmin, customerController.toggleBlockCustomer);

// ---------------- live database health check ----------------
router.get('/health', async (req: Request, res: Response) => {
  try {
    let dbConnected = false;
    let productsFound = false;
    let customersFound = false;
    let ordersFound = false;
    let dbErrorMessage = '';

    if (isMySQLConnected && mysqlPool) {
      try {
        const [connTest]: any = await mysqlPool.query('SELECT 1');
        if (connTest) {
          dbConnected = true;
          
          const [productsTable]: any = await mysqlPool.query("SHOW TABLES LIKE 'products'");
          productsFound = productsTable.length > 0;
          
          const [customersTable]: any = await mysqlPool.query("SHOW TABLES LIKE 'customers'");
          customersFound = customersTable.length > 0;
          
          const [ordersTable]: any = await mysqlPool.query("SHOW TABLES LIKE 'orders'");
          ordersFound = ordersTable.length > 0;
        }
      } catch (err: any) {
        dbErrorMessage = err.message;
      }
    }

    res.json({
      status: dbConnected ? 'success' : 'warning',
      serverRunning: true,
      databaseConnected: dbConnected,
      productsTableFound: productsFound,
      customersTableFound: customersFound,
      ordersTableFound: ordersFound,
      ...(dbErrorMessage ? { error: dbErrorMessage } : {})
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'error',
      serverRunning: true,
      databaseConnected: false,
      productsTableFound: false,
      customersTableFound: false,
      ordersTableFound: false,
      error: err.message
    });
  }
});

// ---------------- PROMOTIONAL COUPONS ----------------
router.get('/coupons', couponController.getCoupons);
router.get('/admin/coupons', requireAdmin, couponController.getAdminCoupons);
router.post('/admin/coupons', requireAdmin, couponController.createCoupon);
router.delete('/admin/coupons/:id', requireAdmin, couponController.deleteCoupon);

// ---------------- REFERRAL PROGRAM ----------------
router.get('/admin/referrals', requireAdmin, referralController.getAdminReferrals);

// ---------------- LOYALTY & REWARD COINS ----------------
router.post('/admin/products/bulk-rewards', requireAdmin, productController.bulkUpdateRewards);
router.post('/admin/customers/:id/adjust-wallet', requireAdmin, customerController.adjustCustomerWallet);
router.get('/admin/rewards/transactions', requireAdmin, adminController.getRewardTransactions);


export default router;
