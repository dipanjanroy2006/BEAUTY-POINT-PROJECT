import { Request, Response } from 'express';
import { readDB, writeDB } from '../db';

/**
 * @route   GET /api/admin/stats
 * @desc    Get complete analytics, KPIs, charts, and activity feeds for the Admin Dashboard.
 * @access  Private (Admin only)
 * 
 * MYSQL PRODUCTION QUERIES REFERENCE:
 * 
 * -- 1. TOTAL PRODUCTS KPI
 * SELECT COUNT(*) AS total_products FROM `products` WHERE `deleted_at` IS NULL;
 * 
 * -- 2. TOTAL CUSTOMERS KPI
 * SELECT COUNT(*) AS total_customers FROM `customers` WHERE `deleted_at` IS NULL;
 * 
 * -- 3. TOTAL ORDERS KPI
 * SELECT COUNT(*) AS total_orders FROM `orders` WHERE `deleted_at` IS NULL;
 * 
 * -- 4. TOTAL REVENUE KPI
 * SELECT SUM(`total_amount`) AS total_revenue FROM `orders` WHERE `order_status` != 'cancelled' AND `deleted_at` IS NULL;
 * 
 * -- 5. REWARD COINS ISSUED KPI
 * SELECT SUM(`points`) AS reward_coins_issued FROM `reward_transactions` WHERE `points` > 0;
 * 
 * -- 6. REWARD COINS REDEEMED KPI
 * SELECT ABS(SUM(`points`)) AS reward_coins_redeemed FROM `reward_transactions` WHERE `points` < 0;
 * 
 * -- 7. SALES OVERVIEW CHART (Trailing 7 Days)
 * SELECT DATE(created_at) as date, SUM(total_amount) as revenue
 * FROM orders
 * WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
 *   AND order_status != 'cancelled'
 *   AND deleted_at IS NULL
 * GROUP BY DATE(created_at)
 * ORDER BY DATE(created_at) ASC;
 * 
 * -- 8. MONTHLY REVENUE CHART
 * SELECT DATE_FORMAT(created_at, '%b %Y') as month, SUM(total_amount) as revenue
 * FROM orders
 * WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 11 MONTH)
 *   AND order_status != 'cancelled'
 *   AND deleted_at IS NULL
 * GROUP BY YEAR(created_at), MONTH(created_at)
 * ORDER BY YEAR(created_at) ASC, MONTH(created_at) ASC;
 * 
 * -- 9. CUSTOMER GROWTH CHART (New customer count grouped by month)
 * SELECT DATE_FORMAT(created_at, '%b %Y') as month, COUNT(*) as new_customers
 * FROM customers
 * WHERE deleted_at IS NULL
 * GROUP BY YEAR(created_at), MONTH(created_at)
 * ORDER BY YEAR(created_at) ASC, MONTH(created_at) ASC;
 * 
 * -- 10. TOP PRODUCTS CHART (Best selling products by units sold & revenue)
 * SELECT p.id, p.name, SUM(oi.quantity) as units_sold, SUM(oi.total_price) as revenue
 * FROM order_items oi
 * JOIN products p ON oi.product_id = p.id
 * JOIN orders o ON oi.order_id = o.id
 * WHERE o.order_status != 'cancelled' AND o.deleted_at IS NULL
 * GROUP BY p.id, p.name
 * ORDER BY units_sold DESC
 * LIMIT 5;
 * 
 * -- 11. RECENT ACTIVITY FEED ( কেন্দ্রীয় টাইমলাইন )
 * (SELECT 'order' as type, o.order_number as reference, c.username, o.total_amount as value, o.created_at
 *  FROM orders o
 *  JOIN customers c ON o.customer_id = c.id
 *  WHERE o.deleted_at IS NULL)
 * UNION ALL
 * (SELECT 'review' as type, p.name as reference, c.username, r.rating as value, r.created_at
 *  FROM reviews r
 *  JOIN customers c ON r.customer_id = c.id
 *  JOIN products p ON r.product_id = p.id
 *  WHERE r.deleted_at IS NULL)
 * ORDER BY created_at DESC
 * LIMIT 10;
 */
