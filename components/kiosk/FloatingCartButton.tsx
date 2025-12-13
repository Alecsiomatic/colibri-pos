'use client'

import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FloatingCartButtonProps {
  cartCount: number;
  onCartClick: () => void;
}

export const FloatingCartButton = ({ cartCount, onCartClick }: FloatingCartButtonProps) => {
  if (cartCount === 0) return null;

  return (
    <div className="fixed bottom-6 right-4 sm:right-6 md:bottom-8 md:right-8 z-[100]" data-floating-cart>
      {/* Liquid glass floating button */}
      <div className="relative">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-colibri-green/40 to-colibri-wine/50 rounded-full blur-xl animate-pulse" />
        
        {/* Floating particles around button */}
        <div className="absolute -top-2 -right-1 w-2 h-2 bg-colibri-gold/60 rounded-full animate-bounce blur-sm" />
        <div className="absolute -bottom-1 -left-2 w-1.5 h-1.5 bg-colibri-wine/70 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
        <div className="absolute top-1/2 -left-3 w-1 h-1 bg-colibri-gold/80 rounded-full animate-pulse" />
        
        <Button
          onClick={onCartClick}
          size="lg"
          className="relative h-20 w-20 sm:h-18 sm:w-18 md:h-20 md:w-20 rounded-full bg-gradient-to-br from-colibri-green via-colibri-wine to-colibri-wine backdrop-blur-xl border-[3px] border-white/30 hover:border-colibri-gold/60 transition-all duration-500 transform active:scale-95 hover:scale-110 shadow-2xl hover:shadow-colibri-wine/50 group touch-manipulation"
        >
          {/* Liquid glass overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-colibri-gold/20 rounded-full group-hover:via-white/20 transition-all duration-300" />
          
          {/* Cart icon */}
          <div className="relative z-10 flex items-center justify-center">
            <ShoppingCart className="h-9 w-9 sm:h-8 sm:w-8 md:h-9 md:w-9 text-white transition-colors duration-300" />
          </div>
          
          {/* Cart count badge */}
          <div className="absolute -top-2 -right-2 min-h-[28px] min-w-[28px] h-7 w-7 bg-gradient-to-br from-colibri-wine to-colibri-wine/90 rounded-full border-[3px] border-white shadow-lg flex items-center justify-center animate-pulse">
            <span className="text-white text-sm font-bold px-1">
              {cartCount > 99 ? '99+' : cartCount}
            </span>
            <div className="absolute inset-0 bg-colibri-wine rounded-full blur-sm opacity-40 animate-ping" />
          </div>
          
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        </Button>
      </div>
    </div>
  );
};
