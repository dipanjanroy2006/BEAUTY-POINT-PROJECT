import { Request, Response } from 'express';
import { readDB, writeDB, hashPassword, verifyPassword, signToken } from '../db';
import { User, RewardWallet, RewardTransaction, Referral } from '../../src/types';

export const register = (req: Request, res: Response) => {
  try {
    const { username, email, phone, password, referralCode } = req.body;

    if (!username || !phone || !password) {
      return res.status(400).json({ error: 'Username, mobile number, and password are required.' });
    }

    const db = readDB();

    // Check if phone already exists
    const normalizedPhone = phone.replace(/[\s-]/g, '');
    const existingUserPhone = db.users.find(u => u.phone && u.phone.replace(/[\s-]/g, '') === normalizedPhone);
    if (existingUserPhone) {
      return res.status(400).json({ error: 'An account with this mobile number already exists.' });
    }

    // Check if email already exists (only if provided and not empty)
    if (email && email.trim() !== '') {
      const existingUserEmail = db.users.find(u => u.email && u.email.toLowerCase() === email.trim().toLowerCase());
      if (existingUserEmail) {
        return res.status(400).json({ error: 'An account with this email already exists.' });
      }
    }

    // Create user
    const userId = 'usr_' + Date.now();
    // Generate unique referral code for this user
    const userReferralCode = 'BP-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const newUser: User = {
      id: userId,
      username,
      email: email ? email.trim().toLowerCase() : '',
      phone: phone.trim(),
      role: 'customer', // default role
      referralCode: userReferralCode,
      createdAt: new Date().toISOString()
    };

    // Initialize their reward wallet
    const newWallet: RewardWallet = {
      customerId: userId,
      balancePoints: 0,
      lifetimePointsEarned: 0
    };

    // Process Referral if code is provided and program is enabled
    const referralEnabled = db.settings.referralEnabled !== false;
    let referrer = null;
    
    if (referralEnabled && referralCode && referralCode.trim() !== '') {
      const codeToMatch = referralCode.trim().toUpperCase();
      referrer = db.users.find(u => u.referralCode && u.referralCode === codeToMatch);
      
      // Make sure referrer exists, and is NOT the registering user (self-referral prevention)
      if (referrer && referrer.id !== userId) {
        const refRewardReferrer = db.settings.referralRewardReferrer ?? 10;
        const refRewardReferred = db.settings.referralRewardReferred ?? 5;

        // Add points to new user's wallet
        newWallet.balancePoints = refRewardReferred;
        newWallet.lifetimePointsEarned = refRewardReferred;

        // Add points to referrer's wallet
        let referrerWallet = db.rewardWallets.find(w => w.customerId === referrer.id);
        if (!referrerWallet) {
          referrerWallet = {
            customerId: referrer.id,
            balancePoints: 0,
            lifetimePointsEarned: 0
          };
          db.rewardWallets.push(referrerWallet);
        }
        referrerWallet.balancePoints += refRewardReferrer;
        referrerWallet.lifetimePointsEarned += refRewardReferrer;

        // Create referral audit log entry
        const referralId = 'ref_' + Date.now();
        const newReferral: Referral = {
          id: referralId,
          referrerId: referrer.id,
          referredId: userId,
          referrerName: referrer.username,
          referredName: username,
          referralCode: codeToMatch,
          status: 'completed',
          pointsRewarded: refRewardReferrer,
          createdAt: new Date().toISOString()
        };
        db.referrals.push(newReferral);

        // Create reward transaction records
        const txReferrerId = 'tx_' + Date.now() + '_1';
        const txReferredId = 'tx_' + Date.now() + '_2';

        db.rewardTransactions.push({
          id: txReferrerId,
          walletId: referrer.id,
          points: refRewardReferrer,
          transactionType: 'earn_referral',
          description: `Referral reward for inviting ${username}`,
          createdAt: new Date().toISOString()
        });

        db.rewardTransactions.push({
          id: txReferredId,
          walletId: userId,
          points: refRewardReferred,
          transactionType: 'signup_bonus',
          description: `Welcome bonus for signing up using code ${codeToMatch}`,
          createdAt: new Date().toISOString()
        });
      }
    }

    // Hash and store password
    const passwordHash = hashPassword(password);
    db.users.push(newUser);
    db.rewardWallets.push(newWallet);
    db.passwordHashes[userId] = passwordHash;

    writeDB(db);

    // Sign JWT token
    const token = signToken({
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role
    });

    res.status(201).json({
      message: 'Registration successful!',
      token,
      user: newUser
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to register: ' + err.message });
  }
};

export const login = (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Mobile number/Email and password are required.' });
    }

    const db = readDB();
    const identifier = email.trim().toLowerCase();
    const normalizedIdentifier = identifier.replace(/[\s-]/g, '');

    // Find user by either email or phone
    const user = db.users.find(u => {
      const uEmail = (u.email || '').toLowerCase();
      const uPhone = (u.phone || '').replace(/[\s-]/g, '');
      return uEmail === identifier || (uPhone && uPhone === normalizedIdentifier);
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid mobile number/email or password.' });
    }

    const passwordHash = db.passwordHashes[user.id];
    if (!passwordHash || !verifyPassword(password, passwordHash)) {
      return res.status(401).json({ error: 'Invalid mobile number/email or password.' });
    }

    // Sign JWT token
    const token = signToken({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    });

    res.json({
      message: 'Login successful!',
      token,
      user
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to log in: ' + err.message });
  }
};

export const getMe = (req: Request, res: Response) => {
  try {
    const userPayload = (req as any).user;
    if (!userPayload) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }

    const db = readDB();
    const user = db.users.find(u => u.id === userPayload.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const wallet = db.rewardWallets.find(w => w.customerId === user.id) || {
      customerId: user.id,
      balancePoints: 0,
      lifetimePointsEarned: 0
    };

    res.json({ user, wallet });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve profile: ' + err.message });
  }
};
