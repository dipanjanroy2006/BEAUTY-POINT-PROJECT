import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight, ShieldCheck, Tag } from 'lucide-react';
import { CartItem } from '../types';
import React, { useState } from 'react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
}

export default function CartDrawer({ isOpen, onClose, cartItems, onUpdateQuantity, onRemoveItem, onCheckout }: CartDrawerProps) {
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0); // dynamic discount %
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((sum, item) => sum + (item.product.salePrice || item.product.price) * item.quantity, 0);
  const discountAmount = Number((subtotal * (promoDiscount / 100)).toFixed(2));
  const subtotalAfterDiscount = subtotal - discountAmount;
  const shippingCharge = subtotalAfterDiscount > 150 ? 0 : (subtotalAfterDiscount === 0 ? 0 : 15.00);
  const finalTotal = subtotalAfterDiscount + shippingCharge;
  const totalCoinsToEarn = cartItems.reduce((sum, item) => sum + (item.product.rewardCoins || 0) * item.quantity, 0);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError('');
    setPromoSuccess('');

    const code = promoCode.toUpperCase().trim();
    if (code === 'LUXEGIFT' && subtotal >= 150) {
      setPromoDiscount(15); // 15% off for orders over 150
      setPromoSuccess('Promo LUXEGIFT applied! 15% off your entire bag.');
    } else if (code === 'BEAUTY10') {
      setPromoDiscount(10); // 10% off
      setPromoSuccess('Promo BEAUTY10 applied! 10% off your entire bag.');
    } else if (code === 'LUXEGIFT' && subtotal < 150) {
      setPromoError('LUXEGIFT requires a minimum bag value of ₹150.');
    } else {
      setPromoError('Invalid promo code. Please try BEAUTY10 or LUXEGIFT.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs">
      {/* Dimmer backdrop listener */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-slide-left border-l border-neutral-100">
        {/* Header bar */}
        <div className="p-5 border-b border-neutral-100 flex justify-between items-center bg-neutral-50">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-neutral-950 text-white rounded-md">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <h2 className="font-serif text-lg font-semibold tracking-wide text-neutral-900">Your Shopping Bag</h2>
            <span className="bg-rose-100 text-rose-600 text-xs font-semibold px-2 py-0.5 rounded-full font-mono">
              {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic content scroll */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-72 text-center py-8">
              <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mb-4 text-neutral-400 border border-dashed border-neutral-300">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="font-serif text-lg font-medium text-neutral-800">Your Bag is Empty</h3>
              <p className="text-xs text-neutral-400 mt-1 max-w-[240px] leading-relaxed">
                Fill it with our handpicked luxurious cosmetics and start your radiant beauty ritual.
              </p>
              <button 
                onClick={onClose}
                className="mt-5 py-2.5 px-6 border border-neutral-900 text-neutral-900 rounded-lg hover:bg-neutral-950 hover:text-white transition-all text-xs font-medium"
              >
                Shop Cosmetics Now
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item, index) => {
                const itemPrice = item.product.salePrice || item.product.price;
                return (
                  <div key={index} className="flex gap-4 p-3 border border-neutral-100 rounded-xl bg-neutral-50/30 hover:shadow-xs transition-shadow">
                    <img 
                      src={item.product.image} 
                      alt={item.product.name} 
                      className="w-16 h-16 rounded-lg object-cover border border-neutral-200 bg-white"
                    />
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-1">
                          <h4 className="font-sans font-semibold text-xs text-neutral-800 truncate leading-tight pr-1">
                            {item.product.name}
                          </h4>
                          <button 
                            onClick={() => onRemoveItem(item.product.id)}
                            className="p-1 rounded-full text-neutral-400 hover:text-red-500 hover:bg-neutral-100 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[10px] text-neutral-400 mt-0.5">{item.product.details?.brand || 'Collection'}</p>
                      </div>

                      <div className="flex justify-between items-center mt-2">
                        {/* Quantity controls */}
                        <div className="flex items-center border border-neutral-200 rounded-md bg-white">
                          <button 
                            onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                            className="p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-50"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-medium font-mono text-neutral-800">{item.quantity}</span>
                          <button 
                            onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                            disabled={item.quantity >= item.product.stock}
                            className="p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-50 disabled:opacity-30"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        
                        {/* Price Display */}
                        <div className="text-right">
                          <p className="text-xs font-bold font-mono text-neutral-800">₹{(itemPrice * item.quantity).toFixed(2)}</p>
                          {item.product.salePrice && (
                            <p className="text-[9px] text-rose-500 font-medium font-mono line-through">₹{(item.product.price * item.quantity).toFixed(2)}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Cart Bottom Summary footer */}
        {cartItems.length > 0 && (
          <div className="p-5 border-t border-neutral-100 bg-neutral-50 space-y-4">
            {totalCoinsToEarn > 0 && (
              <div className="flex items-center justify-between text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100/50 p-2.5 rounded-xl shadow-3xs">
                <div className="flex items-center gap-1.5">
                  <span className="animate-bounce">🎁</span>
                  <span>Coins to be earned on purchase:</span>
                </div>
                <span className="font-mono text-xs font-bold bg-white px-2 py-0.5 border border-rose-200 rounded-md shadow-3xs">
                  {totalCoinsToEarn} Coins
                </span>
              </div>
            )}
            
            {/* Promo Code input */}
            <form onSubmit={handleApplyPromo} className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute w-3.5 h-3.5 text-neutral-400 left-3 top-3" />
                <input
                  type="text"
                  placeholder="PROMO CODE (BEAUTY10)"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="w-full py-2.5 pl-9 pr-3 text-[11px] font-mono bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-500"
                />
              </div>
              <button
                type="submit"
                className="py-2.5 px-4 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 text-[11px] font-medium tracking-wide uppercase transition-colors"
              >
                Apply
              </button>
            </form>

            {promoError && <p className="text-[10px] text-red-600 font-medium pl-1">{promoError}</p>}
            {promoSuccess && <p className="text-[10px] text-emerald-600 font-medium pl-1">{promoSuccess}</p>}

            {/* Calculations block */}
            <div className="space-y-2 text-xs border-b border-neutral-200 pb-3">
              <div className="flex justify-between text-neutral-500">
                <span>Subtotal:</span>
                <span className="font-mono">₹{subtotal.toFixed(2)}</span>
              </div>
              {promoDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount ({promoDiscount}%):</span>
                  <span className="font-mono">-₹{discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between text-neutral-500">
                <span>Shipping:</span>
                <span className="font-mono">
                  {shippingCharge === 0 ? <span className="text-rose-500 font-semibold uppercase">FREE</span> : `₹${shippingCharge.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-sm font-semibold text-neutral-900 border-t border-neutral-200 pt-2.5 mt-1.5">
                <span>Estimated Total:</span>
                <span className="font-mono">₹{finalTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Guarantee / Safe badge */}
            <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Complimentary Returns • 100% Authentic Guarantee</span>
            </div>

            {/* Checkout Action Button */}
            <button
              onClick={onCheckout}
              className="w-full py-3.5 px-4 bg-neutral-900 text-white font-medium text-xs rounded-xl hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 shadow-md active:scale-[0.99]"
            >
              <span>PROCEED TO CHECKOUT</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
