import { Request, Response } from 'express';
import { readDB, writeDB } from '../db';
import { Coupon } from '../../src/types';

/**
 * @route   GET /api/coupons
 * @desc    Get all active coupons for storefront checkouts
 * @access  Public
 */
export const getCoupons = (req: Request, res: Response) => {
  try {
    const db = readDB();
    const activeCoupons = db.coupons.filter(c => c.isActive);
    res.json(activeCoupons);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve coupons: ' + err.message });
  }
};

/**
 * @route   GET /api/admin/coupons
 * @desc    Get all coupons including inactive ones for Admin Dashboard
 * @access  Private (Admin only)
 */
export const getAdminCoupons = (req: Request, res: Response) => {
  try {
    const db = readDB();
    res.json(db.coupons);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve admin coupons: ' + err.message });
  }
};

/**
 * @route   POST /api/admin/coupons
 * @desc    Create a new promotion coupon
 * @access  Private (Admin only)
 */
export const createCoupon = (req: Request, res: Response) => {
  try {
    const { code, discountType, discountValue, minPurchaseAmount } = req.body;

    if (!code || !discountType || discountValue === undefined || minPurchaseAmount === undefined) {
      return res.status(400).json({ error: 'Code, discount type, value, and minimum purchase are required.' });
    }

    const db = readDB();

    // Check code uniqueness
    const codeExists = db.coupons.find(c => c.code.toUpperCase() === code.toUpperCase());
    if (codeExists) {
      return res.status(400).json({ error: 'A coupon with this code already exists.' });
    }

    const newCoupon: Coupon = {
      id: 'cpn_' + Date.now(),
      code: code.toUpperCase(),
      discountType,
      discountValue: Number(discountValue),
      minPurchaseAmount: Number(minPurchaseAmount),
      usageCount: 0,
      isActive: true
    };

    db.coupons.push(newCoupon);
    writeDB(db);

    res.status(201).json({
      message: 'Coupon created successfully!',
      coupon: newCoupon
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create coupon: ' + err.message });
  }
};

/**
 * @route   DELETE /api/admin/coupons/:id
 * @desc    Delete a coupon by ID
 * @access  Private (Admin only)
 */
export const deleteCoupon = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = readDB();

    const couponIndex = db.coupons.findIndex(c => c.id === id);
    if (couponIndex === -1) {
      return res.status(404).json({ error: 'Coupon not found.' });
    }

    db.coupons.splice(couponIndex, 1);
    writeDB(db);

    res.json({ message: 'Coupon deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete coupon: ' + err.message });
  }
};