export const getStats = (req: Request, res: Response) => {
  try {
    const db = readDB();

    // -------------------------------------------------------------
    // 1. CALCULATE CORE KPIS
    // -------------------------------------------------------------
    const completedOrders = db.orders.filter(o => o.orderStatus !== 'cancelled');
    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalOrders = db.orders.length;
    const totalCustomers = db.users.filter(u => u.role === 'customer').length;
    const totalProducts = db.products.length;
    const totalReviews = db.reviews.length;

    // Loyalty Points (Reward Coins) Calculations
    const rewardCoinsIssued = db.rewardTransactions
      .filter(tx => tx.points > 0)
      .reduce((sum, tx) => sum + tx.points, 0);

    const rewardCoinsRedeemed = Math.abs(
      db.rewardTransactions
        .filter(tx => tx.points < 0)
        .reduce((sum, tx) => sum + tx.points, 0)
    );

    // -------------------------------------------------------------
    // 2. STOCK SHORTAGE ALARMS (Low Stock)
    // -------------------------------------------------------------
    const lowStockThreshold = 10;
    const lowStockProducts = db.products
      .filter(p => p.stock <= lowStockThreshold)
      .map(p => ({
        id: p.id,
        name: p.name,
        stock: p.stock,
        brand: p.details?.brand || 'Collection'
      }));

    // -------------------------------------------------------------
    // 3. REVENUE BY CATEGORY WEIGHTS (Pie Chart)
    // -------------------------------------------------------------
    const categoryRevenueMap: Record<string, number> = {};
    db.categories.forEach(cat => {
      categoryRevenueMap[cat.name] = 0;
    });

    completedOrders.forEach(order => {
      order.items.forEach(item => {
        const product = db.products.find(p => p.id === item.productId);
        const categoryName = product ? product.categoryName : 'Other';
        categoryRevenueMap[categoryName] = (categoryRevenueMap[categoryName] || 0) + (item.price * item.quantity);
      });
    });

    const categoryRevenue = Object.entries(categoryRevenueMap).map(([name, value]) => ({
      name,
      value: Number(value.toFixed(2))
    }));

    // -------------------------------------------------------------
    // 4. CHART: SALES OVERVIEW (Last 7 Days Trend)
    // -------------------------------------------------------------
    const salesTrends: Record<string, number> = {};
    const daysToGenerate = 7;
    const now = new Date();

    for (let i = daysToGenerate - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateString = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      salesTrends[dateString] = 0;
    }

    completedOrders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      const dateString = orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (salesTrends[dateString] !== undefined) {
        salesTrends[dateString] += order.totalAmount;
      }
    });

    const salesTrendData = Object.entries(salesTrends).map(([date, revenue]) => ({
      date,
      revenue: Number(revenue.toFixed(2))
    }));

    // -------------------------------------------------------------
    // 5. CHART: MONTHLY REVENUE (Month-by-Month Current Year)
    // -------------------------------------------------------------
    const monthlyRevenueMap: Record<string, number> = {};
    const monthsToGenerate = 6;

    for (let i = monthsToGenerate - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(now.getMonth() - i);
      const key = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      monthlyRevenueMap[key] = 0;
    }

    completedOrders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      const key = orderDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (monthlyRevenueMap[key] !== undefined) {
        monthlyRevenueMap[key] += order.totalAmount;
      }
    });

    const monthlyRevenue = Object.entries(monthlyRevenueMap).map(([month, revenue]) => ({
      month,
      revenue: Number(revenue.toFixed(2))
    }));

    // -------------------------------------------------------------
    // 6. CHART: CUSTOMER GROWTH (Cumulative Over Last 6 Months)
    // -------------------------------------------------------------
    const customerGrowthMap: Record<string, number> = {};
    for (let i = monthsToGenerate - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(now.getMonth() - i);
      const key = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      customerGrowthMap[key] = 0;
    }

    db.users.filter(u => u.role === 'customer').forEach(u => {
      const regDate = new Date(u.createdAt);
      const key = regDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (customerGrowthMap[key] !== undefined) {
        customerGrowthMap[key] += 1;
      }
    });

    // Compute running/cumulative sum
    let cumulativeCustomers = 0;
    const customerGrowth = Object.entries(customerGrowthMap).map(([month, count]) => {
      cumulativeCustomers += count;
      return {
        month,
        newSignups: count,
        customers: cumulativeCustomers
      };
    });

    // -------------------------------------------------------------
    // 7. CHART: TOP PRODUCTS (Sorted by Sales Units)
    // -------------------------------------------------------------
    const productSalesMap: Record<string, { name: string; unitsSold: number; revenue: number; image: string }> = {};
    completedOrders.forEach(order => {
      order.items.forEach(item => {
        if (!productSalesMap[item.productId]) {
          productSalesMap[item.productId] = {
            name: item.name,
            unitsSold: 0,
            revenue: 0,
            image: item.image || 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&q=80&w=400'
          };
        }
        productSalesMap[item.productId].unitsSold += item.quantity;
        productSalesMap[item.productId].revenue += item.price * item.quantity;
      });
    });

    const topProducts = Object.entries(productSalesMap)
      .map(([id, productData]) => ({
        id,
        name: productData.name,
        unitsSold: productData.unitsSold,
        revenue: Number(productData.revenue.toFixed(2)),
        image: productData.image
      }))
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 5);

    // 7.1 TOP COIN-EARNING PRODUCTS (Sorted by generated coins)
    const topCoinProducts = [...db.products]
      .map(p => {
        const unitsSold = completedOrders.reduce((sum, o) => {
          const item = o.items.find(it => it.productId === p.id);
          return sum + (item ? item.quantity : 0);
        }, 0);
        return {
          id: p.id,
          name: p.name,
          rewardCoins: p.rewardCoins || 0,
          totalCoinsEarned: unitsSold * (p.rewardCoins || 0),
          unitsSold,
          image: p.image
        };
      })
      .sort((a, b) => b.totalCoinsEarned - a.totalCoinsEarned)
      .slice(0, 5);

    // 7.2 TOP CUSTOMERS BY WALLET COINS EARNED
    const topCustomers = db.users
      .filter(u => u.role === 'customer')
      .map(u => {
        const wallet = db.rewardWallets.find(w => w.customerId === u.id) || {
          balancePoints: 0,
          lifetimePointsEarned: 0
        };
        return {
          id: u.id,
          username: u.username,
          email: u.email,
          phone: u.phone,
          balancePoints: wallet.balancePoints,
          lifetimePointsEarned: wallet.lifetimePointsEarned
        };
      })
      .sort((a, b) => b.lifetimePointsEarned - a.lifetimePointsEarned)
      .slice(0, 5);

    // 7.3 ACTIVE REWARD MEMBERS COUNT
    const activeRewardMembers = db.rewardWallets.filter(w => w.balancePoints > 0).length;

    // -------------------------------------------------------------
    // 8. RECENT ACTIVITY TIMELINE FEED (Sorted Chronologically)
    // -------------------------------------------------------------
    interface ActivityItem {
      id: string;
      type: 'order' | 'review' | 'reward' | 'signup';
      title: string;
      description: string;
      user: string;
      value?: string;
      createdAt: string;
    }

    const activities: ActivityItem[] = [];

    // Order actions
    db.orders.forEach(o => {
      activities.push({
        id: `order_${o.id}`,
        type: 'order',
        title: 'New Order Placed',
        description: `Order BP-${o.id.substring(0, 5).toUpperCase()} has been submitted`,
        user: o.userName || o.userEmail,
        value: `$${o.totalAmount.toFixed(2)}`,
        createdAt: o.createdAt
      });
    });

    // Customer registrations
    db.users.filter(u => u.role === 'customer').forEach(u => {
      activities.push({
        id: `user_${u.id}`,
        type: 'signup',
        title: 'Boutique Member Joined',
        description: `Account created for ${u.username}`,
        user: u.username,
        createdAt: u.createdAt
      });
    });

    // Product reviews
    db.reviews.forEach(r => {
      activities.push({
        id: `review_${r.id}`,
        type: 'review',
        title: 'Boutique Review Received',
        description: `Left ${r.rating}-star review on "${r.productName}"`,
        user: r.userName,
        value: `${r.rating} ★`,
        createdAt: r.createdAt
      });
    });

    // Reward transaction points
    db.rewardTransactions.forEach(tx => {
      activities.push({
        id: `reward_${tx.id}`,
        type: 'reward',
        title: tx.points > 0 ? 'Loyalty Points Earned' : 'Loyalty Points Redeemed',
        description: tx.description,
        user: tx.walletId === 'usr_demo' ? 'Aria Glow' : 'Boutique Member',
        value: `${tx.points > 0 ? '+' : ''}${tx.points} pts`,
        createdAt: tx.createdAt
      });
    });

    // Sort combined feed by latest datetime
    const recentActivityFeed = activities
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    // Send final statistics JSON response
    res.json({
      summary: {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalOrders,
        totalCustomers,
        totalProducts,
        totalReviews,
        rewardCoinsIssued,
        rewardCoinsRedeemed,
        lowStockCount: lowStockProducts.length,
        activeRewardMembers
      },
      lowStockProducts,
      categoryRevenue,
      salesTrends: salesTrendData,
      monthlyRevenue,
      customerGrowth,
      topProducts,
      recentActivityFeed,
      topCoinProducts,
      topCustomers
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve admin stats: ' + err.message });
  }
};

