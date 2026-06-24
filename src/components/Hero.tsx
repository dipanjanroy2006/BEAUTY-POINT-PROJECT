import { ArrowRight, Star, Sparkles } from 'lucide-react';
import { Setting } from '../types';

interface HeroProps {
  settings: Setting | null;
  onCtaClick: () => void;
}

export default function Hero({ settings, onCtaClick }: HeroProps) {
  // Safe fallbacks matching database seeds
  const title = settings?.bannerTitle || "ILLUMINATE YOUR BEAUTY";
  const subtitle = settings?.bannerSubtitle || "Experience perfect radiance and restore your skin to its natural, glowing beauty with our handpicked collection.";
  const ctaText = settings?.bannerCtaText || "SHOP THE COLLECTION";
  const image = settings?.bannerImage || "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=1200";

  return (
    <div className="relative w-full overflow-hidden bg-neutral-100 min-h-[480px] md:min-h-[560px] flex items-center">
      {/* Absolute Image Background with clean luxury overlay gradient */}
      <div className="absolute inset-0 z-0">
        <img 
          src={image} 
          alt="Luxe Beauty Banner" 
          className="w-full h-full object-cover object-center scale-102 transition-transform duration-10000 ease-out"
        />
        {/* Soft, professional off-white/pink marble-tint gradient overlay for textual readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-50/95 via-neutral-50/80 to-transparent md:bg-gradient-to-r" />
        <div className="absolute inset-0 bg-black/5" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 py-16">
        <div className="max-w-xl md:max-w-2xl space-y-6">
          
          {/* Badge indicator */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-100 rounded-full text-rose-600 text-xs font-semibold tracking-wider uppercase shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Organic & Dermatologically Approved</span>
          </div>

          {/* Luxury Main Heading */}
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-neutral-900 leading-tight">
            {title}
          </h1>

          {/* Soft Description Subtitle */}
          <p className="font-sans text-sm sm:text-base md:text-lg text-neutral-600 font-light leading-relaxed max-w-lg md:max-w-xl">
            {subtitle}
          </p>

          {/* Luxury Trust Indicators */}
          <div className="flex flex-wrap items-center gap-5 text-xs text-neutral-500 font-medium">
            <div className="flex items-center gap-1">
              <div className="flex text-amber-400">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-3.5 h-3.5 fill-amber-400" />
                ))}
              </div>
              <span className="font-semibold text-neutral-800 ml-0.5">4.9/5 Rating</span>
            </div>
            <div className="h-4 w-px bg-neutral-300 hidden sm:block" />
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Dermatologically Certified</span>
            </div>
            <div className="h-4 w-px bg-neutral-300 hidden sm:block" />
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span>Cruelty Free</span>
            </div>
          </div>

          {/* Call to Action Button */}
          <div className="pt-2">
            <button
              onClick={onCtaClick}
              className="group relative inline-flex items-center justify-center gap-2 py-4 px-8 bg-neutral-900 hover:bg-rose-500 text-white font-medium text-sm rounded-xl transition-all duration-300 shadow-lg hover:shadow-rose-300/30 active:scale-99 hover:-translate-y-0.5"
            >
              <span>{ctaText}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

        </div>
      </div>

      {/* Elegant scroll bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-neutral-50 to-transparent pointer-events-none" />
    </div>
  );
}
