import React, { useState, useEffect } from 'react';
import { 
  X, ShoppingBag, MapPin, Phone, CreditCard, Sparkles, 
  Check, CheckCircle2, ChevronDown, ChevronUp, Calendar, Coins, Award
} from 'lucide-react';
import { Order, User } from '../types';

interface OrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  user: User | null;
}

export default function OrdersModal({ isOpen, onClose, token, user }: OrdersModalProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && token) {
      fetchUserOrders();
    }
  }, [isOpen, token]);

  const fetchUserOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        // Sort newest first
        const sorted = (data || []).sort(
          (a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setOrders(sorted);
      } else {
        setError(data.error || 'Failed to retrieve your order history.');
      }
    } catch (err: any) {
      setError('Failed to fetch orders: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Calculate Lifetime customer stats
  const completedOrders = orders.filter(o => o.orderStatus === 'completed');
  const lifetimeSpend = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalOrdersCount = orders.length;
  const activeShipmentsCount = orders.filter(o => o.orderStatus === 'pending' || o.orderStatus === 'shipped').length;

  const toggleExpandOrder = (orderId: string) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
    } else {
      setExpandedOrderId(orderId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto font-sans">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        
        {/* Top Decorative Bar */}
        <div className="h-2 bg-gradient-to-r from-amber-200 via-rose-300 to-amber-200 shrink-0" />

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute p-2 transition-colors rounded-full top-4 right-4 hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Container */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Header */}
          <div className="flex items-center gap-2 border-b border-neutral-100 pb-4">
            <div className="p-1.5 bg-rose-50 rounded-lg text-rose-500">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-2xl font-bold tracking-wide text-neutral-900">
                Order Tracking & History
              </h2>
              <p className="text-neutral-500 text-xs mt-0.5">
                View your lifetime order logs and track packaging/delivery status.
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 text-xs font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg">
              {error}
            </div>
          )}

          {/* User Lifetime stats row */}
          {!loading && !error && orders.length > 0 && (
            <div className="grid grid-cols-3 gap-3 bg-neutral-50 border border-neutral-200 rounded-2xl p-4 shadow-xs">
              <div className="text-center sm:text-left">
                <p className="text-[9px] uppercase tracking-wider font-bold text-neutral-450">Lifetime Spend</p>
                <p className="text-sm sm:text-base font-extrabold text-neutral-900 mt-1">₹{lifetimeSpend.toFixed(2)}</p>
                <p className="text-[8px] text-neutral-400 mt-0.5 font-sans">Delivered checkouts</p>
              </div>
              <div className="text-center sm:text-left border-l border-neutral-200 pl-3">
                <p className="text-[9px] uppercase tracking-wider font-bold text-neutral-455">Total Orders</p>
                <p className="text-sm sm:text-base font-extrabold text-neutral-900 mt-1">{totalOrdersCount}</p>
                <p className="text-[8px] text-neutral-400 mt-0.5 font-sans">Lifetime checkouts</p>
              </div>
              <div className="text-center sm:text-left border-l border-neutral-200 pl-3">
                <p className="text-[9px] uppercase tracking-wider font-bold text-neutral-456">Active Shipments</p>
                <p className="text-sm sm:text-base font-extrabold text-rose-500 mt-1">{activeShipmentsCount}</p>
                <p className="text-[8px] text-neutral-450 mt-0.5 font-sans">Preparing or en route</p>
              </div>
            </div>
          )}

          {/* Loading view */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-8 h-8 border-2 border-neutral-900 rounded-full border-t-transparent animate-spin mb-3" />
              <p className="text-xs text-neutral-500 font-medium font-mono">Retrieving your order portfolio...</p>
            </div>
          ) : orders.length === 0 ? (
            /* Empty state */
            <div className="text-center py-16 bg-neutral-50 border border-neutral-100 rounded-2xl p-8 space-y-4">
              <div className="w-12 h-12 bg-neutral-100 text-neutral-400 rounded-full flex items-center justify-center mx-auto">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif text-sm font-semibold text-neutral-800 uppercase tracking-wide">No Orders Found</h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed">
                  You have not placed any orders yet. Go back to our store homepage and add some luxury cosmetics to your cart!
                </p>
              </div>
            </div>
          ) : (
            /* Order log cards list */
            <div className="space-y-4">
              {orders.map((order) => {
                const isExpanded = expandedOrderId === order.id;
                const dateStr = new Date(order.createdAt).toLocaleDateString();
                const itemsCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
                
                // Stepper variables
                const isPending = order.orderStatus === 'pending';
                const isShipped = order.orderStatus === 'shipped';
                const isCompleted = order.orderStatus === 'completed';
                const isCancelled = order.orderStatus === 'cancelled';

                // Stepper step completion states
                const step1Active = !isCancelled; // Placed is always complete if not cancelled
                const step2Active = isShipped || isCompleted; // Shipped is complete if shipped or completed
                const step3Active = isCompleted; // Completed is complete only if completed

                return (
                  <div 
                    key={order.id} 
                    className="border border-neutral-200 rounded-2xl overflow-hidden bg-white shadow-xs transition-all hover:border-neutral-300"
                  >
                    {/* Header Summary Row */}
                    <div 
                      onClick={() => toggleExpandOrder(order.id)}
                      className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 cursor-pointer select-none bg-neutral-50/50 hover:bg-neutral-50 transition-colors"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-mono text-xs font-bold text-neutral-900">#{order.id}</span>
                        <span className="text-[10px] text-neutral-400 font-mono flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-neutral-400" /> {dateStr}
                        </span>
                        <span className="text-[11px] text-neutral-500 font-medium font-sans">
                          {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="flex items-center gap-2">
                          {/* Payment status badge */}
                          <span className={`px-1.5 py-0.5 rounded-sm text-[8px] uppercase tracking-wider font-bold ${
                            order.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>
                            {order.paymentStatus}
                          </span>
                          
                          {/* Order fulfillment status badge */}
                          <span className={`px-1.5 py-0.5 rounded-sm text-[8px] uppercase tracking-wider font-bold ${
                            isCompleted ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 
                            isShipped ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                            isCancelled ? 'bg-rose-50 text-rose-700 border border-rose-100' : 
                            'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>
                            {order.orderStatus}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-neutral-900">₹{order.totalAmount.toFixed(2)}</span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-neutral-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-neutral-400" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Stepper Tracking Visual Block */}
                    <div className="px-4 py-5 border-t border-neutral-100 bg-white">
                      {isCancelled ? (
                        /* Cancelled state notice */
                        <div className="flex items-center gap-2 text-rose-600 bg-rose-50/50 border border-rose-100/50 py-2.5 px-4 rounded-xl text-xs font-semibold">
                          <span>❌</span>
                          <span>Order was Cancelled & Refunded. Any redeemed points have been returned to your wallet.</span>
                        </div>
                      ) : (
                        /* Fulfillment visual stepper */
                        <div className="max-w-md mx-auto relative mt-2 mb-2">
                          {/* Progress Line */}
                          <div className="absolute top-3.5 left-8 right-8 h-0.5 bg-neutral-100 -z-10" />
                          <div 
                            className={`absolute top-3.5 left-8 h-0.5 bg-neutral-900 transition-all duration-500 -z-10`}
                            style={{ 
                              width: isCompleted ? '100%' : isShipped ? '50%' : '0%' 
                            }}
                          />
                          
                          {/* Stepper Steps grid */}
                          <div className="grid grid-cols-3 text-center">
                            
                            {/* Step 1: Placed */}
                            <div className="flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                                step1Active ? 'bg-neutral-900 text-white shadow-md' : 'bg-neutral-150 text-neutral-400'
                              }`}>
                                {step2Active ? <Check className="w-4 h-4" /> : '1'}
                              </div>
                              <span className="text-[10px] font-bold text-neutral-800 mt-2 uppercase tracking-wider">Order Placed</span>
                              <span className="text-[8px] text-neutral-400 mt-0.5 font-sans">Payment Approved</span>
                            </div>

                            {/* Step 2: Shipped */}
                            <div className="flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                                step2Active ? 'bg-neutral-900 text-white shadow-md' : 'bg-neutral-150 text-neutral-400'
                              }`}>
                                {step3Active ? <Check className="w-4 h-4" /> : '2'}
                              </div>
                              <span className="text-[10px] font-bold text-neutral-800 mt-2 uppercase tracking-wider">Package Shipped</span>
                              <span className="text-[8px] text-neutral-400 mt-0.5 font-sans">In Transit</span>
                            </div>

                            {/* Step 3: Delivered */}
                            <div className="flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                                step3Active ? 'bg-emerald-500 text-white shadow-md' : 'bg-neutral-150 text-neutral-400'
                              }`}>
                                {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : '3'}
                              </div>
                              <span className="text-[10px] font-bold text-neutral-800 mt-2 uppercase tracking-wider">Delivered</span>
                              <span className="text-[8px] text-neutral-400 mt-0.5 font-sans">Fulfillment Done</span>
                            </div>

                          </div>
                        </div>
                      )}
                    </div>

                    {/* Detailed Order Expansion Card */}
                    {isExpanded && (
                      <div className="p-4 border-t border-neutral-155 bg-neutral-50/50 space-y-4 text-xs">
                        
                        {/* Summary Items list */}
                        <div className="space-y-3">
                          <p className="font-semibold text-neutral-500 uppercase tracking-wider text-[9px]">Purchased Items</p>
                          <div className="space-y-2 bg-white border border-neutral-200 rounded-xl p-3.5">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center text-xs">
                                <div className="flex items-center gap-3">
                                  <img 
                                    src={item.image} 
                                    alt={item.name} 
                                    className="w-10 h-10 rounded-md object-cover border border-neutral-200 bg-neutral-50"
                                  />
                                  <div>
                                    <p className="font-semibold text-neutral-850">{item.name}</p>
                                    <p className="text-neutral-455 text-[10px] font-mono">
                                      {item.quantity} × ₹{item.price.toFixed(2)}
                                    </p>
                                  </div>
                                </div>
                                <p className="font-bold font-mono text-neutral-800">
                                  ₹{(item.price * item.quantity).toFixed(2)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Invoice & Shipping details split grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          
                          {/* Shipping address info */}
                          <div className="bg-white border border-neutral-200 rounded-xl p-3.5 space-y-1">
                            <p className="font-bold text-neutral-500 uppercase tracking-wider text-[9px] mb-1">Shipping Details</p>
                            <p className="font-semibold text-neutral-850 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-neutral-400" /> {order.shippingAddress}
                            </p>
                            <p className="text-neutral-500 font-mono flex items-center gap-1 mt-1">
                              <Phone className="w-3.5 h-3.5 text-neutral-400" /> {order.phone}
                            </p>
                          </div>

                          {/* Order invoice totals breakdown card */}
                          <div className="bg-white border border-neutral-200 rounded-xl p-3.5 space-y-2">
                            <p className="font-bold text-neutral-500 uppercase tracking-wider text-[9px] mb-1">Invoice Statement</p>
                            
                            {(() => {
                              const orderSubtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
                              const orderTax = Number((orderSubtotal * 0.08).toFixed(2));
                              const orderShipping = orderSubtotal > 150 ? 0 : 15.00;
                              return (
                                <div className="space-y-1.5">
                                  <div className="flex justify-between text-neutral-500">
                                    <span>Subtotal:</span>
                                    <span className="font-mono">₹{orderSubtotal.toFixed(2)}</span>
                                  </div>
                                  {order.coinsUsed !== undefined && order.coinsUsed > 0 && (
                                    <div className="flex justify-between text-emerald-600 font-medium">
                                      <span>Redeemed Coins Discount:</span>
                                      <span className="font-mono">-₹{order.coinsUsed.toFixed(2)}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between text-neutral-500">
                                    <span>Sales Tax (8%):</span>
                                    <span className="font-mono">₹{orderTax.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between text-neutral-500">
                                    <span>Shipping Charge:</span>
                                    <span className="font-mono">{orderShipping === 0 ? 'FREE' : `₹${orderShipping.toFixed(2)}`}</span>
                                  </div>
                                  <div className="flex justify-between text-sm font-extrabold text-neutral-900 border-t border-neutral-100 pt-2 mt-1">
                                    <span>Grand Total:</span>
                                    <span className="font-mono">₹{order.totalAmount.toFixed(2)}</span>
                                  </div>
                                  
                                  {/* Coins reward indicators */}
                                  {order.coinsEarned !== undefined && order.coinsEarned > 0 && (
                                    <div className="text-[9px] font-semibold text-rose-600 bg-rose-50 border border-rose-100/50 p-1.5 rounded-lg flex items-center gap-1 w-fit mt-2">
                                      <Award className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                      <span>Earns {order.coinsEarned} Coins (crediting upon completion/delivery)</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>

                        </div>

                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
