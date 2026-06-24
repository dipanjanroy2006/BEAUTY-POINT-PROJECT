import { Request, Response } from 'express';
import { readDB, writeDB } from '../db';
import { User, RewardWallet, RewardTransaction, Referral, Order } from '../../src/types';

/**
 * PRODUCTION MYSQL QUERIES REFERENCE:
 * 
 * -- 1. TOTAL CUSTOMERS STATISTIC
 * SELECT COUNT(*) AS total_customers FROM `users` WHERE `role` = 'customer';
 * 
 * -- 2. ACTIVE CUSTOMERS STATISTIC
 * SELECT COUNT(*) AS active_customers FROM `users` WHERE `role` = 'customer' AND (`isBlocked` = 0 OR `isBlocked` IS NULL);
 * 
 * -- 3. VIP CUSTOMERS STATISTIC
 * SELECT COUNT(DISTINCT u.id) AS vip_customers 
 * FROM `users` u
 * JOIN `reward_wallets` w ON u.id = w.customerId
 * WHERE u.role = 'customer' AND (w.balancePoints >= 300 OR w.lifetimePointsEarned >= 500);
 * 
 * -- 4. NEW CUSTOMERS STATISTIC (Past 30 Days)
 * SELECT COUNT(*) AS new_customers FROM `users` WHERE `role` = 'customer' AND `createdAt` >= DATE_SUB(NOW(), INTERVAL 30 DAY);
 * 
 * -- 5. SEARCH & LIST CUSTOMERS WITH WALLET BALANCES
 * SELECT u.*, w.balancePoints, w.lifetimePointsEarned 
 * FROM `users` u
 * LEFT JOIN `reward_wallets` w ON u.id = w.customerId
 * WHERE u.role = 'customer' 
 *   AND (u.username LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)
 * ORDER BY u.createdAt DESC;
 * 
 * -- 6. CUSTOMER DETAILS BY ID
 * SELECT u.*, w.balancePoints, w.lifetimePointsEarned 
 * FROM `users` u
 * LEFT JOIN `reward_wallets` w ON u.id = w.customerId
 * WHERE u.id = ? AND u.role = 'customer';
 * 
 * -- 7. CUSTOMER ORDER HISTORY
 * SELECT * FROM `orders` WHERE `userId` = ? ORDER BY `createdAt` DESC;
 * 
 * -- 8. CUSTOMER REWARD TRANSACTION HISTORY
 * SELECT * FROM `reward_transactions` WHERE `walletId` = ? ORDER BY `createdAt` DESC;
 * 
 * -- 9. CUSTOMER REFERRAL HISTORY ( Both Referrer or Referred Role )
 * SELECT * FROM `referrals` WHERE `referrerId` = ? OR `referredId` = ? ORDER BY `createdAt` DESC;
 * 
 * -- 10. UPDATE CUSTOMER PROFILE
 * UPDATE `users` SET `username` = ?, `email` = ?, `phone` = ? WHERE `id` = ? AND `role` = 'customer';
 * 
 * -- 11. BLOCK / UNBLOCK CUSTOMER
 * UPDATE `users` SET `isBlocked` = ? WHERE `id` = ? AND `role` = 'customer';
 */

/**
 * @route   GET /api/admin/customers
 * @desc    Get all customers with advanced searching, filtering, and dashboard statistics
 * @access  Private (Admin only)
 */
