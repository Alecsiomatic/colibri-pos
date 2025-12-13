"use client";

import React, { useState } from "react";
import { Printer } from "lucide-react";

interface KitchenPrintProps {
  order: {
    id: number;
    items: string;
    total: number;
    customer_info: string;
    payment_method?: string;
    created_at: string;
  };
}

export default function KitchenPrint({ order }: KitchenPrintProps) {
  const [printing, setPrinting] = useState(false);

  const handlePrint = async () => {
    setPrinting(true);
    
    try {
      // Parse datos
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

      // Datos para el servidor de impresión
      const printData = {
        orderId: order.id,
        customer: {
          name: customerInfo?.name || 'Cliente',
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
        paymentMethod: order.payment_method || 'efectivo',
        deliveryType: 'pickup',
        createdAt: order.created_at
      };

      // Enviar SOLO al servidor de impresión
      const PRINT_SERVER_URL = process.env.NEXT_PUBLIC_PRINT_SERVER_URL || 'https://untextural-louetta-nonrestrictedly.ngrok-free.dev';
      
      const response = await fetch(`${PRINT_SERVER_URL}/print`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ order: printData })
      });

      if (response.ok) {
        console.log('✅ Comanda impresa correctamente');
      } else {
        console.error('❌ Error al imprimir comanda');
      }
    } catch (error) {
      console.error('❌ Error:', error);
    }
    
    setPrinting(false);
  };

  return (
    <button
      onClick={handlePrint}
      disabled={printing}
      className="inline-flex items-center px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
    >
      <Printer className="w-3 h-3 mr-1" />
      {printing ? 'Imprimiendo...' : 'Imprimir Comanda'}
    </button>
  );
}