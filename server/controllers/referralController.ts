import { Request, Response } from 'express';
import { readDB } from '../db';

export const getAdminReferrals = (req: Request, res: Response) => {
  try {
    const db = readDB();
    const referrals = db.referrals || [];
    
    // Map details
    const mappedReferrals = referrals.map(ref => {
      const referrer = db.users.find(u => u.id === ref.referrerId);
      const referred = db.users.find(u => u.id === ref.referredId);
      return {
        id: ref.id,
        referrerName: referrer ? referrer.username : 'Unknown',
        referrerEmail: referrer ? referrer.email : '',
        referredName: referred ? referred.username : 'Unknown',
        referredEmail: referred ? referred.email : '',
        referralCode: ref.referralCode,
        status: ref.status,
        pointsRewarded: ref.pointsRewarded,
        createdAt: ref.createdAt
      };
    });

    // Total coins distributed: Referrer rewards + Referred welcome rewards
    const refRewardReferred = db.settings.referralRewardReferred || 5;
    const totalCoinsDistributed = referrals.reduce((sum, ref) => {
      return sum + ref.pointsRewarded + refRewardReferred;
    }, 0);

    // Calculate top referrers
    const referrerCounts: Record<string, { username: string; email: string; count: number; pointsEarned: number }> = {};
    referrals.forEach(ref => {
      const referrer = db.users.find(u => u.id === ref.referrerId);
      if (referrer) {
        if (!referrerCounts[ref.referrerId]) {
          referrerCounts[ref.referrerId] = {
            username: referrer.username,
            email: referrer.email,
            count: 0,
            pointsEarned: 0
          };
        }
        referrerCounts[ref.referrerId].count += 1;
        referrerCounts[ref.referrerId].pointsEarned += ref.pointsRewarded;
      }
    });

    const topReferrers = Object.values(referrerCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    res.json({
      referrals: mappedReferrals,
      totalCoinsDistributed,
      topReferrers
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve referral data: ' + err.message });
  }
};
