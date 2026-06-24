export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'customer';
  createdAt: string;
  phone?: string;
  isBlocked?: boolean;
  referralCode?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
}

export interface ProductDetails {
  ingredients: string;
  howToUse: string;
  skinType: string;
  brand: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  salePrice?: number;
  stock: number;
  categoryId: string;
  categoryName: string;
  image: string;
  rating: number;
  reviewsCount: number;
  isFeatured: boolean;
  details: ProductDetails;
  rewardCoins?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  items: OrderItem[];
  totalAmount: number;
  shippingAddress: string;
  phone: string;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed';
  orderStatus: 'pending' | 'shipped' | 'completed' | 'cancelled';
  createdAt: string;
  coinsEarned?: number;
  coinsUsed?: number;
}

export interface Review {
  id: string;
  productId: string;
  productName: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: string;
}

export interface Setting {
  bannerTitle: string;
  bannerSubtitle: string;
  bannerCtaText: string;
  bannerImage: string;
  announcementText: string;
  referralEnabled?: boolean;
  referralRewardReferrer?: number;
  referralRewardReferred?: number;
  rewardEnabled?: boolean;
  rewardCoinConversionRate?: number;
  rewardMaxRedemptionPercent?: number;
}

export interface RewardWallet {
  id?: string;
  customerId: string;
  balancePoints: number;
  lifetimePointsEarned: number;
  lifetimePointsRedeemed?: number;
}

export interface RewardTransaction {
  id: string;
  walletId: string;
  points: number;
  transactionType: 'earn_purchase' | 'earn_referral' | 'redeem_purchase' | 'admin_adjustment' | 'signup_bonus' | 'manual_credit' | 'manual_debit' | 'refund_adjustment';
  description: string;
  createdAt: string;
}


export interface Referral {
  id: string;
  referrerId: string;
  referredId: string;
  referrerName: string;
  referredName: string;
  referralCode: string;
  status: 'pending' | 'completed' | 'cancelled';
  pointsRewarded: number;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed_amount' | 'free_shipping';
  discountValue: number;
  minPurchaseAmount: number;
  usageCount: number;
  isActive: boolean;
}

