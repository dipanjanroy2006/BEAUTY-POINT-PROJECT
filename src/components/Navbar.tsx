import React, { useState } from 'react';
import { ShoppingBag, Search, User, Menu, X, Sparkles, LogOut, Settings2, Sliders, Gift, Award } from 'lucide-react';
import { Category, User as UserType, RewardWallet } from '../types';

interface NavbarProps {
  categories: Category[];
  activeCategory: string | null;
  onSelectCategory: (slug: string | null) => void;
  cartCount: number;
  onOpenCart: () => void;
  user: UserType | null;
  wallet: RewardWallet | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onSearch: (text: string) => void;
  onToggleAdmin: () => void;
  isAdminView: boolean;
  announcementText?: string;
  onOpenReferral: () => void;
  onOpenOrders: () => void;
}

export default function Navbar({
  categories,
  activeCategory,
  onSelectCategory,
  cartCount,
  onOpenCart,
  user,
  wallet,
  onOpenAuth,
  onLogout,
  onSearch,
  onToggleAdmin,
  isAdminView,
  announcementText,
  onOpenReferral,
  onOpenOrders
}: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchText(val);
    onSearch(val);
  };

  const clearSearch = () => {
    setSearchText('');
    onSearch('');
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-neutral-100 shadow-xs">
      
      {/* 1. TOP ANNOUNCEMENT BAR */}
      <div className="bg-neutral-900 text-white py-2 px-4 text-center text-[10px] md:text-xs font-medium tracking-widest uppercase flex items-center justify-center gap-1.5 select-none overflow-hidden">
        <Sparkles className="w-3 h-3 text-amber-300 shrink-0" />
        <span className="truncate">{announcementText || "✨ COMPLIMENTARY LUXE GIFT BOX ON ORDERS OVER ₹150 • CODE: LUXEGIFT ✨"}</span>
      </div>

      {/* 2. MAIN NAV BAR ROW */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-4 flex items-center justify-between gap-4">
        
        {/* Left: Mobile hamburger menu toggle */}
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Brand Logo - Centered or Left */}
        <div className="flex flex-col items-center md:items-start cursor-pointer" onClick={() => onSelectCategory(null)}>
          <h1 className="font-serif text-xl sm:text-2xl font-bold tracking-widest text-neutral-900 select-none">
            BEAUTY POINT
          </h1>
          <span className="text-[9px] text-neutral-400 font-mono tracking-widest uppercase -mt-0.5 hidden sm:inline-block">
            EST. 2026 • LUXURY COSMETICS
          </span>
        </div>

        {/* Center-Left Search Input */}
        <div className="relative max-w-xs sm:max-w-md w-full hidden md:block">
          <Search className="absolute w-4 h-4 text-neutral-400 left-3.5 top-3.5" />
          <input
            type="text"
            value={searchText}
            onChange={handleSearchChange}
            placeholder="Search luxury skincare, lip tints, fragrances..."
            className="w-full py-3 pl-10 pr-10 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400/20 focus:border-rose-400 transition-all text-neutral-800"
          />
          {searchText && (
            <button 
              onClick={clearSearch}
              className="absolute p-1 top-2.5 right-3 text-neutral-400 hover:text-neutral-600 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right Actions Bar */}
        <div className="flex items-center gap-1.5 md:gap-3">
          
          {/* Admin panel toggle (If user is Admin) */}
          {user && user.role === 'admin' && (
            <button
              onClick={onToggleAdmin}
              className={`py-2 px-3 rounded-xl text-xs font-semibold tracking-wide border flex items-center gap-1.5 transition-all ${
                isAdminView 
                  ? 'bg-rose-500 border-rose-500 text-white shadow-md' 
                  : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isAdminView ? 'Storefront View' : 'Admin Dashboard'}</span>
            </button>
          )}

          {/* User Sign-In / Account Dropdown */}
          <div className="relative">
            {user ? (
              <div>
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center gap-1 text-xs font-semibold text-neutral-700 bg-neutral-50 hover:bg-neutral-100 py-2.5 px-3 rounded-xl border border-neutral-200 transition-colors focus:outline-none"
                >
                  <User className="w-4 h-4 text-rose-500" />
                  <span className="max-w-[72px] truncate hidden sm:inline">{user.username}</span>
                </button>

                {showProfileDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-neutral-150 rounded-xl shadow-xl z-50 py-1.5 animate-scale-up font-sans text-xs">
                    <div className="px-4 py-2 border-b border-neutral-100 bg-neutral-55">
                      <p className="font-semibold text-neutral-800 truncate">{user.username}</p>
                      <p className="text-[10px] text-neutral-400 truncate">{user.email || user.phone}</p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="font-bold font-mono text-neutral-800">
                          {wallet?.balancePoints || 0} Coins
                        </span>
                      </div>
                      <span className="inline-block mt-2 px-2 py-0.5 text-[9px] font-bold text-rose-600 bg-rose-50 rounded-sm uppercase tracking-wide">
                        {user.role}
                      </span>
                    </div>

                    {user.role === 'admin' && (
                      <button
                        onClick={() => {
                          onToggleAdmin();
                          setShowProfileDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-neutral-50 text-neutral-700 flex items-center gap-2"
                      >
                        <Settings2 className="w-4 h-4 text-neutral-500" />
                        <span>Manage Store</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        onOpenOrders();
                        setShowProfileDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-neutral-50 text-neutral-700 flex items-center gap-2 font-medium"
                    >
                      <ShoppingBag className="w-4 h-4 text-neutral-500" />
                      <span>Order History & Track</span>
                    </button>

                    <button
                      onClick={() => {
                        onOpenReferral();
                        setShowProfileDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-rose-50 text-rose-600 flex items-center gap-2 font-medium"
                    >
                      <Gift className="w-4 h-4 text-rose-500 animate-pulse" />
                      <span>Refer & Earn 🎁</span>
                    </button>

                    <button
                      onClick={() => {
                        onLogout();
                        setShowProfileDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-red-50 text-red-600 flex items-center gap-2 font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="py-2.5 px-4 bg-neutral-900 text-white text-xs font-semibold rounded-xl hover:bg-rose-500 transition-all flex items-center gap-1.5 shadow-sm active:scale-[0.98]"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>

          {/* Shopping Bag Drawer Trigger */}
          {!isAdminView && (
            <button
              onClick={onOpenCart}
              className="relative p-2.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 transition-colors focus:outline-none"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-mono text-[9px] font-bold h-5 w-5 rounded-full flex items-center justify-center border border-white shadow-xs">
                  {cartCount}
                </span>
              )}
            </button>
          )}

        </div>
      </div>

      {/* 3. CATEGORIES HORIZONTAL NAVIGATION (Visible on Desktop, hidden on Admin View) */}
      {!isAdminView && (
        <nav className="border-t border-neutral-100 hidden md:block bg-neutral-50/50">
          <div className="max-w-7xl mx-auto px-8 py-3.5 flex items-center justify-center gap-10 text-xs font-medium uppercase tracking-widest text-neutral-600">
            <button
              onClick={() => onSelectCategory(null)}
              className={`hover:text-rose-500 transition-colors focus:outline-none ${
                activeCategory === null ? 'text-rose-500 font-bold border-b-2 border-rose-500 pb-0.5' : ''
              }`}
            >
              All Products
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.slug)}
                className={`hover:text-rose-500 transition-colors focus:outline-none ${
                  activeCategory === cat.slug ? 'text-rose-500 font-bold border-b-2 border-rose-500 pb-0.5' : ''
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </nav>
      )}

      {/* 4. MOBILE DRAWER NAVIGATION */}
      {isMobileMenuOpen && !isAdminView && (
        <div className="fixed inset-x-0 top-[110px] bg-white border-b border-neutral-200 shadow-xl z-50 p-5 md:hidden animate-slide-down">
          {/* Mobile Search input */}
          <div className="relative mb-4">
            <Search className="absolute w-4 h-4 text-neutral-400 left-3 top-3.5" />
            <input
              type="text"
              value={searchText}
              onChange={handleSearchChange}
              placeholder="Search lipsticks, skin serums..."
              className="w-full py-3 pl-10 pr-10 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-400"
            />
          </div>

          <div className="space-y-3 font-medium uppercase tracking-wider text-xs text-neutral-700 flex flex-col">
            <p className="text-[10px] font-bold text-neutral-400 border-b pb-1">Categories</p>
            <button
              onClick={() => {
                onSelectCategory(null);
                setIsMobileMenuOpen(false);
              }}
              className={`text-left py-1.5 hover:text-rose-500 ${activeCategory === null ? 'text-rose-500 font-bold' : ''}`}
            >
              All Products
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  onSelectCategory(cat.slug);
                  setIsMobileMenuOpen(false);
                }}
                className={`text-left py-1.5 hover:text-rose-500 ${activeCategory === cat.slug ? 'text-rose-500 font-bold' : ''}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

    </header>
  );
}
