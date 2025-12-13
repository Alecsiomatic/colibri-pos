'use client'

import { useState, useEffect } from 'react';
import { X, Plus, Minus, ShoppingBag, ArrowLeft, CreditCard, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface CartModifier {
  group: string;
  modifier: string;
  price: number;
}

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
  modifiers?: CartModifier[];
}

interface FloatingCartKioskProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onRemoveItem: (productId: number) => void;
  onClearCart: () => void;
  onCheckout: (customerName: string, notes: string, paymentMethod: 'efectivo' | 'tarjeta') => Promise<void>;
}

export const FloatingCartKiosk = ({ 
  isOpen, 
  onClose, 
  items, 
  onUpdateQuantity, 
  onRemoveItem,
  onClearCart,
  onCheckout
}: FloatingCartKioskProps) => {
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'tarjeta'>('efectivo');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const total = items.reduce((sum, item) => {
    const modifierTotal = item.modifiers?.reduce((modSum, mod) => modSum + Number(mod.price || 0), 0) || 0;
    return sum + ((Number(item.price) || 0) + modifierTotal) * item.quantity;
  }, 0);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setShowCheckout(false);
    } else {
      setTimeout(() => setIsVisible(false), 300);
    }
  }, [isOpen]);

  const handleCheckout = async () => {
    if (!showCheckout) {
      setShowCheckout(true);
      return;
    }

    if (!customerName.trim()) {
      alert('Por favor ingresa tu nombre');
      return;
    }

    setIsSubmitting(true);
    try {
      await onCheckout(customerName, notes, paymentMethod);
      setCustomerName('');
      setNotes('');
      setPaymentMethod('efectivo');
      setShowCheckout(false);
      onClose();
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Error al procesar el pedido');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {isVisible && (
        <>
          {/* Overlay */}
          <div 
            className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-md transition-all duration-500 ${
              isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            onClick={onClose}
          />
          
          {/* Cart Container */}
          <div 
            className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 transition-all duration-700 ease-out
              w-[94vw] max-w-[430px] h-[82vh] sm:w-[320px] sm:h-[568px] md:w-[380px] md:h-[640px] lg:w-[420px] lg:h-[680px]
              ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'}`}
            style={{ maxHeight: '88vh' }}
          >
            {/* Glass Background */}
            <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-colibri-green/30 via-slate-900/40 to-colibri-wine/20 backdrop-blur-2xl" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(31,79,55,0.35),transparent_65%)]" />
              <div className="absolute inset-0 rounded-[2.5rem] ring-1 ring-white/15" />
              <div className="absolute inset-0 rounded-[2.5rem] border border-white/10" />
            </div>

            {/* Content */}
            <div className="relative z-10 h-full flex flex-col p-4 sm:p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-2xl bg-colibri-green/20 border border-colibri-gold/30 shadow-lg">
                    <ShoppingBag className="h-5 w-5 text-colibri-gold" />
                  </div>
                  <div>
                    <h2 className="text-white font-semibold text-lg tracking-tight">Mi Carrito</h2>
                    <p className="text-white/55 text-xs">
                      {items.length} {items.length === 1 ? 'producto' : 'productos'}
                    </p>
                  </div>
                </div>
                
                <Button
                  onClick={onClose}
                  size="sm"
                  variant="ghost"
                  className="h-10 w-10 p-0 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {!showCheckout ? (
                <>
                  {/* Items */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                    {items.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center text-white/70">
                        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 mb-4">
                          <ShoppingBag className="h-8 w-8 text-white/60" />
                        </div>
                        <p className="text-base font-medium">Carrito vacío</p>
                        <p className="text-white/50 text-sm mt-1">Agrega productos deliciosos</p>
                      </div>
                    ) : (
                      items.map((item) => {
                        const modifierTotal = item.modifiers?.reduce((sum, mod) => sum + Number(mod.price || 0), 0) || 0;
                        const itemTotal = (Number(item.price) || 0) + modifierTotal;
                        
                        return (
                          <div key={item.id} className="relative rounded-3xl p-4 overflow-hidden group shadow-2xl transition-all duration-500 hover:scale-[1.02]">
                            <div className="absolute inset-0 bg-gradient-to-br from-colibri-green/25 via-black/40 to-colibri-wine/30 backdrop-blur-xl rounded-3xl" />
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-colibri-gold/10 rounded-3xl group-hover:via-white/10 transition-all duration-300" />
                            <div className="absolute inset-0 border border-white/15 group-hover:border-colibri-gold/40 rounded-3xl transition-all duration-300" />
                            
                            <div className="relative z-10 flex items-start space-x-4">
                              {item.image_url && (
                                <div className="relative w-14 h-14 rounded-2xl overflow-hidden border-2 border-colibri-gold/30 group-hover:border-colibri-gold/60 transition-all duration-300 shrink-0 shadow-lg">
                                  <img
                                    src={item.image_url}
                                    alt={item.name}
                                    className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500"
                                  />
                                </div>
                              )}
                              
                              <div className="flex-1 min-w-0">
                                <h4 className="text-white font-bold text-base truncate group-hover:text-colibri-beige transition-colors duration-300 mb-1">
                                  {item.name}
                                </h4>
                                
                                {item.modifiers && item.modifiers.length > 0 && (
                                  <div className="mt-2 space-y-1.5 p-2 rounded-xl bg-colibri-green/20 border border-colibri-gold/20">
                                    <div className="text-xs text-colibri-gold/80 font-medium uppercase tracking-wide">Personalizaciones:</div>
                                    {item.modifiers.map((modifier, idx) => (
                                      <div key={idx} className="flex items-center justify-between text-sm">
                                        <span className="text-colibri-beige/90 flex items-center">
                                          <span className="w-1 h-1 bg-colibri-gold rounded-full mr-2" />
                                          {modifier.modifier}
                                        </span>
                                        {modifier.price !== 0 && (
                                          <span className="text-green-400 font-semibold">+${modifier.price.toFixed(2)}</span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                
                                <div className="flex items-center space-x-3 mt-2">
                                  <div className="flex items-baseline space-x-1">
                                    <p className="text-colibri-gold font-bold text-lg">
                                      ${itemTotal.toFixed(2)}
                                    </p>
                                    {modifierTotal > 0 && (
                                      <span className="text-xs text-white/60 line-through">
                                        ${item.price}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
                                  className="h-8 w-8 p-0 rounded-xl bg-gradient-to-br from-white/10 to-colibri-green/20 hover:from-colibri-green/30 hover:to-colibri-wine/30 border border-white/20 hover:border-colibri-gold/50 text-white transition-all duration-300 hover:scale-110"
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                
                                <div className="relative">
                                  <span className="text-white font-bold text-base min-w-[2rem] text-center bg-gradient-to-br from-colibri-green/30 to-colibri-wine/40 px-3 py-2 rounded-xl border-2 border-colibri-gold/40 shadow-lg backdrop-blur-sm">
                                    {item.quantity}
                                  </span>
                                </div>
                                
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                                  className="h-8 w-8 p-0 rounded-xl bg-gradient-to-br from-white/10 to-colibri-green/20 hover:from-colibri-green/30 hover:to-colibri-wine/30 border border-white/20 hover:border-colibri-gold/50 text-white transition-all duration-300 hover:scale-110"
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Footer */}
                  {items.length > 0 && (
                    <div className="mt-3 sm:mt-4 space-y-3">
                      <div className="rounded-2xl p-3 bg-white/6 border border-white/12 backdrop-blur-sm shadow-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-white font-semibold">Total:</span>
                          <span className="text-white text-lg sm:text-xl font-bold tracking-wide">${total.toFixed(2)}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Button
                          onClick={() => setShowCheckout(true)}
                          className="relative w-full py-3 text-sm font-semibold rounded-2xl text-white bg-gradient-to-r from-colibri-green to-colibri-wine hover:from-colibri-green/90 hover:to-colibri-wine/90 transition-all duration-400 shadow-[0_8px_20px_-6px_rgba(31,79,55,0.55)] border border-white/15"
                        >
                          Finalizar Pedido
                        </Button>
                        
                        <Button
                          onClick={onClearCart}
                          variant="outline"
                          size="sm"
                          className="w-full rounded-xl bg-white/5 border-white/30 hover:border-red-400/50 hover:bg-red-500/20 text-white text-xs"
                        >
                          Vaciar Carrito
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                // Checkout Form
                <div className="flex-1 flex flex-col space-y-4">
                  <Button
                    onClick={() => setShowCheckout(false)}
                    variant="ghost"
                    size="sm"
                    className="self-start text-white hover:bg-white/10 p-2 h-auto font-normal rounded-xl"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver
                  </Button>

                  <div className="flex-1 space-y-4 overflow-y-auto pr-1 custom-scrollbar">
                    <div className="space-y-2">
                      <Label htmlFor="customer-name" className="text-white font-medium text-sm">
                        Nombre Completo *
                      </Label>
                      <Input
                        id="customer-name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Tu nombre"
                        className="h-12 rounded-xl bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:border-purple-400 min-h-[44px]"
                        style={{ fontSize: '16px' }}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="notes" className="text-white font-medium text-sm">
                        Notas Especiales (Opcional)
                      </Label>
                      <Textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Instrucciones especiales..."
                        className="h-16 rounded-xl bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:border-purple-400 resize-none"
                        style={{ fontSize: '16px' }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white font-medium text-sm">Método de Pago</Label>
                      <RadioGroup value={paymentMethod} onValueChange={(value: 'efectivo' | 'tarjeta') => setPaymentMethod(value)}>
                        <div className="flex items-center space-x-2 p-3 bg-white/10 rounded-xl border border-white/20">
                          <RadioGroupItem value="efectivo" id="efectivo" />
                          <Label htmlFor="efectivo" className="flex items-center cursor-pointer text-white font-bold text-base flex-1">
                            <Banknote className="h-5 w-5 mr-2 text-green-400" />
                            Efectivo
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 p-3 bg-white/10 rounded-xl border border-white/20">
                          <RadioGroupItem value="tarjeta" id="tarjeta" />
                          <Label htmlFor="tarjeta" className="flex items-center cursor-pointer text-white font-bold text-base flex-1">
                            <CreditCard className="h-5 w-5 mr-2 text-blue-400" />
                            Tarjeta
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="rounded-2xl p-4 bg-white/6 border border-white/12 backdrop-blur-sm shadow-lg">
                      <div className="flex items-center justify-between text-white">
                        <span className="font-semibold">Total:</span>
                        <span className="text-xl font-bold">${total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleCheckout}
                    disabled={isSubmitting}
                    className="w-full py-3 text-sm font-semibold rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-400 shadow-[0_8px_20px_-6px_rgba(168,85,247,0.55)] border border-white/15"
                  >
                    {isSubmitting ? "Procesando..." : "Confirmar Pedido"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <style jsx global>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(168, 85, 247, 0.3) transparent;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(168, 85, 247, 0.3);
          border-radius: 2px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(168, 85, 247, 0.5);
        }
      `}</style>
    </>
  );
};
