'use client'

import { useEffect, useMemo, useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

type CategoryInfo = {
  id: number;
  name: string;
  count: number;
  icon?: string;
};

interface Props {
  selectedCategory: string;
  onCategoryChange: (id: string) => void;
  categories: CategoryInfo[];
}

interface Bubble {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  opacity: number;
}

// Helper para obtener el icono de lucide-react por nombre
const getIconByName = (iconName?: string): LucideIcon => {
  if (!iconName) return LucideIcons.Package;
  
  // Mapeo de nombres de iconos de la DB a nombres de componentes de lucide-react
  const iconMap: Record<string, string> = {
    'hamburger': 'Sandwich',
    'cake': 'Cake',
    'beef': 'Beef',
    'drumstick': 'Drumstick',
    'baby': 'Baby',
    'utensils-crossed': 'UtensilsCrossed',
    'utensils': 'Utensils',
    'chef-hat': 'ChefHat',
    'coffee': 'Coffee',
    'pizza': 'Pizza',
    'ice-cream': 'IceCream2',
    'salad': 'Salad',
    'wine': 'Wine',
    'beer': 'Beer',
    'cookie': 'Cookie',
    'croissant': 'Croissant',
    'sandwich': 'Sandwich',
    'soup': 'Soup',
    'fish': 'Fish',
    'egg': 'Egg',
    'milk': 'Milk',
    'apple': 'Apple',
    'cherry': 'Cherry',
    'banana': 'Banana',
    'carrot': 'Carrot',
    'pepper': 'Pepper',
    'flame': 'Flame',
    'sparkles': 'Sparkles',
    'snowflake': 'Snowflake',
    'star': 'Star',
    'heart': 'Heart',
    'circle': 'Circle',
    'square': 'Square',
    'package': 'Package'
  };
  
  const componentName = iconMap[iconName.toLowerCase()] || 'Package';
  return (LucideIcons as any)[componentName] || LucideIcons.Package;
};

// Metadatos de colores por categoría (por nombre normalizado)
const getCategoryColors = (categoryName: string) => {
  const normalized = categoryName.toLowerCase();
  
  if (normalized.includes('hamburgues') || normalized.includes('burger')) {
    return {
      titleColor: 'text-white',
      iconColor: 'text-white',
      accentFrom: 'from-orange-100',
      accentTo: 'to-amber-100',
      desc: 'Deliciosas hamburguesas con papas incluidas'
    };
  }
  if (normalized.includes('wing') || normalized.includes('boneless') || normalized.includes('alit')) {
    return {
      titleColor: 'text-white',
      iconColor: 'text-white',
      accentFrom: 'from-amber-100',
      accentTo: 'to-yellow-100',
      desc: 'Alitas crujientes con salsas especiales'
    };
  }
  if (normalized.includes('bebida') || normalized.includes('drink') || normalized.includes('café') || normalized.includes('coffee')) {
    return {
      titleColor: 'text-white',
      iconColor: 'text-white',
      accentFrom: 'from-sky-100',
      accentTo: 'to-cyan-100',
      desc: 'Bebidas refrescantes y deliciosas'
    };
  }
  if (normalized.includes('postre') || normalized.includes('dessert') || normalized.includes('dulce')) {
    return {
      titleColor: 'text-white',
      iconColor: 'text-white',
      accentFrom: 'from-pink-100',
      accentTo: 'to-rose-100',
      desc: 'Postres dulces para completar tu comida'
    };
  }
  if (normalized.includes('infan') || normalized.includes('kid') || normalized.includes('niño')) {
    return {
      titleColor: 'text-white',
      iconColor: 'text-white',
      accentFrom: 'from-colibri-beige',
      accentTo: 'to-colibri-gold',
      desc: 'Menú especial para los pequeños'
    };
  }
  if (normalized.includes('acompaña') || normalized.includes('side')) {
    return {
      titleColor: 'text-white',
      iconColor: 'text-white',
      accentFrom: 'from-green-100',
      accentTo: 'to-emerald-100',
      desc: 'Complementa tu comida'
    };
  }
  
  // Default
  return {
    titleColor: 'text-white',
    iconColor: 'text-white',
    accentFrom: 'from-slate-100',
    accentTo: 'to-gray-100',
    desc: 'Descubre nuestros productos'
  };
};

export const WelcomeBubblyPanel = ({ selectedCategory, onCategoryChange, categories }: Props) => {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [viewport, setViewport] = useState<'mobile' | 'desktop' | 'kiosk'>('desktop');

  // Responsive detection and bubble generation
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      const mode: typeof viewport = w < 480 ? 'mobile' : w >= 1400 ? 'kiosk' : 'desktop';
      setViewport(mode);

      const arr: Bubble[] = [];
      const totals = { mobile: 45, desktop: 100, kiosk: 160 } as const;
      const total = totals[mode];
      const sizeBase = mode === 'mobile' ? 5 : mode === 'desktop' ? 6 : 8;
      const sizeVar = mode === 'mobile' ? 5 : mode === 'desktop' ? 6 : 8;
      const durationBase = mode === 'mobile' ? 6 : mode === 'desktop' ? 7 : 8.5;

      for (let i = 0; i < total; i++) {
        const x = Math.max(3, Math.min(97, Math.random() * 100));
        const startBand = Math.random() * 25 + 70;
        arr.push({
          id: i,
          x,
          y: startBand,
          size: Math.random() * sizeVar + sizeBase,
          delay: Math.random() * 6,
          duration: durationBase + Math.random() * 5,
          opacity: 0.35 + Math.random() * 0.45
        });
      }
      setBubbles(arr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={`w-full ${viewport === 'kiosk' ? 'max-w-[1600px]' : 'max-w-6xl'} mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-8 md:py-10 xl:py-12`}>
      <div className={`relative rounded-[28px] sm:rounded-[36px] md:rounded-[44px] bg-gradient-to-br from-colibri-green/20 to-slate-900/30 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.4)] border border-colibri-gold/30 overflow-hidden ${viewport === 'kiosk' ? 'min-h-[90vh]' : 'min-h-[60vh] md:min-h-[68vh]'}`}>
        {/* Boiling bubbles overlay inside the panel */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {bubbles.map(b => (
            <div
              key={b.id}
              className="absolute rounded-full bg-gradient-to-t from-colibri-green/40 to-colibri-gold/20 blur-sm animate-bubble-rise"
              style={{
                left: `${b.x}%`,
                top: `${b.y}%`,
                width: `${b.size}px`,
                height: `${b.size}px`,
                animationDelay: `${b.delay}s`,
                animationDuration: `${b.duration}s`,
                opacity: b.opacity
              }}
            />
          ))}
        </div>

        {/* Header */}
        <div className={`relative px-6 sm:px-8 md:px-14 ${viewport === 'kiosk' ? 'pt-12' : 'pt-10 sm:pt-12 md:pt-16'} text-center overflow-visible`}>
          {/* Animated title with gradient and glow */}
          <motion.h1 
            initial={{ scale: 0.8, opacity: 0, y: -30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ 
              type: "spring",
              stiffness: 200,
              damping: 15,
              duration: 0.6
            }}
            className="relative text-[36px] sm:text-[40px] md:text-[72px] xl:text-[90px] 2xl:text-[110px] leading-none font-extrabold tracking-tight"
          >
            {/* Glow effect behind text */}
            <motion.span
              animate={{ 
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{ 
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 bg-gradient-to-r from-colibri-green via-colibri-gold to-colibri-wine blur-[60px] -z-10"
            />
            
            {/* Main text with gradient */}
            <span className="relative bg-gradient-to-r from-colibri-gold via-colibri-beige to-colibri-gold bg-clip-text text-transparent">
              {['¡', 'H', 'O', 'L', 'A', '!'].map((letter, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: i * 0.08,
                    type: "spring",
                    stiffness: 400,
                    damping: 25
                  }}
                  className="inline-block"
                  whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                >
                  {letter}
                </motion.span>
              ))}
            </span>
          </motion.h1>
          
          {/* Animated subtitle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
            className="mt-3 sm:mt-4 md:mt-6 relative"
          >
            <motion.p 
              className="text-colibri-beige text-base sm:text-lg md:text-2xl xl:text-3xl font-medium px-4"
              animate={{ 
                textShadow: [
                  "0 0 20px rgba(171,153,118,0.4)",
                  "0 0 30px rgba(171,153,118,0.6)",
                  "0 0 20px rgba(171,153,118,0.4)",
                ]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              Elige tu categoría favorita y descubre nuestras deliciosas opciones
            </motion.p>
            
            {/* Decorative sparkles */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: [0, 1.5, 0],
                  opacity: [0, 1, 0],
                  x: Math.sin(i * Math.PI / 4) * 60,
                  y: Math.cos(i * Math.PI / 4) * 60
                }}
                transition={{
                  delay: 1 + i * 0.15,
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 2
                }}
                className="absolute left-1/2 top-1/2 w-1.5 h-1.5 bg-yellow-300 rounded-full shadow-[0_0_10px_rgba(253,224,71,0.8)]"
              />
            ))}
          </motion.div>
        </div>

        {/* Cards grid */}
        <div className={`relative px-4 sm:px-6 md:px-12 ${viewport === 'kiosk' ? 'pb-10' : 'pb-8 sm:pb-10 md:pb-16'}`}>
          <div className={`grid grid-cols-1 sm:grid-cols-2 ${viewport === 'kiosk' ? 'grid-rows-2 auto-rows-fr items-stretch content-stretch gap-10' : 'gap-4 sm:gap-6 md:gap-10'}`}>
            {categories.map(cat => {
              const Icon = getIconByName(cat.icon);
              const meta = getCategoryColors(cat.name);
              const selected = selectedCategory === cat.id.toString();
              
              return (
                <button
                  key={cat.id}
                  onClick={() => onCategoryChange(cat.id.toString())}
                  className={`group relative text-left h-full rounded-[32px] transition-all duration-200 overflow-hidden ${selected ? 'ring-2 ring-colibri-gold/50' : ''}`}
                >
                  {/* Glass card with enhanced blur and elevation */}
                  <div className={`relative h-full flex flex-col border-2 border-white/30 bg-white/[0.08] backdrop-blur-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3),0_32px_64px_rgba(0,0,0,0.25)] ${viewport === 'kiosk' ? 'min-h-[320px]' : 'min-h-[180px] sm:min-h-[200px] md:min-h-[220px]'} hover:shadow-[0_12px_48px_rgba(0,0,0,0.4),0_48px_80px_rgba(0,0,0,0.3)] hover:scale-[1.03] hover:border-white/40 hover:-translate-y-2 active:scale-[0.97] active:translate-y-0 transition-all duration-300 rounded-[32px]`}>
                    
                    {/* Stronger noise texture overlay */}
                    <div className="absolute inset-0 opacity-[0.025] mix-blend-overlay pointer-events-none" style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='5' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")`
                    }} />
                    
                    {/* Gradient overlay on hover */}
                    <span className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${meta.accentFrom} ${meta.accentTo} opacity-0 group-hover:opacity-30 transition-opacity duration-300`} />
                    
                    {/* Enhanced shimmer effect */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                    </div>
                    
                    {/* Content */}
                    <div className="relative z-10 px-5 sm:px-7 py-6 sm:py-8 md:px-9 md:py-10 h-full flex flex-col">
                      <div className="flex items-start gap-3 sm:gap-4">
                        {/* Icon container with glass effect and elevation */}
                        <div className={`shrink-0 rounded-3xl bg-gradient-to-br from-white/25 to-white/10 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.25),inset_0_2px_4px_rgba(255,255,255,0.4)] p-4 sm:p-5 md:p-6 border-2 border-white/40 group-hover:bg-gradient-to-br group-hover:from-white/35 group-hover:to-white/15 group-hover:scale-110 group-hover:rotate-3 group-active:scale-95 transition-all duration-500 relative overflow-hidden`}>
                          {/* Inner glow */}
                          <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${meta.accentFrom} ${meta.accentTo} opacity-0 group-hover:opacity-40 blur-2xl transition-all duration-500`} />
                          {/* Icon */}
                          <Icon className={`relative z-10 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 ${meta.iconColor} drop-shadow-[0_6px_16px_rgba(0,0,0,0.4)] filter group-hover:brightness-125 transition-all duration-300`} />
                          {/* Multiple sparkle effects */}
                          <div className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping" />
                          <div className="absolute top-2 right-3 w-1.5 h-1.5 bg-white/70 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping animation-delay-150" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className={`text-xl sm:text-2xl md:text-3xl font-extrabold ${meta.titleColor} drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)] group-hover:scale-105 transition-transform duration-300 origin-left break-words`}>{cat.name}</h3>
                          <p className="mt-1 text-white/95 text-sm md:text-base drop-shadow-[0_2px_6px_rgba(0,0,0,0.3)] break-words">{meta.desc}</p>
                        </div>
                      </div>
                      
                      {/* Badge with product count */}
                      <div className={`${viewport === 'kiosk' ? 'mt-auto pt-6' : 'mt-5 sm:mt-6 md:mt-8'}`}>
                        <div className={`${viewport === 'kiosk' ? 'h-11 text-lg px-6 rounded-2xl' : 'h-8 sm:h-9 px-3 sm:px-4 rounded-xl'} w-fit flex items-center justify-center bg-white/25 backdrop-blur-xl border-2 border-white/50 text-white font-bold shadow-[0_8px_24px_rgba(0,0,0,0.2),inset_0_2px_0_rgba(255,255,255,0.3)] group-hover:bg-white/35 group-hover:border-white/60 group-hover:scale-105 group-active:scale-95 transition-all duration-300`}>
                          {cat.count} opciones
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes bubble-rise {
          0% {
            transform: translateY(0) scale(1);
            opacity: var(--bubble-opacity, 0.4);
          }
          50% {
            transform: translateY(-40vh) scale(1.1);
            opacity: calc(var(--bubble-opacity, 0.4) * 0.6);
          }
          100% {
            transform: translateY(-80vh) scale(0.8);
            opacity: 0;
          }
        }
        
        .animate-bubble-rise {
          animation: bubble-rise var(--duration, 10s) ease-in infinite;
        }
      `}</style>
    </div>
  );
};
