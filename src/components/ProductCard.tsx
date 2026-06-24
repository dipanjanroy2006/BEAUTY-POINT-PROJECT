import { Star, ShoppingBag, Eye, Heart } from 'lucide-react';
import { Product } from '../types';
import React, { useState } from 'react';

interface ProductCardProps {
  key?: any;
  product: Product;
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void | Promise<void>;
}

export default function ProductCard({ product, onAddToCart, onViewDetails }: ProductCardProps): React.JSX.Element {
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const price = product.price;
  const salePrice = product.salePrice;
  const discountPercent = salePrice ? Math.round(((price - salePrice) / price) * 100) : 0;
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 10;

  return (
    <div 
      id={`product-card-${product.id}`}
      className="group relative flex flex-col bg-white border border-neutral-150 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Badges (Sale / Featured / Out of stock) */}
      <div className="absolute left-3 top-3 z-10 flex flex-col gap-1 text-[10px] font-bold tracking-wider uppercase font-sans">
        {discountPercent > 0 && (
          <span className="bg-rose-500 text-white px-2 py-0.5 rounded-sm shadow-xs">
            {discountPercent}% OFF
          </span>
        )}
        {product.isFeatured && (
          <span className="bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-sm shadow-xs">
            BESTSELLER
          </span>
        )}
        {isOutOfStock ? (
          <span className="bg-neutral-800 text-white px-2 py-0.5 rounded-sm">
            SOLD OUT
          </span>
        ) : isLowStock ? (
          <span className="bg-amber-500 text-white px-2 py-0.5 rounded-sm animate-pulse">
            ONLY {product.stock} LEFT
          </span>
        ) : null}
      </div>

      {/* Wishlist Heart Icon */}
      <button 
        onClick={() => setIsLiked(!isLiked)}
        className="absolute right-3 top-3 z-10 p-2 rounded-full bg-white/85 hover:bg-white text-neutral-400 hover:text-rose-500 shadow-xs transition-colors focus:outline-none"
      >
        <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
      </button>

      {/* Image Container */}
      <div 
        onClick={() => onViewDetails(product)}
        className="relative aspect-square overflow-hidden bg-neutral-100 cursor-pointer"
      >
        <img 
          src={product.image} 
          alt={product.name} 
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {/* Quick View Button Overlay */}
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <button 
            className="py-2.5 px-4 bg-white/95 text-neutral-900 rounded-full font-medium text-xs flex items-center gap-1.5 shadow-md transform translate-y-3 group-hover:translate-y-0 transition-all duration-300 hover:bg-neutral-900 hover:text-white"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Quick View</span>
          </button>
        </div>
      </div>

      {/* Details Box */}
      <div className="flex-1 p-4 flex flex-col justify-between">
        <div className="space-y-1">
          {/* Brand & Category */}
          <div className="flex justify-between items-center text-[10px] text-neutral-400 font-medium uppercase tracking-wider">
            <span>{product.details?.brand || 'Collection'}</span>
            <span>{product.categoryName}</span>
          </div>

          {/* Product Name */}
          <h3 
            onClick={() => onViewDetails(product)}
            className="font-serif text-sm font-semibold text-neutral-900 line-clamp-1 group-hover:text-rose-500 transition-colors cursor-pointer"
          >
            {product.name}
          </h3>

          {/* Stars & Reviews */}
          <div className="flex items-center gap-1.5 justify-between">
            <div className="flex items-center gap-1">
              <div className="flex items-center text-amber-400">
                <Star className="w-3 h-3 fill-amber-400" />
                <span className="text-xs font-semibold font-mono ml-0.5 text-neutral-700">{product.rating.toFixed(1)}</span>
              </div>
              <span className="text-[10px] text-neutral-400 font-sans">({product.reviewsCount} reviews)</span>
            </div>
            {product.rewardCoins !== undefined && product.rewardCoins > 0 && (
              <span className="text-[9px] font-bold text-rose-500 bg-rose-50 border border-rose-100/50 py-0.5 px-1.5 rounded-md flex items-center gap-0.5 select-none animate-pulse">
                🎁 +{product.rewardCoins} Coins
              </span>
            )}
          </div>
        </div>

        {/* Price and Add to bag bar */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-100">
          <div className="flex flex-col">
            {salePrice ? (
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-bold font-mono text-rose-600">₹{salePrice.toFixed(2)}</span>
                <span className="text-xs font-mono text-neutral-400 line-through">₹{price.toFixed(2)}</span>
              </div>
            ) : (
              <span className="text-sm font-bold font-mono text-neutral-800">₹{price.toFixed(2)}</span>
            )}
          </div>

          <button
            onClick={() => onAddToCart(product)}
            disabled={isOutOfStock}
            className={`p-2 rounded-xl transition-all duration-300 flex items-center justify-center ${
              isOutOfStock 
                ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                : 'bg-neutral-900 hover:bg-rose-500 text-white shadow-xs hover:shadow-md hover:scale-105 active:scale-95'
            }`}
            title={isOutOfStock ? "Sold Out" : "Add to Bag"}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
