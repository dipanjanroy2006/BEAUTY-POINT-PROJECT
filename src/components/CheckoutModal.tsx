import React, { useState } from 'react';
import { X, MapPin, Phone, CreditCard, Sparkles, CheckCircle2, ShoppingBag, FileText, Printer } from 'lucide-react';
import { CartItem, Order, User } from '../types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  user: User | null;
  wallet: any;
  settings: any;
  token: string | null;
  onOrderPlaced: () => void;
}

export default function CheckoutModal({ isOpen, onClose, cartItems, user, wallet, settings, token, onOrderPlaced }: CheckoutModalProps) {
  const [shippingAddress, setShippingAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [coinsToRedeem, setCoinsToRedeem] = useState<number>(0);
  const [coinsRedeemInput, setCoinsRedeemInput] = useState<string>('');

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((sum, item) => sum + (item.product.salePrice || item.product.price) * item.quantity, 0);
  const tax = Number((subtotal * 0.08).toFixed(2)); // 8% sales tax
  const shippingCharge = subtotal > 150 ? 0 : 15.00; // Free shipping above $150
  
  const rewardEnabled = settings?.rewardEnabled !== false;
  const rate = settings?.rewardCoinConversionRate ?? 1;
  const maxPercent = settings?.rewardMaxRedemptionPercent ?? 50;

  // Maximum coins allowed based on settings and subtotal
  const maxAllowedDiscount = (subtotal * maxPercent) / 100;
  const maxCoinsAllowed = Math.floor(maxAllowedDiscount / rate);
  const maxRedemptableCoins = Math.min(wallet?.balancePoints || 0, maxCoinsAllowed);

  const coinsDiscount = coinsToRedeem * rate;
  const finalTotal = Number((subtotal + tax + shippingCharge - coinsDiscount).toFixed(2));
  
  // Estimated coins to earn
  const estimatedCoinsToEarn = cartItems.reduce((sum, item) => sum + (item.product.rewardCoins || 0) * item.quantity, 0);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('You must be logged in to place an order.');
      return;
    }

    setLoading(true);
    setError('');

    // Transform cart items to order items structure
    const orderItems = cartItems.map(item => ({
      productId: item.product.id,
      name: item.product.name,
      price: item.product.salePrice || item.product.price,
      quantity: item.quantity,
      image: item.product.image
    }));

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: orderItems,
          shippingAddress,
          phone,
          paymentMethod,
          coinsUsed: coinsToRedeem
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to place order.');
      }

      setPlacedOrder(data.order);
      onOrderPlaced(); // Clear cart in App state
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden my-8">
        
        {/* Top Decorative Bar */}
        <div className="h-2 bg-gradient-to-r from-amber-200 via-rose-300 to-amber-200" />

        {/* Close Header */}
        <button 
          onClick={onClose}
          className="absolute p-2 transition-colors rounded-full top-4 right-4 hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 print:hidden"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ORDER SUCCESS STATE (INVOICE SCREEN) */}
        {placedOrder ? (
          <div className="p-8 max-h-[85vh] overflow-y-auto">
            {/* Header Success Greeting */}
            <div className="flex flex-col items-center text-center mb-8 print:hidden">
              <div className="flex items-center justify-center w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full mb-3">
                <CheckCircle2 className="w-10 h-10 animate-bounce" />
              </div>
              <h2 className="font-serif text-3xl font-semibold text-neutral-900 tracking-wide">
                Thank You For Your Order!
              </h2>
              <p className="text-neutral-500 text-sm mt-1.5 max-w-md">
                Your luxury package is being prepared. We have sent a confirmation email with shipment updates to <span className="font-semibold text-neutral-700">{user?.email}</span>.
              </p>
            </div>

            {/* INVOICE CARD */}
            <div className="border border-neutral-200 rounded-xl p-6 bg-neutral-50/50 relative shadow-xs print:border-none print:p-0">
              
              {/* Invoice Watermark / Stamp */}
              <div className="absolute right-6 top-6 border-2 border-emerald-500/20 text-emerald-600/30 text-xs font-bold tracking-widest px-3 py-1 rounded-sm rotate-12 select-none uppercase">
                PAID VIA {placedOrder.paymentMethod}
              </div>

              {/* Invoice Brand Header */}
              <div className="flex justify-between items-start border-b border-neutral-200 pb-5 mb-5">
                <div>
                  <h1 className="font-serif text-2xl font-bold tracking-wider text-neutral-900">BEAUTY POINT</h1>
                  <p className="text-[11px] text-neutral-400 font-mono mt-0.5">EST. 2026 • PREMIUM COSMETICS</p>
                </div>
                <div className="text-right">
                  <h3 className="font-mono text-sm font-bold text-neutral-800 uppercase flex items-center gap-1 justify-end">
                    <FileText className="w-4 h-4 text-rose-500" /> Invoice
                  </h3>
                  <p className="text-xs text-neutral-500 font-mono mt-1">Invoice ID: #{placedOrder.id}</p>
                  <p className="text-xs text-neutral-400 font-mono">Date: {new Date(placedOrder.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Billing Info Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6 text-xs">
                <div>
                  <p className="font-semibold text-neutral-500 uppercase tracking-wider text-[10px] mb-1">Customer Details</p>
                  <p className="font-medium text-neutral-900">{placedOrder.userName}</p>
                  <p className="text-neutral-500 font-mono">{placedOrder.userEmail}</p>
                  <p className="text-neutral-500 mt-0.5 font-mono">Phone: {placedOrder.phone}</p>
                </div>
                <div>
                  <p className="font-semibold text-neutral-500 uppercase tracking-wider text-[10px] mb-1">Delivery Address</p>
                  <p className="text-neutral-700 leading-relaxed font-sans">{placedOrder.shippingAddress}</p>
                  <p className="text-neutral-500 mt-1">Payment Method: <span className="font-medium text-neutral-800">{placedOrder.paymentMethod}</span></p>
                </div>
              </div>

              {/* Invoice Items Table */}
              <div className="border-t border-b border-neutral-200 py-3 mb-5">
                <p className="font-semibold text-neutral-500 uppercase tracking-wider text-[10px] mb-2">Ordered Items</p>
                <div className="space-y-3">
                  {placedOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-3">
                        <img src={item.image} alt={item.name} className="w-8 h-8 rounded-md object-cover border border-neutral-200" />
                        <div>
                          <p className="font-medium text-neutral-800">{item.name}</p>
                          <p className="text-neutral-400 text-[10px] font-mono">Qty: {item.quantity} × ₹{item.price.toFixed(2)}</p>
                        </div>
                      </div>
                      <p className="font-medium font-mono text-neutral-800">₹{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subtotal Summary Lines */}
              {(() => {
                const invoiceSubtotal = placedOrder.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
                return (
                  <div className="flex flex-col items-end gap-1.5 text-xs font-sans">
                    <div className="flex justify-between w-64 text-neutral-500">
                      <span>Subtotal:</span>
                      <span className="font-mono">₹{invoiceSubtotal.toFixed(2)}</span>
                    </div>
                    {placedOrder.coinsUsed !== undefined && placedOrder.coinsUsed > 0 && (
                      <div className="flex justify-between w-64 text-emerald-600 font-medium">
                        <span>Coins Redeemed Discount:</span>
                        <span className="font-mono">-₹{(placedOrder.coinsUsed * rate).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between w-64 text-neutral-500">
                      <span>Sales Tax (8%):</span>
                      <span className="font-mono">₹{tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between w-64 text-neutral-500">
                      <span>Shipping:</span>
                      <span className="font-mono">{shippingCharge === 0 ? 'FREE' : `₹${shippingCharge.toFixed(2)}`}</span>
                    </div>
                    <div className="flex justify-between w-64 text-sm font-semibold text-neutral-900 border-t border-neutral-200 pt-2 mt-1">
                      <span>Grand Total:</span>
                      <span className="font-mono">₹{placedOrder.totalAmount.toFixed(2)}</span>
                    </div>
                    {placedOrder.coinsEarned !== undefined && placedOrder.coinsEarned > 0 && (
                      <div className="mt-2.5 text-[10px] font-semibold text-rose-600 bg-rose-50 border border-rose-100/50 py-1.5 px-2.5 rounded-lg flex items-center gap-1 w-fit">
                        <span>🎉</span>
                        <span>Earned {placedOrder.coinsEarned} Coins on this purchase! (Credited on Delivery)</span>
                      </div>
                    )}
                  </div>
                );
              })()}

            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mt-8 print:hidden">
              <button
                onClick={handlePrint}
                className="flex-1 py-3 px-4 border border-neutral-300 rounded-xl hover:bg-neutral-50 text-neutral-700 font-medium text-sm transition-all flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print Invoice</span>
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-neutral-900 text-white font-medium text-sm rounded-xl hover:bg-neutral-800 transition-all text-center flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Continue Shopping</span>
              </button>
            </div>
          </div>
        ) : (
          /* REGULAR CHECKOUT FORM STATE */
          <div className="p-8">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-1.5 bg-rose-50 rounded-lg text-rose-500">
                <Sparkles className="w-5 h-5" />
              </div>
              <h2 className="font-serif text-2xl font-semibold tracking-wide text-neutral-900">
                Luxe Shipment Checkout
              </h2>
            </div>

            {error && (
              <div className="p-3 mb-5 text-xs font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
              {/* Left Column: Form Details */}
              <form onSubmit={handleCheckout} className="space-y-4 md:col-span-3">
                
                <div>
                  <label className="block mb-1 text-xs font-medium tracking-wide uppercase text-neutral-600">Recipient Name</label>
                  <input
                    type="text"
                    disabled
                    value={user?.username || ''}
                    className="w-full py-3 px-4 text-sm bg-neutral-100 border border-neutral-200 rounded-xl text-neutral-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-xs font-medium tracking-wide uppercase text-neutral-600">Contact Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute w-4 h-4 text-neutral-400 left-3 top-3.5" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full py-3 pl-10 pr-4 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400/20 focus:border-rose-400 transition-all text-neutral-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-1 text-xs font-medium tracking-wide uppercase text-neutral-600">Full Shipping Address</label>
                  <div className="relative">
                    <MapPin className="absolute w-4 h-4 text-neutral-400 left-3 top-3.5" />
                    <textarea
                      required
                      rows={3}
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      placeholder="123 Luxury Boulevard, Apartment 4B, Beverly Hills, CA 90210"
                      className="w-full py-3 pl-10 pr-4 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400/20 focus:border-rose-400 transition-all text-neutral-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-2 text-xs font-medium tracking-wide uppercase text-neutral-600">Select Premium Payment Method</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['Credit Card', 'PayPal'].map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`py-3 px-4 border text-xs font-medium rounded-xl flex items-center justify-center gap-2 transition-all ${
                          paymentMethod === method
                            ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                            : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600'
                        }`}
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>{method}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Place Order Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 bg-neutral-900 text-white font-medium text-sm rounded-xl hover:bg-neutral-800 transition-all shadow-md active:scale-[0.99] disabled:opacity-50 flex justify-center items-center gap-2 mt-6"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white rounded-full border-t-transparent animate-spin" />
                  ) : (
                    <span>Authorized Order Checkout • ₹{finalTotal.toFixed(2)}</span>
                  )}
                </button>
              </form>

              {/* Right Column: Order Review Panel */}
              <div className="md:col-span-2 bg-neutral-50 border border-neutral-200 rounded-xl p-5 text-neutral-800 h-fit">
                <h3 className="font-serif text-lg font-semibold border-b border-neutral-200 pb-3 mb-3">
                  Bag Summary
                </h3>
                
                {/* Scrolling List of Items */}
                <div className="space-y-3 max-h-48 overflow-y-auto pr-1 mb-4">
                  {cartItems.map((item, index) => (
                    <div key={index} className="flex gap-3 text-xs">
                      <img src={item.product.image} alt={item.product.name} className="w-10 h-10 rounded-md object-cover border border-neutral-200 bg-white" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-neutral-800 truncate">{item.product.name}</p>
                        <p className="text-neutral-400 font-mono">{item.quantity} × ₹{(item.product.salePrice || item.product.price).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Scroll List items */}
                
                {rewardEnabled && (
                  <div className="border-t border-neutral-200 pt-3 mb-4 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-neutral-700 flex items-center gap-1">
                        🎁 Redeem Loyalty Coins
                      </span>
                      <span className="text-[10px] text-neutral-400 font-medium font-mono">
                        Available: {wallet?.balancePoints || 0} Coins
                      </span>
                    </div>

                    {wallet && wallet.balancePoints > 0 ? (
                      <div className="space-y-1.5">
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="0"
                            max={maxRedemptableCoins}
                            value={coinsRedeemInput}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCoinsRedeemInput(val);
                              const num = parseInt(val, 10);
                              if (!isNaN(num) && num >= 0) {
                                if (num > maxRedemptableCoins) {
                                  setCoinsToRedeem(maxRedemptableCoins);
                                } else {
                                  setCoinsToRedeem(num);
                                }
                              } else {
                                setCoinsToRedeem(0);
                              }
                            }}
                            placeholder={`Max ${maxRedemptableCoins} coins`}
                            className="flex-1 py-1.5 px-3 text-xs bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-400"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setCoinsToRedeem(maxRedemptableCoins);
                              setCoinsRedeemInput(String(maxRedemptableCoins));
                            }}
                            className="py-1.5 px-3 bg-neutral-900 text-white text-[10px] font-bold rounded-lg hover:bg-neutral-800 transition-colors uppercase"
                          >
                            Max
                          </button>
                        </div>
                        <p className="text-[9px] text-neutral-400">
                          * 1 Coin = ₹{rate} Discount. Max cover: {maxPercent}% of total.
                        </p>
                      </div>
                    ) : (
                      <p className="text-[10px] text-neutral-400 italic">No coins available in your wallet.</p>
                    )}

                    {estimatedCoinsToEarn > 0 && (
                      <div className="text-[10px] font-semibold text-rose-600 bg-rose-50 border border-rose-100/50 p-2 rounded-lg flex items-center justify-between">
                        <span>🎁 Estimated coins to earn:</span>
                        <span className="font-mono">{estimatedCoinsToEarn} Coins</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Subtotal, tax, shipping breakdown */}
                <div className="space-y-2 text-xs border-t border-neutral-200 pt-3">
                  <div className="flex justify-between text-neutral-500">
                    <span>Subtotal:</span>
                    <span className="font-mono">₹{subtotal.toFixed(2)}</span>
                  </div>
                  {coinsToRedeem > 0 && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>Coins Discount:</span>
                      <span className="font-mono">-₹{coinsDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-neutral-500">
                    <span>Sales Tax (8%):</span>
                    <span className="font-mono">₹{tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-500">
                    <span>Shipping Charge:</span>
                    <span className="font-mono">
                      {shippingCharge === 0 ? <span className="text-rose-500 font-semibold uppercase">FREE</span> : `₹${shippingCharge.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold border-t border-neutral-200 pt-2.5 mt-2 text-neutral-900">
                    <span>Total Amount:</span>
                    <span className="font-mono">₹{finalTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Free shipping hint */}
                {shippingCharge > 0 && (
                  <p className="mt-4 text-[10px] text-rose-500 text-center font-medium bg-rose-50/50 p-2 rounded-lg border border-rose-100/30">
                    ✨ Add ₹{(150 - subtotal).toFixed(2)} more to unlock FREE luxury shipping!
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
