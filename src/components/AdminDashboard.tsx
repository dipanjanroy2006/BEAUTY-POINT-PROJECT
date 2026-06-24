import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Plus, Edit, Trash2, ShoppingBag, Eye, 
  MessageSquare, Settings, AlertTriangle, IndianRupee, 
  Users, Check, X, ShieldAlert, Upload, Image as ImageIcon,
  ChevronRight, Calendar, Star, Sliders, Coins, Award, Sparkles, TrendingUp, History, Gift
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  Tooltip, PieChart, Pie, Cell, Legend, BarChart, Bar, LineChart, Line, CartesianGrid 
} from 'recharts';
import { Product, Category, Order, Review, Setting, RewardTransaction, Referral, Coupon } from '../types';

interface AdminDashboardProps {
  token: string | null;
  categories: Category[];
  onRefreshCatalog: () => void;
}

interface SummaryStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  totalReviews: number;
  rewardCoinsIssued: number;
  rewardCoinsRedeemed: number;
  lowStockCount: number;
  activeRewardMembers?: number;
}

interface LowStockItem {
  id: string;
  name: string;
  stock: number;
  brand: string;
}

interface ChartItem {
  name: string;
  value: number;
}

interface SalesTrend {
  date: string;
  revenue: number;
}

interface MonthlyRevenueItem {
  month: string;
  revenue: number;
}

interface CustomerGrowthItem {
  month: string;
  newSignups: number;
  customers: number;
}

interface TopProductItem {
  id: string;
  name: string;
  unitsSold: number;
  revenue: number;
  image: string;
}

interface ActivityItem {
  id: string;
  type: 'order' | 'review' | 'reward' | 'signup';
  title: string;
  description: string;
  user: string;
  value?: string;
  createdAt: string;
}

interface AdminStats {
  summary: SummaryStats;
  lowStockProducts: LowStockItem[];
  categoryRevenue: ChartItem[];
  salesTrends: SalesTrend[];
  monthlyRevenue: MonthlyRevenueItem[];
  customerGrowth: CustomerGrowthItem[];
  topProducts: TopProductItem[];
  recentActivityFeed: ActivityItem[];
  topCoinProducts?: any[];
  topCustomers?: any[];
}

const COLORS = ['#cca380', '#ecdcc3', '#bc865d', '#8c583b', '#71412e', '#5d3425'];

