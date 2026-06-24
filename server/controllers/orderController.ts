import { Request, Response } from 'express';
import { readDB, writeDB } from '../db';
import { Order, OrderItem } from '../../src/types';

export const createOrder = (req: Request, res: Response) => {
  try {
    const { items, shippingAddress, phone, paymentMethod, coinsUsed } = req.body;
    const userPayload = (req as any).user;

    if (!userPayload) {
      return res.status(401).json({ error: 'Please sign in to place an order.' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Your cart is empty. Cannot place an order.' });
    }

    if (!shippingAddress || !phone) {
      return res.status(400).json({ error: 'Shipping address and phone number are required.' });
    }

    const db = readDB();
    const rate = db.settings.rewardCoinConversionRate ?? 1;
    const maxPercent = db.settings.rewardMaxRedemptionPercent ?? 50;
    const rewardEnabled = db.settings.rewardEnabled !== false;

    const orderItems: OrderItem[] = [];
    let subtotal = 0;
    let coinsEarned = 0;

    // Validate products and stock levels
    for (const item of items) {
      const dbProduct = db.products.find(p => p.id === item.productId);
      if (!dbProduct) {
        return res.status(404).json({ error: `Product "${item.name}" not found.` });
      }

      if (dbProduct.stock < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for "${dbProduct.name}". Only ${dbProduct.stock} items left in stock.`
        });
      }

      const itemPrice = dbProduct.salePrice || dbProduct.price;
      const amount = itemPrice * item.quantity;
      subtotal += amount;

      // Calculate purchase reward coins
      if (rewardEnabled) {
        coinsEarned += (dbProduct.rewardCoins || 0) * item.quantity;
      }

      orderItems.push({
        productId: dbProduct.id,
        name: dbProduct.name,
        price: itemPrice,
        quantity: item.quantity,
        image: dbProduct.image
      });
    }

    // Process coin redemption
    let discountAmount = 0;
    let coinsRedeemed = 0;

    if (rewardEnabled && coinsUsed && Number(coinsUsed) > 0) {
      coinsRedeemed = Math.floor(Number(coinsUsed));

      let walletIndex = db.rewardWallets.findIndex(w => w.customerId === userPayload.id);
      if (walletIndex === -1) {
        db.rewardWallets.push({
          customerId: userPayload.id,
          balancePoints: 0,
          lifetimePointsEarned: 0,
          lifetimePointsRedeemed: 0
        });
        walletIndex = db.rewardWallets.length - 1;
      }

      const wallet = db.rewardWallets[walletIndex];
      if (wallet.balancePoints < coinsRedeemed) {
        return res.status(400).json({ error: `Insufficient reward coins. You only have ${wallet.balancePoints} coins.` });
      }

      // Check max redemption percentage
      const maxAllowedDiscount = (subtotal * maxPercent) / 100;
      const calculatedDiscount = coinsRedeemed * rate;

      if (calculatedDiscount > maxAllowedDiscount) {
        return res.status(400).json({
          error: `Maximum coin redemption exceeded. You can only cover up to ${maxPercent}% of your order total (₹${maxAllowedDiscount.toFixed(2)}) using coins.`
        });
      }

      discountAmount = Number(calculatedDiscount.toFixed(2));

      // Deduct coins from user's wallet
      wallet.balancePoints -= coinsRedeemed;
      wallet.lifetimePointsRedeemed = (wallet.lifetimePointsRedeemed || 0) + coinsRedeemed;

      // Log transaction history
      db.rewardTransactions.push({
        id: 'tx_' + Date.now() + '_redeem',
        walletId: userPayload.id,
        points: -coinsRedeemed,
        transactionType: 'redeem_purchase',
        description: `Coins redeemed for discount on order creation`,
        createdAt: new Date().toISOString()
      });
    }

    // Decrement product stock levels
    for (const item of items) {
      const dbProduct = db.products.find(p => p.id === item.productId);
      if (dbProduct) {
        dbProduct.stock -= item.quantity;
      }
    }

    const finalTotal = Math.max(0, subtotal - discountAmount);

    // Generate unique order ID
    const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);

    const newOrder: Order = {
      id: orderId,
      userId: userPayload.id,
      userEmail: userPayload.email,
      userName: userPayload.username || 'Valued Customer',
      items: orderItems,
      totalAmount: Number(finalTotal.toFixed(2)),
      shippingAddress,
      phone,
      paymentMethod: paymentMethod || 'Credit Card',
      paymentStatus: 'pending',
      orderStatus: 'pending',
      createdAt: new Date().toISOString(),
      coinsEarned,
      coinsUsed: coinsRedeemed
    };

    db.orders.unshift(newOrder); // Add to the beginning
    writeDB(db);

    res.status(201).json({
      message: 'Order placed successfully!',
      order: newOrder
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to place order: ' + err.message });
  }
};

export const getOrders = (req: Request, res: Response) => {
  try {
    const userPayload = (req as any).user;
    if (!userPayload) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }

    const db = readDB();

    // If Admin, return all orders. If Customer, return only their own.
    if (userPayload.role === 'admin') {
      res.json(db.orders);
    } else {
      const userOrders = db.orders.filter(o => o.userId === userPayload.id);
      res.json(userOrders);
    }
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve orders: ' + err.message });
  }
};

export const updateOrderStatus = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { orderStatus, paymentStatus } = req.body;

    const db = readDB();
    const order = db.orders.find(o => o.id === id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const previousOrderStatus = order.orderStatus;

    if (orderStatus) {
      const allowedOrderStatuses = ['pending', 'shipped', 'completed', 'cancelled'];
      if (!allowedOrderStatuses.includes(orderStatus)) {
        return res.status(400).json({ error: 'Invalid order status value.' });
      }

      // If transition to cancelled, return stock back to inventory
      if (orderStatus === 'cancelled' && order.orderStatus !== 'cancelled') {
        for (const item of order.items) {
          const product = db.products.find(p => p.id === item.productId);
          if (product) {
            product.stock += item.quantity;
          }
        }
      } 
      // If undoing cancellation, re-decrement stock if available
      else if (order.orderStatus === 'cancelled' && orderStatus !== 'cancelled') {
        for (const item of order.items) {
          const product = db.products.find(p => p.id === item.productId);
          if (product) {
            if (product.stock >= item.quantity) {
              product.stock -= item.quantity;
            } else {
              return res.status(400).json({
                error: `Cannot restore order status. Product "${product.name}" has insufficient stock (${product.stock} items available).`
              });
            }
          }
        }
      }

      order.orderStatus = orderStatus;

      // Handle Reward Coins triggers based on order status transition
      const rewardEnabled = db.settings.rewardEnabled !== false;
      if (rewardEnabled) {
        // 1. Order becomes Completed (Delivered)
        if (orderStatus === 'completed' && previousOrderStatus !== 'completed') {
          const coinsEarned = order.coinsEarned || 0;
          if (coinsEarned > 0) {
            let walletIndex = db.rewardWallets.findIndex(w => w.customerId === order.userId);
            if (walletIndex === -1) {
              db.rewardWallets.push({
                customerId: order.userId,
                balancePoints: 0,
                lifetimePointsEarned: 0,
                lifetimePointsRedeemed: 0
              });
              walletIndex = db.rewardWallets.length - 1;
            }

            const wallet = db.rewardWallets[walletIndex];

            // Prevent duplicate crediting
            const alreadyCredited = db.rewardTransactions.some(
              tx => tx.walletId === order.userId && 
                    tx.transactionType === 'earn_purchase' && 
                    tx.description.includes(order.id)
            );

            if (!alreadyCredited) {
              wallet.balancePoints += coinsEarned;
              wallet.lifetimePointsEarned += coinsEarned;

              db.rewardTransactions.push({
                id: 'tx_' + Date.now() + '_earn',
                walletId: order.userId,
                points: coinsEarned,
                transactionType: 'earn_purchase',
                description: `Earned purchase coins for completed order ${order.id}`,
                createdAt: new Date().toISOString()
              });
            }
          }
        }
        
        // 2. Order transitions AWAY from Completed (refunded or cancelled after being completed)
        if (previousOrderStatus === 'completed' && orderStatus !== 'completed') {
          const coinsEarned = order.coinsEarned || 0;
          if (coinsEarned > 0) {
            const walletIndex = db.rewardWallets.findIndex(w => w.customerId === order.userId);
            if (walletIndex !== -1) {
              const wallet = db.rewardWallets[walletIndex];
              
              // Verify points were credited
              const creditedTx = db.rewardTransactions.some(
                tx => tx.walletId === order.userId && 
                      tx.transactionType === 'earn_purchase' && 
                      tx.description.includes(order.id)
              );

              if (creditedTx) {
                // Adjust points (let balance bottom out at 0 to satisfy database constraints)
                const reverseAmount = Math.min(wallet.balancePoints, coinsEarned);
                wallet.balancePoints -= reverseAmount;

                db.rewardTransactions.push({
                  id: 'tx_' + Date.now() + '_reverse_earn',
                  walletId: order.userId,
                  points: -coinsEarned,
                  transactionType: 'refund_adjustment',
                  description: `Reversal of earned coins for cancelled/refunded order ${order.id}`,
                  createdAt: new Date().toISOString()
                });
              }
            }
          }
        }

        // 3. Order is Cancelled (refund/revert coins used at checkout)
        if (orderStatus === 'cancelled' && previousOrderStatus !== 'cancelled') {
          const coinsUsed = order.coinsUsed || 0;
          if (coinsUsed > 0) {
            const walletIndex = db.rewardWallets.findIndex(w => w.customerId === order.userId);
            if (walletIndex !== -1) {
              const wallet = db.rewardWallets[walletIndex];

              // Verify we haven't already refunded these coins
              const alreadyRefunded = db.rewardTransactions.some(
                tx => tx.walletId === order.userId && 
                      tx.transactionType === 'refund_adjustment' && 
                      tx.description.includes(order.id) &&
                      tx.description.includes('redeemed')
              );

              if (!alreadyRefunded) {
                wallet.balancePoints += coinsUsed;
                wallet.lifetimePointsRedeemed = Math.max(0, (wallet.lifetimePointsRedeemed || 0) - coinsUsed);

                db.rewardTransactions.push({
                  id: 'tx_' + Date.now() + '_refund_redeem',
                  walletId: order.userId,
                  points: coinsUsed,
                  transactionType: 'refund_adjustment',
                  description: `Refund of redeemed coins for cancelled order ${order.id}`,
                  createdAt: new Date().toISOString()
                });
              }
            }
          }
        }
      }
    }

    if (paymentStatus) {
      const allowedPaymentStatuses = ['pending', 'paid', 'failed'];
      if (!allowedPaymentStatuses.includes(paymentStatus)) {
        return res.status(400).json({ error: 'Invalid payment status value.' });
      }
      order.paymentStatus = paymentStatus;
    }

    writeDB(db);

    res.json({
      message: 'Order status updated successfully!',
      order
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update order status: ' + err.message });
  }
};
