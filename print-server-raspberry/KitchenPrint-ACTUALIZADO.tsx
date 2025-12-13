// COMPONENTE ACTUALIZADO: KitchenPrint.tsx
// Impresión híbrida: Red (Raspberry Pi) + Fallback (navegador)

'use client';

import React, { useState } from 'react';
import { Printer, Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';

// ============================================
// CONFIGURACIÓN
// ============================================

// IP de tu Raspberry Pi (cámbiala según tu red)
const PRINT_SERVER_URL = process.env.NEXT_PUBLIC_PRINT_SERVER_URL || 'http://192.168.100.50:3001';

// Tiempo de espera para detectar servidor (ms)
const SERVER_TIMEOUT = 3000;

// ============================================
// TIPOS
// ============================================

interface OrderItem {
  id?: string;
  name: string;
  quantity: number;
  price?: number;
  extras?: Array<{
    name: string;
    price?: number;
  }>;
  notes?: string;
}

interface Order {
  id: string | number;
  customer_name?: string;
  customerName?: string;
  customer_phone?: string;
  customerPhone?: string;
  delivery_type?: 'delivery' | 'pickup' | 'dine-in';
  delivery_address?: string;
  items: OrderItem[];
  total?: number;
  payment_method?: 'cash' | 'card' | 'mercadopago';
  notes?: string;
}

interface KitchenPrintProps {
  order: Order;
  onPrintComplete?: () => void;
}

// ============================================
// COMPONENTE
// ============================================

export function KitchenPrint({ order, onPrintComplete }: KitchenPrintProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);
  const [isCheckingServer, setIsCheckingServer] = useState(false);

  // ============================================
  // VERIFICAR SERVIDOR
  // ============================================
  
  const checkPrintServer = async (): Promise<boolean> => {
    setIsCheckingServer(true);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), SERVER_TIMEOUT);

      const response = await fetch(`${PRINT_SERVER_URL}/status`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const online = data.status === 'online' && data.connected;
        setServerOnline(online);
        return online;
      }

      setServerOnline(false);
      return false;

    } catch (error) {
      console.warn('Servidor de impresión no disponible:', error);
      setServerOnline(false);
      return false;
    } finally {
      setIsCheckingServer(false);
    }
  };

  // ============================================
  // IMPRIMIR VÍA SERVIDOR (RASPBERRY PI)
  // ============================================

  const printViaServer = async (): Promise<boolean> => {
    try {
      const response = await fetch(`${PRINT_SERVER_URL}/print`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order: order,
          type: 'order',
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success('✅ Impreso en cocina', {
          description: `Orden #${order.id}`,
          duration: 3000,
        });
        return true;
      }

      throw new Error(result.message || 'Error desconocido');

    } catch (error) {
      console.error('Error imprimiendo vía servidor:', error);
      return false;
    }
  };

  // ============================================
  // IMPRIMIR VÍA NAVEGADOR (FALLBACK)
  // ============================================

  const printViaBrowser = () => {
    try {
      // Abrir ventana de impresión
      window.print();
      
      toast.info('📄 Imprimiendo desde navegador', {
        description: 'Usando método tradicional',
        duration: 3000,
      });

      return true;

    } catch (error) {
      console.error('Error imprimiendo desde navegador:', error);
      toast.error('Error al abrir diálogo de impresión');
      return false;
    }
  };

  // ============================================
  // MANEJADOR PRINCIPAL DE IMPRESIÓN
  // ============================================

  const handlePrint = async () => {
    if (isPrinting) return;

    setIsPrinting(true);

    try {
      // 1. Verificar si el servidor está disponible
      toast.loading('Verificando impresora...', { duration: 1000 });
      const isServerAvailable = await checkPrintServer();

      // 2. Intentar imprimir vía servidor primero
      if (isServerAvailable) {
        console.log('🖨️ Imprimiendo vía servidor Raspberry Pi...');
        const success = await printViaServer();
        
        if (success) {
          onPrintComplete?.();
          return;
        }

        // Si falla, mostrar advertencia
        toast.warning('Servidor no respondió, usando método alternativo...');
      } else {
        console.log('🖨️ Servidor offline, usando impresión de navegador...');
      }

      // 3. Fallback: Imprimir desde navegador
      printViaBrowser();
      onPrintComplete?.();

    } catch (error) {
      console.error('Error en proceso de impresión:', error);
      toast.error('Error al imprimir', {
        description: 'Intenta nuevamente',
      });
    } finally {
      setIsPrinting(false);
    }
  };

  // ============================================
  // RENDERIZADO
  // ============================================

  return (
    <div className="print-container">
      {/* BOTÓN DE IMPRESIÓN */}
      <button
        onClick={handlePrint}
        disabled={isPrinting || isCheckingServer}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPrinting || isCheckingServer ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Imprimiendo...</span>
          </>
        ) : (
          <>
            <Printer className="w-5 h-5" />
            <span>Imprimir en Cocina</span>
          </>
        )}
      </button>

      {/* INDICADOR DE ESTADO DEL SERVIDOR */}
      {serverOnline !== null && (
        <div className="mt-2 flex items-center gap-2 text-sm">
          {serverOnline ? (
            <>
              <Wifi className="w-4 h-4 text-green-500" />
              <span className="text-green-600">Impresora conectada</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-orange-500" />
              <span className="text-orange-600">Modo tradicional</span>
            </>
          )}
        </div>
      )}

      {/* TICKET OCULTO PARA IMPRESIÓN DE NAVEGADOR */}
      <div className="print-only">
        <style jsx>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .print-only,
            .print-only * {
              visibility: visible;
            }
            .print-only {
              position: absolute;
              left: 0;
              top: 0;
              width: 80mm;
              padding: 5mm;
              font-family: 'Courier New', monospace;
              font-size: 12pt;
              line-height: 1.4;
            }
            .print-only h1 {
              font-size: 20pt;
              font-weight: 900;
              text-align: center;
              margin-bottom: 10px;
              border-bottom: 3px solid #000;
              padding-bottom: 5px;
            }
            .print-only h2 {
              font-size: 16pt;
              font-weight: 900;
              margin: 10px 0;
            }
            .print-only .delivery-type {
              font-size: 24pt;
              font-weight: 900;
              text-align: center;
              background: #000;
              color: #fff;
              padding: 10px;
              margin: 10px 0;
            }
            .print-only .item {
              margin: 8px 0;
              font-weight: 700;
            }
            .print-only .item-name {
              font-weight: 900;
            }
            .print-only .extra {
              margin-left: 15px;
              font-size: 10pt;
            }
            .print-only .total {
              font-size: 18pt;
              font-weight: 900;
              text-align: center;
              border-top: 3px solid #000;
              border-bottom: 3px solid #000;
              padding: 10px 0;
              margin: 15px 0;
            }
          }

          @media screen {
            .print-only {
              display: none;
            }
          }
        `}</style>

        {/* CONTENIDO DEL TICKET */}
        <div>
          <h1>ORDEN DE COCINA</h1>
          
          <p><strong>ORDEN #{order.id}</strong></p>
          <p>{new Date().toLocaleString('es-MX', {
            timeZone: 'America/Mexico_City',
            dateStyle: 'short',
            timeStyle: 'short'
          })}</p>

          {(order.customer_name || order.customerName) && (
            <>
              <h2>CLIENTE:</h2>
              <p>{order.customer_name || order.customerName}</p>
            </>
          )}

          {(order.customer_phone || order.customerPhone) && (
            <p>Tel: {order.customer_phone || order.customerPhone}</p>
          )}

          {order.delivery_type === 'delivery' && order.delivery_address && (
            <>
              <h2>DIRECCIÓN:</h2>
              <p>{order.delivery_address}</p>
            </>
          )}

          <div className="delivery-type">
            {order.delivery_type === 'delivery' && 'DELIVERY'}
            {order.delivery_type === 'pickup' && 'RECOGER'}
            {order.delivery_type === 'dine-in' && 'COMER AQUÍ'}
            {!order.delivery_type && 'N/A'}
          </div>

          <h2>PRODUCTOS:</h2>
          {order.items.map((item, index) => (
            <div key={index} className="item">
              <div className="item-name">
                {item.quantity}x {item.name}
              </div>
              {item.price && (
                <div>${parseFloat(String(item.price)).toFixed(2)} c/u</div>
              )}
              {item.extras && item.extras.length > 0 && (
                <div className="extra">
                  {item.extras.map((extra, i) => (
                    <div key={i}>
                      + {extra.name}
                      {extra.price && parseFloat(String(extra.price)) > 0 && (
                        <span> (${parseFloat(String(extra.price)).toFixed(2)})</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {item.notes && (
                <div className="extra" style={{ fontStyle: 'italic' }}>
                  Nota: {item.notes}
                </div>
              )}
            </div>
          ))}

          {order.total && (
            <div className="total">
              TOTAL: ${parseFloat(String(order.total)).toFixed(2)}
            </div>
          )}

          {order.payment_method && (
            <p style={{ textAlign: 'center', fontWeight: 900 }}>
              PAGO: {
                order.payment_method === 'cash' ? 'EFECTIVO' :
                order.payment_method === 'card' ? 'TARJETA' :
                order.payment_method === 'mercadopago' ? 'MERCADO PAGO' :
                order.payment_method.toUpperCase()
              }
            </p>
          )}

          {order.notes && (
            <>
              <h2>NOTAS:</h2>
              <p>{order.notes}</p>
            </>
          )}

          <p style={{ textAlign: 'center', marginTop: '20px' }}>
            SuperNova Burgers<br />
            Gracias por su preferencia
          </p>
        </div>
      </div>
    </div>
  );
}

export default KitchenPrint;