export const getCustomers = (req: Request, res: Response) => {
  try {
    const db = readDB();
    const search = (req.query.search as string || '').toLowerCase();
    const filter = req.query.filter as string || 'all'; // all, active, blocked, vip, new

    const customers = db.users.filter(u => u.role === 'customer');

    // 1. Calculate Dashboard Statistics
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(u => !u.isBlocked).length;
    
    // VIP logic: points balance >= 300 OR lifetime earned >= 500
    const vipThresholdPoints = 300;
    const vipThresholdLifetime = 500;
    const vipCustomers = customers.filter(u => {
      const wallet = db.rewardWallets.find(w => w.customerId === u.id);
      return wallet && (wallet.balancePoints >= vipThresholdPoints || wallet.lifetimePointsEarned >= vipThresholdLifetime);
    }).length;

    // New logic: created within past 30 days (let's assume 30 days from current date 2026-06-24)
    const currentDate = new Date("2026-06-24T00:00:00Z");
    const thirtyDaysAgo = new Date(currentDate.getTime() - (30 * 24 * 60 * 60 * 1000));
    const newCustomers = customers.filter(u => new Date(u.createdAt) >= thirtyDaysAgo).length;

    // 2. Map Wallets to Customers
    let results = customers.map(u => {
      const wallet = db.rewardWallets.find(w => w.customerId === u.id) || {
        customerId: u.id,
        balancePoints: 0,
        lifetimePointsEarned: 0
      };
      
      const orders = db.orders.filter(o => o.userId === u.id);
      const totalSpend = orders.filter(o => o.orderStatus !== 'cancelled').reduce((sum, o) => sum + o.totalAmount, 0);

      return {
        ...u,
        balancePoints: wallet.balancePoints,
        lifetimePointsEarned: wallet.lifetimePointsEarned,
        totalOrders: orders.length,
        totalSpend: Number(totalSpend.toFixed(2))
      };
    });

    // 3. Search Filter
    if (search) {
      results = results.filter(c => 
        c.username.toLowerCase().includes(search) || 
        (c.email && c.email.toLowerCase().includes(search)) || 
        (c.phone && c.phone.toLowerCase().includes(search)) ||
        c.id.toLowerCase().includes(search)
      );
    }

    // 4. Dropdown Category Filtering
    if (filter === 'blocked') {
      results = results.filter(c => c.isBlocked);
    } else if (filter === 'active') {
      results = results.filter(c => !c.isBlocked);
    } else if (filter === 'vip') {
      results = results.filter(c => c.balancePoints >= vipThresholdPoints || c.lifetimePointsEarned >= vipThresholdLifetime);
    } else if (filter === 'new') {
      results = results.filter(c => new Date(c.createdAt) >= thirtyDaysAgo);
    }

    res.json({
      stats: {
        totalCustomers,
        activeCustomers,
        vipCustomers,
        newCustomers
      },
      customers: results
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve customers list: ' + err.message });
  }
};

/**
 * @route   GET /api/admin/customers/:id
 * @desc    Get detailed customer profile, order history, reward ledger, and referrals
 * @access  Private (Admin only)
 */
export const getCustomerDetails = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = readDB();

    const customer = db.users.find(u => u.id === id && u.role === 'customer');
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found.' });
    }

    const wallet = db.rewardWallets.find(w => w.customerId === id) || {
      customerId: id,
      balancePoints: 0,
      lifetimePointsEarned: 0
    };

    // Retrieve order history
    const orders = db.orders
      .filter(o => o.userId === id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Retrieve points history
    const transactions = db.rewardTransactions
      .filter(tx => tx.walletId === id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Retrieve referral history (either customer referred someone, or was referred themselves)
    const referrals = db.referrals
      .filter(r => r.referrerId === id || r.referredId === id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Compute total metrics
    const completedOrders = orders.filter(o => o.orderStatus !== 'cancelled');
    const totalSpend = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    res.json({
      customer: {
        ...customer,
        balancePoints: wallet.balancePoints,
        lifetimePointsEarned: wallet.lifetimePointsEarned,
        totalOrders: orders.length,
        totalSpend: Number(totalSpend.toFixed(2))
      },
      orders,
      rewardHistory: transactions,
      referralHistory: referrals
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve customer details: ' + err.message });
  }
};

/**
 * @route   PUT /api/admin/customers/:id
 * @desc    Edit customer core profile details
 * @access  Private (Admin only)
 */
export const updateCustomer = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { username, email, phone } = req.body;
    const db = readDB();

    const userIndex = db.users.findIndex(u => u.id === id && u.role === 'customer');
    if (userIndex === -1) {
      return res.status(404).json({ error: 'Customer not found.' });
    }

    // Check email duplicates (only for non-empty email addresses)
    if (email && email.trim() !== '') {
      const emailConflict = db.users.find(u => u.id !== id && u.email && u.email.toLowerCase() === email.trim().toLowerCase());
      if (emailConflict) {
        return res.status(400).json({ error: 'An account with this email address already exists.' });
      }
    }

    // Check phone duplicates (since phone is required and unique)
    if (phone && phone.trim() !== '') {
      const normalizedPhone = phone.replace(/[\s-]/g, '');
      const phoneConflict = db.users.find(u => 
        u.id !== id && 
        u.phone && 
        u.phone.replace(/[\s-]/g, '') === normalizedPhone
      );
      if (phoneConflict) {
        return res.status(400).json({ error: 'An account with this mobile number already exists.' });
      }
    }

    // Update fields
    const updatedCustomer = {
      ...db.users[userIndex],
      username: username || db.users[userIndex].username,
      email: email !== undefined ? email.toLowerCase() : db.users[userIndex].email,
      phone: phone !== undefined ? phone : db.users[userIndex].phone
    };

    db.users[userIndex] = updatedCustomer;
    writeDB(db);

    res.json({
      message: 'Customer profile updated successfully!',
      customer: updatedCustomer
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update customer: ' + err.message });
  }
};

/**
 * @route   PUT /api/admin/customers/:id/block
 * @desc    Block or unblock a customer account
 * @access  Private (Admin only)
 */
export const toggleBlockCustomer = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isBlocked } = req.body;
    const db = readDB();

    const userIndex = db.users.findIndex(u => u.id === id && u.role === 'customer');
    if (userIndex === -1) {
      return res.status(404).json({ error: 'Customer not found.' });
    }

    db.users[userIndex].isBlocked = !!isBlocked;
    writeDB(db);

    res.json({
      message: isBlocked ? 'Customer account blocked successfully.' : 'Customer account unblocked successfully.',
      customer: db.users[userIndex]
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to set account lock status: ' + err.message });
  }
};

export const adjustCustomerWallet = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { points, description } = req.body;

    if (points === undefined || isNaN(Number(points)) || Number(points) === 0) {
      return res.status(400).json({ error: 'Valid points value (positive or negative) is required.' });
    }

    const db = readDB();
    const customer = db.users.find(u => u.id === id && u.role === 'customer');
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found.' });
    }

    let walletIndex = db.rewardWallets.findIndex(w => w.customerId === id);
    if (walletIndex === -1) {
      db.rewardWallets.push({
        customerId: id,
        balancePoints: 0,
        lifetimePointsEarned: 0,
        lifetimePointsRedeemed: 0
      });
      walletIndex = db.rewardWallets.length - 1;
    }

    const wallet = db.rewardWallets[walletIndex];
    const change = Number(points);
    const txType = change > 0 ? 'manual_credit' : 'manual_debit';

    // Prevent wallet balance going below 0
    if (wallet.balancePoints + change < 0) {
      return res.status(400).json({ error: `Cannot deduct ${Math.abs(change)} coins. Customer only has ${wallet.balancePoints} coins.` });
    }

    wallet.balancePoints += change;
    if (change > 0) {
      wallet.lifetimePointsEarned += change;
    } else {
      wallet.lifetimePointsRedeemed = (wallet.lifetimePointsRedeemed || 0) + Math.abs(change);
    }

    // Add transaction history
    const txId = 'tx_' + Date.now();
    db.rewardTransactions.push({
      id: txId,
      walletId: id,
      points: change,
      transactionType: txType,
      description: description || (change > 0 ? 'Manual coins credit by Admin' : 'Manual coins debit by Admin'),
      createdAt: new Date().toISOString()
    });

    writeDB(db);

    res.json({
      message: `Successfully adjusted customer wallet by ${change > 0 ? '+' : ''}${change} coins.`,
      wallet
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to adjust customer wallet: ' + err.message });
  }
};