export const getSettings = (req: Request, res: Response) => {
  try {
    const db = readDB();
    res.json(db.settings);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve settings: ' + err.message });
  }
};

export const updateSettings = (req: Request, res: Response) => {
  try {
    const { 
      bannerTitle, bannerSubtitle, bannerCtaText, bannerImage, announcementText,
      referralEnabled, referralRewardReferrer, referralRewardReferred,
      rewardEnabled, rewardCoinConversionRate, rewardMaxRedemptionPercent
    } = req.body;

    const db = readDB();

    db.settings = {
      bannerTitle: bannerTitle || db.settings.bannerTitle,
      bannerSubtitle: bannerSubtitle || db.settings.bannerSubtitle,
      bannerCtaText: bannerCtaText || db.settings.bannerCtaText,
      bannerImage: bannerImage || db.settings.bannerImage,
      announcementText: announcementText || db.settings.announcementText,
      
      referralEnabled: referralEnabled !== undefined ? (referralEnabled === true || referralEnabled === 'true') : db.settings.referralEnabled,
      referralRewardReferrer: referralRewardReferrer !== undefined ? Number(referralRewardReferrer) : db.settings.referralRewardReferrer,
      referralRewardReferred: referralRewardReferred !== undefined ? Number(referralRewardReferred) : db.settings.referralRewardReferred,
      
      rewardEnabled: rewardEnabled !== undefined ? (rewardEnabled === true || rewardEnabled === 'true') : db.settings.rewardEnabled,
      rewardCoinConversionRate: rewardCoinConversionRate !== undefined ? Number(rewardCoinConversionRate) : db.settings.rewardCoinConversionRate,
      rewardMaxRedemptionPercent: rewardMaxRedemptionPercent !== undefined ? Number(rewardMaxRedemptionPercent) : db.settings.rewardMaxRedemptionPercent
    };

    writeDB(db);

    res.json({
      message: 'Storefront settings updated successfully!',
      settings: db.settings
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update settings: ' + err.message });
  }
};

export const getRewardTransactions = (req: Request, res: Response) => {
  try {
    const db = readDB();
    const txs = db.rewardTransactions.map(tx => {
      const wallet = db.rewardWallets.find(w => w.id === tx.walletId || w.customerId === tx.walletId);
      const customer = wallet ? db.users.find(u => u.id === wallet.customerId) : null;
      return {
        id: tx.id,
        walletId: tx.walletId,
        customerId: wallet ? wallet.customerId : null,
        customerName: customer ? customer.username : 'Unknown',
        customerEmail: customer ? customer.email : 'Unknown',
        points: tx.points,
        transactionType: tx.transactionType,
        description: tx.description,
        createdAt: tx.createdAt
      };
    });
    // Sort descending by date
    txs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(txs);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve transactions: ' + err.message });
  }
};