export default function AdminDashboard({ token, categories, onRefreshCatalog }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'analytics' | 'products' | 'categories' | 'orders' | 'reviews' | 'settings' | 'customers' | 'coupons' | 'referrals' | 'rewards'>('analytics');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [ordersList, setOrdersList] = useState<Order[]>([]);
  const [reviewsList, setReviewsList] = useState<Review[]>([]);
  const [storeSettings, setStoreSettings] = useState<Setting | null>(null);
  const [couponsList, setCouponsList] = useState<Coupon[]>([]);
  const [rewardTransactions, setRewardTransactions] = useState<any[]>([]);

  
  // Form states - Coupons
  const [cpnCode, setCpnCode] = useState('');
  const [cpnDiscountType, setCpnDiscountType] = useState<'percentage' | 'fixed_amount' | 'free_shipping'>('percentage');
  const [cpnDiscountValue, setCpnDiscountValue] = useState('');
  const [cpnMinPurchaseAmount, setCpnMinPurchaseAmount] = useState('');
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  
  // Loading & Action states
  const [loading, setLoading] = useState(false);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals / Editor states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isOrderDetailOpen, setIsOrderDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Customer Management states
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [customerStats, setCustomerStats] = useState<any>({ totalCustomers: 0, activeCustomers: 0, vipCustomers: 0, newCustomers: 0 });
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isCustomerDetailOpen, setIsCustomerDetailOpen] = useState(false);
  const [isCustomerEditOpen, setIsCustomerEditOpen] = useState(false);
  const [customerEditName, setCustomerEditName] = useState('');
  const [customerEditEmail, setCustomerEditEmail] = useState('');
  const [customerEditPhone, setCustomerEditPhone] = useState('');
  const [customerDetailTab, setCustomerDetailTab] = useState<'orders' | 'rewards' | 'referrals'>('orders');

  // Referral settings & data states
  const [settingReferralEnabled, setSettingReferralEnabled] = useState(true);
  const [settingReferralRewardReferrer, setSettingReferralRewardReferrer] = useState(10);
  const [settingReferralRewardReferred, setSettingReferralRewardReferred] = useState(5);
  const [referralsData, setReferralsData] = useState<{ referrals: any[]; totalCoinsDistributed: number; topReferrers: any[] }>({ referrals: [], totalCoinsDistributed: 0, topReferrers: [] });

  // Reward Coins settings states
  const [settingRewardEnabled, setSettingRewardEnabled] = useState(true);
  const [settingRewardCoinConversionRate, setSettingRewardCoinConversionRate] = useState(1);
  const [settingRewardMaxRedemptionPercent, setSettingRewardMaxRedemptionPercent] = useState(50);

  // Manual coin adjustments state
  const [manualCoinsPoints, setManualCoinsPoints] = useState('');
  const [manualCoinsDescription, setManualCoinsDescription] = useState('');

  // Bulk update rewards state
  const [bulkRewardsCategory, setBulkRewardsCategory] = useState('');
  const [bulkRewardsMethod, setBulkRewardsMethod] = useState<'flat' | 'multiply' | 'percent_price'>('flat');
  const [bulkRewardsValue, setBulkRewardsValue] = useState('');

  // Form states - Product
  const [prodName, setProdName] = useState('');
  const [prodBrand, setProdBrand] = useState('');
  const [prodDescription, setProdDescription] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodSalePrice, setProdSalePrice] = useState('');
  const [prodStock, setProdStock] = useState('');
  const [prodCategory, setProdCategory] = useState('');
  const [prodFeatured, setProdFeatured] = useState(false);
  const [prodSkinType, setProdSkinType] = useState('All Skin Types');
  const [prodIngredients, setProdIngredients] = useState('');
  const [prodHowToUse, setProdHowToUse] = useState('');
  const [prodImageUrl, setProdImageUrl] = useState('');
  const [prodRewardCoins, setProdRewardCoins] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Form states - Category
  const [catName, setCatName] = useState('');
  const [catDescription, setCatDescription] = useState('');
  const [catImageUrl, setCatImageUrl] = useState('');
  const [selectedCatFile, setSelectedCatFile] = useState<File | null>(null);

  // Form states - Settings
  const [settingBannerTitle, setSettingBannerTitle] = useState('');
  const [settingBannerSubtitle, setSettingBannerSubtitle] = useState('');
  const [settingBannerCtaText, setSettingBannerCtaText] = useState('');
  const [settingBannerImage, setSettingBannerImage] = useState('');
  const [settingAnnouncement, setSettingAnnouncement] = useState('');

  // Fetch Stats and relevant records
  const fetchAllAdminData = async () => {
    if (!token) return;
    setLoading(true);
    setErrorMsg('');
    try {
      // 1. Stats
      const statsRes = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const statsData = await statsRes.json();
      if (statsRes.ok) setStats(statsData);

      // 2. Products List
      const prodRes = await fetch('/api/products');
      const prodData = await prodRes.json();
      if (prodRes.ok) setProductsList(prodData);

      // 3. Orders List
      const ordRes = await fetch('/api/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const ordData = await ordRes.json();
      if (ordRes.ok) setOrdersList(ordData);

      // 4. Reviews List
      const revRes = await fetch('/api/admin/reviews', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const revData = await revRes.json();
      if (revRes.ok) setReviewsList(revData);

      // 5. Shop Settings
      const setRes = await fetch('/api/settings');
      const setData = await setRes.json();
      if (setRes.ok) {
        setStoreSettings(setData);
        // Initialize settings forms
        setSettingBannerTitle(setData.bannerTitle);
        setSettingBannerSubtitle(setData.bannerSubtitle);
        setSettingBannerCtaText(setData.bannerCtaText);
        setSettingBannerImage(setData.bannerImage);
        setSettingAnnouncement(setData.announcementText);
        setSettingReferralEnabled(setData.referralEnabled !== undefined ? setData.referralEnabled : true);
        setSettingReferralRewardReferrer(setData.referralRewardReferrer !== undefined ? setData.referralRewardReferrer : 10);
        setSettingReferralRewardReferred(setData.referralRewardReferred !== undefined ? setData.referralRewardReferred : 5);
        setSettingRewardEnabled(setData.rewardEnabled !== undefined ? setData.rewardEnabled : true);
        setSettingRewardCoinConversionRate(setData.rewardCoinConversionRate !== undefined ? setData.rewardCoinConversionRate : 1);
        setSettingRewardMaxRedemptionPercent(setData.rewardMaxRedemptionPercent !== undefined ? setData.rewardMaxRedemptionPercent : 50);
      }

      // 6. Coupons List
      const cpnRes = await fetch('/api/admin/coupons', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const cpnData = await cpnRes.json();
      if (cpnRes.ok) setCouponsList(cpnData);

      // 7. Referrals List
      const refRes = await fetch('/api/admin/referrals', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const refData = await refRes.json();
      if (refRes.ok) setReferralsData(refData);

      // 8. Reward Transactions List
      const txRes = await fetch('/api/admin/rewards/transactions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const txData = await txRes.json();
      if (txRes.ok) setRewardTransactions(txData);


    } catch (err: any) {
      setErrorMsg('Failed to load admin dataset: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomersList = async (searchStr = customerSearch, filterVal = customerFilter) => {
    if (!token) return;
    setCustomersLoading(true);
    setErrorMsg('');
    try {
      const queryParams = new URLSearchParams({
        search: searchStr,
        filter: filterVal
      }).toString();
      
      const res = await fetch(`/api/admin/customers?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setCustomersList(data.customers || []);
        setCustomerStats(data.stats || { totalCustomers: 0, activeCustomers: 0, vipCustomers: 0, newCustomers: 0 });
      } else {
        setErrorMsg(data.error || 'Failed to load customers');
      }
    } catch (err: any) {
      setErrorMsg('Failed to load customers: ' + err.message);
    } finally {
      setCustomersLoading(false);
    }
  };

  const handleViewCustomerDetails = async (customerId: string) => {
    if (!token) return;
    setActionLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/admin/customers/${customerId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedCustomer(data);
        setIsCustomerDetailOpen(true);
      } else {
        setErrorMsg(data.error || 'Failed to load customer details');
      }
    } catch (err: any) {
      setErrorMsg('Failed to retrieve customer details: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenEditCustomer = (customer: any) => {
    setSelectedCustomer({ customer });
    setCustomerEditName(customer.username);
    setCustomerEditEmail(customer.email);
    setCustomerEditPhone(customer.phone || '');
    setIsCustomerEditOpen(true);
  };

  const handleEditCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedCustomer) return;
    
    // Check if we are editing from inside the details modal or list directly
    const customerId = selectedCustomer.customer ? selectedCustomer.customer.id : selectedCustomer.id;
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch(`/api/admin/customers/${customerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: customerEditName,
          email: customerEditEmail,
          phone: customerEditPhone
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message || 'Customer profile updated!');
        setIsCustomerEditOpen(false);
        // Refresh details modal if it was open
        if (isCustomerDetailOpen) {
          handleViewCustomerDetails(customerId);
        } else {
          fetchCustomersList(customerSearch, customerFilter);
        }
      } else {
        setErrorMsg(data.error || 'Failed to update customer');
      }
    } catch (err: any) {
      setErrorMsg('Failed to update customer profile: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleBlockCustomer = async (customer: any) => {
    if (!token) return;
    const blockStatus = !customer.isBlocked;
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch(`/api/admin/customers/${customer.id}/block`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isBlocked: blockStatus })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message || 'Block status updated.');
        // Refresh detail modal if open
        if (isCustomerDetailOpen && (selectedCustomer?.customer?.id === customer.id || selectedCustomer?.id === customer.id)) {
          handleViewCustomerDetails(customer.id);
        } else {
          fetchCustomersList(customerSearch, customerFilter);
        }
      } else {
        setErrorMsg(data.error || 'Failed to update block status');
      }
    } catch (err: any) {
      setErrorMsg('Failed to set customer block status: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    if (!token) return;
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch(`/api/admin/coupons/${couponId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message || 'Coupon deleted successfully!');
        const cpnRes = await fetch('/api/admin/coupons', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const cpnData = await cpnRes.json();
        if (cpnRes.ok) setCouponsList(cpnData);
      } else {
        setErrorMsg(data.error || 'Failed to delete coupon');
      }
    } catch (err: any) {
      setErrorMsg('Failed to delete coupon: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!cpnCode || !cpnDiscountType || (cpnDiscountType !== 'free_shipping' && !cpnDiscountValue) || !cpnMinPurchaseAmount) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          code: cpnCode,
          discountType: cpnDiscountType,
          discountValue: cpnDiscountType === 'free_shipping' ? 0 : Number(cpnDiscountValue),
          minPurchaseAmount: Number(cpnMinPurchaseAmount)
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message || 'Coupon created successfully!');
        setCpnCode('');
        setCpnDiscountValue('');
        setCpnMinPurchaseAmount('');
        setIsCouponModalOpen(false);
        const cpnRes = await fetch('/api/admin/coupons', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const cpnData = await cpnRes.json();
        if (cpnRes.ok) setCouponsList(cpnData);
      } else {
        setErrorMsg(data.error || 'Failed to create coupon');
      }
    } catch (err: any) {
      setErrorMsg('Failed to create coupon: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'customers') {
      fetchCustomersList(customerSearch, customerFilter);
    } else {
      fetchAllAdminData();
    }
  }, [activeTab, token]);

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const formData = new FormData();
    formData.append('name', prodName);
    formData.append('brand', prodBrand);
    formData.append('description', prodDescription);
    formData.append('price', prodPrice);
    formData.append('salePrice', prodSalePrice);
    formData.append('stock', prodStock);
    formData.append('categoryId', prodCategory);
    formData.append('isFeatured', String(prodFeatured));
    formData.append('skinType', prodSkinType);
    formData.append('ingredients', prodIngredients);
    formData.append('howToUse', prodHowToUse);
    formData.append('rewardCoins', prodRewardCoins || '0');
    
    if (selectedFile) {
      formData.append('image', selectedFile);
    } else {
      formData.append('imageUrl', prodImageUrl);
    }

    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to persist product.');
      }

      setSuccessMsg(editingProduct ? 'Product updated successfully!' : 'Product added successfully!');
      setIsProductModalOpen(false);
      onRefreshCatalog(); // Trigger App-level re-fetch
      fetchAllAdminData(); // Refresh list here
      resetProductForm();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const formData = new FormData();
    formData.append('name', catName);
    formData.append('description', catDescription);
    if (selectedCatFile) {
      formData.append('image', selectedCatFile);
    } else {
      formData.append('imageUrl', catImageUrl);
    }

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create category.');
      }

      setSuccessMsg('New category added successfully!');
      setIsCategoryModalOpen(false);
      onRefreshCatalog();
      fetchAllAdminData();
      setCatName('');
      setCatDescription('');
      setCatImageUrl('');
      setSelectedCatFile(null);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product? This will delete all its product reviews.')) return;
    setActionLoading(true);
    setErrorMsg('');
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete product.');
      setSuccessMsg('Product deleted successfully!');
      onRefreshCatalog();
      fetchAllAdminData();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    setActionLoading(true);
    setErrorMsg('');
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete category.');
      setSuccessMsg('Category deleted successfully!');
      onRefreshCatalog();
      fetchAllAdminData();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, payload: { orderStatus?: string; paymentStatus?: string }) => {
    setActionLoading(true);
    setErrorMsg('');
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update order status.');
      setSuccessMsg('Order status updated successfully!');
      
      // Update selected order details view if open
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(data.order);
      }

      fetchAllAdminData();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReviewStatusToggle = async (reviewId: string, currentStatus: boolean) => {
    setActionLoading(true);
    setErrorMsg('');
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isApproved: !currentStatus })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to toggle review status.');
      setSuccessMsg(`Review is now ${!currentStatus ? 'approved' : 'unapproved'}!`);
      fetchAllAdminData();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    setActionLoading(true);
    setErrorMsg('');
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete review.');
      setSuccessMsg('Review deleted successfully!');
      fetchAllAdminData();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bannerTitle: settingBannerTitle,
          bannerSubtitle: settingBannerSubtitle,
          bannerCtaText: settingBannerCtaText,
          bannerImage: settingBannerImage,
          announcementText: settingAnnouncement,
          referralEnabled: settingReferralEnabled,
          referralRewardReferrer: settingReferralRewardReferrer,
          referralRewardReferred: settingReferralRewardReferred,
          rewardEnabled: settingRewardEnabled,
          rewardCoinConversionRate: settingRewardCoinConversionRate,
          rewardMaxRedemptionPercent: settingRewardMaxRedemptionPercent
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update settings.');

      setSuccessMsg('Storefront metadata saved successfully!');
      onRefreshCatalog();
      fetchAllAdminData();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const openEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProdName(prod.name);
    setProdBrand(prod.details?.brand || '');
    setProdDescription(prod.description);
    setProdPrice(String(prod.price));
    setProdSalePrice(prod.salePrice ? String(prod.salePrice) : '');
    setProdStock(String(prod.stock));
    setProdCategory(prod.categoryId);
    setProdFeatured(prod.isFeatured);
    setProdSkinType(prod.details?.skinType || 'All Skin Types');
    setProdIngredients(prod.details?.ingredients || '');
    setProdHowToUse(prod.details?.howToUse || '');
    setProdImageUrl(prod.image);
    setProdRewardCoins(prod.rewardCoins ? String(prod.rewardCoins) : '0');
    setSelectedFile(null);
    setIsProductModalOpen(true);
  };

  const resetProductForm = () => {
    setEditingProduct(null);
    setProdName('');
    setProdBrand('');
    setProdDescription('');
    setProdPrice('');
    setProdSalePrice('');
    setProdStock('');
    setProdCategory(categories[0]?.id || '');
    setProdFeatured(false);
    setProdSkinType('All Skin Types');
    setProdIngredients('');
    setProdHowToUse('');
    setProdImageUrl('');
    setProdRewardCoins('');
    setSelectedFile(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-neutral-200 pb-5 mb-8">
        <div>
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-neutral-900 tracking-wide flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-rose-500" /> Admin Command Hub
          </h2>
          <p className="text-neutral-500 text-xs mt-1 font-sans">
            Manage your boutique catalog inventory, category routing, active orders, customer feedback, and design templates.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={fetchAllAdminData}
            className="py-2 px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold rounded-lg transition-all"
          >
            Refresh Hub
          </button>
        </div>
      </div>

      {/* FEEDBACK MASSAGES */}
      {errorMsg && (
        <div className="p-4 mb-6 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs flex items-center gap-2 font-medium shadow-xs">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 mb-6 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-xs flex items-center gap-2 font-medium shadow-xs">
          <Check className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* SUB-TAB NAVIGATOR */}
      <div className="flex flex-wrap gap-2 border-b border-neutral-100 pb-4 mb-6">
        {[
          { id: 'analytics', label: 'KPI Analytics', icon: BarChart3 },
          { id: 'products', label: 'Inventory (Products)', icon: ShoppingBag },
          { id: 'categories', label: 'Departments (Categories)', icon: Sliders },
          { id: 'orders', label: 'Shipments (Orders)', icon: ChevronRight },
          { id: 'customers', label: 'Customers (Directory)', icon: Users },
          { id: 'reviews', label: 'Moderation (Reviews)', icon: MessageSquare },
          { id: 'coupons', label: 'Coupons (Promotional)', icon: Coins },
          { id: 'referrals', label: 'Referrals (Program)', icon: Gift },
          { id: 'rewards', label: 'Rewards System', icon: Award },
          { id: 'settings', label: 'Store Theme Settings', icon: Settings }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-4 rounded-xl text-xs font-medium flex items-center gap-2 transition-all ${
                activeTab === tab.id
                  ? 'bg-neutral-900 text-white shadow-md'
                  : 'bg-white hover:bg-neutral-50 text-neutral-600 border border-neutral-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-10 h-10 border-3 border-neutral-900 rounded-full border-t-transparent animate-spin mb-4" />
          <p className="text-xs text-neutral-500 font-medium font-mono">Syncing complete boutique database...</p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* ==================== 1. ANALYTICS SUB-TAB ==================== */}
          {activeTab === 'analytics' && stats && (
            <div className="space-y-8 animate-fade-in">
              
              {/* KPI metrics row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Revenue', value: `₹${stats.summary.totalRevenue.toLocaleString()}`, icon: IndianRupee, color: 'text-amber-600 bg-amber-50 border-amber-100', subtitle: 'Lifetime sales volume' },
                  { label: 'Total Orders', value: stats.summary.totalOrders, icon: ShoppingBag, color: 'text-indigo-600 bg-indigo-50 border-indigo-100', subtitle: 'Checkout transactions' },
                  { label: 'Registered Customers', value: stats.summary.totalCustomers, icon: Users, color: 'text-teal-600 bg-teal-50 border-teal-100', subtitle: 'Loyal client accounts' },
                  { label: 'Total Products', value: stats.summary.totalProducts, icon: Sparkles, color: 'text-pink-600 bg-pink-50 border-pink-100', subtitle: 'Luxury SKU inventory' },
                  { label: 'Reward Coins Issued', value: `${(stats.summary.rewardCoinsIssued || 0).toLocaleString()} pts`, icon: Award, color: 'text-emerald-600 bg-emerald-50 border-emerald-100', subtitle: 'Points awarded to date' },
                  { label: 'Reward Coins Redeemed', value: `${(stats.summary.rewardCoinsRedeemed || 0).toLocaleString()} pts`, icon: Coins, color: 'text-rose-600 bg-rose-50 border-rose-100', subtitle: 'Points used for discounts' },
                  { label: 'Product Reviews', value: stats.summary.totalReviews, icon: MessageSquare, color: 'text-purple-600 bg-purple-50 border-purple-100', subtitle: 'Verified user feedbacks' },
                  { label: 'Low Stock Alarms', value: stats.summary.lowStockCount, icon: AlertTriangle, color: stats.summary.lowStockCount > 0 ? 'text-orange-600 bg-orange-50 border-orange-100 font-bold animate-pulse' : 'text-neutral-500 bg-neutral-50 border-neutral-100', subtitle: 'Items requiring restock' }
                ].map((kpi, idx) => {
                  const Icon = kpi.icon;
                  return (
                    <div key={idx} className={`p-5 rounded-2xl border bg-white flex flex-col justify-between shadow-xs ${kpi.color}`}>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <p className="text-[10px] uppercase tracking-wider font-bold opacity-80">{kpi.label}</p>
                        <div className="p-1.5 rounded-lg bg-white/80 border border-neutral-100/50">
                          <Icon className="w-4 h-4 shrink-0" />
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xl sm:text-2xl font-bold font-mono text-neutral-900">{kpi.value}</p>
                        <p className="text-[9px] text-neutral-400 font-sans">{kpi.subtitle}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Main Charts section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 7 Day Area Trend chart */}
                <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif text-lg font-semibold text-neutral-900 tracking-wide mb-1 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-rose-500" /> Sales Overview
                    </h3>
                    <p className="text-xs text-neutral-400 mb-5">Daily sales curve highlighting order transaction volumes over the last 7 days.</p>
                  </div>
                  <div className="h-72 w-full text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats.salesTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#cca380" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#cca380" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="date" stroke="#8c8c8c" fontSize={10} tickLine={false} />
                        <YAxis stroke="#8c8c8c" fontSize={10} tickLine={false} />
                        <Tooltip formatter={(value) => [`₹${value}`, 'Revenue']} />
                        <Area type="monotone" dataKey="revenue" stroke="#bc865d" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Categories share Pie chart */}
                <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif text-lg font-semibold text-neutral-900 tracking-wide mb-1 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-rose-500" /> Department Weights
                    </h3>
                    <p className="text-xs text-neutral-400 mb-5">Department revenue share distribution across product categories.</p>
                    <div className="h-44 w-full text-xs flex justify-center items-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stats.categoryRevenue}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={68}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {stats.categoryRevenue.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`₹${value}`, 'Sales']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Pie Legend List */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] pt-4 border-t border-neutral-100 mt-4">
                    {stats.categoryRevenue.map((item, index) => (
                      <div key={index} className="flex items-center gap-1.5 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="truncate text-neutral-600 font-medium">{item.name}: <span className="font-mono font-bold">₹{item.value}</span></span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Monthly Revenue & Customer Growth Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Monthly Revenue Bar Chart */}
                <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs">
                  <h3 className="font-serif text-lg font-semibold text-neutral-900 tracking-wide mb-1 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-rose-500" /> Monthly Revenue Trend
                  </h3>
                  <p className="text-xs text-neutral-400 mb-5">Month-by-month aggregated sales volume overview for forecasting.</p>
                  <div className="h-64 w-full text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.monthlyRevenue || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="month" stroke="#8c8c8c" fontSize={10} tickLine={false} />
                        <YAxis stroke="#8c8c8c" fontSize={10} tickLine={false} />
                        <Tooltip formatter={(value) => [`₹${value}`, 'Sales']} />
                        <Bar dataKey="revenue" fill="#bc865d" radius={[4, 4, 0, 0]} maxBarSize={45} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Customer Growth Line Chart */}
                <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs">
                  <h3 className="font-serif text-lg font-semibold text-neutral-900 tracking-wide mb-1 flex items-center gap-2">
                    <Users className="w-5 h-5 text-rose-500" /> Cumulative Customer Growth
                  </h3>
                  <p className="text-xs text-neutral-400 mb-5">Aggregated trajectory of newly signed up beauty boutique accounts.</p>
                  <div className="h-64 w-full text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={stats.customerGrowth || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="month" stroke="#8c8c8c" fontSize={10} tickLine={false} />
                        <YAxis stroke="#8c8c8c" fontSize={10} tickLine={false} />
                        <Tooltip formatter={(value) => [value, 'Total Customers']} />
                        <Line type="monotone" dataKey="customers" stroke="#8c583b" strokeWidth={2.5} dot={{ stroke: '#8c583b', strokeWidth: 2, r: 4, fill: '#fff' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

              {/* Top Products & Recent Timeline Activity Section */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                
                {/* Top Products list (lg:col-span-2) */}
                <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif text-lg font-semibold text-neutral-900 tracking-wide mb-1 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-500" /> Best Selling Products
                    </h3>
                    <p className="text-xs text-neutral-400 mb-5">Our highest performing beauty formulations and skincares ranked by units sold.</p>
                    
                    <div className="space-y-4">
                      {stats.topProducts && stats.topProducts.length > 0 ? (
                        stats.topProducts.map((item, index) => (
                          <div key={item.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-neutral-50/50 transition-colors">
                            <div className="w-7 h-7 flex items-center justify-center font-bold font-mono text-neutral-400 text-xs bg-neutral-100 rounded-lg">
                              #{index + 1}
                            </div>
                            <img 
                              src={item.image} 
                              alt={item.name} 
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 object-cover rounded-lg border border-neutral-100" 
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-neutral-800 truncate">{item.name}</p>
                              <p className="text-[10px] text-neutral-400 font-mono">{item.unitsSold} units sold</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-bold font-mono text-neutral-900">₹{item.revenue.toLocaleString()}</p>
                              <p className="text-[9px] text-neutral-400">revenue</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-8 text-center text-xs text-neutral-400">
                          No product transactions recorded yet.
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="pt-4 border-t border-neutral-100 text-[10px] text-neutral-400 text-center mt-4">
                    Data updates automatically with each completed shipment.
                  </div>
                </div>

                {/* Recent Activity Timeline Feed (lg:col-span-3) */}
                <div className="lg:col-span-3 bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif text-lg font-semibold text-neutral-900 tracking-wide mb-1 flex items-center gap-2">
                      <History className="w-5 h-5 text-indigo-500" /> Recent activity feed
                    </h3>
                    <p className="text-xs text-neutral-400 mb-5">A real-time visual checklist of registrations, checkouts, and system triggers.</p>
                    
                    <div className="relative border-l border-neutral-100 pl-4 ml-2 space-y-5">
                      {stats.recentActivityFeed && stats.recentActivityFeed.length > 0 ? (
                        stats.recentActivityFeed.map((activity) => {
                          let badgeBg = 'bg-neutral-100 text-neutral-600';
                          if (activity.type === 'order') badgeBg = 'bg-amber-100 text-amber-700';
                          if (activity.type === 'signup') badgeBg = 'bg-teal-100 text-teal-700';
                          if (activity.type === 'review') badgeBg = 'bg-purple-100 text-purple-700';
                          if (activity.type === 'reward') badgeBg = 'bg-emerald-100 text-emerald-700';

                          return (
                            <div key={activity.id} className="relative text-xs">
                              {/* Dot indicator */}
                              <span className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full border border-white bg-neutral-300 ring-4 ring-white" />
                              
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-neutral-800">{activity.title}</span>
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-medium ${badgeBg}`}>
                                      {activity.type}
                                    </span>
                                  </div>
                                  <p className="text-neutral-500 text-[11px] mt-0.5">{activity.description}</p>
                                  <p className="text-[10px] text-neutral-400 font-mono mt-1">
                                    By {activity.user} • {new Date(activity.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                                {activity.value && (
                                  <span className="shrink-0 font-mono font-bold text-neutral-900 text-xs bg-neutral-50 px-2 py-1 rounded-lg border border-neutral-100">
                                    {activity.value}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="py-12 text-center text-xs text-neutral-400">
                          Timeline timeline is currently quiet.
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="pt-4 border-t border-neutral-100 text-[10px] text-neutral-400 text-right mt-4">
                    Tracking trailing 10 chronological events.
                  </div>
                </div>

              </div>

              {/* Low stock indicators block */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-serif text-lg font-semibold text-neutral-900 tracking-wide flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" /> Stock Shortages & Restock Alarms
                  </h3>
                  <span className="text-xs bg-neutral-100 px-3 py-1 rounded-full text-neutral-600 font-mono">
                    {stats.lowStockProducts.length} warnings
                  </span>
                </div>

                {stats.lowStockProducts.length === 0 ? (
                  <div className="p-4 text-center text-xs text-neutral-400 bg-neutral-50 rounded-xl">
                    ✓ All products are fully stocked. Zero inventory shortfalls.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {stats.lowStockProducts.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 border border-orange-100 rounded-xl bg-orange-50/20 text-xs">
                        <div>
                          <p className="font-semibold text-neutral-800 truncate max-w-[180px]">{item.name}</p>
                          <p className="text-[10px] text-neutral-400 mt-0.5">Brand: {item.brand}</p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-lg font-mono font-bold ${
                          item.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {item.stock === 0 ? 'SOLD OUT' : `${item.stock} left`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ==================== 2. PRODUCTS INVENTORY SUB-TAB ==================== */}
          {activeTab === 'products' && (
            <div className="space-y-6 animate-fade-in">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <p className="text-xs text-neutral-500 font-sans">
                  Double-click or click Edit on any luxury beauty product below to update values, pricing, and stock, or create a brand new product.
                </p>
                <button
                  onClick={() => {
                    resetProductForm();
                    setIsProductModalOpen(true);
                  }}
                  className="py-3 px-4 bg-neutral-900 hover:bg-rose-500 text-white font-medium text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-md active:scale-98"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Premium Product</span>
                </button>
              </div>

              {/* Table list of products */}
              <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-400 uppercase tracking-wider text-[10px] font-bold">
                        <th className="p-4 w-12 text-center">Image</th>
                        <th className="p-4">Item Details</th>
                        <th className="p-4">Department</th>
                        <th className="p-4">Base / Sale Price</th>
                        <th className="p-4">Stock Status</th>
                        <th className="p-4 text-center">Bestseller</th>
                        <th className="p-4 text-center">Rating</th>
                        <th className="p-4 text-center w-24">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 text-neutral-700 font-sans">
                      {productsList.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-neutral-400">
                            Zero products stored in the database. Click 'Create Premium Product' to populate the catalog.
                          </td>
                        </tr>
                      ) : (
                        productsList.map((prod) => (
                          <tr key={prod.id} className="hover:bg-neutral-50/50 transition-colors">
                            <td className="p-4 text-center">
                              <img src={prod.image} alt={prod.name} className="w-10 h-10 object-cover rounded-lg border border-neutral-200 mx-auto" />
                            </td>
                            <td className="p-4">
                              <p className="font-semibold text-neutral-900 leading-tight">{prod.name}</p>
                              <p className="text-[10px] text-neutral-400 font-mono mt-0.5">{prod.details?.brand || 'Collection'}</p>
                            </td>
                            <td className="p-4 font-medium">{prod.categoryName}</td>
                            <td className="p-4 font-mono font-semibold">
                              {prod.salePrice ? (
                                <div className="space-y-0.5">
                                  <p className="text-rose-600">₹{prod.salePrice.toFixed(2)}</p>
                                  <p className="text-[10px] text-neutral-400 line-through">₹{prod.price.toFixed(2)}</p>
                                </div>
                              ) : (
                                <p className="text-neutral-900">₹{prod.price.toFixed(2)}</p>
                              )}
                            </td>
                            <td className="p-4 font-mono">
                              <span className={`px-2.5 py-1 rounded-lg font-bold text-[10px] ${
                                prod.stock === 0
                                  ? 'bg-red-50 text-red-600 border border-red-100'
                                  : prod.stock <= 10
                                    ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              }`}>
                                {prod.stock === 0 ? 'SOLD OUT' : `${prod.stock} units`}
                              </span>
                            </td>
                            <td className="p-4 text-center font-bold">
                              {prod.isFeatured ? (
                                <span className="inline-block px-2 py-0.5 text-[9px] bg-amber-100 text-amber-800 border border-amber-200 rounded-sm">Featured</span>
                              ) : (
                                <span className="text-neutral-300 font-normal">-</span>
                              )}
                            </td>
                            <td className="p-4 text-center font-mono">
                              <div className="flex items-center justify-center gap-0.5 text-amber-400">
                                <Star className="w-3.5 h-3.5 fill-amber-400" />
                                <span className="text-neutral-800 font-bold">{prod.rating.toFixed(1)}</span>
                                <span className="text-neutral-400 text-[10px] font-normal">({prod.reviewsCount})</span>
                              </div>
                            </td>
                            <td className="p-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button 
                                  onClick={() => openEditProduct(prod)}
                                  className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                                  title="Edit Product"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteProduct(prod.id)}
                                  className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                  title="Delete Product"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* PRODUCT MODAL (ADD / EDIT) */}
              {isProductModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
                  <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden my-8">
                    <div className="h-2 bg-gradient-to-r from-amber-200 via-rose-300 to-amber-200" />
                    
                    <button 
                      onClick={() => setIsProductModalOpen(false)}
                      className="absolute p-2 top-4 right-4 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-full"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    <div className="p-6 max-h-[85vh] overflow-y-auto">
                      <h3 className="font-serif text-xl font-bold text-neutral-900 border-b pb-3 mb-5 tracking-wide">
                        {editingProduct ? 'Modify Product Specifications' : 'Draft New Luxury Product'}
                      </h3>

                      <form onSubmit={handleProductSubmit} className="space-y-4 text-xs">
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block mb-1 font-semibold uppercase tracking-wide text-neutral-600">Product Name</label>
                            <input
                              type="text"
                              required
                              value={prodName}
                              onChange={(e) => setProdName(e.target.value)}
                              placeholder="E.g., Luminous Hydra Gloss Lip Tint"
                              className="w-full py-2.5 px-3 border border-neutral-200 rounded-lg text-sm bg-neutral-55 text-neutral-800"
                            />
                          </div>
                          <div>
                            <label className="block mb-1 font-semibold uppercase tracking-wide text-neutral-600">Brand Name</label>
                            <input
                              type="text"
                              required
                              value={prodBrand}
                              onChange={(e) => setProdBrand(e.target.value)}
                              placeholder="E.g., Maison de Beauté"
                              className="w-full py-2.5 px-3 border border-neutral-200 rounded-lg text-sm bg-neutral-55 text-neutral-800"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block mb-1 font-semibold uppercase tracking-wide text-neutral-600">Product Description</label>
                          <textarea
                            required
                            rows={3}
                            value={prodDescription}
                            onChange={(e) => setProdDescription(e.target.value)}
                            placeholder="Provide details about texture, formula, long-wear capabilities, etc."
                            className="w-full py-2.5 px-3 border border-neutral-200 rounded-lg text-sm bg-neutral-55 text-neutral-800"
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block mb-1 font-semibold uppercase tracking-wide text-neutral-600">Price (₹)</label>
                            <input
                              type="number"
                              step="0.01"
                              required
                              value={prodPrice}
                              onChange={(e) => setProdPrice(e.target.value)}
                              placeholder="42.00"
                              className="w-full py-2.5 px-3 border border-neutral-200 rounded-lg text-sm bg-neutral-55 text-neutral-800 font-mono"
                            />
                          </div>
                          <div>
                            <label className="block mb-1 font-semibold uppercase tracking-wide text-neutral-600">Sale Price (₹ - Optional)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={prodSalePrice}
                              onChange={(e) => setProdSalePrice(e.target.value)}
                              placeholder="38.00"
                              className="w-full py-2.5 px-3 border border-neutral-200 rounded-lg text-sm bg-neutral-55 text-neutral-800 font-mono"
                            />
                          </div>
                          <div>
                            <label className="block mb-1 font-semibold uppercase tracking-wide text-neutral-600">Initial Stock</label>
                            <input
                              type="number"
                              required
                              value={prodStock}
                              onChange={(e) => setProdStock(e.target.value)}
                              placeholder="50"
                              className="w-full py-2.5 px-3 border border-neutral-200 rounded-lg text-sm bg-neutral-55 text-neutral-800 font-mono"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4">
                          <div>
                            <label className="block mb-1 font-semibold uppercase tracking-wide text-neutral-600">Category Department</label>
                            <select
                              required
                              value={prodCategory}
                              onChange={(e) => setProdCategory(e.target.value)}
                              className="w-full py-2.5 px-3 border border-neutral-200 rounded-lg text-sm bg-neutral-55 text-neutral-800"
                            >
                              <option value="">Select Category</option>
                              {categories.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block mb-1 font-semibold uppercase tracking-wide text-neutral-600">Target Skin Types</label>
                            <input
                              type="text"
                              value={prodSkinType}
                              onChange={(e) => setProdSkinType(e.target.value)}
                              placeholder="All Skin Types, Normal to Dry"
                              className="w-full py-2.5 px-3 border border-neutral-200 rounded-lg text-sm bg-neutral-55 text-neutral-800"
                            />
                          </div>
                          <div>
                            <label className="block mb-1 font-semibold uppercase tracking-wide text-neutral-600">Reward Coins</label>
                            <input
                              type="number"
                              min="0"
                              value={prodRewardCoins}
                              onChange={(e) => setProdRewardCoins(e.target.value)}
                              placeholder="10"
                              className="w-full py-2.5 px-3 border border-neutral-200 rounded-lg text-sm bg-neutral-55 text-neutral-800 font-mono"
                            />
                          </div>
                          <div className="flex items-center gap-2 pt-6">
                            <input
                              type="checkbox"
                              id="isFeatured"
                              checked={prodFeatured}
                              onChange={(e) => setProdFeatured(e.target.checked)}
                              className="w-4 h-4 text-rose-500 rounded border-neutral-300 focus:ring-rose-400"
                            />
                            <label htmlFor="isFeatured" className="font-semibold uppercase tracking-wide text-neutral-600 cursor-pointer select-none">Bestseller Item</label>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block mb-1 font-semibold uppercase tracking-wide text-neutral-600">Ingredients List</label>
                            <textarea
                              rows={2}
                              value={prodIngredients}
                              onChange={(e) => setProdIngredients(e.target.value)}
                              placeholder="Niacinamide, Hyaluronic Acid, Rosewater extract..."
                              className="w-full py-2.5 px-3 border border-neutral-200 rounded-lg text-sm bg-neutral-55 text-neutral-800"
                            />
                          </div>
                          <div>
                            <label className="block mb-1 font-semibold uppercase tracking-wide text-neutral-600">Instructions (How to Use)</label>
                            <textarea
                              rows={2}
                              value={prodHowToUse}
                              onChange={(e) => setProdHowToUse(e.target.value)}
                              placeholder="Smooth gently onto clean face before sleeping..."
                              className="w-full py-2.5 px-3 border border-neutral-200 rounded-lg text-sm bg-neutral-55 text-neutral-800"
                            />
                          </div>
                        </div>

                        {/* Image upload module */}
                        <div className="border border-neutral-200 rounded-xl p-4 bg-neutral-50/50 space-y-3">
                          <p className="font-semibold text-neutral-700 border-b pb-1.5 flex items-center gap-1.5"><ImageIcon className="w-4 h-4 text-rose-500" /> Media Selection</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block mb-1 text-[10px] uppercase font-semibold text-neutral-500">Method A: Upload File (Multer)</label>
                              <div className="flex items-center gap-2">
                                <label className="flex-1 border border-dashed border-neutral-300 rounded-lg p-3 bg-white hover:bg-neutral-50 transition-colors flex flex-col items-center justify-center cursor-pointer text-center">
                                  <Upload className="w-5 h-5 text-neutral-400 mb-1" />
                                  <span className="text-[10px] text-neutral-500 truncate max-w-[150px]">{selectedFile ? selectedFile.name : 'Choose image...'}</span>
                                  <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={(e) => {
                                      if (e.target.files && e.target.files[0]) {
                                        setSelectedFile(e.target.files[0]);
                                        setProdImageUrl(''); // clear url method
                                      }
                                    }}
                                    className="hidden" 
                                  />
                                </label>
                              </div>
                            </div>
                            <div>
                              <label className="block mb-1 text-[10px] uppercase font-semibold text-neutral-500">Method B: Paste Direct URL</label>
                              <input
                                type="text"
                                value={prodImageUrl}
                                onChange={(e) => {
                                  setProdImageUrl(e.target.value);
                                  setSelectedFile(null); // clear file method
                                }}
                                placeholder="https://images.unsplash.com/photo-..."
                                className="w-full py-3.5 px-3 border border-neutral-200 rounded-lg text-[10px] bg-white text-neutral-800 font-mono"
                              />
                            </div>
                          </div>
                          {(prodImageUrl || selectedFile) && (
                            <p className="text-[10px] text-emerald-600 font-medium font-sans">✓ Image attached successfully via {selectedFile ? 'Multer file upload' : 'Direct URL link'}.</p>
                          )}
                        </div>

                        <button
                          type="submit"
                          disabled={actionLoading}
                          className="w-full py-3.5 px-4 bg-neutral-900 text-white font-medium text-xs rounded-xl hover:bg-rose-500 transition-all flex justify-center items-center gap-2 mt-4"
                        >
                          {actionLoading ? (
                            <div className="w-5 h-5 border-2 border-white rounded-full border-t-transparent animate-spin" />
                          ) : (
                            <span>{editingProduct ? 'Commit Updates' : 'Add to Storefront Catalog'}</span>
                          )}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ==================== 3. CATEGORIES/DEPARTMENTS SUB-TAB ==================== */}
          {activeTab === 'categories' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center">
                <p className="text-xs text-neutral-500">
                  Configure the primary department routing filters. Deleting a category requires that zero products remain associated with it to preserve data integrity.
                </p>
                <button
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="py-3 px-4 bg-neutral-900 hover:bg-rose-500 text-white font-medium text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Department Category</span>
                </button>
              </div>

              {/* Grid of categories with stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {categories.map((cat) => {
                  const itemsCount = productsList.filter(p => p.categoryId === cat.id).length;
                  return (
                    <div key={cat.id} className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between">
                      <div className="relative aspect-video">
                        <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                        <div className="absolute bottom-3 left-4 text-white">
                          <h4 className="font-serif text-base font-bold tracking-wider">{cat.name}</h4>
                          <p className="text-[10px] font-mono opacity-80 uppercase">Slug: {cat.slug}</p>
                        </div>
                      </div>
                      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                        <p className="text-neutral-500 text-xs leading-relaxed">{cat.description}</p>
                        <div className="pt-3 border-t border-neutral-100 flex justify-between items-center text-xs">
                          <span className="font-mono bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1 text-neutral-600 font-bold">{itemsCount} products</span>
                          <button
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Department"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ADD CATEGORY MODAL */}
              {isCategoryModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                  <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
                    <div className="h-2 bg-gradient-to-r from-amber-200 via-rose-300 to-amber-200" />
                    <button 
                      onClick={() => setIsCategoryModalOpen(false)}
                      className="absolute p-2 top-4 right-4 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-full"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <div className="p-6">
                      <h3 className="font-serif text-lg font-bold text-neutral-900 border-b pb-2 mb-4 tracking-wide">
                        Create Department Category
                      </h3>
                      <form onSubmit={handleCategorySubmit} className="space-y-4 text-xs">
                        <div>
                          <label className="block mb-1 font-semibold uppercase tracking-wide text-neutral-600">Category Name</label>
                          <input
                            type="text"
                            required
                            value={catName}
                            onChange={(e) => setCatName(e.target.value)}
                            placeholder="E.g., Cleansers & Toners"
                            className="w-full py-2.5 px-3 border border-neutral-200 rounded-lg text-sm bg-neutral-55 text-neutral-800"
                          />
                        </div>
                        <div>
                          <label className="block mb-1 font-semibold uppercase tracking-wide text-neutral-600">Department Description</label>
                          <textarea
                            required
                            rows={3}
                            value={catDescription}
                            onChange={(e) => setCatDescription(e.target.value)}
                            placeholder="Brief summary of department inventory..."
                            className="w-full py-2.5 px-3 border border-neutral-200 rounded-lg text-sm bg-neutral-55 text-neutral-800"
                          />
                        </div>

                        {/* Image upload */}
                        <div className="border border-neutral-200 rounded-xl p-4 bg-neutral-50/50 space-y-3">
                          <p className="font-semibold text-neutral-700 border-b pb-1">Category Image Media</p>
                          <div className="grid grid-cols-1 gap-3">
                            <div>
                              <label className="block mb-1 text-[9px] uppercase font-semibold text-neutral-500">Method A: Upload (Multer)</label>
                              <label className="border border-dashed border-neutral-300 rounded-lg p-2.5 bg-white hover:bg-neutral-50 transition-colors flex flex-col items-center justify-center cursor-pointer text-center">
                                <Upload className="w-4 h-4 text-neutral-400 mb-1" />
                                <span className="text-[10px] text-neutral-500 truncate max-w-[120px]">{selectedCatFile ? selectedCatFile.name : 'Choose image...'}</span>
                                <input 
                                  type="file" 
                                  accept="image/*"
                                  onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                      setSelectedCatFile(e.target.files[0]);
                                      setCatImageUrl('');
                                    }
                                  }}
                                  className="hidden" 
                                />
                              </label>
                            </div>
                            <div>
                              <label className="block mb-1 text-[9px] uppercase font-semibold text-neutral-500">Method B: Image URL</label>
                              <input
                                type="text"
                                value={catImageUrl}
                                onChange={(e) => {
                                  setCatImageUrl(e.target.value);
                                  setSelectedCatFile(null);
                                }}
                                placeholder="https://images.unsplash.com/photo-..."
                                className="w-full py-2.5 px-3 border border-neutral-200 rounded-lg text-[10px] bg-white text-neutral-800 font-mono"
                              />
                            </div>
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={actionLoading}
                          className="w-full py-3.5 px-4 bg-neutral-900 text-white font-medium text-xs rounded-xl hover:bg-rose-500 transition-all flex justify-center items-center mt-4"
                        >
                          {actionLoading ? (
                            <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin" />
                          ) : (
                            <span>Create Category</span>
                          )}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ==================== 4. ORDERS SHIPMENT MODERATION ==================== */}
          {activeTab === 'orders' && (
            <div className="space-y-6 animate-fade-in">
              <p className="text-xs text-neutral-500">
                Audit shipment dispatches, monitor checkout cart items, approve invoices, and adjust payment statuses dynamically.
              </p>

              <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-400 uppercase tracking-wider text-[10px] font-bold">
                        <th className="p-4">Order ID</th>
                        <th className="p-4">Date Placed</th>
                        <th className="p-4">Recipient</th>
                        <th className="p-4">Invoice Items</th>
                        <th className="p-4">Total Amount</th>
                        <th className="p-4 text-center">Payment</th>
                        <th className="p-4 text-center">Delivery Status</th>
                        <th className="p-4 text-center w-24">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 text-neutral-700 font-sans">
                      {ordersList.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-neutral-400">
                            Zero user checkouts recorded. Placing a customer order will populate this panel.
                          </td>
                        </tr>
                      ) : (
                        ordersList.map((ord) => (
                          <tr key={ord.id} className="hover:bg-neutral-50/50 transition-colors">
                            <td className="p-4 font-mono font-bold text-neutral-900">#{ord.id}</td>
                            <td className="p-4 font-mono text-neutral-400">{new Date(ord.createdAt).toLocaleDateString()}</td>
                            <td className="p-4">
                              <p className="font-semibold text-neutral-800">{ord.userName}</p>
                              <p className="text-[10px] text-neutral-400 font-mono">{ord.userEmail}</p>
                            </td>
                            <td className="p-4 font-medium text-neutral-600">
                              <span className="truncate max-w-[180px] inline-block">
                                {ord.items.map(i => `${i.quantity}× ${i.name}`).join(', ')}
                              </span>
                            </td>
                            <td className="p-4 font-mono font-bold text-neutral-900">₹{ord.totalAmount.toFixed(2)}</td>
                            <td className="p-4 text-center">
                              <span className={`px-2 py-0.5 rounded-sm font-semibold text-[9px] uppercase ${
                                ord.paymentStatus === 'paid'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : ord.paymentStatus === 'failed'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}>
                                {ord.paymentStatus}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] uppercase font-bold ${
                                ord.orderStatus === 'completed'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                  : ord.orderStatus === 'shipped'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-100'
                                    : ord.orderStatus === 'cancelled'
                                      ? 'bg-red-50 text-red-700 border border-red-100'
                                      : 'bg-amber-50 text-amber-700 border border-amber-100 animate-pulse'
                              }`}>
                                {ord.orderStatus}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => {
                                  setSelectedOrder(ord);
                                  setIsOrderDetailOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-500 hover:bg-neutral-100 transition-colors"
                                title="Inspect Shipment"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ORDER DETAILS MODAL */}
              {isOrderDetailOpen && selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                  <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden">
                    <div className="h-2 bg-gradient-to-r from-amber-200 via-rose-300 to-amber-200" />
                    <button 
                      onClick={() => setIsOrderDetailOpen(false)}
                      className="absolute p-2 top-4 right-4 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-full"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <div className="p-6 space-y-4">
                      
                      {/* Invoice style header */}
                      <div className="border-b border-neutral-200 pb-3">
                        <h3 className="font-serif text-lg font-bold text-neutral-900 tracking-wide">
                          Fulfillment Audit • #{selectedOrder.id}
                        </h3>
                        <p className="text-neutral-400 text-[10px] font-mono mt-0.5">Placed: {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                      </div>

                      {/* Client delivery details */}
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <p className="font-bold text-neutral-400 uppercase tracking-wider text-[9px]">Client Profile</p>
                          <p className="font-semibold text-neutral-800 mt-1">{selectedOrder.userName}</p>
                          <p className="text-neutral-500 font-mono">{selectedOrder.userEmail}</p>
                          <p className="text-neutral-500 font-mono mt-0.5">Contact: {selectedOrder.phone}</p>
                        </div>
                        <div>
                          <p className="font-bold text-neutral-400 uppercase tracking-wider text-[9px]">Shipment Target</p>
                          <p className="text-neutral-600 leading-relaxed mt-1">{selectedOrder.shippingAddress}</p>
                        </div>
                      </div>

                      {/* Items list */}
                      <div className="border-t border-b border-neutral-150 py-3 bg-neutral-50/50 p-3 rounded-xl text-xs space-y-2">
                        <p className="font-bold text-neutral-400 uppercase tracking-wider text-[9px] mb-1">Purchased Cosmetics</p>
                        {selectedOrder.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <img src={item.image} alt={item.name} className="w-8 h-8 rounded-md object-cover border" />
                              <div>
                                <p className="font-semibold text-neutral-800">{item.name}</p>
                                <p className="text-neutral-400 text-[10px] font-mono">{item.quantity} × ₹{item.price.toFixed(2)}</p>
                              </div>
                            </div>
                            <span className="font-mono font-bold text-neutral-900">₹{(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                        <div className="border-t border-neutral-200 pt-2.5 mt-2 flex justify-between font-bold text-sm text-neutral-900">
                          <span>Subtotal Invoice:</span>
                          <span className="font-mono">₹{selectedOrder.totalAmount.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Status adjustments */}
                      <div className="grid grid-cols-2 gap-4 p-4 border border-neutral-100 rounded-xl bg-neutral-50/30 text-xs">
                        <div>
                          <label className="block mb-1.5 font-bold uppercase tracking-wider text-[9px] text-neutral-500">Delivery Status</label>
                          <select
                            value={selectedOrder.orderStatus}
                            onChange={(e) => handleUpdateOrderStatus(selectedOrder.id, { orderStatus: e.target.value })}
                            className="w-full py-2 px-2.5 border border-neutral-200 rounded-lg text-xs bg-white text-neutral-800 font-medium focus:ring-1 focus:ring-neutral-900"
                          >
                            <option value="pending">Pending Preparation</option>
                            <option value="shipped">Dispatched (Shipped)</option>
                            <option value="completed">Delivered (Completed)</option>
                            <option value="cancelled">Revoked (Cancelled)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block mb-1.5 font-bold uppercase tracking-wider text-[9px] text-neutral-500">Invoice Payment</label>
                          <select
                            value={selectedOrder.paymentStatus}
                            onChange={(e) => handleUpdateOrderStatus(selectedOrder.id, { paymentStatus: e.target.value })}
                            className="w-full py-2 px-2.5 border border-neutral-200 rounded-lg text-xs bg-white text-neutral-800 font-medium focus:ring-1 focus:ring-neutral-900"
                          >
                            <option value="pending">Awaiting Payment</option>
                            <option value="paid">Captured (Paid)</option>
                            <option value="failed">Declined (Failed)</option>
                          </select>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ==================== 5. REVIEWS MODERATION PANEL ==================== */}
          {activeTab === 'reviews' && (
            <div className="space-y-6 animate-fade-in">
              <p className="text-xs text-neutral-500">
                Audit reviews submitted by customers. Toggling approval state updates the score weighting of the cosmetics item instantly.
              </p>

              <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-400 uppercase tracking-wider text-[10px] font-bold">
                        <th className="p-4">Author</th>
                        <th className="p-4">Product Item</th>
                        <th className="p-4">Star Rating</th>
                        <th className="p-4 w-1/3">Feedback Message</th>
                        <th className="p-4 text-center">Status</th>
                        <th className="p-4 text-center w-28">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 text-neutral-700 font-sans">
                      {reviewsList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-neutral-400">
                            Zero product feedback logged in the system.
                          </td>
                        </tr>
                      ) : (
                        reviewsList.map((rev) => (
                          <tr key={rev.id} className="hover:bg-neutral-50/50 transition-colors">
                            <td className="p-4">
                              <p className="font-semibold text-neutral-800">{rev.userName}</p>
                              <p className="text-[10px] text-neutral-400 font-mono">{new Date(rev.createdAt).toLocaleDateString()}</p>
                            </td>
                            <td className="p-4 font-medium text-neutral-800">{rev.productName}</td>
                            <td className="p-4 font-mono font-bold text-neutral-900">
                              <div className="flex items-center gap-0.5 text-amber-400">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star key={s} className={`w-3 h-3 ${s <= rev.rating ? 'fill-amber-400' : 'text-neutral-200'}`} />
                                ))}
                                <span className="ml-1 text-neutral-800">{rev.rating}/5</span>
                              </div>
                            </td>
                            <td className="p-4 text-neutral-600 leading-relaxed italic">"{rev.comment}"</td>
                            <td className="p-4 text-center">
                              <span className={`px-2 py-0.5 rounded-sm font-semibold text-[9px] uppercase ${
                                rev.isApproved 
                                  ? 'bg-emerald-100 text-emerald-800' 
                                  : 'bg-rose-100 text-rose-800 border border-rose-200 font-bold animate-pulse'
                              }`}>
                                {rev.isApproved ? 'Approved' : 'Needs Review'}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => handleReviewStatusToggle(rev.id, rev.isApproved)}
                                  className={`p-1.5 rounded-lg border text-xs font-semibold ${
                                    rev.isApproved
                                      ? 'text-neutral-500 border-neutral-200 hover:bg-neutral-50'
                                      : 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'
                                  }`}
                                  title={rev.isApproved ? 'Unapprove Feed' : 'Approve Feed'}
                                >
                                  {rev.isApproved ? 'Unapprove' : 'Approve'}
                                </button>
                                <button
                                  onClick={() => handleDeleteReview(rev.id)}
                                  className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors ml-1"
                                  title="Delete Feedback"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ==================== 5B. CUSTOMER DIRECTORY SYSTEM ==================== */}
          {activeTab === 'customers' && (
            <div className="space-y-6 animate-fade-in">
              {/* Dashboard Statistics Card Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Customers', value: customerStats.totalCustomers, icon: Users, color: 'text-teal-600 bg-teal-50 border-teal-100', subtitle: 'Registered customer database' },
                  { label: 'Active Accounts', value: customerStats.activeCustomers, icon: Check, color: 'text-emerald-600 bg-emerald-50 border-emerald-100', subtitle: 'Non-blocked active clients' },
                  { label: 'VIP Status Members', value: customerStats.vipCustomers, icon: Award, color: 'text-amber-600 bg-amber-50 border-amber-100', subtitle: 'High lifetime points / spend' },
                  { label: 'New This Month', value: customerStats.newCustomers, icon: Sparkles, color: 'text-pink-600 bg-pink-50 border-pink-100', subtitle: 'Registered in past 30 days' }
                ].map((stat, idx) => {
                  const Icon = stat.icon;
                  return (
                    <div key={idx} className={`p-5 rounded-2xl border bg-white flex flex-col justify-between shadow-xs ${stat.color}`}>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <p className="text-[10px] uppercase tracking-wider font-bold opacity-80">{stat.label}</p>
                        <div className="p-1.5 rounded-lg bg-white/80 border border-neutral-100/50">
                          <Icon className="w-4 h-4 shrink-0" />
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xl sm:text-2xl font-bold font-mono text-neutral-900">{stat.value}</p>
                        <p className="text-[9px] text-neutral-400 font-sans">{stat.subtitle}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Search & Filter Header Control */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs">
                <div className="flex-1 flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        fetchCustomersList(e.target.value, customerFilter);
                      }}
                      placeholder="Search customers by username, email, ID, or phone number..."
                      className="w-full pl-3 pr-10 py-2 border border-neutral-200 rounded-xl text-xs bg-neutral-50 text-neutral-800 placeholder-neutral-400 focus:outline-hidden focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 focus:bg-white"
                    />
                    {customersLoading ? (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-3.5 h-3.5 border-2 border-neutral-400 rounded-full border-t-transparent animate-spin" />
                      </div>
                    ) : (
                      customerSearch && (
                        <button
                          onClick={() => {
                            setCustomerSearch('');
                            fetchCustomersList('', customerFilter);
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )
                    )}
                  </div>
                  <button
                    onClick={() => fetchCustomersList(customerSearch, customerFilter)}
                    className="px-4 py-2 bg-neutral-900 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition-all shadow-xs shrink-0"
                  >
                    Search
                  </button>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-400 font-medium">Filter By:</span>
                  <select
                    value={customerFilter}
                    onChange={(e) => {
                      setCustomerFilter(e.target.value);
                      fetchCustomersList(customerSearch, e.target.value);
                    }}
                    className="py-2 px-3 border border-neutral-200 rounded-xl text-xs bg-white text-neutral-800 font-medium focus:ring-1 focus:ring-neutral-900"
                  >
                    <option value="all">All Registered Customers</option>
                    <option value="active">Active Accounts Only</option>
                    <option value="blocked">Blocked / Suspended Accounts</option>
                    <option value="vip">VIP Status Members</option>
                    <option value="new">New Customers (Past 30d)</option>
                  </select>
                </div>
              </div>

              {/* Main Directory Table */}
              <div className={`bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-xs transition-opacity duration-200 ${customersLoading ? 'opacity-60 pointer-events-none' : ''}`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-400 uppercase tracking-wider text-[10px] font-bold">
                        <th className="p-4">Customer ID</th>
                        <th className="p-4">Profile Info</th>
                        <th className="p-4">Phone Number</th>
                        <th className="p-4">Coins Balance</th>
                        <th className="p-4 text-center">Checkout Orders</th>
                        <th className="p-4">Total Spending</th>
                        <th className="p-4 text-center">Status</th>
                        <th className="p-4 text-center w-36">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 text-neutral-700 font-sans">
                      {customersList.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-12 text-center text-neutral-400">
                            No customers found matching your search and filter criteria.
                          </td>
                        </tr>
                      ) : (
                        customersList.map((customer) => (
                          <tr key={customer.id} className="hover:bg-neutral-50/50 transition-colors">
                            <td className="p-4 font-mono font-bold text-neutral-500">#{customer.id}</td>
                            <td className="p-4">
                              <p className="font-semibold text-neutral-800">{customer.username}</p>
                              <p className="text-[10px] text-neutral-400 font-mono">{customer.email}</p>
                              <p className="text-[9px] text-neutral-400 font-mono">Joined: {new Date(customer.createdAt).toLocaleDateString()}</p>
                            </td>
                            <td className="p-4 font-mono text-neutral-600">{customer.phone || '—'}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-1">
                                <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                <span className="font-bold font-mono text-neutral-900">{customer.balancePoints}</span>
                                <span className="text-[10px] text-neutral-400">({customer.lifetimePointsEarned} earned)</span>
                              </div>
                            </td>
                            <td className="p-4 text-center font-mono font-bold text-neutral-600">{customer.totalOrders}</td>
                            <td className="p-4 font-mono font-bold text-neutral-900">₹{customer.totalSpend.toFixed(2)}</td>
                            <td className="p-4 text-center">
                              <span className={`px-2 py-0.5 rounded-sm font-semibold text-[9px] uppercase ${
                                customer.isBlocked
                                  ? 'bg-red-100 text-red-800 border border-red-200'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}>
                                {customer.isBlocked ? 'Blocked' : 'Active'}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleViewCustomerDetails(customer.id)}
                                  className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-500 hover:bg-neutral-100 transition-colors"
                                  title="View Customer Profile"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleOpenEditCustomer(customer)}
                                  className="p-1.5 rounded-lg text-neutral-500 hover:text-amber-600 hover:bg-neutral-100 transition-colors"
                                  title="Edit Profile"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleToggleBlockCustomer(customer)}
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    customer.isBlocked 
                                      ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50' 
                                      : 'text-red-500 hover:text-red-700 hover:bg-red-50'
                                  }`}
                                  title={customer.isBlocked ? 'Unblock Customer Account' : 'Block Customer Account'}
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* DETAILED CUSTOMER PROFILE MODAL */}
              {isCustomerDetailOpen && selectedCustomer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                  <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                    <div className="h-2 bg-gradient-to-r from-amber-200 via-rose-300 to-amber-200 shrink-0" />
                    
                    <button 
                      onClick={() => setIsCustomerDetailOpen(false)}
                      className="absolute p-2 top-4 right-4 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-full z-10"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    {/* Scrollable Content Container */}
                    <div className="p-6 overflow-y-auto space-y-6">
                      
                      {/* Customer Info Header Card */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-neutral-50 p-5 rounded-2xl border border-neutral-150">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-neutral-900 text-white font-serif font-bold text-lg flex items-center justify-center">
                            {selectedCustomer.customer.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-serif text-lg font-bold text-neutral-900">
                                {selectedCustomer.customer.username}
                              </h3>
                              <span className={`px-2 py-0.5 rounded-sm font-semibold text-[8px] uppercase tracking-wider ${
                                selectedCustomer.customer.isBlocked
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {selectedCustomer.customer.isBlocked ? 'Blocked' : 'Active'}
                              </span>
                            </div>
                            <p className="text-neutral-500 text-xs font-mono">{selectedCustomer.customer.email}</p>
                            <p className="text-neutral-400 text-[10px] mt-0.5 font-sans">
                              Account ID: <span className="font-mono">{selectedCustomer.customer.id}</span> • Member Since: {new Date(selectedCustomer.customer.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {/* Quick Stats Block */}
                        <div className="flex gap-4 text-xs font-mono border-l sm:border-l border-neutral-200 pl-4">
                          <div>
                            <p className="text-[9px] uppercase tracking-wider font-bold text-neutral-400">Total Spend</p>
                            <p className="text-sm font-bold text-neutral-900 mt-1">₹{selectedCustomer.customer.totalSpend.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-[9px] uppercase tracking-wider font-bold text-neutral-400">Coin Balance</p>
                            <p className="text-sm font-bold text-amber-600 mt-1 flex items-center gap-0.5">
                              <Award className="w-3.5 h-3.5 shrink-0" />
                              {selectedCustomer.customer.balancePoints}
                            </p>
                          </div>
                          <div>
                            <p className="text-[9px] uppercase tracking-wider font-bold text-neutral-400">Phone</p>
                            <p className="text-sm font-bold text-neutral-600 mt-1">{selectedCustomer.customer.phone || '—'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Profile Detail Action Row */}
                      <div className="flex justify-end gap-2 shrink-0">
                        <button
                          onClick={() => handleOpenEditCustomer(selectedCustomer.customer)}
                          className="py-1.5 px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold text-[11px] rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit Customer Profile</span>
                        </button>
                        <button
                          onClick={() => handleToggleBlockCustomer(selectedCustomer.customer)}
                          className={`py-1.5 px-3 font-semibold text-[11px] rounded-lg transition-colors flex items-center gap-1 ${
                            selectedCustomer.customer.isBlocked
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-red-50 text-red-700 hover:bg-red-100'
                          }`}
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>{selectedCustomer.customer.isBlocked ? 'Activate Customer' : 'Suspend Customer'}</span>
                        </button>
                      </div>

                      {/* Tabs Navigation inside profile */}
                      <div className="border-b border-neutral-100 pb-3 flex gap-2">
                        {[
                          { id: 'orders', label: 'Order History', icon: History, badge: selectedCustomer.orders.length },
                          { id: 'rewards', label: 'Reward Coins Ledger', icon: Coins, badge: selectedCustomer.rewardHistory.length },
                          { id: 'referrals', label: 'Referral Track', icon: Users, badge: selectedCustomer.referralHistory.length }
                        ].map((subtab) => {
                          const Icon = subtab.icon;
                          const isSelected = customerDetailTab === subtab.id;
                          return (
                            <button
                              key={subtab.id}
                              onClick={() => setCustomerDetailTab(subtab.id as any)}
                              className={`py-2 px-3.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                                isSelected
                                  ? 'bg-neutral-900 text-white'
                                  : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-600 border border-neutral-200'
                              }`}
                            >
                              <Icon className="w-3.5 h-3.5" />
                              <span>{subtab.label}</span>
                              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-mono ${
                                isSelected ? 'bg-white/20 text-white' : 'bg-neutral-200 text-neutral-600'
                              }`}>{subtab.badge}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Tab Contents: Orders History */}
                      {customerDetailTab === 'orders' && (
                        <div className="space-y-3">
                          <p className="text-[10px] text-neutral-400 font-mono font-bold uppercase tracking-wider">Purchase History Logs</p>
                          <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white max-h-64 overflow-y-auto">
                            <table className="w-full text-left border-collapse text-[11px]">
                              <thead>
                                <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-400 uppercase text-[9px] font-bold">
                                  <th className="p-3">Order ID</th>
                                  <th className="p-3">Placement Date</th>
                                  <th className="p-3">Purchased Items</th>
                                  <th className="p-3">Total Amount</th>
                                  <th className="p-3">Invoice / Pay</th>
                                  <th className="p-3 text-center">Fulfillment</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-neutral-100 font-sans text-neutral-600">
                                {selectedCustomer.orders.length === 0 ? (
                                  <tr>
                                    <td colSpan={6} className="p-6 text-center text-neutral-400">No invoice checkouts found for this user.</td>
                                  </tr>
                                ) : (
                                  selectedCustomer.orders.map((ord: Order) => (
                                    <tr key={ord.id} className="hover:bg-neutral-50/50">
                                      <td className="p-3 font-mono font-bold text-neutral-900">#{ord.id}</td>
                                      <td className="p-3 font-mono">{new Date(ord.createdAt).toLocaleDateString()}</td>
                                      <td className="p-3">
                                        <span className="truncate max-w-[150px] inline-block font-medium">
                                          {ord.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                                        </span>
                                      </td>
                                      <td className="p-3 font-mono font-bold text-neutral-900">₹{ord.totalAmount.toFixed(2)}</td>
                                      <td className="p-3">
                                        <span className={`px-1.5 py-0.5 rounded-sm text-[8px] uppercase font-bold ${
                                          ord.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                        }`}>
                                          {ord.paymentStatus}
                                        </span>
                                      </td>
                                      <td className="p-3 text-center">
                                        <span className={`px-1.5 py-0.5 rounded-sm text-[8px] uppercase font-bold ${
                                          ord.orderStatus === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                                        }`}>
                                          {ord.orderStatus}
                                        </span>
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Tab Contents: Reward History */}
                      {customerDetailTab === 'rewards' && (
                        <div className="space-y-4">
                          {/* Wallet Statistics Row */}
                          <div className="grid grid-cols-3 gap-3 bg-amber-50/40 border border-amber-100/50 p-3.5 rounded-xl">
                            <div>
                              <p className="text-[9px] uppercase tracking-wider font-bold text-neutral-400">Current Balance</p>
                              <p className="text-sm font-extrabold text-amber-700 mt-0.5">{selectedCustomer.customer.balancePoints || 0} Coins</p>
                            </div>
                            <div>
                              <p className="text-[9px] uppercase tracking-wider font-bold text-neutral-400">Lifetime Earned</p>
                              <p className="text-sm font-extrabold text-neutral-700 mt-0.5">{selectedCustomer.customer.lifetimePointsEarned || 0} Coins</p>
                            </div>
                            <div>
                              <p className="text-[9px] uppercase tracking-wider font-bold text-neutral-400">Lifetime Redeemed</p>
                              <p className="text-sm font-extrabold text-neutral-700 mt-0.5">{selectedCustomer.customer.lifetimePointsRedeemed || 0} Coins</p>
                            </div>
                          </div>

                          <p className="text-[10px] text-neutral-400 font-mono font-bold uppercase tracking-wider">Loyalty Coin Transaction Ledger</p>
                          <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white max-h-[180px] overflow-y-auto">
                            <table className="w-full text-left border-collapse text-[11px]">
                              <thead>
                                <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-400 uppercase text-[9px] font-bold">
                                  <th className="p-3">Transaction ID</th>
                                  <th className="p-3">Timestamp</th>
                                  <th className="p-3">Adjustment Type</th>
                                  <th className="p-3">Description</th>
                                  <th className="p-3 text-right">Points Delta</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-neutral-100 font-sans text-neutral-600">
                                {selectedCustomer.rewardHistory.length === 0 ? (
                                  <tr>
                                    <td colSpan={5} className="p-6 text-center text-neutral-400">No coin transactions recorded.</td>
                                  </tr>
                                ) : (
                                  selectedCustomer.rewardHistory.map((tx: RewardTransaction) => {
                                    const isEarn = tx.points > 0;
                                    return (
                                      <tr key={tx.id} className="hover:bg-neutral-50/50">
                                        <td className="p-3 font-mono font-semibold text-neutral-500">#{tx.id}</td>
                                        <td className="p-3 font-mono">{new Date(tx.createdAt).toLocaleString()}</td>
                                        <td className="p-3 font-semibold uppercase text-[9px] tracking-wider text-neutral-500">
                                          {tx.transactionType.replace(/_/g, ' ')}
                                        </td>
                                        <td className="p-3">{tx.description}</td>
                                        <td className={`p-3 text-right font-mono font-bold text-sm ${
                                          isEarn ? 'text-emerald-600' : 'text-rose-600'
                                        }`}>
                                          {isEarn ? `+${tx.points}` : tx.points}
                                        </td>
                                      </tr>
                                    );
                                  })
                                )}
                              </tbody>
                            </table>
                          </div>

                          {/* Manual Wallet Adjustment Form */}
                          <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 space-y-3">
                            <h4 className="text-xs font-semibold text-neutral-800 uppercase tracking-wide flex items-center gap-1.5">
                              <Sliders className="w-3.5 h-3.5 text-amber-500" />
                              <span>Manual Wallet Adjustment</span>
                            </h4>
                            <p className="text-[10px] text-neutral-500 leading-normal">
                              Adjust this client's wallet coin balance directly. Use positive integers to award/credit coins, and negative integers to deduct/debit coins.
                            </p>
                            
                            <form 
                              onSubmit={async (e) => {
                                e.preventDefault();
                                setActionLoading(true);
                                setErrorMsg('');
                                setSuccessMsg('');
                                try {
                                  const points = parseInt(manualCoinsPoints, 10);
                                  if (isNaN(points) || points === 0) {
                                    throw new Error('Please enter a valid non-zero integer for coin adjustment.');
                                  }
                                  if (!manualCoinsDescription.trim()) {
                                    throw new Error('Please provide a reason/description for this manual adjustment.');
                                  }
                                  
                                  const customerId = selectedCustomer.customer.id;
                                  const res = await fetch(`/api/admin/customers/${customerId}/adjust-wallet`, {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      'Authorization': `Bearer ${token}`
                                    },
                                    body: JSON.stringify({
                                      points,
                                      description: manualCoinsDescription.trim()
                                    })
                                  });
                                  
                                  const data = await res.json();
                                  if (!res.ok) throw new Error(data.error || 'Failed to adjust wallet balance');
                                  
                                  setSuccessMsg(`Wallet adjusted successfully by ${points} coins!`);
                                  setManualCoinsPoints('');
                                  setManualCoinsDescription('');
                                  
                                  // Refresh details & list
                                  const updatedCustRes = await fetch(`/api/admin/customers/${customerId}`, {
                                    headers: { 'Authorization': `Bearer ${token}` }
                                  });
                                  if (updatedCustRes.ok) {
                                    const updatedCustData = await updatedCustRes.json();
                                    setSelectedCustomer(updatedCustData);
                                  }
                                  fetchCustomersList(customerSearch, customerFilter);
                                } catch (err: any) {
                                  setErrorMsg(err.message);
                                } finally {
                                  setActionLoading(false);
                                }
                              }}
                              className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end"
                            >
                              <div>
                                <label className="block mb-1 font-semibold uppercase tracking-wide text-neutral-600 text-[9px]">Coins Delta (e.g. 50 or -25)</label>
                                <input
                                  type="number"
                                  required
                                  value={manualCoinsPoints}
                                  onChange={(e) => setManualCoinsPoints(e.target.value)}
                                  placeholder="e.g. 50 or -25"
                                  className="w-full py-1.5 px-2.5 border border-neutral-200 rounded-lg text-xs bg-white font-medium text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                                />
                              </div>
                              <div>
                                <label className="block mb-1 font-semibold uppercase tracking-wide text-neutral-600 text-[9px]">Reason / Description</label>
                                <input
                                  type="text"
                                  required
                                  value={manualCoinsDescription}
                                  onChange={(e) => setManualCoinsDescription(e.target.value)}
                                  placeholder="e.g. Goodwill credit"
                                  className="w-full py-1.5 px-2.5 border border-neutral-200 rounded-lg text-xs bg-white font-medium text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                                />
                              </div>
                              <div>
                                <button
                                  type="submit"
                                  disabled={actionLoading}
                                  className="w-full py-2 px-4 bg-neutral-900 text-white font-semibold text-xs rounded-lg hover:bg-rose-500 transition-colors flex justify-center items-center gap-1.5"
                                >
                                  {actionLoading ? (
                                    <div className="w-3.5 h-3.5 border-2 border-white rounded-full border-t-transparent animate-spin" />
                                  ) : (
                                    <>
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Apply Adjustment</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </form>
                          </div>
                        </div>
                      )}


                      {/* Tab Contents: Referral History */}
                      {customerDetailTab === 'referrals' && (
                        <div className="space-y-3">
                          <p className="text-[10px] text-neutral-400 font-mono font-bold uppercase tracking-wider">Referral Program Activity</p>
                          <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white max-h-64 overflow-y-auto">
                            <table className="w-full text-left border-collapse text-[11px]">
                              <thead>
                                <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-400 uppercase text-[9px] font-bold">
                                  <th className="p-3">Referral ID</th>
                                  <th className="p-3">Referrer</th>
                                  <th className="p-3">Referred User</th>
                                  <th className="p-3">Code Claimed</th>
                                  <th className="p-3">Referral Status</th>
                                  <th className="p-3 text-right">Coins Gifted</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-neutral-100 font-sans text-neutral-600">
                                {selectedCustomer.referralHistory.length === 0 ? (
                                  <tr>
                                    <td colSpan={6} className="p-6 text-center text-neutral-400">No refer-a-friend activities recorded.</td>
                                  </tr>
                                ) : (
                                  selectedCustomer.referralHistory.map((ref: Referral) => {
                                    // Highlight if current user was referrer vs referred
                                    const isReferrer = ref.referrerId === selectedCustomer.customer.id;
                                    return (
                                      <tr key={ref.id} className="hover:bg-neutral-50/50">
                                        <td className="p-3 font-mono font-semibold text-neutral-400">#{ref.id}</td>
                                        <td className="p-3">
                                          <span className={isReferrer ? 'font-bold text-neutral-800' : ''}>
                                            {ref.referrerName} {isReferrer && '(You)'}
                                          </span>
                                        </td>
                                        <td className="p-3">
                                          <span className={!isReferrer ? 'font-bold text-neutral-800' : ''}>
                                            {ref.referredName} {!isReferrer && '(You)'}
                                          </span>
                                        </td>
                                        <td className="p-3 font-mono text-neutral-500">{ref.referralCode}</td>
                                        <td className="p-3">
                                          <span className={`px-1.5 py-0.5 rounded-sm text-[8px] uppercase font-bold ${
                                            ref.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-50 text-neutral-400'
                                          }`}>
                                            {ref.status}
                                          </span>
                                        </td>
                                        <td className="p-3 text-right font-mono font-bold text-emerald-600">
                                          +{ref.pointsRewarded}
                                        </td>
                                      </tr>
                                    );
                                  })
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                </div>
              )}

              {/* EDIT CUSTOMER PROFILE DIALOG */}
              {isCustomerEditOpen && selectedCustomer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                  <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
                    <div className="h-2 bg-gradient-to-r from-amber-200 via-rose-300 to-amber-200" />
                    
                    <button 
                      onClick={() => setIsCustomerEditOpen(false)}
                      className="absolute p-2 top-4 right-4 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-full"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    <div className="p-6">
                      <h3 className="font-serif text-lg font-bold text-neutral-900 border-b pb-2 mb-4 tracking-wide">
                        Edit Customer Account Profile
                      </h3>
                      
                      <form onSubmit={handleEditCustomerSubmit} className="space-y-4 text-xs">
                        <div>
                          <label className="block mb-1 font-semibold uppercase tracking-wide text-neutral-600">Username</label>
                          <input
                            type="text"
                            required
                            value={customerEditName}
                            onChange={(e) => setCustomerEditName(e.target.value)}
                            placeholder="E.g., Isabella Thorne"
                            className="w-full py-2.5 px-3 border border-neutral-200 rounded-lg text-sm bg-neutral-55 text-neutral-800"
                          />
                        </div>

                        <div>
                          <label className="block mb-1 font-semibold uppercase tracking-wide text-neutral-600">Email Address</label>
                          <input
                            type="email"
                            required
                            value={customerEditEmail}
                            onChange={(e) => setCustomerEditEmail(e.target.value)}
                            placeholder="isabella@beautypoint.com"
                            className="w-full py-2.5 px-3 border border-neutral-200 rounded-lg text-sm bg-neutral-55 text-neutral-800"
                          />
                        </div>

                        <div>
                          <label className="block mb-1 font-semibold uppercase tracking-wide text-neutral-600">Phone Number</label>
                          <input
                            type="text"
                            value={customerEditPhone}
                            onChange={(e) => setCustomerEditPhone(e.target.value)}
                            placeholder="+91 98765 43210"
                            className="w-full py-2.5 px-3 border border-neutral-200 rounded-lg text-sm bg-neutral-55 text-neutral-800 font-mono"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={actionLoading}
                          className="w-full py-3.5 px-4 bg-neutral-900 text-white font-medium text-xs rounded-xl hover:bg-rose-500 transition-all flex justify-center items-center gap-2 mt-4"
                        >
                          {actionLoading ? (
                            <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin" />
                          ) : (
                            <span>Commit Profile Changes</span>
                          )}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ==================== 5C. PROMOTIONAL COUPONS MANAGEMENT ==================== */}
          {activeTab === 'coupons' && (
            <div className="space-y-6 animate-fade-in text-xs">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <p className="text-xs text-neutral-500 font-sans">
                  Manage storefront coupon discount rules, minimum order purchase requirements, and check usage analytics.
                </p>
                <button
                  onClick={() => {
                    setCpnCode('');
                    setCpnDiscountType('percentage');
                    setCpnDiscountValue('');
                    setCpnMinPurchaseAmount('');
                    setIsCouponModalOpen(true);
                  }}
                  className="py-3 px-4 bg-neutral-900 hover:bg-rose-500 text-white font-medium text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-md active:scale-98 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Promotion Coupon</span>
                </button>
              </div>

              {/* Table list of coupons */}
              <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-400 uppercase tracking-wider text-[10px] font-bold">
                        <th className="p-4">Coupon Code</th>
                        <th className="p-4">Discount Model</th>
                        <th className="p-4">Discount Value</th>
                        <th className="p-4">Min. Purchase Limit</th>
                        <th className="p-4 text-center">Usage Count</th>
                        <th className="p-4 text-center">Status</th>
                        <th className="p-4 text-center w-24">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 text-neutral-700 font-sans">
                      {couponsList.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-neutral-400">
                            Zero coupons configured. Click 'Create Promotion Coupon' to introduce storefront campaigns.
                          </td>
                        </tr>
                      ) : (
                        couponsList.map((cpn) => (
                          <tr key={cpn.id} className="hover:bg-neutral-50/50 transition-colors">
                            <td className="p-4 font-mono font-bold text-neutral-900">
                              <span className="bg-amber-50 text-amber-900 px-2.5 py-1 rounded border border-amber-200 uppercase tracking-wider text-xs">
                                {cpn.code}
                              </span>
                            </td>
                            <td className="p-4 font-medium uppercase text-neutral-600">
                              {cpn.discountType.replace('_', ' ')}
                            </td>
                            <td className="p-4 font-mono font-bold">
                              {cpn.discountType === 'percentage' 
                                ? `${cpn.discountValue}% Off`
                                : cpn.discountType === 'free_shipping'
                                  ? 'Free Shipping'
                                  : `₹${cpn.discountValue.toFixed(2)} Off`
                              }
                            </td>
                            <td className="p-4 font-mono font-semibold text-neutral-600">
                              ₹{cpn.minPurchaseAmount.toFixed(2)}
                            </td>
                            <td className="p-4 text-center font-mono font-bold text-neutral-600">
                              {cpn.usageCount} checkouts
                            </td>
                            <td className="p-4 text-center">
                              <span className={`px-2 py-0.5 rounded-sm font-semibold text-[9px] uppercase ${
                                cpn.isActive 
                                  ? 'bg-emerald-105 text-emerald-800' 
                                  : 'bg-neutral-100 text-neutral-500'
                              }`}>
                                {cpn.isActive ? 'Active' : 'Expired'}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <button 
                                onClick={() => handleDeleteCoupon(cpn.id)}
                                className="p-1.5 rounded-lg text-neutral-400 hover:text-red-650 hover:bg-red-55 transition-colors cursor-pointer"
                                title="Delete Coupon"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* CREATE COUPON MODAL */}
              {isCouponModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                  <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
                    <div className="h-2 bg-gradient-to-r from-amber-200 via-rose-300 to-amber-200" />
                    
                    <button 
                      onClick={() => setIsCouponModalOpen(false)}
                      className="absolute p-2 top-4 right-4 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-full"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    <div className="p-6">
                      <h3 className="font-serif text-lg font-bold text-neutral-900 border-b pb-2 mb-4 tracking-wide">
                        Create Promotion Coupon
                      </h3>
                      
                      <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs">
                        <div>
                          <label className="block mb-1 font-semibold uppercase tracking-wide text-neutral-600">Coupon Code</label>
                          <input
                            type="text"
                            required
                            value={cpnCode}
                            onChange={(e) => setCpnCode(e.target.value)}
                            placeholder="E.g., RADIANCE15"
                            className="w-full py-2.5 px-3 border border-neutral-200 rounded-lg text-sm bg-neutral-55 text-neutral-800 font-mono uppercase"
                          />
                        </div>

                        <div>
                          <label className="block mb-1 font-semibold uppercase tracking-wide text-neutral-600">Discount Model</label>
                          <select
                            value={cpnDiscountType}
                            onChange={(e: any) => setCpnDiscountType(e.target.value)}
                            className="w-full py-2.5 px-3 border border-neutral-200 rounded-lg text-sm bg-white text-neutral-800"
                          >
                            <option value="percentage">Percentage Discount (%)</option>
                            <option value="fixed_amount">Fixed Amount Deduction ($)</option>
                            <option value="free_shipping">Free Shipping</option>
                          </select>
                        </div>

                        {cpnDiscountType !== 'free_shipping' && (
                          <div>
                            <label className="block mb-1 font-semibold uppercase tracking-wide text-neutral-600">Discount Value</label>
                            <input
                              type="number"
                              required
                              min="0"
                              step="any"
                              value={cpnDiscountValue}
                              onChange={(e) => setCpnDiscountValue(e.target.value)}
                              placeholder={cpnDiscountType === 'percentage' ? "E.g., 15" : "E.g., 20.00"}
                              className="w-full py-2.5 px-3 border border-neutral-200 rounded-lg text-sm bg-neutral-55 text-neutral-800"
                            />
                          </div>
                        )}

                        <div>
                          <label className="block mb-1 font-semibold uppercase tracking-wide text-neutral-600">Min. Purchase Limit ($)</label>
                          <input
                            type="number"
                            required
                            min="0"
                            step="any"
                            value={cpnMinPurchaseAmount}
                            onChange={(e) => setCpnMinPurchaseAmount(e.target.value)}
                            placeholder="E.g., 50.00"
                            className="w-full py-2.5 px-3 border border-neutral-200 rounded-lg text-sm bg-neutral-55 text-neutral-800"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={actionLoading}
                          className="w-full py-3.5 px-4 bg-neutral-900 text-white font-medium text-xs rounded-xl hover:bg-rose-500 transition-all flex justify-center items-center gap-2 mt-4 cursor-pointer"
                        >
                          {actionLoading ? (
                            <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin" />
                          ) : (
                            <span>Establish Store Coupon</span>
                          )}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================== 9. REFERRALS SUB-TAB ==================== */}
          {activeTab === 'referrals' && referralsData && (
            <div className="space-y-8 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl border bg-white border-neutral-200 flex flex-col justify-between shadow-xs">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-neutral-400">Total Referrals</p>
                    <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-500 border border-indigo-100/50">
                      <Users className="w-4 h-4 shrink-0" />
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xl sm:text-2xl font-bold font-mono text-neutral-900">{referralsData.referrals.length}</p>
                    <p className="text-[9px] text-neutral-400 font-sans">Successful user invites</p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl border bg-white border-neutral-200 flex flex-col justify-between shadow-xs">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-neutral-400">Coins Distributed</p>
                    <div className="p-1.5 rounded-lg bg-amber-50 text-amber-500 border border-amber-100/50">
                      <Coins className="w-4 h-4 shrink-0" />
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xl sm:text-2xl font-bold font-mono text-neutral-900">{referralsData.totalCoinsDistributed} pts</p>
                    <p className="text-[9px] text-neutral-400 font-sans">Referrer & referred welcome coins</p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl border bg-white border-neutral-200 flex flex-col justify-between shadow-xs">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-neutral-400">Program Status</p>
                    <div className={`p-1.5 rounded-lg border ${settingReferralEnabled ? 'bg-emerald-50 text-emerald-500 border-emerald-100/50' : 'bg-rose-50 text-rose-500 border-rose-100/50'}`}>
                      <Gift className="w-4 h-4 shrink-0" />
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <p className={`text-xl sm:text-2xl font-bold uppercase tracking-wider ${settingReferralEnabled ? 'text-emerald-600' : 'text-neutral-500'}`}>
                      {settingReferralEnabled ? 'Active' : 'Paused'}
                    </p>
                    <p className="text-[9px] text-neutral-400 font-sans">Controlled via Settings</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Top Referrers */}
                <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs lg:col-span-1">
                  <h3 className="font-serif text-sm font-semibold text-neutral-800 mb-4 uppercase tracking-wider">Top Referrers</h3>
                  {referralsData.topReferrers.length === 0 ? (
                    <p className="text-xs text-neutral-400 text-center py-8">No referrer records found.</p>
                  ) : (
                    <div className="space-y-3.5">
                      {referralsData.topReferrers.map((ref, idx) => (
                        <div key={idx} className="flex items-center justify-between border-b border-neutral-50 pb-2.5 last:border-0 last:pb-0">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 flex items-center justify-center bg-neutral-900 text-white font-mono text-[10px] font-bold rounded-full">
                              {idx + 1}
                            </span>
                            <div>
                              <p className="font-semibold text-neutral-800 text-xs">{ref.username}</p>
                              <p className="text-[9px] text-neutral-400 font-mono">{ref.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-neutral-900 text-xs font-mono">{ref.count} referrals</p>
                            <p className="text-[9px] text-amber-500 font-semibold">{ref.pointsEarned} coins</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: Full Referral Log */}
                <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-xs lg:col-span-2">
                  <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
                    <h3 className="font-serif text-sm font-semibold text-neutral-800 uppercase tracking-wider">Referrals Log</h3>
                    <span className="px-2 py-0.5 rounded-sm font-semibold text-[9px] uppercase bg-neutral-100 text-neutral-600 border border-neutral-200">
                      Live audit entries
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-400 uppercase tracking-wider text-[9px] font-bold">
                          <th className="p-4">Log ID</th>
                          <th className="p-4">Referrer</th>
                          <th className="p-4">Invited Friend</th>
                          <th className="p-4">Code Used</th>
                          <th className="p-4 text-center">Reward (Referrer)</th>
                          <th className="p-4">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 text-neutral-700 font-sans">
                        {referralsData.referrals.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-12 text-center text-neutral-400">
                              No referral entries found.
                            </td>
                          </tr>
                        ) : (
                          referralsData.referrals.map((ref) => (
                            <tr key={ref.id} className="hover:bg-neutral-50/50 transition-colors">
                              <td className="p-4 font-mono font-bold text-neutral-400">#{ref.id.replace('ref_', '')}</td>
                              <td className="p-4">
                                <p className="font-semibold text-neutral-800">{ref.referrerName}</p>
                                <p className="text-[9px] text-neutral-400 font-mono">{ref.referrerEmail}</p>
                              </td>
                              <td className="p-4">
                                <p className="font-semibold text-neutral-800">{ref.referredName}</p>
                                <p className="text-[9px] text-neutral-400 font-mono">{ref.referredEmail}</p>
                              </td>
                              <td className="p-4">
                                <span className="px-2 py-0.5 rounded-sm font-mono font-bold text-[10px] uppercase bg-rose-50 text-rose-600 border border-rose-100">
                                  {ref.referralCode}
                                </span>
                              </td>
                              <td className="p-4 text-center font-bold font-mono text-emerald-600">+{ref.pointsRewarded} coins</td>
                              <td className="p-4 text-neutral-500 font-mono text-[10px]">
                                {new Date(ref.createdAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== 5.5 REWARDS SYSTEM PANEL ==================== */}
          {activeTab === 'rewards' && stats && (
            <div className="space-y-6 animate-fade-in">
              
              {/* KPI metrics row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'Total Coins Issued', value: `${(stats.summary.rewardCoinsIssued || 0).toLocaleString()} coins`, icon: Award, color: 'text-emerald-600 bg-emerald-50 border-emerald-100', subtitle: 'Distributed to loyal customers' },
                  { label: 'Total Coins Redeemed', value: `${(stats.summary.rewardCoinsRedeemed || 0).toLocaleString()} coins`, icon: Coins, color: 'text-rose-600 bg-rose-50 border-rose-100', subtitle: 'Redeemed for order discounts' },
                  { label: 'Active Reward Members', value: `${stats.summary.activeRewardMembers || 0} members`, icon: Users, color: 'text-amber-600 bg-amber-50 border-amber-100', subtitle: 'Accounts with active coin balances' }
                ].map((kpi, idx) => {
                  const Icon = kpi.icon;
                  return (
                    <div key={idx} className={`p-5 rounded-2xl border bg-white flex flex-col justify-between shadow-xs ${kpi.color}`}>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <p className="text-[10px] uppercase tracking-wider font-bold opacity-80">{kpi.label}</p>
                        <div className="p-1.5 rounded-lg bg-white/80 border border-neutral-100/50">
                          <Icon className="w-4 h-4 shrink-0" />
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xl font-bold font-mono text-neutral-900">{kpi.value}</p>
                        <p className="text-[9px] text-neutral-400 font-sans">{kpi.subtitle}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bulk Update and Stats Table split layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Bulk Update Card */}
                <div className="lg:col-span-1 bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif text-sm font-semibold text-neutral-900 tracking-wide mb-1 flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-amber-500" /> Bulk Update Reward Coins
                    </h3>
                    <p className="text-[10px] text-neutral-400 mb-4 leading-normal">
                      Update the Reward Coins setting for multiple boutique products simultaneously.
                    </p>
                    
                    <form 
                      onSubmit={async (e) => {
                        e.preventDefault();
                        setActionLoading(true);
                        setErrorMsg('');
                        setSuccessMsg('');
                        try {
                          const valNum = parseFloat(bulkRewardsValue);
                          if (isNaN(valNum) || valNum < 0) {
                            throw new Error('Please enter a valid non-negative number for the update value.');
                          }
                          
                          const res = await fetch('/api/admin/products/bulk-rewards', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({
                              categoryId: bulkRewardsCategory || undefined,
                              method: bulkRewardsMethod,
                              value: valNum
                            })
                          });
                          
                          const data = await res.json();
                          if (!res.ok) throw new Error(data.error || 'Failed to bulk update rewards');
                          
                          setSuccessMsg(data.message || `Successfully updated reward coins!`);
                          setBulkRewardsValue('');
                          fetchAllAdminData();
                        } catch (err: any) {
                          setErrorMsg(err.message);
                        } finally {
                          setActionLoading(false);
                        }
                      }}
                      className="space-y-3.5 text-xs"
                    >
                      <div>
                        <label className="block mb-1 font-semibold uppercase tracking-wide text-neutral-600 text-[9px]">Select Department / Category</label>
                        <select
                          value={bulkRewardsCategory}
                          onChange={(e) => setBulkRewardsCategory(e.target.value)}
                          className="w-full py-2 px-3 border border-neutral-200 rounded-lg text-xs bg-white font-medium text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                        >
                          <option value="">All Categories & Departments</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block mb-1 font-semibold uppercase tracking-wide text-neutral-600 text-[9px]">Calculation Method</label>
                        <select
                          value={bulkRewardsMethod}
                          onChange={(e) => setBulkRewardsMethod(e.target.value as any)}
                          className="w-full py-2 px-3 border border-neutral-200 rounded-lg text-xs bg-white font-medium text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                        >
                          <option value="flat">Flat Coins (Overwrite all with fixed value)</option>
                          <option value="multiply">Multiply (Scale current configured coins)</option>
                          <option value="percent_price">Percentage of Product Selling Price</option>
                        </select>
                      </div>

                      <div>
                        <label className="block mb-1 font-semibold uppercase tracking-wide text-neutral-600 text-[9px]">Update Value</label>
                        <input
                          type="number"
                          required
                          min="0"
                          step="any"
                          value={bulkRewardsValue}
                          onChange={(e) => setBulkRewardsValue(e.target.value)}
                          placeholder={bulkRewardsMethod === 'percent_price' ? 'e.g. 5 (means 5% of price)' : 'e.g. 10'}
                          className="w-full py-2 px-3 border border-neutral-200 rounded-lg text-xs bg-white font-medium text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="w-full py-2.5 px-4 bg-neutral-900 text-white font-semibold text-xs rounded-xl hover:bg-rose-500 transition-colors flex justify-center items-center gap-1.5 shadow-sm mt-2"
                      >
                        {actionLoading ? (
                          <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin" />
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Apply Bulk Update</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Top Coin Earning Products Card */}
                <div className="lg:col-span-1 bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs">
                  <h3 className="font-serif text-sm font-semibold text-neutral-900 tracking-wide mb-1 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-500" /> Top Coin-Earning Products
                  </h3>
                  <p className="text-[10px] text-neutral-400 mb-4 leading-normal">
                    Skincare & cosmetics items generating the most loyalty coins on purchases.
                  </p>
                  
                  <div className="overflow-y-auto max-h-60 border border-neutral-100 rounded-xl">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-neutral-50 border-b border-neutral-100 text-neutral-400 uppercase text-[9px] font-bold">
                          <th className="p-2.5">Product Name</th>
                          <th className="p-2.5 text-center">Reward</th>
                          <th className="p-2.5 text-right">Est. Issued</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 text-neutral-600 font-sans">
                        {!stats.topCoinProducts || stats.topCoinProducts.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="p-4 text-center text-neutral-400">No coins generated yet.</td>
                          </tr>
                        ) : (
                          stats.topCoinProducts.map((p: any, idx: number) => (
                            <tr key={idx} className="hover:bg-neutral-50/50">
                              <td className="p-2.5 font-medium truncate max-w-[120px]">{p.name}</td>
                              <td className="p-2.5 text-center font-semibold text-amber-600">{p.rewardCoins}</td>
                              <td className="p-2.5 text-right font-mono text-neutral-800">{p.totalCoinsEarned} pts</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Top Customer Coins Balances Card */}
                <div className="lg:col-span-1 bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs">
                  <h3 className="font-serif text-sm font-semibold text-neutral-900 tracking-wide mb-1 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-500" /> Top Loyalty Customers
                  </h3>
                  <p className="text-[10px] text-neutral-400 mb-4 leading-normal">
                    Registered customers sorted by their lifetime reward coins accumulation.
                  </p>
                  
                  <div className="overflow-y-auto max-h-60 border border-neutral-100 rounded-xl">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-neutral-50 border-b border-neutral-100 text-neutral-400 uppercase text-[9px] font-bold">
                          <th className="p-2.5">User</th>
                          <th className="p-2.5 text-center">Balance</th>
                          <th className="p-2.5 text-right">Lifetime</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 text-neutral-600 font-sans">
                        {!stats.topCustomers || stats.topCustomers.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="p-4 text-center text-neutral-400">No active members found.</td>
                          </tr>
                        ) : (
                          stats.topCustomers.map((c: any, idx: number) => (
                            <tr key={idx} className="hover:bg-neutral-50/50">
                              <td className="p-2.5">
                                <p className="font-semibold text-neutral-800 truncate max-w-[100px]">{c.username}</p>
                                <p className="text-[8px] text-neutral-400 font-mono truncate max-w-[100px]">{c.email}</p>
                              </td>
                              <td className="p-2.5 text-center font-bold text-amber-600">{c.balancePoints}</td>
                              <td className="p-2.5 text-right font-mono text-neutral-855 font-semibold">{c.lifetimePointsEarned} pts</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              {/* Comprehensive transactions audit table */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs">
                <h3 className="font-serif text-sm font-semibold text-neutral-900 tracking-wide mb-1 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-rose-500" /> Reward Coins Audit Ledger
                </h3>
                <p className="text-[10px] text-neutral-400 mb-4 leading-normal">
                  Verifiable chronological trail of all earned, redeemed, or manually adjusted loyalty coin transactions.
                </p>

                <div className="overflow-x-auto border border-neutral-200 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-400 uppercase text-[9px] font-bold">
                        <th className="p-3">Tx ID</th>
                        <th className="p-3">Customer</th>
                        <th className="p-3">Transaction Date</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Reason / Details</th>
                        <th className="p-3 text-right">Points Delta</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 font-sans text-neutral-600">
                      {rewardTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-neutral-400 text-xs">No coin transaction logs found in database.</td>
                        </tr>
                      ) : (
                        rewardTransactions.map((tx: any) => {
                          const isPositive = tx.points > 0;
                          return (
                            <tr key={tx.id} className="hover:bg-neutral-50/50 transition-colors">
                              <td className="p-3 font-mono font-bold text-neutral-400">#{tx.id}</td>
                              <td className="p-3">
                                <p className="font-semibold text-neutral-800">{tx.customerName}</p>
                                <p className="text-[9px] text-neutral-400 font-mono">{tx.customerEmail}</p>
                              </td>
                              <td className="p-3 font-mono text-[10px]">
                                {new Date(tx.createdAt).toLocaleString()}
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-sm font-bold text-[8px] uppercase tracking-wide ${
                                  tx.transactionType === 'earn_purchase' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                  tx.transactionType === 'redeem_purchase' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                                  tx.transactionType === 'earn_referral' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                  tx.transactionType === 'signup_bonus' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                                  'bg-amber-50 text-amber-700 border border-amber-100'
                                }`}>
                                  {tx.transactionType.replace(/_/g, ' ')}
                                </span>
                              </td>
                              <td className="p-3 text-neutral-600 truncate max-w-[200px]">{tx.description}</td>
                              <td className={`p-3 text-right font-mono font-bold text-sm ${
                                isPositive ? 'text-emerald-600' : 'text-rose-600'
                              }`}>
                                {isPositive ? `+${tx.points}` : tx.points}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ==================== 6. STOREFRONT SETTINGS EDITOR ==================== */}
          {activeTab === 'settings' && (

            <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs animate-fade-in">
              <h3 className="font-serif text-lg font-semibold text-neutral-900 border-b pb-3 mb-5 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-rose-500" /> Storefront Styling & Advertising Panels
              </h3>

              <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
                
                <div>
                  <label className="block mb-1 font-semibold uppercase tracking-wide text-neutral-600">Announcement Bar Text</label>
                  <input
                    type="text"
                    required
                    value={settingAnnouncement}
                    onChange={(e) => setSettingAnnouncement(e.target.value)}
                    placeholder="✨ FREE COSMETICS GIFT ON ORDERS OVER $150 ✨"
                    className="w-full py-2.5 px-3 border border-neutral-200 rounded-lg text-sm bg-neutral-55 font-semibold text-neutral-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 font-semibold uppercase tracking-wide text-neutral-600">Hero Slide Title</label>
                    <input
                      type="text"
                      required
                      value={settingBannerTitle}
                      onChange={(e) => setSettingBannerTitle(e.target.value)}
                      placeholder="ILLUMINATE YOUR RADIANCE"
                      className="w-full py-2.5 px-3 border border-neutral-200 rounded-lg text-sm bg-neutral-55 text-neutral-800"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-semibold uppercase tracking-wide text-neutral-600">Hero CTA Button Text</label>
                    <input
                      type="text"
                      required
                      value={settingBannerCtaText}
                      onChange={(e) => setSettingBannerCtaText(e.target.value)}
                      placeholder="SHOP COSMETICS NOW"
                      className="w-full py-2.5 px-3 border border-neutral-200 rounded-lg text-sm bg-neutral-55 text-neutral-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-1 font-semibold uppercase tracking-wide text-neutral-600">Hero Slide Description Subtitle</label>
                  <textarea
                    rows={3}
                    required
                    value={settingBannerSubtitle}
                    onChange={(e) => setSettingBannerSubtitle(e.target.value)}
                    placeholder="Introduce your current seasonal catalog, discounts, or promotional beauty packages..."
                    className="w-full py-2.5 px-3 border border-neutral-200 rounded-lg text-sm bg-neutral-55 text-neutral-800"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-semibold uppercase tracking-wide text-neutral-600">Hero Slide Background Image URL</label>
                  <input
                    type="text"
                    required
                    value={settingBannerImage}
                    onChange={(e) => setSettingBannerImage(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full py-2.5 px-3 border border-neutral-200 rounded-lg text-[10px] bg-neutral-55 text-neutral-800 font-mono"
                  />
                  <p className="text-[10px] text-neutral-400 mt-1 font-sans">Provide an elegant, high-contrast landscape photo URL from Unsplash to give an eye-catching backdrop.</p>
                </div>

                <div className="border-t border-neutral-100 pt-6 mt-6 space-y-4">
                  <h3 className="font-serif text-sm font-semibold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Gift className="w-4 h-4 text-rose-500" />
                    <span>Referral Program Configuration</span>
                  </h3>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="settingReferralEnabled"
                      checked={settingReferralEnabled}
                      disabled={actionLoading}
                      onChange={(e) => setSettingReferralEnabled(e.target.checked)}
                      className="w-4 h-4 text-neutral-900 border-neutral-300 rounded focus:ring-neutral-900"
                    />
                    <label htmlFor="settingReferralEnabled" className="text-xs font-semibold text-neutral-700 uppercase tracking-wide cursor-pointer">
                      Enable Referral & Rewards Program
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1 font-semibold uppercase tracking-wide text-neutral-600 text-[10px]">Referrer Reward (Coins)</label>
                      <input
                        type="number"
                        required
                        min="0"
                        disabled={actionLoading}
                        value={settingReferralRewardReferrer}
                        onChange={(e) => setSettingReferralRewardReferrer(parseInt(e.target.value, 10))}
                        className="w-full py-2.5 px-3 border border-neutral-200 rounded-lg text-sm bg-neutral-55 font-semibold text-neutral-800"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-semibold uppercase tracking-wide text-neutral-600 text-[10px]">New User Welcome Reward (Coins)</label>
                      <input
                        type="number"
                        required
                        min="0"
                        disabled={actionLoading}
                        value={settingReferralRewardReferred}
                        onChange={(e) => setSettingReferralRewardReferred(parseInt(e.target.value, 10))}
                        className="w-full py-2.5 px-3 border border-neutral-200 rounded-lg text-sm bg-neutral-55 font-semibold text-neutral-800"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-neutral-100 pt-6 mt-6 space-y-4">
                  <h3 className="font-serif text-sm font-semibold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-amber-500" />
                    <span>Reward Coins System Configuration</span>
                  </h3>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="settingRewardEnabled"
                      checked={settingRewardEnabled}
                      disabled={actionLoading}
                      onChange={(e) => setSettingRewardEnabled(e.target.checked)}
                      className="w-4 h-4 text-neutral-900 border-neutral-300 rounded focus:ring-neutral-900"
                    />
                    <label htmlFor="settingRewardEnabled" className="text-xs font-semibold text-neutral-700 uppercase tracking-wide cursor-pointer">
                      Enable Purchase Rewards System
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1 font-semibold uppercase tracking-wide text-neutral-600 text-[10px]">Coin Conversion Rate (1 Coin = ₹X discount)</label>
                      <input
                        type="number"
                        required
                        min="1"
                        step="1"
                        disabled={actionLoading}
                        value={settingRewardCoinConversionRate}
                        onChange={(e) => setSettingRewardCoinConversionRate(parseInt(e.target.value, 10) || 1)}
                        className="w-full py-2.5 px-3 border border-neutral-200 rounded-lg text-sm bg-neutral-55 font-semibold text-neutral-800"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-semibold uppercase tracking-wide text-neutral-600 text-[10px]">Max Redemption Percentage (X% of order total)</label>
                      <input
                        type="number"
                        required
                        min="1"
                        max="100"
                        step="1"
                        disabled={actionLoading}
                        value={settingRewardMaxRedemptionPercent}
                        onChange={(e) => setSettingRewardMaxRedemptionPercent(parseInt(e.target.value, 10) || 50)}
                        className="w-full py-2.5 px-3 border border-neutral-200 rounded-lg text-sm bg-neutral-55 font-semibold text-neutral-800"
                      />
                    </div>
                  </div>
                </div>


                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full py-3.5 px-4 bg-neutral-900 text-white font-medium text-xs rounded-xl hover:bg-rose-500 transition-all flex justify-center items-center gap-2 pt-4 shadow-md"
                >
                  {actionLoading ? (
                    <div className="w-5 h-5 border-2 border-white rounded-full border-t-transparent animate-spin" />
                  ) : (
                    <span>Save Storefront Configurations</span>
                  )}
                </button>

              </form>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
