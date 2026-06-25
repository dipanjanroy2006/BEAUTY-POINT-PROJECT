import React, { useState, useEffect } from 'react';
import { 
  Star, ShoppingBag, ShieldCheck, Heart, Sparkles, 
  Trash2, Plus, Minus, ArrowRight, MessageSquare, AlertCircle, X, ChevronRight, CheckCircle2, Gift,
  Home, ClipboardList, User as UserIcon, Search, Bell, MapPin, SlidersHorizontal, Sliders, LogOut, Check, Coins
} from 'lucide-react';

// Import Types
import { Product, Category, CartItem, User, Review, Setting } from './types';

// Import Components
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProductCard from './components/ProductCard';
import CartDrawer from './components/CartDrawer';
import AuthModal from './components/AuthModal';
import CheckoutModal from './components/CheckoutModal';
import AdminDashboard from './components/AdminDashboard';
import ReferralModal from './components/ReferralModal';
import OrdersModal from './components/OrdersModal';

export default function App() {
  // Global states
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<Setting | null>(null);
  
  // Filtering & Search states
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('default');

  // Interactive cart & checkout states
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Authentication states
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Referral & reward states
  const [isReferralOpen, setIsReferralOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [wallet, setWallet] = useState<any>(null);

  // View state toggles
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productReviews, setProductReviews] = useState<Review[]>([]);
  const [isAdminView, setIsAdminView] = useState(false);

  // Review form states
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [reviewError, setReviewError] = useState('');

  // Initial loading states
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Mobile responsive layout states
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth <= 768 : false);
  const [mobileTab, setMobileTab] = useState<'home' | 'wallet' | 'orders' | 'profile'>('home');
  const [mobileLocation, setMobileLocation] = useState('West Bengal, India');
  const [mobileOrders, setMobileOrders] = useState<any[]>([]);
  const [mobileOrdersLoading, setMobileOrdersLoading] = useState(false);

  // Countdown timer for mobile flash sale
  const [timeLeft, setTimeLeft] = useState({ hours: 2, minutes: 12, seconds: 56 });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isMobile) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          return { hours: 2, minutes: 12, seconds: 56 };
        }
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isMobile]);

  const fetchMobileOrders = async () => {
    if (!token) return;
    try {
      setMobileOrdersLoading(true);
      const response = await fetch('/api/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMobileOrders(data);
      }
    } catch (err) {
      console.error('Failed to fetch mobile orders:', err);
    } finally {
      setMobileOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (isMobile && mobileTab === 'orders' && token) {
      fetchMobileOrders();
    }
  }, [isMobile, mobileTab, token]);

  // Sync wallet points and profile if logged in
  useEffect(() => {
    if (token) {
      fetchUserProfile(token);
    }
  }, [token]);

  // Fetch product catalog & categories
  const fetchCatalogData = async () => {
    try {
      setLoading(true);
      // Determine query filters
      let productUrl = '/api/products';
      const params = new URLSearchParams();
      if (activeCategory) params.append('category', activeCategory);
      if (searchQuery) params.append('search', searchQuery);
      if (sortBy !== 'default') params.append('sortBy', sortBy);

      if (params.toString()) {
        productUrl += `?${params.toString()}`;
      }

      const [prodRes, catRes, setRes] = await Promise.all([
        fetch(productUrl),
        fetch('/api/categories'),
        fetch('/api/settings')
      ]);

      const [prodData, catData, setData] = await Promise.all([
        prodRes.json(),
        catRes.json(),
        setRes.json()
      ]);

      if (prodRes.ok) setProducts(prodData);
      if (catRes.ok) setCategories(catData);
      if (setRes.ok) setSettings(setData);

    } catch (err) {
      console.error('Failed to sync catalog datasets:', err);
    } finally {
      setLoading(false);
    }
  };

  // Sync token on boot
  useEffect(() => {
    const storedToken = localStorage.getItem('bp_token');
    const storedUser = localStorage.getItem('bp_user');
    
    if (storedToken) {
      setToken(storedToken);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      fetchUserProfile(storedToken);
    }
    
    // Sync cart state from localStorage
    const storedCart = localStorage.getItem('bp_cart');
    if (storedCart) {
      setCart(JSON.parse(storedCart));
    }

    // Intercept ref query param
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    if (refCode) {
      localStorage.setItem('referralCode', refCode);
      // Clean up URL without reload
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  // Fetch on filters change
  useEffect(() => {
    fetchCatalogData();
  }, [activeCategory, searchQuery, sortBy]);

  // Sync cart to localStorage whenever it updates
  const saveCartToStorage = (updatedCart: CartItem[]) => {
    setCart(updatedCart);
    localStorage.setItem('bp_cart', JSON.stringify(updatedCart));
  };

  // Cart operations
  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) return;

    const existingIndex = cart.findIndex(item => item.product.id === product.id);
    let updatedCart = [...cart];

    if (existingIndex > -1) {
      const currentQty = updatedCart[existingIndex].quantity;
      if (currentQty >= product.stock) {
        alert(`Sorry, only ${product.stock} items are available in stock.`);
        return;
      }
      updatedCart[existingIndex].quantity += 1;
    } else {
      updatedCart.push({ product, quantity: 1 });
    }

    saveCartToStorage(updatedCart);
    
    // Aesthetic slide out cart open feedback
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }

    const updatedCart = cart.map(item => {
      if (item.product.id === productId) {
        if (quantity > item.product.stock) {
          alert(`Sorry, only ${item.product.stock} items are available in stock.`);
          return item;
        }
        return { ...item, quantity };
      }
      return item;
    });

    saveCartToStorage(updatedCart);
  };

  const handleRemoveFromCart = (productId: string) => {
    const updatedCart = cart.filter(item => item.product.id !== productId);
    saveCartToStorage(updatedCart);
  };

  const handleClearCart = () => {
    saveCartToStorage([]);
  };

  // Login callback
  const handleAuthSuccess = (authUser: User, authToken: string) => {
    setUser(authUser);
    setToken(authToken);
    localStorage.setItem('bp_user', JSON.stringify(authUser));
    localStorage.setItem('bp_token', authToken);
    
    // Fetch profile to sync wallet and full user details
    fetchUserProfile(authToken);

    // If Admin logs in, toggle to Admin Dashboard automatically for convenient testing
    if (authUser.role === 'admin') {
      setIsAdminView(true);
    }
  };

  // Logout operations
  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setWallet(null);
    setIsAdminView(false);
    localStorage.removeItem('bp_user');
    localStorage.removeItem('bp_token');
  };

  // Fetch user profile & wallet
  const fetchUserProfile = async (authToken: string) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setWallet(data.wallet);
        localStorage.setItem('bp_user', JSON.stringify(data.user));
      } else {
        handleLogout();
      }
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
    }
  };

  // Open details for a specific beauty item
  const handleViewDetails = async (product: Product) => {
    setDetailsLoading(true);
    setSelectedProduct(product);
    setReviewComment('');
    setReviewSuccess('');
    setReviewError('');
    try {
      const response = await fetch(`/api/products/${product.id}`);
      const data = await response.json();
      if (response.ok) {
        setProductReviews(data.reviews || []);
      }
    } catch (err) {
      console.error('Failed to load product reviews:', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Submit product review
  const handlePostReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedProduct) return;

    setReviewSuccess('');
    setReviewError('');

    try {
      const response = await fetch(`/api/reviews/${selectedProduct.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          rating: reviewRating,
          comment: reviewComment
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit review.');
      }

      setReviewSuccess('Review posted successfully! Thank you.');
      setReviewComment('');
      
      // Refresh detailed product reviews
      const updatedReviewsRes = await fetch(`/api/products/${selectedProduct.id}`);
      const updatedData = await updatedReviewsRes.json();
      if (updatedReviewsRes.ok) {
        setProductReviews(updatedData.reviews || []);
        // Also sync item averages back on catalog main screen
        fetchCatalogData();
      }

    } catch (err: any) {
      setReviewError(err.message);
    }
  };

  if (isMobile) {
    return (
      <div className="min-h-screen bg-[#fbf7f0]/60 flex flex-col font-sans pb-28 text-neutral-800">
        {/* MOBILE HEADER */}
        <header className="bg-[#fbf7f0]/85 backdrop-blur-md sticky top-0 z-30 border-b border-gold-100/40 px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#5d3425]" />
            <div className="text-left">
              <span className="text-[9px] uppercase tracking-wider text-neutral-400 block font-bold">Location</span>
              <span className="text-xs font-semibold text-neutral-700">{mobileLocation}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 relative rounded-full bg-white text-neutral-600 hover:text-neutral-900 border border-neutral-200/50 shadow-xs">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
            </button>
            <div 
              className="w-8 h-8 rounded-full border border-neutral-200 overflow-hidden cursor-pointer"
              onClick={() => {
                if (!token) setIsAuthOpen(true);
                else setMobileTab('profile');
              }}
            >
              <img src="/logo.png" alt="Profile" className="w-full h-full object-cover" />
            </div>
          </div>
        </header>

        {/* MOBILE BODY CHANGER */}
        <main className="flex-grow px-4 py-4 overflow-y-auto">
          {mobileTab === 'home' && (
            <div className="space-y-5">
              {/* Search & Quick Filter */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute w-4 h-4 text-neutral-400 left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search luxury cosmetics..."
                    className="w-full py-3 pl-10 pr-4 text-xs bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5d3425]/15 focus:border-[#5d3425] transition-all text-neutral-800 text-left"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute p-1 top-2.5 right-3 text-neutral-400 hover:text-neutral-600 rounded-full"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <button 
                  onClick={() => {
                    const nextSort = sortBy === 'default' ? 'rating' : sortBy === 'rating' ? 'price_asc' : sortBy === 'price_asc' ? 'price_desc' : 'default';
                    setSortBy(nextSort);
                  }}
                  className="w-11 h-11 bg-[#5d3425] text-white flex items-center justify-center rounded-xl shadow-xs hover:bg-[#71412e] active:scale-95 transition-all shrink-0"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </button>
              </div>

              {/* Sort Chips */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5">
                {[
                  { label: 'All Items', value: 'default' },
                  { label: 'Top Rated', value: 'rating' },
                  { label: 'Price: Low-High', value: 'price_asc' },
                  { label: 'Price: High-Low', value: 'price_desc' }
                ].map((chip) => {
                  const isActive = sortBy === chip.value;
                  return (
                    <button
                      key={chip.value}
                      onClick={() => setSortBy(chip.value)}
                      className={`px-4 py-2 rounded-full text-[10px] font-medium transition-all shrink-0 border ${
                        isActive 
                          ? 'bg-[#5d3425] text-white border-[#5d3425] shadow-xs' 
                          : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
                      }`}
                    >
                      {chip.label}
                    </button>
                  );
                })}
              </div>

              {/* No Big Banners - Small Luxury Promo Banner */}
              {!activeCategory && !searchQuery && (
                <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#f4eae1] to-[#ecdcc3]/70 p-5 flex items-center justify-between border border-[#ecdcc3]/40 shadow-xs">
                  <div className="max-w-[62%] space-y-1 text-left z-10">
                    <span className="text-[8px] font-bold tracking-widest text-[#a7704b] uppercase font-mono">Welcome Offer</span>
                    <h3 className="font-serif text-base font-bold text-[#5d3425] leading-tight">
                      New Collection
                    </h3>
                    <p className="text-[10px] text-[#71412e]/90 font-normal leading-tight">
                      Discount 50% for the first transaction.
                    </p>
                    <div className="pt-2">
                      <button 
                        onClick={() => {
                          const grid = document.getElementById('mobile-products');
                          if (grid) grid.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="bg-[#5d3425] hover:bg-[#71412e] text-white text-[10px] font-medium py-1.5 px-4 rounded-full transition-all shadow-xs active:scale-95"
                      >
                        Shop Now
                      </button>
                    </div>
                  </div>
                  <div className="w-[35%] aspect-[4/5] rounded-xl overflow-hidden border border-white/40 shadow-xs bg-neutral-100 shrink-0">
                    <img 
                      src="https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=400" 
                      alt="New Collection Banner Model" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              {/* Categories Scroll */}
              <div className="text-left">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-bold text-neutral-950 tracking-tight font-serif text-[13px]">Category</h4>
                  {activeCategory ? (
                    <button onClick={() => setActiveCategory(null)} className="text-[11px] text-[#8c583b] font-medium">Clear filter</button>
                  ) : (
                    <span className="text-[11px] text-[#8c583b] font-semibold">See All</span>
                  )}
                </div>
                <div className="flex gap-4 overflow-x-auto no-scrollbar py-1">
                  {categories.map((cat) => {
                    const isActive = activeCategory === cat.slug;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(isActive ? null : cat.slug)}
                        className="flex flex-col items-center gap-1.5 shrink-0"
                      >
                        <div 
                          className={`w-13 h-13 rounded-full overflow-hidden border flex items-center justify-center transition-all bg-white shadow-xs ${
                            isActive ? 'border-[#5d3425] ring-2 ring-[#5d3425]/10 scale-105' : 'border-neutral-200/60'
                          }`}
                        >
                          <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                        </div>
                        <span className={`text-[10px] font-medium tracking-tight ${isActive ? 'text-[#5d3425] font-semibold' : 'text-neutral-500'}`}>
                          {cat.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Products List section */}
              <div id="mobile-products" className="space-y-4">
                {/* Flash Sale Header with countdown */}
                <div className="flex justify-between items-center text-left">
                  <h4 className="text-xs font-bold text-neutral-950 tracking-tight font-serif text-[13px]">
                    {activeCategory ? categories.find(c => c.slug === activeCategory)?.name : 'Flash Sale'}
                  </h4>
                  {!activeCategory && (
                    <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium">
                      <span className="text-[10px] text-neutral-450 font-normal">Closing in:</span>
                      <div className="flex items-center gap-1 font-mono">
                        <span className="bg-[#ecdcc3]/80 text-[#5d3425] px-1.5 py-0.5 rounded text-[11px] font-bold">
                          {String(timeLeft.hours).padStart(2, '0')}
                        </span>
                        <span className="text-neutral-450 font-bold text-[10px]">:</span>
                        <span className="bg-[#ecdcc3]/80 text-[#5d3425] px-1.5 py-0.5 rounded text-[11px] font-bold">
                          {String(timeLeft.minutes).padStart(2, '0')}
                        </span>
                        <span className="text-neutral-450 font-bold text-[10px]">:</span>
                        <span className="bg-[#ecdcc3]/80 text-[#5d3425] px-1.5 py-0.5 rounded text-[11px] font-bold">
                          {String(timeLeft.seconds).padStart(2, '0')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 border-[#5d3425] rounded-full border-t-transparent animate-spin mb-2" />
                    <p className="text-[10px] text-neutral-400 font-mono">Syncing items...</p>
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-10 bg-white border border-dashed border-neutral-200 rounded-2xl p-4">
                    <p className="text-xs text-neutral-500 font-medium">No items found matching criteria.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3.5">
                    {products.map((prod) => (
                      <div 
                        key={prod.id}
                        className="bg-white rounded-2xl border border-neutral-200/50 p-2.5 flex flex-col justify-between shadow-xs relative cursor-pointer"
                        onClick={() => handleViewDetails(prod)}
                      >
                        <div className="aspect-square rounded-xl overflow-hidden bg-neutral-50 border border-neutral-100 relative">
                          <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                          {prod.salePrice && (
                            <span className="absolute top-1.5 left-1.5 bg-[#5d3425] text-white text-[8px] font-bold py-0.5 px-1.5 rounded-md">
                              SALE
                            </span>
                          )}
                        </div>
                        
                        <div className="mt-2.5 flex-1 flex flex-col justify-between">
                          <div className="space-y-0.5 text-left">
                            <span className="text-[8px] text-neutral-400 font-mono uppercase tracking-wider block">
                              {prod.details?.brand || 'Collection'}
                            </span>
                            <h5 className="text-[11px] font-semibold text-neutral-800 line-clamp-1">
                              {prod.name}
                            </h5>
                          </div>
                          
                          <div className="flex justify-between items-center mt-2">
                            <div className="flex flex-col text-left">
                              {prod.salePrice ? (
                                <>
                                  <span className="text-xs font-mono font-bold text-rose-600">₹{prod.salePrice}</span>
                                  <span className="text-[9px] font-mono text-neutral-400 line-through">₹{prod.price}</span>
                                </>
                              ) : (
                                <span className="text-xs font-mono font-bold text-neutral-800">₹{prod.price}</span>
                              )}
                            </div>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddToCart(prod);
                              }}
                              disabled={prod.stock <= 0}
                              className="w-7 h-7 rounded-full bg-[#5d3425] text-white flex items-center justify-center shadow-xs active:scale-90 transition-all hover:bg-[#71412e] disabled:opacity-50"
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {mobileTab === 'wallet' && (
            <div className="space-y-6">
              {!token ? (
                <div className="text-center py-12 bg-white rounded-3xl p-6 border border-neutral-200/50 shadow-xs space-y-4">
                  <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-500 shadow-inner">
                    <Gift className="w-6 h-6 animate-pulse" />
                  </div>
                  <h3 className="font-serif text-base font-bold text-neutral-800">Rewards Wallet & Referrals</h3>
                  <p className="text-xs text-neutral-500 max-w-xs mx-auto leading-relaxed">
                    Join our beauty loyalty club to earn reward coins, track referrals, and redeem points on checkout.
                  </p>
                  <button 
                    onClick={() => setIsAuthOpen(true)}
                    className="w-full py-3 bg-neutral-900 text-white rounded-xl text-xs font-semibold shadow-md"
                  >
                    Sign In / Register
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Glossy Wallet Card */}
                  <div className="bg-gradient-to-br from-amber-800 via-rose-700 to-neutral-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden border border-white/10">
                    <div className="absolute -right-10 -bottom-10 w-36 h-36 bg-white/5 rounded-full blur-2xl"></div>
                    <div className="absolute right-6 top-6 text-white/20">
                      <Coins className="w-16 h-16" />
                    </div>
                    
                    <span className="text-[9px] uppercase tracking-widest text-amber-200/70 font-mono font-bold block mb-1 text-left">
                      Beauty Loyalty Wallet
                    </span>
                    <h3 className="font-serif text-lg font-bold truncate text-left">
                      {user?.username}
                    </h3>
                    <p className="text-[10px] font-mono text-white/50 mt-0.5 text-left">Code: {user?.referralCode || 'BP-REFER'}</p>
                    
                    <div className="mt-6 flex justify-between items-end">
                      <div className="text-left">
                        <span className="text-[9px] text-white/60 block uppercase font-mono tracking-wider">Active Balance</span>
                        <span className="text-3xl font-serif font-bold text-white leading-none mt-1 inline-block">
                          {wallet?.balancePoints || 0} <span className="text-sm font-sans font-normal text-amber-300">Coins</span>
                        </span>
                      </div>
                      
                      <div className="text-right text-[10px] text-white/70 space-y-0.5">
                        <p>Lifetime Earned: <span className="font-mono font-semibold text-white">{wallet?.lifetimePointsEarned || 0}</span></p>
                        <p>Lifetime Redeemed: <span className="font-mono font-semibold text-white">{wallet?.lifetimePointsRedeemed || 0}</span></p>
                      </div>
                    </div>
                  </div>

                  {/* Refer & Earn share panel */}
                  <div className="bg-white rounded-3xl border border-neutral-200/50 p-5 shadow-xs space-y-4 text-left">
                    <div>
                      <h4 className="text-xs uppercase font-bold text-neutral-400 tracking-wider">Refer Friends</h4>
                      <h3 className="text-sm font-bold text-neutral-800 mt-1">Get ₹10 per referral</h3>
                      <p className="text-[11px] text-neutral-500 mt-1 leading-relaxed">
                        Share your referral link. You get {settings?.referralRewardReferrer || 10} Coins when they register, and they get {settings?.referralRewardReferred || 5} welcome Coins.
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={`${window.location.origin}?ref=${user?.referralCode}`}
                        className="flex-1 py-2 px-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-500 font-mono focus:outline-none"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}?ref=${user?.referralCode}`);
                          alert('Referral link copied!');
                        }}
                        className="bg-neutral-900 text-white rounded-xl text-xs font-semibold px-4 py-2 hover:bg-neutral-800 transition-all active:scale-[0.98]"
                      >
                        Copy
                      </button>
                    </div>

                    {/* Social icons */}
                    <div className="flex items-center justify-between gap-2.5 pt-1">
                      <button 
                        onClick={() => {
                          const link = `${window.location.origin}?ref=${user?.referralCode}`;
                          const text = `Invite your friends to Dipanjan_works and earn rewards. Join using my link: ${link}`;
                          window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                        }}
                        className="flex-1 py-2 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100/55 rounded-xl text-[10px] font-semibold text-emerald-600 flex items-center justify-center gap-1"
                      >
                        WhatsApp
                      </button>
                      <button 
                        onClick={() => {
                          const link = `${window.location.origin}?ref=${user?.referralCode}`;
                          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`, '_blank');
                        }}
                        className="flex-1 py-2 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100/55 rounded-xl text-[10px] font-semibold text-indigo-600 flex items-center justify-center gap-1"
                      >
                        Facebook
                      </button>
                    </div>
                  </div>

                  {/* Transaction ledger list */}
                  <div className="space-y-3 text-left">
                    <h4 className="text-xs uppercase font-bold text-neutral-400 tracking-wider">Reward Points Ledger</h4>
                    <div className="bg-white rounded-2xl border border-neutral-100 p-4 divide-y divide-neutral-100">
                      <div className="flex justify-between items-center py-2 text-xs">
                        <div>
                          <p className="font-semibold text-neutral-800">Welcome Coins</p>
                          <p className="text-[10px] text-neutral-400">Signup welcome balance</p>
                        </div>
                        <span className="font-mono font-bold text-emerald-500">+5 Coins</span>
                      </div>
                      {wallet?.lifetimePointsEarned > 5 && (
                        <div className="flex justify-between items-center py-2 text-xs">
                          <div>
                            <p className="font-semibold text-neutral-800">Referral Reward</p>
                            <p className="text-[10px] text-neutral-400">Affiliate sign up credit</p>
                          </div>
                          <span className="font-mono font-bold text-emerald-500">+{wallet.lifetimePointsEarned - 5} Coins</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {mobileTab === 'orders' && (
            <div className="space-y-6">
              {!token ? (
                <div className="text-center py-12 bg-white rounded-3xl p-6 border border-neutral-200/50 shadow-xs space-y-4">
                  <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-500 shadow-inner">
                    <ClipboardList className="w-6 h-6" />
                  </div>
                  <h3 className="font-serif text-base font-bold text-neutral-800">Track Packages & History</h3>
                  <p className="text-xs text-neutral-500 max-w-xs mx-auto leading-relaxed">
                    Log in to view your complete order history, download invoice details, and track shipment status.
                  </p>
                  <button 
                    onClick={() => setIsAuthOpen(true)}
                    className="w-full py-3 bg-neutral-950 text-white rounded-xl text-xs font-semibold shadow-md"
                  >
                    Sign In / Register
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* KPI Row */}
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="bg-white border border-neutral-100 rounded-2xl p-3 text-center">
                      <span className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block">Orders</span>
                      <span className="text-lg font-serif font-bold text-neutral-800 mt-0.5 inline-block">{mobileOrders.length}</span>
                    </div>
                    <div className="bg-white border border-neutral-100 rounded-2xl p-3 text-center">
                      <span className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block">Active</span>
                      <span className="text-lg font-serif font-bold text-neutral-800 mt-0.5 inline-block">
                        {mobileOrders.filter(o => o.orderStatus === 'pending' || o.orderStatus === 'shipped').length}
                      </span>
                    </div>
                    <div className="bg-white border border-neutral-100 rounded-2xl p-3 text-center">
                      <span className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block">Delivered</span>
                      <span className="text-lg font-serif font-bold text-neutral-800 mt-0.5 inline-block">
                        {mobileOrders.filter(o => o.orderStatus === 'completed').length}
                      </span>
                    </div>
                  </div>

                  {/* Orders list */}
                  <div className="space-y-3">
                    <h4 className="text-xs uppercase font-bold text-neutral-400 tracking-wider text-left">My Packages</h4>
                    {mobileOrdersLoading ? (
                      <div className="text-center py-10 text-xs text-neutral-400">Loading order list...</div>
                    ) : mobileOrders.length === 0 ? (
                      <div className="text-center py-10 bg-white border border-neutral-200 rounded-2xl p-4">
                        <p className="text-xs text-neutral-500 font-medium">You haven't placed any orders yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {mobileOrders.map((order) => (
                          <div key={order.id} className="bg-white border border-neutral-200/50 rounded-2xl p-4 space-y-3.5 shadow-xs">
                            <div className="flex justify-between items-start">
                              <div className="text-left">
                                <span className="font-mono text-xs font-bold text-neutral-900">ID: #{order.id}</span>
                                <span className="text-[10px] text-neutral-400 font-mono block">Date: {new Date(order.createdAt).toLocaleDateString()}</span>
                              </div>
                              <span className={`text-[10px] font-bold uppercase py-1 px-2.5 rounded-lg font-mono ${
                                order.orderStatus === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                                order.orderStatus === 'shipped' ? 'bg-sky-50 text-sky-600' :
                                order.orderStatus === 'cancelled' ? 'bg-red-50 text-red-600' :
                                'bg-amber-50 text-amber-600'
                              }`}>
                                {order.orderStatus}
                              </span>
                            </div>

                            {/* Products summary */}
                            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                              {order.items.map((it: any, index: number) => (
                                <div key={index} className="flex items-center gap-1.5 shrink-0 bg-neutral-50 border border-neutral-100 rounded-lg p-1.5">
                                  <div className="w-8 h-8 rounded-md overflow-hidden bg-white border border-neutral-150">
                                    <img src={it.image} alt={it.name} className="w-full h-full object-cover" />
                                  </div>
                                  <div className="text-left text-[10px]">
                                    <p className="font-medium text-neutral-800 line-clamp-1 max-w-[80px]">{it.name}</p>
                                    <p className="font-mono text-neutral-400 font-bold">Qty: {it.quantity}</p>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Mobile visual tracking stepper */}
                            {order.orderStatus === 'cancelled' ? (
                              <div className="p-2.5 bg-red-50 rounded-xl border border-red-100 text-center text-xs font-semibold text-red-600">
                                ❌ Order Cancelled & Refunded
                              </div>
                            ) : (
                              <div className="flex items-center justify-between pt-1 font-sans">
                                <div className="flex flex-col items-center flex-1">
                                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">✓</div>
                                  <span className="text-[9px] font-bold text-neutral-800 mt-1">Placed</span>
                                </div>
                                <div className={`h-0.5 flex-1 transition-all ${
                                  order.orderStatus === 'shipped' || order.orderStatus === 'completed' ? 'bg-emerald-500' : 'bg-neutral-200'
                                }`}></div>
                                <div className="flex flex-col items-center flex-1">
                                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                                    order.orderStatus === 'shipped' || order.orderStatus === 'completed' 
                                      ? 'bg-emerald-500 text-white' 
                                      : 'bg-neutral-200 text-neutral-400'
                                  }`}>
                                    {order.orderStatus === 'shipped' || order.orderStatus === 'completed' ? '✓' : '2'}
                                  </div>
                                  <span className={`text-[9px] font-bold mt-1 ${
                                    order.orderStatus === 'shipped' || order.orderStatus === 'completed' ? 'text-neutral-800' : 'text-neutral-400'
                                  }`}>Shipped</span>
                                </div>
                                <div className={`h-0.5 flex-1 transition-all ${
                                  order.orderStatus === 'completed' ? 'bg-emerald-500' : 'bg-neutral-200'
                                }`}></div>
                                <div className="flex flex-col items-center flex-1">
                                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                                    order.orderStatus === 'completed' 
                                      ? 'bg-emerald-500 text-white' 
                                      : 'bg-neutral-200 text-neutral-400'
                                  }`}>
                                    {order.orderStatus === 'completed' ? '✓' : '3'}
                                  </div>
                                  <span className={`text-[9px] font-bold mt-1 ${
                                    order.orderStatus === 'completed' ? 'text-neutral-800 font-bold' : 'text-neutral-400'
                                  }`}>Delivered</span>
                                </div>
                              </div>
                            )}

                            {/* Subtotal details */}
                            <div className="flex justify-between items-center border-t border-neutral-100 pt-2.5 text-xs">
                              <span className="text-neutral-500">Paid: <span className="font-semibold text-neutral-800">{order.paymentMethod}</span></span>
                              <span className="font-mono font-bold text-neutral-900">Total: ₹{order.totalAmount}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {mobileTab === 'profile' && (
            <div className="space-y-6">
              {!token ? (
                <div className="text-center py-12 bg-white rounded-3xl p-6 border border-neutral-200/50 shadow-xs space-y-4">
                  <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-500 shadow-inner">
                    <UserIcon className="w-6 h-6" />
                  </div>
                  <h3 className="font-serif text-base font-bold text-neutral-800">My Account</h3>
                  <p className="text-xs text-neutral-500 max-w-xs mx-auto leading-relaxed">
                    Log in to configure your user profile details, manage security, and access administrative dashboard hubs.
                  </p>
                  <button 
                    onClick={() => setIsAuthOpen(true)}
                    className="w-full py-3 bg-neutral-900 text-white rounded-xl text-xs font-semibold shadow-md"
                  >
                    Sign In / Register
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Profile Detail card */}
                  <div className="bg-white border border-neutral-200/50 rounded-3xl p-6 shadow-xs flex flex-col items-center text-center space-y-3">
                    <div className="w-16 h-16 rounded-full border-2 border-neutral-200 overflow-hidden bg-neutral-50 relative mx-auto">
                      <img src="/logo.png" alt="Profile" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h3 className="font-serif text-base font-bold text-neutral-800">{user?.username}</h3>
                      <p className="text-xs text-neutral-400 font-mono mt-0.5">{user?.email || user?.phone}</p>
                      <span className="bg-rose-50 border border-rose-100 text-rose-600 text-[9px] font-bold font-mono py-0.5 px-2 rounded-md uppercase tracking-wider inline-block mt-2">
                        {user?.role} Account
                      </span>
                    </div>
                  </div>

                  {/* Actions List */}
                  <div className="bg-white border border-neutral-200/50 rounded-3xl p-4 divide-y divide-neutral-100 shadow-xs font-sans text-xs text-left">
                    {user?.role === 'admin' && (
                      <button
                        onClick={() => {
                          setIsAdminView(!isAdminView);
                        }}
                        className="w-full py-3.5 flex justify-between items-center text-left text-neutral-700 hover:text-neutral-900"
                      >
                        <span className="font-semibold text-rose-500">Toggle Admin Command Center</span>
                        <ChevronRight className="w-4 h-4 text-neutral-400" />
                      </button>
                    )}
                    <div className="py-3.5 flex justify-between items-center">
                      <span className="text-neutral-500">Wallet Balance</span>
                      <span className="font-mono font-bold text-neutral-800">{wallet?.balancePoints || 0} Coins</span>
                    </div>
                    <div className="py-3.5 flex justify-between items-center">
                      <span className="text-neutral-500">Referral Affiliate Code</span>
                      <span className="font-mono font-bold text-rose-500 tracking-wider font-bold">{user?.referralCode || 'BP-REFER'}</span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full py-3.5 flex justify-between items-center text-left text-red-600 font-semibold"
                    >
                      <span>Log Out Account</span>
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        {/* FLOATING GLASSMORPHIC BOTTOM TAB MENU */}
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-sm h-15 glass-nav rounded-full px-5 flex items-center justify-between text-neutral-450 shadow-xl z-40">
          <button 
            onClick={() => setMobileTab('home')}
            className={`flex items-center justify-center p-3 rounded-full transition-all ${
              mobileTab === 'home' ? 'bg-white text-neutral-950 shadow-md scale-105' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Home className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => setIsCartOpen(true)}
            className={`flex items-center justify-center p-3 rounded-full transition-all relative ${
              isCartOpen ? 'bg-white text-neutral-950 shadow-md scale-105' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <ShoppingBag className="w-5 h-5" />
            {cart.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[8px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center border border-neutral-950">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </button>

          <button 
            onClick={() => setMobileTab('wallet')}
            className={`flex items-center justify-center p-3 rounded-full transition-all ${
              mobileTab === 'wallet' ? 'bg-white text-neutral-950 shadow-md scale-105' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Gift className="w-5 h-5" />
          </button>

          <button 
            onClick={() => setMobileTab('orders')}
            className={`flex items-center justify-center p-3 rounded-full transition-all ${
              mobileTab === 'orders' ? 'bg-white text-neutral-950 shadow-md scale-105' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <ClipboardList className="w-5 h-5" />
          </button>

          <button 
            onClick={() => setMobileTab('profile')}
            className={`flex items-center justify-center p-3 rounded-full transition-all ${
              mobileTab === 'profile' ? 'bg-white text-neutral-950 shadow-md scale-105' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <UserIcon className="w-5 h-5" />
          </button>
        </nav>

        {/* MOBILE OVERLAYS & BOTTOM SHEETS */}
        
        {/* AuthModal portal */}
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          onAuthSuccess={(u, t) => {
            setUser(u);
            setToken(t);
            localStorage.setItem('bp_token', t);
            localStorage.setItem('bp_user', JSON.stringify(u));
            fetchUserProfile(t);
            setIsAuthOpen(false);
          }}
        />

        {/* Checkout Modal portal */}
        {isCheckoutOpen && (
          <CheckoutModal
            isOpen={isCheckoutOpen}
            onClose={() => setIsCheckoutOpen(false)}
            token={token}
            user={user}
            wallet={wallet}
            cartItems={cart}
            onOrderPlaced={() => {
              setCart([]);
              localStorage.removeItem('bp_cart');
              fetchUserProfile(token || '');
              fetchMobileOrders();
              setMobileTab('orders');
              setIsCheckoutOpen(false);
            }}
            settings={settings}
          />
        )}

        {/* Product Details Bottom Sheet */}
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs animate-fade-in">
            <div 
              className="absolute inset-0 z-0" 
              onClick={() => setSelectedProduct(null)}
            />
            <div className="relative w-full max-h-[92vh] bg-white rounded-t-[32px] overflow-hidden shadow-2xl z-10 flex flex-col transition-all duration-300 animate-slide-up pb-8 text-neutral-800">
              {/* Drag/Pull indicator */}
              <div className="w-12 h-1.5 bg-neutral-200 rounded-full mx-auto my-3 shrink-0"></div>

              {/* Close Button floating */}
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute p-2.5 top-4 left-4 bg-white/80 backdrop-blur-md rounded-full shadow-sm text-neutral-500 hover:text-neutral-850 z-20 border border-neutral-100/50"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Heart Button floating */}
              <button
                className="absolute p-2.5 top-4 right-4 bg-white/80 backdrop-blur-md rounded-full shadow-sm text-neutral-500 hover:text-rose-500 z-20 border border-neutral-100/50 transition-colors"
                onClick={() => alert('Added to wishlist!')}
              >
                <Heart className="w-4 h-4" />
              </button>

              <div className="flex-1 overflow-y-auto">
                {detailsLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-8 h-8 border-2 border-[#5d3425] rounded-full border-t-transparent animate-spin mb-3" />
                    <p className="text-xs text-neutral-400 font-mono">Syncing details...</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Media image container */}
                    <div className="w-full aspect-[4/3] bg-[#fbf7f0] overflow-hidden relative border-b border-neutral-100/50">
                      <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
                      
                      {/* Image Thumbnail Overlay from Mockup */}
                      <div className="absolute bottom-4 left-4 flex gap-1.5 z-20">
                        <div className="w-9 h-9 rounded-lg overflow-hidden border border-white/50 bg-neutral-100 shadow-sm shrink-0">
                          <img src={selectedProduct.image} className="w-full h-full object-cover" />
                        </div>
                        <div className="w-9 h-9 rounded-lg overflow-hidden border border-white/50 bg-neutral-150 shadow-sm opacity-85 shrink-0">
                          <img src="https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=200" className="w-full h-full object-cover" />
                        </div>
                        <div className="w-9 h-9 rounded-lg overflow-hidden border border-white/50 bg-neutral-150 shadow-sm opacity-85 shrink-0">
                          <img src="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=200" className="w-full h-full object-cover" />
                        </div>
                        <div className="w-9 h-9 rounded-lg overflow-hidden border border-white/50 bg-neutral-900/60 flex items-center justify-center text-[9px] font-bold text-white shadow-sm shrink-0">
                          +4
                        </div>
                      </div>

                      {settings?.rewardEnabled !== false && selectedProduct.rewardCoins && (
                        <div className="absolute bottom-4 right-4 bg-amber-950/90 backdrop-blur-md text-amber-200 text-[9px] font-bold font-mono px-3 py-1.5 rounded-xl flex items-center gap-1 border border-amber-500/20 shadow-md">
                          <Coins className="w-3 h-3 text-amber-300" />
                          <span>+{selectedProduct.rewardCoins} Coins</span>
                        </div>
                      )}
                    </div>

                    {/* Details content */}
                    <div className="px-5 space-y-4 text-left">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400">
                            <span>{selectedProduct.details?.brand || 'Premium Brand'}</span>
                            <span className="bg-[#ecdcc3]/40 text-[#5d3425] px-1.5 py-0.5 rounded text-[8px] font-semibold">{selectedProduct.categoryName}</span>
                          </div>
                          <h2 className="font-serif text-lg font-bold text-neutral-950 leading-snug">
                            {selectedProduct.name}
                          </h2>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-amber-500 font-semibold bg-amber-50/50 px-2 py-1 rounded-lg border border-amber-100/50 shrink-0">
                          <Star className="w-3.5 h-3.5 fill-current text-amber-500" />
                          <span className="font-mono text-neutral-705">{selectedProduct.rating.toFixed(1)}</span>
                        </div>
                      </div>

                      {/* Select Size from Mockup */}
                      <div className="space-y-2 pt-1">
                        <span className="text-[10px] font-bold text-[#5d3425] uppercase tracking-wider block">Select Size</span>
                        <div className="flex gap-2">
                          {['30ml', '50ml', '100ml', '150ml'].map((sz, i) => (
                            <button
                              key={sz}
                              type="button"
                              onClick={() => alert(`Selected size: ${sz}`)}
                              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-medium border transition-all ${
                                i === 1
                                  ? 'bg-[#5d3425] text-white border-[#5d3425] shadow-xs'
                                  : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
                              }`}
                            >
                              {sz}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Select Color/Variant from Mockup */}
                      <div className="space-y-2 pt-1">
                        <span className="text-[10px] font-bold text-[#5d3425] uppercase tracking-wider block">Select Variant</span>
                        <div className="flex gap-2.5 items-center">
                          {['#EAC3B2', '#D38A71', '#BC654B'].map((col, i) => (
                            <button
                              key={col}
                              type="button"
                              className={`w-6 h-6 rounded-full border-2 transition-all ${
                                i === 0 ? 'border-[#5d3425] ring-2 ring-[#5d3425]/10 scale-105' : 'border-transparent'
                              }`}
                              style={{ backgroundColor: col }}
                              onClick={() => alert(`Variant selected`)}
                            />
                          ))}
                          <span className="text-xs text-neutral-500 font-medium ml-1">Rose Tinted</span>
                        </div>
                      </div>

                      {/* Description Accordions */}
                      <div className="space-y-3 font-sans text-xs text-neutral-600 leading-relaxed border-t border-neutral-200/50 pt-4">
                        <div>
                          <strong className="text-neutral-800 font-bold uppercase tracking-wider text-[9px] block mb-0.5">Product Details</strong>
                          <p className="font-light text-neutral-500">
                            {selectedProduct.description} <span className="text-neutral-700 font-semibold underline cursor-pointer">Read more</span>
                          </p>
                        </div>
                        <div>
                          <strong className="text-neutral-800 font-bold uppercase tracking-wider text-[9px] block mb-0.5">Skin Compatibility</strong>
                          <p>{selectedProduct.details?.skinType || 'All Skin Types'}</p>
                        </div>
                        <div>
                          <strong className="text-neutral-800 font-bold uppercase tracking-wider text-[9px] block mb-0.5">Ingredients</strong>
                          <p className="text-[11px] font-light text-neutral-450">{selectedProduct.details?.ingredients || 'Water, cold-pressed essences.'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

                {/* Sticky bottom buy bar */}
                <div className="border-t border-neutral-100/60 p-4 bg-white flex items-center justify-between gap-4 shrink-0 shadow-lg">
                  <div className="flex flex-col text-left">
                    <span className="text-[9px] text-neutral-400 uppercase font-bold tracking-wider font-mono">Total Price</span>
                    <span className="text-base font-mono font-bold text-neutral-900 leading-none mt-0.5">
                      ₹{selectedProduct.salePrice || selectedProduct.price}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => {
                      handleAddToCart(selectedProduct);
                      setSelectedProduct(null);
                    }}
                    disabled={selectedProduct.stock <= 0}
                    className="flex-1 py-3.5 bg-[#5d3425] hover:bg-[#71412e] text-white font-semibold text-xs rounded-full flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition-all disabled:opacity-50"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>{selectedProduct.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        {/* Cart Drawer Bottom Sheet */}
        {isCartOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs animate-fade-in">
            <div 
              className="absolute inset-0 z-0" 
              onClick={() => setIsCartOpen(false)}
            />
            <div className="relative w-full max-h-[85vh] bg-[#fbf7f0] rounded-t-[32px] overflow-hidden shadow-2xl z-10 flex flex-col transition-all duration-300 animate-slide-up pb-8 text-neutral-800">
              {/* Drag handle */}
              <div className="w-12 h-1.5 bg-neutral-300/60 rounded-full mx-auto my-3 shrink-0"></div>

              {/* Close Button */}
              <button
                onClick={() => setIsCartOpen(false)}
                className="absolute p-2.5 top-4 right-4 text-neutral-450 hover:text-neutral-600"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="px-5 pb-3 border-b border-gold-100/30 flex justify-between items-center shrink-0">
                <h3 className="font-serif text-base font-bold text-[#5d3425] flex items-center gap-1">
                  <span>My Cart</span>
                  <span className="text-xs font-sans text-neutral-400 font-normal">({cart.reduce((s, it) => s + it.quantity, 0)} items)</span>
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4 divide-y divide-neutral-100/50">
                {cart.length === 0 ? (
                  <div className="text-center py-16 space-y-3">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto text-neutral-400 border border-neutral-100">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                    <p className="text-xs text-neutral-500 font-medium">Your shopping cart is currently empty.</p>
                  </div>
                ) : (
                  cart.map((item, idx) => (
                    <div key={idx} className="py-3.5 flex gap-3 items-center text-left">
                      <div className="w-14 h-14 rounded-xl border border-neutral-200/40 overflow-hidden bg-white shrink-0 shadow-xs">
                        <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                      </div>
                      
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <h4 className="text-xs font-semibold text-neutral-800 truncate">{item.product.name}</h4>
                        <p className="text-xs font-mono font-bold text-[#5d3425]">₹{item.product.salePrice || item.product.price}</p>
                      </div>

                      {/* Quantity Toggles */}
                      <div className="flex items-center border border-neutral-200/80 rounded-lg p-0.5 bg-white shrink-0 text-xs gap-1.5 shadow-xs">
                        <button 
                          onClick={() => handleUpdateQuantity(item.product.id, item.quantity - 1)}
                          className="w-5 h-5 flex items-center justify-center hover:bg-neutral-100 rounded-md text-neutral-600 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-mono font-bold text-neutral-800 w-4 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)}
                          className="w-5 h-5 flex items-center justify-center hover:bg-neutral-100 rounded-md text-neutral-600 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => handleRemoveFromCart(item.product.id)}
                        className="p-2 text-neutral-400 hover:text-red-500 shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Order total breakdown sticky summary */}
              {cart.length > 0 && (
                <div className="border-t border-gold-100/30 p-5 bg-white space-y-4 shrink-0 font-sans text-xs">
                  {/* Ledger Summary */}
                  <div className="space-y-2 text-left">
                    <div className="flex justify-between text-neutral-500">
                      <span>Sub-total</span>
                      <span className="font-mono font-semibold text-neutral-850">
                        ₹{cart.reduce((sum, item) => sum + (item.product.salePrice || item.product.price) * item.quantity, 0)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-neutral-500">
                      <span>Delivery Fee</span>
                      <span className="font-mono font-semibold text-neutral-800">
                        ₹0.00
                      </span>
                    </div>
                    
                    {settings?.rewardEnabled !== false && (
                      <div className="flex justify-between text-amber-700 bg-amber-50/50 p-2 rounded-xl border border-amber-100/30">
                        <span>Earnable loyalty Coins:</span>
                        <span className="font-mono font-bold flex items-center gap-0.5">
                          <Coins className="w-3.5 h-3.5 text-amber-500" />
                          +{cart.reduce((sum, item) => sum + (item.product.rewardCoins || 0) * item.quantity, 0)} Coins
                        </span>
                      </div>
                    )}

                    <div className="border-t border-neutral-150/50 pt-2 flex justify-between text-neutral-900 font-bold text-sm">
                      <span>Total Price</span>
                      <span className="font-mono text-[#5d3425]">
                        ₹{cart.reduce((sum, item) => sum + (item.product.salePrice || item.product.price) * item.quantity, 0)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      if (!token) {
                        setIsAuthOpen(true);
                      } else {
                        setIsCheckoutOpen(true);
                      }
                    }}
                    className="w-full py-3.5 bg-[#5d3425] hover:bg-[#71412e] text-white font-semibold rounded-full flex items-center justify-center gap-1 shadow-md active:scale-98 transition-all"
                  >
                    <span>Checkout</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col text-neutral-800 font-sans relative">
      
      {/* GLOBAL BANNER ANNOUNCEMENT & NAVIGATION */}
      <Navbar
        categories={categories}
        activeCategory={activeCategory}
        onSelectCategory={(slug) => {
          setActiveCategory(slug);
          setIsAdminView(false); // toggle back to store view if category is clicked
        }}
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        user={user}
        wallet={wallet}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        onSearch={setSearchQuery}
        onToggleAdmin={() => setIsAdminView(!isAdminView)}
        isAdminView={isAdminView}
        announcementText={settings?.announcementText}
        onOpenReferral={() => setIsReferralOpen(true)}
        onOpenOrders={() => setIsOrdersOpen(true)}
      />

      {/* RENDER ADMIN HUB VS CUSTOMER FRONTEND */}
      {isAdminView && user?.role === 'admin' ? (
        <main className="flex-1">
          <AdminDashboard 
            token={token} 
            categories={categories} 
            onRefreshCatalog={fetchCatalogData} 
          />
        </main>
      ) : (
        /* STANDARD CUSTOMER VIEWPORT */
        <main className="flex-grow pb-16">
          
          {/* 1. HERO HOME PROMOTIONAL PANEL (Only when not filtering) */}
          {!activeCategory && !searchQuery && (
            <Hero 
              settings={settings} 
              onCtaClick={() => {
                // Focus scroll down to products grid
                const grid = document.getElementById('products-grid-section');
                if (grid) grid.scrollIntoView({ behavior: 'smooth' });
              }} 
            />
          )}

          {/* 2. PRODUCTS GRID PORTLET */}
          <div id="products-grid-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            
            {/* Grid Header & Sort select filters */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-neutral-100 pb-5">
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-wide text-neutral-900 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-rose-500 animate-pulse" />
                  {activeCategory 
                    ? `${categories.find(c => c.slug === activeCategory)?.name || 'Cosmetics'}` 
                    : searchQuery 
                      ? `Search results for "${searchQuery}"` 
                      : "Bestseller Radiance Collection"
                  }
                </h2>
                <p className="text-xs text-neutral-500 mt-1">
                  {activeCategory 
                    ? categories.find(c => c.slug === activeCategory)?.description 
                    : "Curated formulations featuring cold-pressed essences and non-comedogenic elements."
                  }
                </p>
              </div>

              {/* Sort By selector */}
              <div className="flex items-center gap-2 font-sans text-xs">
                <span className="text-neutral-500 font-medium">Sort By:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="py-2.5 px-3 border border-neutral-200 bg-white text-neutral-700 font-medium rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-400"
                >
                  <option value="default">Default Catalog</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating">Rating: High to Low</option>
                </select>
              </div>
            </div>

            {/* Products Loader */}
            {loading ? (
              <div className="flex flex-col justify-center items-center h-64">
                <div className="w-10 h-10 border-3 border-neutral-950 rounded-full border-t-transparent animate-spin mb-4" />
                <p className="text-xs text-neutral-400 font-mono">Syncing cosmetics catalog...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 bg-white border border-dashed border-neutral-300 rounded-2xl max-w-xl mx-auto p-8">
                <div className="w-12 h-12 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-4 text-neutral-400">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-lg font-bold text-neutral-800">No Beauty Items Found</h3>
                <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto">
                  We couldn't find any cosmetics matching your parameters. Try relaxing your filters or typing a different keyword.
                </p>
                <button
                  onClick={() => {
                    setActiveCategory(null);
                    setSearchQuery('');
                    setSortBy('default');
                  }}
                  className="mt-6 py-2.5 px-6 bg-neutral-900 text-white rounded-xl text-xs font-medium hover:bg-rose-500 transition-all shadow-sm"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              /* Actual dynamic product card grids */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>
            )}

            {/* 3. PROMOTIONAL FEATURE BENTO PLATES (Only shown on default home view) */}
            {!activeCategory && !searchQuery && (
              <div className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-neutral-150 pt-16">
                
                {/* Plate A */}
                <div className="relative overflow-hidden rounded-2xl bg-neutral-100 aspect-21/9 flex items-center p-8 group border border-neutral-200">
                  <div className="absolute inset-0 z-0">
                    <img 
                      src="https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&q=80&w=600" 
                      alt="Aesthetic skincare" 
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-neutral-50/95 via-neutral-50/80 to-transparent" />
                  </div>
                  <div className="relative z-10 max-w-xs space-y-3">
                    <span className="text-[9px] font-bold tracking-widest text-rose-500 uppercase">Aura Treatment</span>
                    <h3 className="font-serif text-xl font-bold text-neutral-950">Natural Essence Skincare</h3>
                    <p className="text-xs text-neutral-500 font-light leading-relaxed">Formulated with organic chamomile and calendula blooms to heal barrier fatigue.</p>
                    <button 
                      onClick={() => setActiveCategory('skincare')}
                      className="text-xs font-semibold text-neutral-900 flex items-center gap-1 hover:text-rose-500 transition-colors"
                    >
                      <span>Explore Skincare</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Plate B */}
                <div className="relative overflow-hidden rounded-2xl bg-neutral-100 aspect-21/9 flex items-center p-8 group border border-neutral-200">
                  <div className="absolute inset-0 z-0">
                    <img 
                      src="https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=600" 
                      alt="Liquid blush makeup brush" 
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-neutral-50/95 via-neutral-50/80 to-transparent" />
                  </div>
                  <div className="relative z-10 max-w-xs space-y-3">
                    <span className="text-[9px] font-bold tracking-widest text-rose-500 uppercase">Premium Glaze</span>
                    <h3 className="font-serif text-xl font-bold text-neutral-950">Luminous Velvet Makeup</h3>
                    <p className="text-xs text-neutral-500 font-light leading-relaxed">Infused with micro-pearl pigments to give skin a second-skin satin finish.</p>
                    <button 
                      onClick={() => setActiveCategory('makeup')}
                      className="text-xs font-semibold text-neutral-900 flex items-center gap-1 hover:text-rose-500 transition-colors"
                    >
                      <span>Explore Makeup</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>

        </main>
      )}

      {/* ==================== PRODUCT DETAILS SLIDE OVERLAY SCREEN ==================== */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden my-8 border border-neutral-100 animate-scale-up">
            
            <div className="h-2 bg-gradient-to-r from-amber-200 via-rose-300 to-amber-200" />

            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute p-2 top-4 right-4 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-full z-10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6 md:p-8 max-h-[85vh] overflow-y-auto">
              {detailsLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-10 h-10 border-2 border-neutral-950 rounded-full border-t-transparent animate-spin mb-3" />
                  <p className="text-xs text-neutral-500 font-mono">Syncing reviews & ingredients...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                  
                  {/* Left Column: Media Presentation */}
                  <div className="space-y-4">
                    <div className="aspect-square rounded-2xl overflow-hidden border border-neutral-150 bg-neutral-50">
                      <img 
                        src={selectedProduct.image} 
                        alt={selectedProduct.name} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    {/* Trust assurances block */}
                    <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-neutral-500 font-medium uppercase tracking-wider py-1">
                      <div className="p-2 border rounded-xl bg-neutral-50/50 flex flex-col items-center justify-center gap-1">
                        <span className="text-rose-500">Vegan</span>
                        <span>Certified</span>
                      </div>
                      <div className="p-2 border rounded-xl bg-neutral-50/50 flex flex-col items-center justify-center gap-1">
                        <span className="text-rose-500">Cruelty</span>
                        <span>Free</span>
                      </div>
                      <div className="p-2 border rounded-xl bg-neutral-50/50 flex flex-col items-center justify-center gap-1">
                        <span className="text-rose-500">Organic</span>
                        <span>Elements</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Spec Sheets & Reviews */}
                  <div className="space-y-6 flex flex-col justify-between">
                    
                    <div className="space-y-4">
                      {/* Brand Label */}
                      <div className="flex justify-between items-center text-xs text-neutral-400 uppercase tracking-widest">
                        <span className="font-bold text-neutral-600">{selectedProduct.details?.brand || 'Collection'}</span>
                        <span className="bg-neutral-100 px-2.5 py-1 rounded-md text-neutral-600 font-semibold">{selectedProduct.categoryName}</span>
                      </div>

                      {/* Product Name */}
                      <h2 className="font-serif text-2xl md:text-3xl font-bold text-neutral-900 leading-tight">
                        {selectedProduct.name}
                      </h2>

                      {/* Rating summary */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center text-amber-400">
                          <Star className="w-4 h-4 fill-amber-400" />
                          <span className="font-mono font-bold text-sm text-neutral-800 ml-1">{selectedProduct.rating.toFixed(1)}</span>
                        </div>
                        <span className="text-xs text-neutral-400">({selectedProduct.reviewsCount} verified purchases reviews)</span>
                      </div>

                      {/* Pricing block */}
                      <div className="border-t border-b border-neutral-100 py-3 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-neutral-400 uppercase tracking-wider">Estimated Price</p>
                          {selectedProduct.salePrice ? (
                            <div className="flex items-baseline gap-2 mt-0.5">
                              <span className="text-2xl font-mono font-bold text-rose-600">₹{selectedProduct.salePrice.toFixed(2)}</span>
                              <span className="text-sm font-mono text-neutral-400 line-through">₹{selectedProduct.price.toFixed(2)}</span>
                            </div>
                          ) : (
                            <span className="text-2xl font-mono font-bold text-neutral-900 mt-0.5">₹{selectedProduct.price.toFixed(2)}</span>
                          )}
                          {settings?.rewardEnabled !== false && selectedProduct.rewardCoins !== undefined && selectedProduct.rewardCoins > 0 && (
                            <div className="mt-2 text-[10px] font-semibold text-rose-600 bg-rose-50 border border-rose-100/50 py-1 px-2.5 rounded-lg flex items-center gap-1 w-fit">
                              <span className="animate-bounce">🎁</span>
                              <span>Buy this product and earn {selectedProduct.rewardCoins} Coins!</span>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-neutral-400 uppercase tracking-wider">Availability</p>
                          <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold mt-1 ${
                            selectedProduct.stock <= 0 
                              ? 'bg-red-50 text-red-600'
                              : selectedProduct.stock <= 10
                                ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                                : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {selectedProduct.stock <= 0 ? 'SOLD OUT' : selectedProduct.stock <= 10 ? `Low Stock: Only ${selectedProduct.stock} left` : 'Fully Stocked'}
                          </span>
                        </div>
                      </div>

                      {/* Ingredients & How to Use tabs */}
                      <div className="space-y-3 text-xs text-neutral-600 leading-relaxed">
                        <p><strong className="text-neutral-800 font-bold uppercase tracking-wider text-[9px] block mb-1">Product Description</strong> {selectedProduct.description}</p>
                        <p><strong className="text-neutral-800 font-bold uppercase tracking-wider text-[9px] block mb-1">Skin Compatibility</strong> {selectedProduct.details?.skinType || 'All Skin Types'}</p>
                        <p><strong className="text-neutral-800 font-bold uppercase tracking-wider text-[9px] block mb-1">How To Apply</strong> {selectedProduct.details?.howToUse || 'Apply as desired on clean skin.'}</p>
                        <p><strong className="text-neutral-800 font-bold uppercase tracking-wider text-[9px] block mb-1">Active Ingredients</strong> {selectedProduct.details?.ingredients || 'Water, botanical essences.'}</p>
                      </div>
                    </div>

                    {/* Add to Cart button */}
                    <button
                      onClick={() => {
                        handleAddToCart(selectedProduct);
                        setSelectedProduct(null); // auto-close on cart add
                      }}
                      disabled={selectedProduct.stock <= 0}
                      className={`w-full py-3.5 px-4 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2 ${
                        selectedProduct.stock <= 0
                          ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed shadow-none'
                          : 'bg-neutral-900 text-white hover:bg-rose-500 hover:shadow-lg active:scale-[0.99]'
                      }`}
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>{selectedProduct.stock <= 0 ? 'Out of Stock' : 'Add to Bag'}</span>
                    </button>

                  </div>

                </div>
              )}

              {/* REVIEWS INTEGRATED PORTAL SECTION */}
              {!detailsLoading && selectedProduct && (
                <div className="mt-12 border-t border-neutral-150 pt-10 space-y-6">
                  <h3 className="font-serif text-lg font-bold text-neutral-950 tracking-wide flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-rose-500" /> Customer Reflections & Reviews ({productReviews.length})
                  </h3>

                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    
                    {/* Left side: Review submissions card */}
                    <div className="lg:col-span-2">
                      {token ? (
                        <div className="border border-neutral-200 rounded-2xl p-5 bg-neutral-50/50 space-y-4">
                          <p className="font-serif text-sm font-semibold text-neutral-900">Add Your Personal Review</p>
                          
                          {reviewSuccess && (
                            <p className="text-xs text-emerald-600 font-medium bg-emerald-50 border border-emerald-100 p-2.5 rounded-lg">{reviewSuccess}</p>
                          )}
                          {reviewError && (
                            <p className="text-xs text-red-600 font-medium bg-red-50 border border-red-100 p-2.5 rounded-lg">{reviewError}</p>
                          )}

                          <form onSubmit={handlePostReview} className="space-y-3.5 text-xs text-neutral-700">
                            <div>
                              <label className="block mb-1 font-semibold text-neutral-600 uppercase tracking-wide text-[10px]">Your Rating</label>
                              <div className="flex gap-1 text-amber-400">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => setReviewRating(star)}
                                    className="p-0.5 focus:outline-none"
                                  >
                                    <Star className={`w-5 h-5 ${star <= reviewRating ? 'fill-amber-400' : 'text-neutral-300'}`} />
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div>
                              <label className="block mb-1 font-semibold text-neutral-600 uppercase tracking-wide text-[10px]">Your Comments</label>
                              <textarea
                                required
                                rows={3}
                                value={reviewComment}
                                onChange={(e) => setReviewComment(e.target.value)}
                                placeholder="I absolutely love the hydrating satin glaze finish..."
                                className="w-full py-2.5 px-3 border border-neutral-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-rose-400"
                              />
                            </div>

                            <button
                              type="submit"
                              className="w-full py-3 bg-neutral-900 text-white rounded-lg hover:bg-rose-500 transition-all font-medium text-xs shadow-xs"
                            >
                              Publish Review
                            </button>
                          </form>
                        </div>
                      ) : (
                        <div className="border border-dashed border-neutral-300 rounded-2xl p-6 text-center text-xs bg-neutral-50/50">
                          <p className="text-neutral-500 leading-relaxed mb-4">You must be logged in to share comments and rate this product.</p>
                          <button
                            onClick={() => {
                              setSelectedProduct(null); // Close details
                              setIsAuthOpen(true); // Open login
                            }}
                            className="py-2.5 px-5 border border-neutral-900 text-neutral-900 font-medium rounded-lg hover:bg-neutral-900 hover:text-white transition-all"
                          >
                            Sign In to Write Review
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Right side: List of reviews */}
                    <div className="lg:col-span-3 space-y-4">
                      {productReviews.length === 0 ? (
                        <p className="text-xs text-neutral-400 italic text-center py-8">Be the first to leave a review for this luxury item!</p>
                      ) : (
                        <div className="space-y-3 max-h-[360px] overflow-y-auto pr-2">
                          {productReviews.map((rev) => (
                            <div key={rev.id} className="p-4 border border-neutral-100 rounded-xl bg-white space-y-1 shadow-xs text-xs">
                              <div className="flex justify-between items-center">
                                <span className="font-semibold text-neutral-900">{rev.userName}</span>
                                <span className="text-[10px] text-neutral-400 font-mono">{new Date(rev.createdAt).toLocaleDateString()}</span>
                              </div>
                              <div className="flex text-amber-400 gap-0.5">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star key={s} className={`w-3 h-3 ${s <= rev.rating ? 'fill-amber-400' : 'text-neutral-200'}`} />
                                ))}
                              </div>
                              <p className="text-neutral-600 leading-relaxed italic mt-1.5 font-sans">"{rev.comment}"</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ==================== FOOTER ==================== */}
      <footer className="bg-neutral-900 text-neutral-400 text-xs border-t border-neutral-800 py-12 mt-auto print:hidden select-none">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Dipanjan_works Logo" className="w-8 h-8 rounded-full object-cover" />
              <h3 className="font-serif text-white text-lg font-bold tracking-wider">Dipanjan_works</h3>
            </div>
            <p className="text-neutral-500 font-light leading-relaxed">
              Dermatologically validated cosmetics pairing bio-peptides, antioxidants, and cold-pressed floral essential nectars.
            </p>
          </div>
          <div>
            <h4 className="text-white font-serif font-semibold uppercase tracking-wider text-xs mb-3">Shop Departments</h4>
            <ul className="space-y-1.5">
              {categories.map(c => (
                <li key={c.id}>
                  <button onClick={() => setActiveCategory(c.slug)} className="hover:text-rose-400 transition-colors">{c.name}</button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white font-serif font-semibold uppercase tracking-wider text-xs mb-3">Luxe Assurances</h4>
            <ul className="space-y-1.5 text-neutral-500">
              <li>• Complimentary Returns</li>
              <li>• 100% Secure Checkout</li>
              <li>• Cruelty-Free Formulations</li>
              <li>• 15% Welcome Offer</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-serif font-semibold uppercase tracking-wider text-xs mb-3">Secure Operations</h4>
            <p className="text-neutral-500 font-light leading-relaxed mb-3">
              We leverage end-to-end token validation to protect customer details.
            </p>
            <div className="flex items-center gap-1.5 text-[10px] text-rose-400 font-bold uppercase">
              <ShieldCheck className="w-5 h-5" />
              <span>SSL Protected Invoicing</span>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 md:px-12 pt-8 border-t border-neutral-800 text-center text-neutral-500 flex flex-col md:flex-row justify-between items-center gap-2">
          <p>© 2026 Dipanjan_works. All Rights Reserved.</p>
          <p className="font-mono text-[10px]">EST. 2026 • PREMIUM SKINCARE & COSMETICS</p>
        </div>
      </footer>

      {/* ==================== GLOBAL SLIDING DRAWERS & POPUP OVERLAYS ==================== */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        onCheckout={() => {
          setIsCartOpen(false);
          if (token) {
            setIsCheckoutOpen(true);
          } else {
            setIsAuthOpen(true); // Open sign in first
          }
        }}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cart}
        user={user}
        wallet={wallet}
        settings={settings}
        token={token}
        onOrderPlaced={handleClearCart}
      />

      <ReferralModal
        isOpen={isReferralOpen}
        onClose={() => setIsReferralOpen(false)}
        user={user}
        settings={settings}
      />

      <OrdersModal
        isOpen={isOrdersOpen}
        onClose={() => setIsOrdersOpen(false)}
        token={token}
        user={user}
      />

      {user && user.role === 'customer' && (
        <button
          onClick={() => setIsReferralOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-rose-500 hover:bg-rose-600 text-white p-4 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 animate-pulse"
          style={{ boxShadow: '0 10px 25px -5px rgba(244, 63, 94, 0.4)' }}
        >
          <Gift className="w-6 h-6" />
        </button>
      )}

    </div>
  );
}
