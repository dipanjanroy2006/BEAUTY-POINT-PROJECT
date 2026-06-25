import React, { useState, useEffect } from 'react';
import { 
  Star, ShoppingBag, ShieldCheck, Heart, Sparkles, 
  Trash2, Plus, Minus, ArrowRight, MessageSquare, AlertCircle, X, ChevronRight, CheckCircle2, Gift
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
      sessionStorage.setItem('referralCode', refCode);
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
