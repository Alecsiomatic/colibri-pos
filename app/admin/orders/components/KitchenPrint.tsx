"use client";

import React, { useState } from "react";
import { Printer } from "lucide-react";

type Order = {
  id: number;
  user_id: number;
  items: string;
  total: number;
  status: string;
  created_at: string;
  customer_info: string;
  username?: string;
  raw_status?: string;
  payment_method?: string;
  delivery_address?: string;
  notes?: string;
};

interface KitchenPrintProps {
  order: Order;
}

// URL del servidor de impresión en Raspberry Pi
const PRINT_SERVER_URL = process.env.NEXT_PUBLIC_PRINT_SERVER_URL || 'https://untextural-louetta-nonrestrictedly.ngrok-free.dev';

export default function KitchenPrint({ order }: KitchenPrintProps) {
  const [printing, setPrinting] = useState(false);

  const handlePrint = async () => {
    setPrinting(true);
    
    try {
      // Intentar imprimir via servidor Raspberry Pi
      const printed = await printViaServer();
      if (printed) {
        console.log('✅ Comanda impresa correctamente');
      } else {
        console.error('❌ Error: No se pudo imprimir la comanda');
      }
    } catch (error) {
      console.error('❌ Error imprimiendo comanda:', error);
    }
    
    setPrinting(false);
  };

  const printViaServer = async (): Promise<boolean> => {
    try {
      // Parse customer info and items
      let customerInfo: any = {};
      try {
        customerInfo = typeof order.customer_info === "string" 
          ? JSON.parse(order.customer_info) 
          : order.customer_info;
      } catch {}

      let items: any[] = [];
      try {
        items = typeof order.items === "string" 
          ? JSON.parse(order.items) 
          : order.items;
      } catch {}

      // Preparar datos para el servidor
      const printData = {
        orderId: order.id,
        customer: {
          name: customerInfo?.name || 'N/A',
          phone: customerInfo?.phone || '',
          address: customerInfo?.address || '',
          notes: customerInfo?.notes || ''
        },
        items: items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total: order.total,
        paymentMethod: order.payment_method,
        deliveryType: customerInfo?.deliveryType || 'pickup',
        createdAt: order.created_at
      };

      // Enviar al servidor de impresión
      const response = await fetch(`${PRINT_SERVER_URL}/print`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(printData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Impresión exitosa:', result);
        return true;
      } else {
        console.error('❌ Error del servidor de impresión:', await response.text());
        return false;
      }
    } catch (error) {
      console.error('❌ Error conectando al servidor de impresión:', error);
      return false;
    }
  };

  const printViaBrowser = () => {
    // Parse customer info and items
    let customerInfo: any = {};
    try {
      customerInfo = typeof order.customer_info === "string" 
        ? JSON.parse(order.customer_info) 
        : order.customer_info;
    } catch {}

    let items: any[] = [];
    try {
      items = typeof order.items === "string" 
        ? JSON.parse(order.items) 
        : order.items;
    } catch {}

    // Create print window
    const printWindow = window.open('', '_blank', 'width=300,height=600');
    
    if (!printWindow) {
      alert('Por favor, permite las ventanas emergentes para imprimir');
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Comanda #${order.id}</title>
          <style>
            @media print {
              @page {
                size: 80mm auto;
                margin: 5mm;
              }
              body {
                margin: 0;
                padding: 0;
              }
            }
            
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.4;
              max-width: 300px;
              margin: 0 auto;
              padding: 10px;
              background: white;
              color: black;
            }
            
            .header {
              text-align: center;
              border-bottom: 2px dashed #000;
              padding-bottom: 10px;
              margin-bottom: 10px;
            }
            
            .header h1 {
              font-size: 18px;
              margin: 0 0 5px 0;
              font-weight: bold;
            }
            
            .header h2 {
              font-size: 24px;
              margin: 5px 0;
              font-weight: bold;
            }
            
            .section {
              margin-bottom: 15px;
              border-bottom: 1px dashed #000;
              padding-bottom: 10px;
            }
            
            .section-title {
              font-weight: bold;
              font-size: 14px;
              margin-bottom: 5px;
              text-transform: uppercase;
            }
            
            .info-line {
              display: flex;
              justify-content: space-between;
              margin: 3px 0;
            }
            
            .item {
              margin: 8px 0;
              padding: 5px 0;
            }
            
            .item-header {
              display: flex;
              justify-content: space-between;
              font-weight: bold;
              font-size: 13px;
            }
            
            .item-name {
              flex: 1;
            }
            
            .item-qty {
              margin-right: 10px;
            }
            
            .total {
              font-size: 16px;
              font-weight: bold;
              text-align: right;
              margin-top: 10px;
              padding-top: 10px;
              border-top: 2px solid #000;
            }
            
            .notes {
              background: #f0f0f0;
              padding: 8px;
              margin: 10px 0;
              border: 1px solid #000;
              font-weight: bold;
            }
            
            .footer {
              text-align: center;
              margin-top: 15px;
              font-size: 10px;
              border-top: 2px dashed #000;
              padding-top: 10px;
            }
            
            .delivery-type {
              text-align: center;
              font-size: 16px;
              font-weight: bold;
              padding: 10px;
              margin: 10px 0;
              border: 2px solid #000;
              background: ${customerInfo?.deliveryType === 'delivery' ? '#ffe0b2' : '#c8e6c9'};
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🍔 COMANDA DE COCINA</h1>
            <h2>PEDIDO #${order.id}</h2>
            <div>${new Date(order.created_at).toLocaleDateString('es-ES', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            })} - ${new Date(order.created_at).toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit'
            })}</div>
          </div>

          <div class="delivery-type">
            ${customerInfo?.deliveryType === 'delivery' ? '🚚 DELIVERY' : '🏪 RECOGER EN TIENDA'}
          </div>

          <div class="section">
            <div class="section-title">📋 Cliente</div>
            <div class="info-line">
              <span>Nombre:</span>
              <strong>${customerInfo?.name || 'N/A'}</strong>
            </div>
            ${customerInfo?.phone ? `
              <div class="info-line">
                <span>Teléfono:</span>
                <strong>${customerInfo.phone}</strong>
              </div>
            ` : ''}
            ${customerInfo?.address && customerInfo?.deliveryType === 'delivery' ? `
              <div class="info-line" style="margin-top: 5px;">
                <span style="display: block; margin-bottom: 3px;">Dirección:</span>
              </div>
              <div style="font-weight: bold; word-wrap: break-word;">
                ${customerInfo.address}
              </div>
            ` : ''}
          </div>

          <div class="section">
            <div class="section-title">🍽️ Productos a Preparar</div>
            ${Array.isArray(items) && items.length > 0 ? items.map((item, index) => `
              <div class="item">
                <div class="item-header">
                  <span class="item-qty">[ ${item.quantity}x ]</span>
                  <span class="item-name">${item.name}</span>
                </div>
              </div>
            `).join('') : '<p>No hay productos</p>'}
          </div>

          ${customerInfo?.notes ? `
            <div class="notes">
              <div style="margin-bottom: 3px;">⚠️ NOTAS ESPECIALES:</div>
              ${customerInfo.notes}
            </div>
          ` : ''}

          <div class="section">
            <div class="section-title">💰 Información de Pago</div>
            <div class="info-line">
              <span>Método:</span>
              <strong>${order.payment_method === 'mercadopago' ? '💳 Tarjeta (MP)' : '💵 Efectivo'}</strong>
            </div>
            <div class="total">
              TOTAL: $${Number(order.total).toFixed(2)}
            </div>
          </div>

          <div class="footer">
            <div>Impreso: ${new Date().toLocaleString('es-ES')}</div>
            <div style="margin-top: 5px;">Sistema de Gestión de Pedidos</div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for content to load, then print
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      // Close after printing or if user cancels
      setTimeout(() => {
        printWindow.close();
      }, 500);
    }, 250);
  };

  return (
    <button
      onClick={handlePrint}
      disabled={printing}
      className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
      title="Imprimir comanda de cocina"
    >
      <Printer className="w-4 h-4" />
      {printing ? 'Imprimiendo...' : 'Imprimir Comanda'}
    </button>
  );
}
